# 🛡️ Plan de Remediación de Seguridad - VecinoSimple

> **Documento:** Plan de Acción para Vulnerabilidades de Seguridad  
> **Equipo:** Security Strike Team (Expert Programmers)  
> **Fecha:** 18 de Enero 2026

---

## 🎯 Objetivo

Corregir todas las vulnerabilidades críticas y de alta severidad identificadas en la auditoría de seguridad, implementando mejores prácticas de seguridad y tests automatizados para prevenir regresiones.

---

## 👥 Equipo de Seguridad (Security Strike Team)

| Rol | Responsabilidad |
|-----|-----------------|
| **Security Lead** | Coordinación, revisión de código, aprobación de PRs |
| **Backend Security Specialist** | Implementación de fixes en NestJS |
| **DevOps Security** | Configuración de infraestructura segura |
| **QA Security** | Tests de penetración y validación |

---

## 📋 Tickets de Implementación

### 🔴 PRIORIDAD 0 - CRÍTICO (Inmediato)

#### TICKET SEC-001: Eliminar JWT Secret Hardcodeado

**Archivo:** `apps/api/src/modules/auth/auth.module.ts`

**Cambio Requerido:**
```typescript
// ❌ ANTES (VULNERABLE)
JwtModule.register({
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
  signOptions: { expiresIn: "1d" },
})

// ✅ DESPUÉS (SEGURO)
JwtModule.registerAsync({
  imports: [ConfigModule],
  useFactory: async (configService: ConfigService) => {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be defined and at least 32 characters');
    }
    return {
      secret,
      signOptions: { 
        expiresIn: '15m', // Access token corto
        issuer: 'vecinosimple',
        audience: 'vecinosimple-api',
      },
    };
  },
  inject: [ConfigService],
})
```

**Tiempo estimado:** 2 horas  
**Responsable:** Backend Security Specialist

---

#### TICKET SEC-002: Implementar Rate Limiting Global

**Archivo:** `apps/api/src/app.module.ts`

**Cambio Requerido:**
```typescript
// ✅ Agregar ThrottlerModule
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,  // 1 segundo
        limit: 3,   // 3 requests por segundo
      },
      {
        name: 'medium',
        ttl: 10000, // 10 segundos
        limit: 20,  // 20 requests por 10 segundos
      },
      {
        name: 'long',
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      }
    ]),
    // ... otros módulos
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
```

**Archivo adicional:** `apps/api/src/modules/auth/auth.controller.ts`

```typescript
// Rate limiting específico para auth
import { Throttle, SkipThrottle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  
  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 intentos cada 5 minutos
  async login(@Body() loginDto: LoginDto) {
    // ...
  }
  
  @Get('verify')
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 verificaciones por minuto
  async verifyMagicLink(@Query('token') token: string) {
    // ...
  }
}
```

**Tiempo estimado:** 3 horas  
**Responsable:** Backend Security Specialist

---

#### TICKET SEC-003: Configurar CORS para Producción

**Archivo:** `apps/api/src/main.ts`

**Cambio Requerido:**
```typescript
// ✅ CORS configurado por entorno
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push(
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002'
  );
}

app.enableCors({
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 horas de cache para preflight
});
```

**Variables de entorno (.env.example):**
```env
ALLOWED_ORIGINS=https://admin.vecinosimple.com,https://app.vecinosimple.com
```

**Tiempo estimado:** 1 hora  
**Responsable:** DevOps Security

---

#### TICKET SEC-004: Agregar Helmet para Headers de Seguridad

**Archivo:** `apps/api/src/main.ts`

**Cambio Requerido:**
```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // ✅ Headers de seguridad
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: "deny" },
    hidePoweredBy: true,
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true,
  }));
  
  // ... resto del bootstrap
}
```

**Dependencia a instalar:**
```bash
pnpm add helmet --filter=api
```

**Tiempo estimado:** 1 hora  
**Responsable:** Backend Security Specialist

---

### 🟠 PRIORIDAD 1 - ALTO (1 semana)

#### TICKET SEC-005: Implementar Refresh Tokens

**Archivo nuevo:** `apps/api/src/modules/auth/dto/tokens.dto.ts`

```typescript
export class TokensDto {
  @ApiProperty()
  accessToken: string;
  
  @ApiProperty()
  refreshToken: string;
  
  @ApiProperty()
  expiresIn: number;
}
```

**Archivo:** `apps/api/src/modules/auth/auth.service.ts`

```typescript
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class AuthService {
  
  async generateTokens(usuario: Usuario): Promise<TokensDto> {
    // Access token corto (15 minutos)
    const accessToken = this.jwtService.sign(
      {
        sub: usuario.id,
        email: usuario.email,
        rol: await this.getUserPrimaryRole(usuario.id),
        type: 'access',
      },
      { expiresIn: '15m' }
    );
    
    // Refresh token largo (7 días)
    const refreshToken = randomBytes(64).toString('hex');
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    
    // Guardar hash del refresh token en DB
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        refreshToken: refreshTokenHash,
        refreshTokenExpira: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos en segundos
    };
  }
  
  async refreshTokens(refreshToken: string): Promise<TokensDto> {
    const refreshTokenHash = createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        refreshToken: refreshTokenHash,
        refreshTokenExpira: { gt: new Date() },
        estado: 'ACTIVO',
      },
    });
    
    if (!usuario) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }
    
    // Rotar refresh token (one-time use)
    return this.generateTokens(usuario);
  }
  
  async logout(userId: string): Promise<void> {
    // Invalidar refresh token
    await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        refreshToken: null,
        refreshTokenExpira: null,
      },
    });
  }
}
```

**Tiempo estimado:** 4 horas  
**Responsable:** Backend Security Specialist

---

#### TICKET SEC-006: Mejorar JWT Strategy con Validación Completa

**Archivo:** `apps/api/src/modules/auth/strategies/jwt.strategy.ts`

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: 'vecinosimple',
      audience: 'vecinosimple-api',
    });
  }

  async validate(payload: JwtPayload): Promise<UserContext> {
    // Validar tipo de token
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Token inválido');
    }
    
    // Verificar que el usuario existe y está activo
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        estado: true,
        rolesConsorcio: {
          select: {
            rol: true,
            consorcioId: true,
          },
        },
      },
    });
    
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    if (usuario.estado !== 'ACTIVO') {
      throw new UnauthorizedException('Usuario suspendido o inactivo');
    }
    
    return {
      sub: payload.sub,
      email: payload.email,
      roles: usuario.rolesConsorcio.map(rc => ({
        rol: rc.rol,
        consorcioId: rc.consorcioId,
      })),
    };
  }
}

interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  iat: number;
  exp: number;
}

interface UserContext {
  sub: string;
  email: string;
  roles: Array<{ rol: string; consorcioId: string }>;
}
```

**Tiempo estimado:** 3 horas  
**Responsable:** Backend Security Specialist

---

#### TICKET SEC-007: Eliminar Logs de Información Sensible

**Archivos afectados:** Múltiples servicios

**Cambio Requerido:**
```typescript
// ❌ ANTES
console.log(`🔐 Magic Link para ${email}: ${magicLink}`);

// ✅ DESPUÉS (solo en desarrollo con variable específica)
if (process.env.DEBUG_AUTH === 'true' && process.env.NODE_ENV === 'development') {
  console.log(`🔐 Magic Link generado para: ${email.substring(0, 3)}***`);
}
```

**Crear servicio de logging seguro:**

**Archivo nuevo:** `apps/api/src/common/services/secure-logger.service.ts`

```typescript
import { Injectable, LoggerService, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class SecureLoggerService implements LoggerService {
  private context?: string;
  
  private readonly sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /cbu/i,
    /dni/i,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{7,8}\b/g, // DNI
    /\b\d{22}\b/g, // CBU
  ];
  
  setContext(context: string) {
    this.context = context;
  }
  
  private sanitize(message: any): string {
    let sanitized = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    for (const pattern of this.sensitivePatterns) {
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
    
    return sanitized;
  }
  
  log(message: any, ...optionalParams: any[]) {
    console.log(`[${this.context}] ${this.sanitize(message)}`, ...optionalParams);
  }
  
  error(message: any, trace?: string) {
    console.error(`[${this.context}] ERROR: ${this.sanitize(message)}`);
    if (trace) {
      console.error(`Stack: ${this.sanitize(trace)}`);
    }
  }
  
  warn(message: any) {
    console.warn(`[${this.context}] WARN: ${this.sanitize(message)}`);
  }
  
  debug(message: any) {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[${this.context}] DEBUG: ${this.sanitize(message)}`);
    }
  }
  
  verbose(message: any) {
    if (process.env.DEBUG_VERBOSE === 'true') {
      console.log(`[${this.context}] VERBOSE: ${this.sanitize(message)}`);
    }
  }
}
```

**Tiempo estimado:** 4 horas  
**Responsable:** Backend Security Specialist

---

### 🟠 PRIORIDAD 2 - MEDIO (2 semanas)

#### TICKET SEC-008: Centralizar Sanitización XSS

**Archivo nuevo:** `apps/api/src/common/utils/sanitizer.util.ts`

```typescript
import { escape } from 'html-escaper';
import DOMPurify from 'isomorphic-dompurify';

export class Sanitizer {
  /**
   * Sanitiza texto plano (sin HTML permitido)
   */
  static text(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .replace(/`/g, '&#x60;')
      .replace(/\\/g, '&#x5C;')
      .trim();
  }
  
  /**
   * Sanitiza HTML (permite tags seguros)
   */
  static html(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
    });
  }
  
  /**
   * Sanitiza para uso en atributos HTML
   */
  static attribute(input: string): string {
    if (!input || typeof input !== 'string') return '';
    return escape(input);
  }
  
  /**
   * Sanitiza URL (previene javascript: y data:)
   */
  static url(input: string): string | null {
    if (!input || typeof input !== 'string') return null;
    
    try {
      const url = new URL(input);
      
      // Solo permitir http y https
      if (!['http:', 'https:'].includes(url.protocol)) {
        return null;
      }
      
      return url.toString();
    } catch {
      return null;
    }
  }
  
  /**
   * Sanitiza nombre de archivo
   */
  static filename(input: string): string {
    if (!input || typeof input !== 'string') return '';
    
    return input
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }
}
```

**Tiempo estimado:** 3 horas  
**Responsable:** Backend Security Specialist

---

#### TICKET SEC-009: Implementar Token Blacklist

**Archivo nuevo:** `apps/api/src/modules/auth/services/token-blacklist.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlacklistService implements OnModuleInit {
  // En producción, usar Redis para escalabilidad
  private blacklist: Map<string, number> = new Map();
  
  onModuleInit() {
    // Limpiar tokens expirados cada hora
    this.cleanupExpiredTokens();
  }
  
  /**
   * Agrega un token a la blacklist
   * @param jti - JWT ID único del token
   * @param expiresAt - Timestamp de expiración del token
   */
  add(jti: string, expiresAt: number): void {
    this.blacklist.set(jti, expiresAt);
  }
  
  /**
   * Verifica si un token está en la blacklist
   */
  isBlacklisted(jti: string): boolean {
    return this.blacklist.has(jti);
  }
  
  /**
   * Elimina tokens expirados de la blacklist
   */
  @Cron(CronExpression.EVERY_HOUR)
  cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [jti, expiresAt] of this.blacklist.entries()) {
      if (expiresAt < now) {
        this.blacklist.delete(jti);
      }
    }
  }
}
```

**Uso en JWT Strategy:**
```typescript
async validate(payload: JwtPayload): Promise<UserContext> {
  // Verificar blacklist
  if (payload.jti && this.tokenBlacklist.isBlacklisted(payload.jti)) {
    throw new UnauthorizedException('Token revocado');
  }
  // ... resto de validación
}
```

**Tiempo estimado:** 4 horas  
**Responsable:** Backend Security Specialist

---

## 🧪 Tests de Seguridad E2E

### Archivo: `apps/api/test/security/auth-security.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Security Tests - Authentication (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Rate Limiting', () => {
    it('should block after 5 failed login attempts', async () => {
      const email = 'test@example.com';
      
      // Hacer 5 intentos
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email })
          .expect(201);
      }
      
      // El 6to intento debe ser bloqueado
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email });
      
      expect(response.status).toBe(429);
      expect(response.body.message).toContain('Too Many Requests');
    });
  });

  describe('JWT Security', () => {
    it('should reject forged JWT tokens', async () => {
      const forgedToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        'eyJzdWIiOiIxMjM0NTY3ODkwIiwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIn0.' +
        'INVALID_SIGNATURE';
      
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${forgedToken}`);
      
      expect(response.status).toBe(401);
    });

    it('should reject expired tokens', async () => {
      // Token expirado (exp en el pasado)
      const expiredToken = '...'; // Generar token con exp pasado
      
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${expiredToken}`);
      
      expect(response.status).toBe(401);
    });

    it('should reject tokens with invalid audience', async () => {
      // Token con audience incorrecto
      const wrongAudienceToken = '...';
      
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${wrongAudienceToken}`);
      
      expect(response.status).toBe(401);
    });
  });

  describe('XSS Prevention', () => {
    it('should sanitize malicious input in comunicados', async () => {
      const token = await getValidToken(app);
      
      const maliciousPayload = {
        titulo: '<script>alert("XSS")</script>',
        contenido: '<img src="x" onerror="alert(1)">',
      };
      
      const response = await request(app.getHttpServer())
        .post('/comunicados')
        .set('Authorization', `Bearer ${token}`)
        .send(maliciousPayload);
      
      expect(response.status).toBe(201);
      expect(response.body.titulo).not.toContain('<script>');
      expect(response.body.contenido).not.toContain('onerror');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in search queries', async () => {
      const token = await getValidToken(app);
      
      const response = await request(app.getHttpServer())
        .get('/usuarios')
        .query({ search: "'; DROP TABLE usuarios; --" })
        .set('Authorization', `Bearer ${token}`);
      
      // No debe devolver error de SQL
      expect(response.status).not.toBe(500);
      // La tabla usuarios debe seguir existiendo
      const checkResponse = await request(app.getHttpServer())
        .get('/usuarios')
        .set('Authorization', `Bearer ${token}`);
      expect(checkResponse.status).toBe(200);
    });
  });

  describe('Authorization (RBAC)', () => {
    it('should deny PROPIETARIO access to admin endpoints', async () => {
      const propietarioToken = await getTokenForRole(app, 'PROPIETARIO');
      
      const response = await request(app.getHttpServer())
        .delete('/usuarios/some-id')
        .set('Authorization', `Bearer ${propietarioToken}`);
      
      expect(response.status).toBe(403);
    });

    it('should deny cross-consorcio access', async () => {
      const tokenConsorcio1 = await getTokenForConsorcio(app, 'consorcio-1');
      
      const response = await request(app.getHttpServer())
        .get('/gastos')
        .query({ consorcioId: 'consorcio-2' })
        .set('Authorization', `Bearer ${tokenConsorcio1}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('DDoS Protection', () => {
    it('should handle high request volume gracefully', async () => {
      const requests = Array(100).fill(null).map(() =>
        request(app.getHttpServer())
          .get('/health')
          .timeout(5000)
      );
      
      const responses = await Promise.allSettled(requests);
      const successful = responses.filter(r => r.status === 'fulfilled');
      const blocked = responses.filter(r => 
        r.status === 'fulfilled' && 
        (r.value as any).status === 429
      );
      
      // Al menos algunos requests deben ser bloqueados
      expect(blocked.length).toBeGreaterThan(0);
    });
  });
});

// Helper functions
async function getValidToken(app: INestApplication): Promise<string> {
  // Implementar obtención de token válido para tests
  return 'valid-test-token';
}

async function getTokenForRole(app: INestApplication, role: string): Promise<string> {
  // Implementar obtención de token con rol específico
  return 'role-specific-token';
}

async function getTokenForConsorcio(app: INestApplication, consorcioId: string): Promise<string> {
  // Implementar obtención de token para consorcio específico
  return 'consorcio-specific-token';
}
```

---

## 📊 Métricas de Éxito

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| Vulnerabilidades Críticas | 0 | Auditoría automatizada |
| Vulnerabilidades Altas | 0 | Auditoría automatizada |
| Cobertura Tests Seguridad | >80% | Jest coverage |
| Tiempo de respuesta Rate Limit | <100ms | Load testing |
| Tokens expirados en uso | 0 | Logs de auth |

---

## 📅 Cronograma

| Semana | Tickets | Responsable |
|--------|---------|-------------|
| 1 | SEC-001, SEC-002, SEC-003, SEC-004 | Backend + DevOps |
| 2 | SEC-005, SEC-006, SEC-007 | Backend |
| 3 | SEC-008, SEC-009 | Backend |
| 4 | Tests E2E + Validación | QA Security |

---

## ✅ Checklist de Verificación

### Antes de Deploy a Producción:

- [ ] JWT_SECRET configurado con mínimo 32 caracteres aleatorios
- [ ] ALLOWED_ORIGINS configurado con dominios de producción
- [ ] NODE_ENV=production
- [ ] DEBUG_AUTH=false
- [ ] Rate limiting verificado en staging
- [ ] Headers de seguridad verificados (securityheaders.com)
- [ ] Penetration testing completado
- [ ] Audit log revisado por anomalías
- [ ] Backup de base de datos antes del deploy

---

**Siguiente documento:** [E2E Security Tests](../apps/api/test/security/)
