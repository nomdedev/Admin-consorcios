import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { ConsorciosModule } from "./modules/consorcios/consorcios.module";
import { UnidadesFuncionalesModule } from "./modules/unidades-funcionales/unidades-funcionales.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { HealthModule } from "./modules/health/health.module";

// Módulos de funcionalidad extendida
import { ClaimingModule } from "./modules/claiming/claiming.module";
import { AlertasModule } from "./modules/alertas/alertas.module";
import { SnapshotsModule } from "./modules/snapshots/snapshots.module";
import { BadgesModule } from "./modules/badges/badges.module";
import { QRTrackingModule } from "./modules/qr-tracking/qr-tracking.module";
import { AmenityRulesModule } from "./modules/amenities-rules/amenity-rules.module";

// Módulos financieros MVP
import { AuditModule } from "./modules/audit/audit.module";
import { ExpensasModule } from "./modules/expensas/expensas.module";
import { GastosModule } from "./modules/gastos/gastos.module";
import { PagosModule } from "./modules/pagos/pagos.module";

// Módulos de comunicación y operaciones
import { TicketsModule } from "./modules/tickets/tickets.module";
import { ComunicadosModule } from "./modules/comunicados/comunicados.module";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module";

// Módulo de reservas de amenities
import { AmenitiesModule } from "./modules/amenities/amenities.module";

// Módulo de asambleas virtuales
import { AsambleasModule } from "./modules/asambleas/asambleas.module";

// Módulo de proveedores y marketplace
import { ProveedoresModule } from "./modules/proveedores/proveedores.module";

// Módulo de documentos
import { DocumentosModule } from "./modules/documentos/documentos.module";

// Módulos de infraestructura/integraciones (Sprint 5)
import { EmailModule } from "./modules/email/email.module";
import { StorageModule } from "./modules/storage/storage.module";
import { PdfModule } from "./modules/pdf/pdf.module";

// Módulos de integraciones externas (Sprint 6)
import { PushModule } from "./modules/push/push.module";
import { WhatsAppModule } from "./modules/whatsapp/whatsapp.module";

// Portal de Residentes (acceso para vecinos)
import { ResidentPortalModule } from "./modules/resident-portal/resident-portal.module";

@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // ✅ SEGURIDAD: Rate Limiting Global
    // Protección contra DDoS y brute force
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000, // 1 segundo
        limit: 10, // 10 requests por segundo
      },
      {
        name: "medium",
        ttl: 10000, // 10 segundos
        limit: 50, // 50 requests por 10 segundos
      },
      {
        name: "long",
        ttl: 60000, // 1 minuto
        limit: 200, // 200 requests por minuto
      },
    ]),

    // Base de datos
    DatabaseModule,

    // Módulo de auditoría (global - debe ir primero)
    AuditModule,

    // Módulos core de la aplicación
    HealthModule,
    AuthModule,
    ConsorciosModule,
    UnidadesFuncionalesModule,
    UsuariosModule,

    // Módulos de funcionalidad extendida
    ClaimingModule,       // KYC / Claiming de unidades
    AlertasModule,        // Alertas de emergencia multicanal
    SnapshotsModule,      // Inmutabilidad de expensas cerradas
    BadgesModule,         // Gamificación / Sistema de logros
    QRTrackingModule,     // Tracking QR para migración papel→digital
    AmenityRulesModule,   // Reglas de amenities y penalizaciones

    // Módulos financieros MVP
    ExpensasModule,       // Liquidación de expensas (corazón del sistema)
    GastosModule,         // Gestión de gastos del consorcio
    PagosModule,          // Procesamiento de pagos y cuenta corriente

    // Módulos de comunicación y operaciones
    TicketsModule,        // Sistema de reclamos y mantenimiento
    ComunicadosModule,    // Comunicados y novedades del consorcio
    NotificacionesModule, // Centro de notificaciones del usuario

    // Módulo de reservas de amenities
    AmenitiesModule,      // Reserva de SUM, parrilla, pileta, etc.

    // Módulo de asambleas virtuales
    AsambleasModule,      // Votación, quórum, actas

    // Módulo de proveedores y marketplace
    ProveedoresModule,    // Marketplace, trabajos, autogestión

    // Módulo de documentos
    DocumentosModule,     // Reglamentos, actas, contratos, planos

    // Módulos de infraestructura/integraciones (Sprint 5)
    EmailModule,          // Envío de emails con Resend
    StorageModule,        // Almacenamiento de archivos (S3/R2)
    PdfModule,            // Generación de PDFs (expensas, recibos)

    // Módulos de integraciones externas (Sprint 6)
    PushModule,           // Push notifications (Firebase Cloud Messaging)
    WhatsAppModule,       // WhatsApp Business API

    // Portal de Residentes (Sprint 7)
    ResidentPortalModule, // Endpoints para vecinos: expensas, gastos, CBU
  ],
  providers: [
    // ✅ SEGURIDAD: Guard global de rate limiting
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
