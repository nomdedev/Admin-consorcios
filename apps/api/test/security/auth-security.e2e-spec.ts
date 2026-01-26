/**
 * Tests de Seguridad E2E - VecinoSimple API
 *
 * Suite de tests para validar la seguridad del backend
 * Simula ataques reales para verificar protecciones
 *
 * @module test/security
 */

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../src/app.module";
import * as jwt from "jsonwebtoken";

describe("Security Tests - Authentication (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Aplicar mismo pipeline que en main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Rate Limiting Protection", () => {
    it("should enforce rate limits on login endpoint", async () => {
      const attempts: Promise<request.Response>[] = [];

      // Intentar 20 requests rápidos
      for (let i = 0; i < 20; i++) {
        attempts.push(
          request(app.getHttpServer())
            .post("/api/v1/auth/login")
            .send({ email: `test${i}@example.com` })
        );
      }

      const responses = await Promise.all(attempts);
      const rateLimited = responses.filter((r) => r.status === 429);

      // Al menos algunos requests deben ser rate limited
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it("should return proper rate limit headers", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com" });

      // Verificar headers de rate limit
      expect(response.headers).toHaveProperty("x-ratelimit-limit");
      expect(response.headers).toHaveProperty("x-ratelimit-remaining");
    });
  });

  describe("JWT Security", () => {
    it("should reject requests without Authorization header", async () => {
      const response = await request(app.getHttpServer()).get(
        "/api/v1/usuarios"
      );

      expect(response.status).toBe(401);
      expect(response.body.message).toContain("Unauthorized");
    });

    it("should reject malformed JWT tokens", async () => {
      const malformedTokens = [
        "not-a-jwt",
        "Bearer not-a-jwt",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoiIn0",
        "Bearer null",
        "Bearer undefined",
      ];

      for (const token of malformedTokens) {
        const response = await request(app.getHttpServer())
          .get("/api/v1/usuarios")
          .set("Authorization", token);

        expect(response.status).toBe(401);
      }
    });

    it("should reject JWT tokens with invalid signature", async () => {
      // Token firmado con secret incorrecto
      const fakeToken = jwt.sign(
        { sub: "fake-user-id", email: "fake@test.com" },
        "wrong-secret-key"
      );

      const response = await request(app.getHttpServer())
        .get("/api/v1/usuarios")
        .set("Authorization", `Bearer ${fakeToken}`);

      expect(response.status).toBe(401);
    });

    it("should reject expired JWT tokens", async () => {
      // Token expirado
      const expiredToken = jwt.sign(
        {
          sub: "test-user-id",
          email: "test@test.com",
          exp: Math.floor(Date.now() / 1000) - 3600, // Expiró hace 1 hora
        },
        process.env.JWT_SECRET || "test-secret"
      );

      const response = await request(app.getHttpServer())
        .get("/api/v1/usuarios")
        .set("Authorization", `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });

    it("should reject JWT tokens with wrong issuer", async () => {
      const wrongIssuerToken = jwt.sign(
        { sub: "test-user-id", email: "test@test.com", iss: "wrong-issuer" },
        process.env.JWT_SECRET || "test-secret"
      );

      const response = await request(app.getHttpServer())
        .get("/api/v1/usuarios")
        .set("Authorization", `Bearer ${wrongIssuerToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe("XSS Prevention", () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert(1)',
      '<iframe src="javascript:alert(1)">',
      '"><script>alert(1)</script>',
      "'; DROP TABLE usuarios; --",
      '<body onload="alert(1)">',
      '<a href="javascript:alert(1)">Click</a>',
      '{{constructor.constructor("alert(1)")()}}',
    ];

    it("should sanitize XSS payloads in comunicados", async () => {
      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post("/api/v1/comunicados")
          .send({
            titulo: payload,
            contenido: payload,
            consorcioId: "test-consorcio",
          });

        // Si la request es exitosa (con auth válido), verificar sanitización
        if (response.status === 201 || response.status === 200) {
          expect(response.body.titulo).not.toContain("<script");
          expect(response.body.titulo).not.toContain("onerror");
          expect(response.body.contenido).not.toContain("<script");
        }
      }
    });

    it("should sanitize XSS payloads in tickets", async () => {
      for (const payload of xssPayloads) {
        const response = await request(app.getHttpServer())
          .post("/api/v1/tickets")
          .send({
            titulo: payload,
            descripcion: payload,
            consorcioId: "test-consorcio",
          });

        if (response.status === 201 || response.status === 200) {
          expect(response.body.titulo).not.toContain("<script");
          expect(response.body.descripcion).not.toContain("onerror");
        }
      }
    });

    it("should escape HTML in text fields", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/comunicados")
        .send({
          titulo: "<b>Test</b>",
          contenido: "<script>evil()</script>",
          consorcioId: "test-consorcio",
        });

      if (response.body.titulo) {
        expect(response.body.titulo).toMatch(/&lt;|&gt;/);
      }
    });
  });

  describe("SQL Injection Prevention", () => {
    const sqlPayloads = [
      "'; DROP TABLE usuarios; --",
      "1' OR '1'='1",
      "1; DELETE FROM usuarios",
      "' UNION SELECT * FROM usuarios --",
      "1' AND 1=1 --",
      "admin'--",
      "' OR 1=1#",
      "'; EXEC xp_cmdshell('dir'); --",
      "1' WAITFOR DELAY '0:0:5'--",
      "1'; UPDATE usuarios SET rol='SUPER_ADMIN' --",
    ];

    it("should prevent SQL injection in search parameters", async () => {
      for (const payload of sqlPayloads) {
        const response = await request(app.getHttpServer())
          .get("/api/v1/usuarios")
          .query({ search: payload });

        // No debe haber error 500 (SQL error)
        expect(response.status).not.toBe(500);

        // Si hay error, debe ser de validación (400) o auth (401)
        if (response.status >= 400) {
          expect([400, 401, 403]).toContain(response.status);
        }
      }
    });

    it("should prevent SQL injection in IDs", async () => {
      for (const payload of sqlPayloads) {
        const response = await request(app.getHttpServer()).get(
          `/api/v1/usuarios/${encodeURIComponent(payload)}`
        );

        // No debe haber error 500 (SQL error)
        expect(response.status).not.toBe(500);
      }
    });

    it("should prevent SQL injection in body parameters", async () => {
      for (const payload of sqlPayloads) {
        const response = await request(app.getHttpServer())
          .post("/api/v1/auth/login")
          .send({ email: payload });

        expect(response.status).not.toBe(500);
      }
    });
  });

  describe("Authorization (RBAC) Bypass Attempts", () => {
    it("should deny access to admin endpoints without proper role", async () => {
      // Crear token con rol INQUILINO
      const inquilinoToken = jwt.sign(
        {
          sub: "inquilino-user-id",
          email: "inquilino@test.com",
          roles: ["INQUILINO"],
        },
        process.env.JWT_SECRET || "test-secret"
      );

      // Intentar acceder a endpoint de admin
      const response = await request(app.getHttpServer())
        .delete("/api/v1/usuarios/some-id")
        .set("Authorization", `Bearer ${inquilinoToken}`);

      expect(response.status).toBe(403);
    });

    it("should deny cross-consorcio access", async () => {
      // Intentar acceder a datos de otro consorcio
      const response = await request(app.getHttpServer())
        .get("/api/v1/gastos")
        .query({ consorcioId: "otro-consorcio-id" });

      // Debe ser 401 (no auth) o 403 (forbidden)
      expect([401, 403]).toContain(response.status);
    });

    it("should prevent horizontal privilege escalation", async () => {
      const userAToken = jwt.sign(
        { sub: "user-a-id", email: "usera@test.com" },
        process.env.JWT_SECRET || "test-secret"
      );

      // Intentar modificar datos de otro usuario
      const response = await request(app.getHttpServer())
        .patch("/api/v1/usuarios/user-b-id")
        .set("Authorization", `Bearer ${userAToken}`)
        .send({ nombre: "Hacked" });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe("Input Validation", () => {
    it("should reject requests with extra properties (whitelist)", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          maliciousField: "hacker payload",
          __proto__: { isAdmin: true },
        });

      // forbidNonWhitelisted should reject this
      expect(response.status).toBe(400);
    });

    it("should validate email format", async () => {
      const invalidEmails = [
        "not-an-email",
        "@nodomain.com",
        "no@domain",
        "spaces in@email.com",
        "<script>@evil.com",
      ];

      for (const email of invalidEmails) {
        const response = await request(app.getHttpServer())
          .post("/api/v1/auth/login")
          .send({ email });

        expect(response.status).toBe(400);
      }
    });

    it("should validate numeric fields", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/pagos")
        .send({
          monto: "not-a-number",
          concepto: "Test",
        });

      expect(response.status).toBe(400);
    });

    it("should enforce minimum and maximum lengths", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/comunicados")
        .send({
          titulo: "a", // Muy corto
          contenido: "a".repeat(100000), // Muy largo
        });

      expect(response.status).toBe(400);
    });
  });

  describe("CORS Protection", () => {
    it("should reject requests from unauthorized origins", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/health")
        .set("Origin", "https://evil-site.com");

      // CORS debería bloquear o no incluir header
      const allowedOrigin = response.headers["access-control-allow-origin"];
      expect(allowedOrigin).not.toBe("https://evil-site.com");
    });

    it("should allow requests from authorized origins", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/health")
        .set("Origin", "http://localhost:3000");

      // En desarrollo, localhost:3000 debería estar permitido
      const allowedOrigin = response.headers["access-control-allow-origin"];
      expect(allowedOrigin).toBe("http://localhost:3000");
    });
  });

  describe("Security Headers", () => {
    it("should include security headers from Helmet", async () => {
      const response = await request(app.getHttpServer()).get(
        "/api/v1/health"
      );

      // Verificar headers de seguridad
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-frame-options"]).toBe("DENY");
      expect(response.headers["x-xss-protection"]).toBeDefined();
    });

    it("should not expose server information", async () => {
      const response = await request(app.getHttpServer()).get(
        "/api/v1/health"
      );

      // Helmet's hidePoweredBy
      expect(response.headers["x-powered-by"]).toBeUndefined();
    });
  });

  describe("Path Traversal Prevention", () => {
    const pathTraversalPayloads = [
      "../../../etc/passwd",
      "....//....//etc/passwd",
      "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd",
      "..\\..\\..\\windows\\system32\\config\\sam",
      "....\\\\....\\\\windows\\\\system32",
    ];

    it("should prevent path traversal in file endpoints", async () => {
      for (const payload of pathTraversalPayloads) {
        const response = await request(app.getHttpServer()).get(
          `/api/v1/documentos/${encodeURIComponent(payload)}`
        );

        // No debe devolver contenido de archivos del sistema
        expect(response.status).not.toBe(200);
        expect(response.body.contenido).not.toContain("root:");
      }
    });
  });

  describe("Prototype Pollution Prevention", () => {
    it("should prevent __proto__ pollution", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          __proto__: { isAdmin: true },
        });

      expect(response.status).toBe(400);
    });

    it("should prevent constructor pollution", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({
          email: "test@example.com",
          constructor: { prototype: { isAdmin: true } },
        });

      expect(response.status).toBe(400);
    });
  });

  describe("Mass Assignment Prevention", () => {
    it("should prevent changing rol through user update", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/v1/usuarios/some-user-id")
        .send({
          nombre: "Normal Update",
          rol: "SUPER_ADMIN", // Intento de escalación
        });

      // Debe rechazar el campo rol no permitido
      expect(response.status).toBe(400);
    });

    it("should prevent changing internal fields", async () => {
      const response = await request(app.getHttpServer())
        .patch("/api/v1/usuarios/some-user-id")
        .send({
          nombre: "Normal Update",
          createdAt: "2020-01-01",
          id: "hacked-id",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("DoS Prevention", () => {
    it("should handle large payloads gracefully", async () => {
      const largePayload = {
        email: "a".repeat(100000),
      };

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send(largePayload);

      // Debe rechazar sin crashear
      expect(response.status).toBe(400);
    });

    it("should handle deeply nested objects", async () => {
      let nestedObject: Record<string, unknown> = { deep: "value" };
      for (let i = 0; i < 100; i++) {
        nestedObject = { nested: nestedObject };
      }

      const response = await request(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email: "test@test.com", data: nestedObject });

      // No debe crashear
      expect(response.status).toBeLessThan(500);
    });

    it("should handle requests with many parameters", async () => {
      const manyParams: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        manyParams[`param${i}`] = `value${i}`;
      }

      const response = await request(app.getHttpServer())
        .get("/api/v1/health")
        .query(manyParams);

      // No debe crashear
      expect(response.status).toBeLessThan(500);
    });
  });
});

describe("Security Tests - Financial Endpoints (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      })
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("Payment Security", () => {
    it("should reject negative payment amounts", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/pagos")
        .send({
          monto: -1000,
          concepto: "Test payment",
        });

      expect(response.status).toBe(400);
    });

    it("should reject amounts below minimum", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/pagos")
        .send({
          monto: 100, // Below $500 minimum
          concepto: "Test payment",
        });

      expect([400, 401]).toContain(response.status);
    });

    it("should validate webhook signatures", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/pagos/webhook/mercadopago")
        .set("x-signature", "invalid-signature")
        .send({
          action: "payment.updated",
          data: { id: "fake-payment-id" },
        });

      // Sin firma válida, debe rechazar
      expect([400, 401, 403]).toContain(response.status);
    });
  });

  describe("Expense Security", () => {
    it("should prevent modifying closed expenses", async () => {
      // Intentar modificar expensa cerrada
      const response = await request(app.getHttpServer())
        .patch("/api/v1/expensas/closed-expense-id")
        .send({
          estado: "BORRADOR",
        });

      expect([400, 401, 403]).toContain(response.status);
    });

    it("should validate expense periods", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/expensas")
        .send({
          periodo: "invalid-period",
          consorcioId: "test",
        });

      expect(response.status).toBe(400);
    });
  });
});
