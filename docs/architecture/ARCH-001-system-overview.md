# Arquitectura Técnica - VecinoSimple

## 1. Estructura del Monorepo (Turborepo)

```
vecinosimple/
├── apps/
│   ├── admin-web/              # Next.js - Portal Administradores
│   │   ├── src/
│   │   │   ├── app/            # App Router (Next.js 14+)
│   │   │   ├── features/       # Feature-based modules
│   │   │   └── lib/            # App-specific utilities
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   ├── resident-app/           # Next.js PWA - App Vecinos
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/
│   │   │   └── lib/
│   │   ├── next.config.js      # PWA config
│   │   └── package.json
│   │
│   ├── staff-app/              # Next.js PWA - App Encargados (Offline-First)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── features/
│   │   │   ├── lib/
│   │   │   └── offline/        # Lógica de sincronización
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── api/                    # NestJS Backend
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── consorcios/
│       │   │   ├── expensas/
│       │   │   ├── gastos/
│       │   │   ├── reclamos/
│       │   │   ├── pagos/
│       │   │   ├── asambleas/
│       │   │   └── notificaciones/
│       │   ├── common/
│       │   │   ├── decorators/
│       │   │   ├── guards/
│       │   │   ├── interceptors/
│       │   │   └── filters/
│       │   ├── integrations/
│       │   │   ├── mercadopago/
│       │   │   ├── afip/
│       │   │   └── whatsapp/
│       │   └── database/
│       │       ├── prisma/
│       │       └── migrations/
│       ├── test/
│       └── package.json
│
├── packages/
│   ├── ui/                     # Design System Accesible
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── primitives/ # Button, Input, Card (Radix-based)
│   │   │   │   ├── patterns/   # ExpenseCard, PaymentButton
│   │   │   │   └── layouts/    # DashboardLayout, SimpleLayout
│   │   │   ├── hooks/
│   │   │   ├── themes/
│   │   │   │   ├── default.ts
│   │   │   │   ├── high-contrast.ts
│   │   │   │   └── tokens.ts
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── business-logic/         # Lógica de Negocio Compartida
│   │   ├── src/
│   │   │   ├── calculators/
│   │   │   │   ├── expensa.calculator.ts
│   │   │   │   ├── interes.calculator.ts
│   │   │   │   └── prorrateo.calculator.ts
│   │   │   ├── validators/
│   │   │   │   ├── cuit.validator.ts
│   │   │   │   └── factura.validator.ts
│   │   │   └── constants/
│   │   │       ├── argentina.constants.ts
│   │   │       └── suterh.constants.ts
│   │   └── package.json
│   │
│   ├── api-client/             # Cliente API tipado (OpenAPI generated)
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── database/               # Prisma Schema + Types compartidos
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   └── package.json
│   │
│   └── config/                 # Configuraciones compartidas
│       ├── eslint/
│       ├── typescript/
│       └── tailwind/
│
├── tooling/
│   ├── scripts/
│   │   ├── import-excel.ts     # Importador Inteligente
│   │   └── db-backup.ts
│   └── docker/
│       ├── docker-compose.yml
│       └── Dockerfile.api
│
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
└── .env.example
```

## 2. Decisiones Arquitectónicas (ADRs)

### ADR-001: Turborepo sobre Nx
**Decisión:** Usar Turborepo
**Razón:** Menor curva de aprendizaje, mejor integración con Vercel (deploy de Next.js), suficiente para nuestro scope. Nx es overkill para 3 apps.

### ADR-002: App Router (Next.js 14+) sobre Pages Router
**Decisión:** App Router con Server Components
**Razón:** Mejor performance, streaming, layouts anidados nativos. Crítico para UX de adultos mayores (carga rápida).

### ADR-003: Multi-tenancy con Row Level Security
**Decisión:** Single database + RLS de PostgreSQL
**Razón:** Menor costo operativo, más simple que DB-per-tenant. El `consorcio_id` se inyecta en cada query vía Prisma middleware.

### ADR-004: Prisma sobre TypeORM/Drizzle
**Decisión:** Prisma ORM
**Razón:** Mejor DX, migraciones robustas, tipos generados automáticamente. Drizzle es más performante pero menos maduro.

## 3. Estrategia Offline-First (Staff App)

### Tecnología: TanStack Query + IndexedDB (Dexie.js)

```
┌─────────────────────────────────────────────────────────────┐
│                    STAFF APP (PWA)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │   UI Layer  │───▶│ TanStack     │───▶│  IndexedDB    │  │
│  │  (React)    │    │ Query        │    │  (Dexie.js)   │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
│                            │                    │           │
│                            ▼                    │           │
│                    ┌──────────────┐             │           │
│                    │ Sync Queue   │◀────────────┘           │
│                    │ (Background) │                         │
│                    └──────────────┘                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Cuando hay conexión
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API (NestJS)                             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌──────────────┐    ┌───────────────┐  │
│  │ Sync Module │───▶│ Conflict     │───▶│  PostgreSQL   │  │
│  │             │    │ Resolver     │    │               │  │
│  └─────────────┘    └──────────────┘    └───────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Flujo de Sincronización:

1. **Operación Offline:** Usuario crea registro en bitácora
2. **Almacenamiento Local:** Se guarda en IndexedDB con `syncStatus: 'pending'`
3. **Cola de Sync:** Se encola operación con timestamp + UUID
4. **Detección de Conexión:** Service Worker detecta reconexión
5. **Sync en Background:** Se ejecutan operaciones pendientes en orden FIFO
6. **Resolución de Conflictos:** "Last Write Wins" con timestamp del servidor como árbitro
7. **Confirmación:** Se actualiza `syncStatus: 'synced'` en local

### Datos que se sincronizan offline:
- ✅ Bitácora de seguridad (CREATE)
- ✅ Recepción de paquetes (CREATE)
- ✅ Rondas de vigilancia (CREATE)
- ❌ Pagos (requiere conexión - seguridad)
- ❌ Votaciones (requiere conexión - integridad)

## 4. Flujo de Autenticación

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Usuario    │      │   Next.js    │      │   NestJS     │
│              │      │   Frontend   │      │   API        │
└──────┬───────┘      └──────┬───────┘      └──────┬───────┘
       │                     │                     │
       │  1. Login DNI/Email │                     │
       │────────────────────▶│                     │
       │                     │  2. Magic Link Req  │
       │                     │────────────────────▶│
       │                     │                     │
       │  3. Email con link  │◀────────────────────│
       │◀────────────────────│                     │
       │                     │                     │
       │  4. Click en link   │                     │
       │────────────────────▶│                     │
       │                     │  5. Verify token    │
       │                     │────────────────────▶│
       │                     │                     │
       │                     │  6. JWT + Refresh   │
       │                     │◀────────────────────│
       │  7. Session cookie  │                     │
       │◀────────────────────│                     │
       │                     │                     │
```

### Roles y Permisos:
```typescript
enum Role {
  SUPER_ADMIN = 'super_admin',         // VecinoSimple staff
  ADMINISTRADOR = 'administrador',     // Dueño de la administración
  ADMIN_STAFF = 'admin_staff',         // Empleado (carga facturas, no borra)
  PROPIETARIO = 'propietario',         // Dueño de UF - vota
  INQUILINO = 'inquilino',             // Paga ordinarias, NO vota
  ENCARGADO = 'encargado',             // Staff del edificio
  AUDITOR = 'auditor',                 // Solo lectura financiera
  PROVEEDOR_EXTERNO = 'proveedor',     // Sube facturas/fotos
}

// Permisos granulares para ADMIN_STAFF
interface AdminStaffPermisos {
  puedeCargarGastos: boolean      // Subir facturas
  puedeVerConciliacion: boolean   // Ver estado bancario
  puedeEnviarComunicados: boolean // Publicar novedades
  // NO puede: borrar consorcios, transferir, cambiar CBU
}
```

### Copropietarios (1 UF = 1 Voto)
```typescript
enum TipoVinculoUF {
  TITULAR_VOTANTE      // Ejerce el voto (máximo 1 por UF)
  COPROPIETARIO        // Ve todo, NO vota
  INQUILINO_PRINCIPAL  // Paga expensas
}

// Un usuario puede tener múltiples UFs
// UI: Selector "Viendo como: Depto 4B" → Cambiar contexto
```

## 5. Integraciones Externas

### Mercado Pago (Split Payments)
```
Vecino paga $10,000
    │
    ├──▶ $9,800 → Cuenta del Consorcio (CBU)
    │
    └──▶ $200 → Cuenta VecinoSimple (Fee 2%)
```

### AFIP (Facturación Electrónica)
- Validación de CAE en facturas de proveedores
- Importación de F.931 para liquidación de sueldos
- Generación de comprobantes tipo C para el consorcio

### WhatsApp Business API
- Notificaciones de vencimiento (templated messages)
- Bot de consulta de saldo (webhook + NLU básico)
- Envío de comprobantes de pago

## 6. Seguridad

### Checklist de Seguridad:
- [ ] HTTPS obligatorio (HSTS)
- [ ] JWT con rotación de refresh tokens
- [ ] Rate limiting por IP y por usuario
- [ ] Input sanitization (XSS prevention)
- [ ] Prepared statements (SQL Injection prevention)
- [ ] Row Level Security en PostgreSQL
- [ ] Audit log inmutable de operaciones financieras
- [ ] Encriptación de datos sensibles (AES-256)
- [ ] 2FA opcional para administradores

### Datos Sensibles:
```
Encriptados en reposo:
- DNI
- CBU/Alias bancario
- Número de teléfono

Hasheados (Argon2):
- Contraseñas (si se usa login tradicional)
```

## 7. Deploy Target

### Frontend (Vercel)
- Deploy automático desde GitHub
- Edge Functions para API routes
- Preview deployments por PR

### Backend + DB (Railway)
```
┌─────────────────────────────────────────┐
│              Railway Project            │
├─────────────────────────────────────────┤
│  ┌─────────────┐    ┌───────────────┐  │
│  │   NestJS    │───▶│  PostgreSQL   │  │
│  │   Service   │    │   (Managed)   │  │
│  └─────────────┘    └───────────────┘  │
│                                         │
│  Variables de entorno compartidas       │
│  ~$5 USD/mes inicial (pay-per-use)     │
└─────────────────────────────────────────┘
```

**¿Por qué Railway?**
- Setup en 2 clicks (vs AWS: IAM, VPC, EC2...)
- PostgreSQL managed sin config
- Precio bajo para MVP (~$5-20 USD/mes)
- Migración fácil a AWS cuando escales

**NO usar para MVP:**
- AWS (overkill, curva de aprendizaje alta)
- Render (DB gratis se borra a 90 días)
