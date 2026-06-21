import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "helmet";
import * as Sentry from "@sentry/node";

import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // ✅ Observabilidad: Sentry (v8+ - NestJS maneja errores internamente)
  const sentryDsn = process.env.SENTRY_DSN;
  if (sentryDsn) {
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV,
      release: process.env.SENTRY_RELEASE,
      tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0),
    });
    // Nota: Sentry.Handlers fue removido en v8+.
    // NestJS captura errores automáticamente a través de interceptores/filtros.
  }

  // ✅ SEGURIDAD: Headers HTTP de seguridad con Helmet
  app.use(
    helmet({
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
      crossOriginOpenerPolicy: { policy: "same-origin" },
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
    })
  );

  // Prefijo global de API
  app.setGlobalPrefix("api");

  // Versionado de API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // ✅ SEGURIDAD: CORS configurado por entorno
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
  const nodeEnv = process.env.NODE_ENV || "development";

  // En desarrollo, permitir localhost
  if (nodeEnv === "development") {
    allowedOrigins.push(
      "http://localhost:3000", // admin-web
      "http://localhost:3001", // resident-app
      "http://localhost:3002" // staff-app
    );
  }

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (mobile apps, Postman, health checks)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["X-Total-Count", "X-Page-Count"],
    maxAge: 86400, // 24 horas de cache para preflight
  });

  // Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle("VecinoSimple API")
    .setDescription(
      "API de administración de consorcios. Documentación completa para integración."
    )
    .setVersion("1.0")
    .addBearerAuth()
    .addTag("auth", "Autenticación y autorización")
    .addTag("consorcios", "Gestión de consorcios")
    .addTag("unidades", "Unidades funcionales")
    .addTag("expensas", "Liquidación de expensas")
    .addTag("gastos", "Registro de gastos")
    .addTag("pagos", "Procesamiento de pagos")
    .addTag("usuarios", "Gestión de usuarios")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  // Puerto
  const port = process.env.PORT || 4000;
  await app.listen(port);

  logger.log(`VecinoSimple API running on http://localhost:${port}`);
  logger.log(`Swagger docs available at /api/docs`);
  logger.log(`Security: Helmet enabled, CORS configured for ${nodeEnv}`);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void bootstrap();
