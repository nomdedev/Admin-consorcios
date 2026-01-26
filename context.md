# VecinoSimple - Contexto del Proyecto

> **Última actualización:** 27 de Enero 2026  
> **Repositorio:** nomdedev/vecinosimple  
> **Branch:** master

---

## 🎯 Visión del Proyecto

**VecinoSimple** es una plataforma SaaS B2B2C para administración de consorcios en Argentina, con foco en:

- **Inclusión digital** de adultos mayores ("Abuela-Proof")
- **Transparencia financiera** (cada gasto con factura visible)
- **Automatización operativa** para administradores

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Monorepo | Turborepo + pnpm |
| Frontend | Next.js 14+ (App Router) |
| Backend | NestJS |
| Base de Datos | PostgreSQL (Neon) + Prisma 5.22 |
| UI | Radix UI + Tailwind + CVA |
| Estado | Zustand (UI) + TanStack Query (server) |
| Formularios | React Hook Form + Zod |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## 📁 Estructura del Monorepo

```
vecinosimple/
├── apps/
│   ├── admin-web/        # Portal Administradores (Next.js) ✅ COMPLETO
│   ├── resident-app/     # PWA Vecinos ✅ COMPLETO (17 páginas)
│   ├── staff-app/        # PWA Encargados (Offline-First) ✅ COMPLETO (12 páginas)
│   └── api/              # NestJS Backend ✅ COMPLETO (28 módulos)
├── packages/
│   ├── ui/               # Design System compartido
│   ├── database/         # Prisma schema (35+ modelos)
│   ├── business-logic/   # Calculadores, validadores
│   ├── api-client/       # Cliente tipado
│   └── config/           # ESLint, TypeScript, Tailwind
├── scripts/              # Scripts de deploy y mantenimiento
│   ├── deploy-db.sh      # Migraciones de base de datos
│   ├── pre-deploy-check.sh # Verificaciones pre-deploy
│   └── smoke-test.sh     # Tests post-deploy
└── docs/                 # Documentación técnica
```

---

## 👥 Roles del Sistema (RBAC)

| Rol | Descripción |
|-----|-------------|
| `SUPER_ADMIN` | VecinoSimple staff - acceso total |
| `ADMINISTRADOR` | Dueño de la administración |
| `ADMIN_STAFF` | Empleado del admin (carga facturas, NO borra consorcios) |
| `PROPIETARIO` | Vota, ve extraordinarios |
| `INQUILINO` | Paga ordinarias, NO ve extraordinarios ni vota |
| `ENCARGADO` | App offline (bitácora, paquetes) |
| `AUDITOR` | Consejo - solo lectura financiera |
| `PROVEEDOR_EXTERNO` | Sube facturas/fotos de trabajos |

---

## 📊 Estado del Proyecto

### Backend API - 100% COMPLETO ✅

| Módulo | Endpoints | Estado |
|--------|-----------|--------|
| **AuthModule** | 4 | ✅ Login, Magic Link, Refresh, 2FA |
| **ConsorciosModule** | CRUD | ✅ Gestión de edificios |
| **UnidadesFuncionalesModule** | CRUD | ✅ Gestión de UFs |
| **UsuariosModule** | 9 | ✅ CRUD, invitaciones, roles |
| **ClaimingModule** | 7 | ✅ KYC con códigos de invitación |
| **AlertasModule** | 5 | ✅ Emergencias multicanal + Email |
| **SnapshotsModule** | 7 | ✅ Inmutabilidad legal |
| **BadgesModule** | 9 | ✅ Gamificación |
| **QRTrackingModule** | 3 | ✅ Tracking de QR en expensas |
| **AmenityRulesModule** | CRUD | ✅ Reglas de fair use |
| **AuditModule** | Global | ✅ Log inmutable |
| **ExpensasModule** | 9 | ✅ Liquidación + PDFs |
| **GastosModule** | 9 | ✅ CRUD + Categorías |
| **PagosModule** | 7 | ✅ Pagos + MP Webhook |
| **TicketsModule** | 10 | ✅ Reclamos con estados |
| **ComunicadosModule** | 7 | ✅ Comunicados programables |
| **NotificacionesModule** | 6 | ✅ Centro de notificaciones |
| **AmenitiesModule** | 12 | ✅ Reservas y penalizaciones |
| **AsambleasModule** | 17 | ✅ Votación por coeficientes |
| **ProveedoresModule** | 15 | ✅ Marketplace y trabajos |
| **DocumentosModule** | 7 | ✅ Gestión de documentos |
| **EmailModule** | - | ✅ Resend + 9 templates |
| **StorageModule** | 3 | ✅ S3/R2 upload/download |
| **PdfModule** | - | ✅ Expensas + Recibos |
| **PushModule** | - | ✅ Firebase Cloud Messaging |
| **WhatsAppModule** | - | ✅ Business API + Templates |
| **ResidentPortalModule** | 8 | ✅ Portal vecino (transparencia) |

**Total: 28 módulos, ~195+ endpoints**

### Frontend Admin-Web - 100% COMPLETO ✅

| Feature | Hooks | Páginas | Estado |
|---------|-------|---------|--------|
| auth | 4 | login | ✅ |
| consorcios | 4 | 3 | ✅ |
| unidades | 4 | 3 | ✅ |
| expensas | 5 | 3 | ✅ |
| gastos | 5 | 3 | ✅ |
| tickets | 5 | 3 | ✅ |
| comunicados | 4 | 3 | ✅ |
| usuarios | 9 | 3 | ✅ |
| pagos | 8 | 3 | ✅ |
| notificaciones | 6 | 1 | ✅ |
| amenities | 12 | 5 | ✅ |
| asambleas | 17 | 3 | ✅ |
| proveedores | 17 | 3 | ✅ |
| documentos | 7 | 3 | ✅ |
| alertas | 5 | 3 | ✅ |
| configuracion | - | 1 | ✅ |

**Total: 14 features, 38 páginas**

### Frontend Resident-App (PWA Vecinos) - 100% COMPLETO ✅

| Página | Descripción | Estado |
|--------|-------------|--------|
| `/` | Landing page | ✅ |
| `/login` | Login con magic link | ✅ |
| `/registro` | Registro con código invitación | ✅ |
| `/app` | Dashboard principal | ✅ |
| `/app/expensas` | Lista de expensas con filtros | ✅ |
| `/app/expensas/[periodo]` | Detalle con gastos y facturas | ✅ |
| `/app/gastos-edificio` | Transparencia: todos los gastos | ✅ |
| `/app/resumen-edificio` | Estadísticas de cobranza | ✅ |
| `/app/datos-bancarios` | CBU/Alias para depositar | ✅ |
| `/app/pagos` | Historial de pagos | ✅ |
| `/app/pagos/nuevo` | Pagar expensa (MP/transfer) | ✅ |
| `/app/pagos/informar` | Informar transferencia realizada | ✅ |
| `/app/tickets` | Lista de reclamos | ✅ |
| `/app/tickets/nuevo` | Crear reclamo | ✅ |
| `/app/comunicados` | Novedades del edificio | ✅ |
| `/app/perfil` | Datos personales | ✅ |

**Total: 18 páginas PWA**

### Frontend Staff-App (PWA Encargados) - 100% COMPLETO ✅

| Página | Descripción | Estado |
|--------|-------------|--------|
| `/login` | Login con código 6 dígitos | ✅ |
| `/app` | Dashboard con stats | ✅ |
| `/app/bitacora` | Lista de registros | ✅ |
| `/app/bitacora/nuevo` | Registrar novedad | ✅ |
| `/app/paquetes` | Lista de paquetes | ✅ |
| `/app/paquetes/recibir` | Recepción de paquete | ✅ |
| `/app/paquetes/[id]/entregar` | Entrega con firma DNI | ✅ |
| `/app/rondas` | Rondas de vigilancia | ✅ |
| `/app/rondas/nueva` | Registrar ronda | ✅ |
| `/app/emergencias` | Alertas activas | ✅ |
| `/app/perfil` | Datos y logout | ✅ |

**Total: 12 páginas PWA con soporte Offline-First**

### Testing - 60% 🟡

- ✅ Vitest configurado
- ✅ Jest configurado para API
- ✅ React Testing Library
- ✅ 40+ tests para lib/utils.ts
- ✅ **Suite E2E de seguridad (37 tests)**
- ✅ **Tests unitarios auth.service (21 tests)**
- ✅ **Tests unitarios pagos.service (19 tests)**
- ⏳ Tests de hooks
- ⏳ Playwright E2E

### Auditoría de Código - ✅ COMPLETADA

Ver [AUDIT-001-code-quality.md](./docs/audits/AUDIT-001-code-quality.md)

**Correcciones Aplicadas (27 Enero 2025):**
- ✅ Funciones duplicadas eliminadas (6 archivos resident-app)
- ✅ Interface `RequestWithUser` creada para tipar requests
- ✅ `readonly` agregado a inyecciones de servicios
- ✅ `console.log` reemplazados con logger condicional

**Correcciones Aplicadas (19 Enero 2026):**
- ✅ Suspense boundaries agregados para `useSearchParams()` (5 páginas)
- ✅ ESLint imports corregidos en resident-app y staff-app
- ✅ Configuración ESLint en packages individuales
- ✅ 38 TODOs documentados con priorización
- ✅ **Todos los builds verificados (API + 3 PWAs)**

**Correcciones Aplicadas (27 Enero 2026):**
- ✅ Jest configurado para tests unitarios API
- ✅ 40 tests unitarios para servicios críticos
- ✅ Documentación de infraestructura creada
- ✅ Scripts de deploy creados
- ✅ .env.example actualizado

**Tech Debt Documentado (Q1 2026):**
- 📋 38 TODOs categorizados y priorizados en AUDIT-001

---

## 💰 Motor Financiero (Implementado)

### Flujo de Expensas

```
1. BORRADOR → Admin crea liquidación
2. LIQUIDADA → Sistema calcula prorrateo
3. PUBLICADA → Visible para vecinos
4. CERRADA → Inmutable (SnapshotExpensa)
```

### Flujo de Pagos

```
Vecino paga $10,000
    ├──▶ $9,800 → CBU del Consorcio (Split automático)
    └──▶ $200 → Cuenta VecinoSimple (Fee 2%)
```

### Seguridad Financiera

- ✅ Precisión decimal (12,2) para montos
- ✅ HMAC-SHA256 para webhooks Mercado Pago
- ✅ Rate limiting (5 intentos/hora)
- ✅ Prevención de pagos duplicados por periodo
- ✅ Monto mínimo $500
- ✅ AuditLog inmutable en todas las operaciones

---

## 🔍 Sistema de Transparencia (ResidentPortalModule)

### Funcionalidades para Vecinos (PROPIETARIO/INQUILINO)

El módulo `/mi-portal/*` permite a los vecinos ver con transparencia total:

| Endpoint | Función | Seguridad |
|----------|---------|-----------|
| `GET /mi-portal/mis-datos` | Datos de UF + consorcio + CBU | Solo su UF |
| `GET /mi-portal/expensas` | Lista de expensas paginada | Solo su UF |
| `GET /mi-portal/expensas/:periodo` | Detalle con gastos por categoría | Solo PUBLICADA/CERRADA |
| `GET /mi-portal/expensas/:periodo/pdf` | Descarga PDF de expensa | Solo su UF |
| `GET /mi-portal/gastos-edificio` | Todos los gastos del edificio | Con comprobantes |
| `GET /mi-portal/gastos-edificio/categorias` | Categorías para filtrar | Público consorcio |
| `GET /mi-portal/resumen-edificio` | Estadísticas de cobranza | Sin datos de otros vecinos |
| `GET /mi-portal/datos-bancarios` | CBU, alias, instrucciones | Para depositar |

### Diferencia PROPIETARIO vs INQUILINO

- **PROPIETARIO**: Ve gastos ordinarios Y extraordinarios, puede votar
- **INQUILINO**: Solo ve gastos ordinarios, NO puede votar ni ver extraordinarios

### Información visible por gasto

- Concepto y descripción
- Monto
- Categoría
- Proveedor
- Tipo de comprobante (Factura A/B/C, Ticket, Recibo)
- Número de comprobante
- **URL de la factura/comprobante** (máxima transparencia)

---

## 🔐 Seguridad Implementada

### Backend (NestJS) - AUDITADO ✅

- ✅ JWT con validación completa (issuer, audience, estado usuario)
- ✅ JWT Secret seguro (mínimo 32 caracteres, validación en startup)
- ✅ Access tokens cortos (15 min) + refresh tokens (7 días)
- ✅ RolesGuard para RBAC con validación de usuario activo
- ✅ Rate limiting GLOBAL (ThrottlerModule)
  - Short: 10 req/seg
  - Medium: 50 req/10seg  
  - Long: 200 req/min
- ✅ Helmet para headers de seguridad HTTP
  - X-Content-Type-Options: nosniff
  - X-Frame-Options: DENY
  - HSTS con preload
  - CSP configurado
- ✅ CORS configurado por entorno
- ✅ Sanitización XSS centralizada (`Sanitizer` util)
- ✅ Validación de URLs (SSRF prevention)
- ✅ AuditService global con redacción de datos sensibles
- ✅ ValidationPipe global (whitelist, forbidNonWhitelisted)

### Tests de Seguridad

- ✅ Suite E2E de seguridad (`test/security/`)
- ✅ Tests de SQL Injection
- ✅ Tests de XSS Prevention
- ✅ Tests de Rate Limiting
- ✅ Tests de JWT Bypass
- ✅ Tests de RBAC
- ✅ Tests de Path Traversal
- ✅ Tests de Prototype Pollution

### Documentación de Seguridad

- [SEC-001 Initial Audit](./docs/security/SEC-001-initial-audit.md) - Hallazgos y vulnerabilidades
- [SEC-002 Remediation Plan](./docs/security/SEC-002-remediation-plan.md) - Tickets y fixes
- [SEC-003 Expert Audit](./docs/security/SEC-003-expert-audit.md) - Análisis exhaustivo OWASP

### Base de Datos

- Row Level Security (RLS) por consorcio
- Columnas sensibles encriptadas (DNI, CBU)
- Snapshots inmutables para auditoría legal

---

## 📋 Reglas de Negocio Críticas

### Expensas
- Una expensa PUBLICADA no se puede modificar
- Al CERRAR se crea un SnapshotExpensa inmutable
- Ajustes posteriores solo via Notas de Crédito/Débito
- Periodo: max 3 meses en el futuro

### Gastos
- URL de archivo debe ser dominio permitido
- Fecha: no futuro, max 2 años atrás
- No editable si expensa está CERRADA/PUBLICADA

### Pagos
- Validación de webhook con firma HMAC
- Sin pagos duplicados por mismo periodo
- Imputación: intereses → capital antiguo → capital actual

### Copropietarios
- 1 UF = 1 voto (TITULAR_VOTANTE)
- COPROPIETARIO ve todo pero no vota
- Usuario puede tener múltiples UFs

---

## 🚀 Roadmap de Sprints

### Sprint 1 - COMPLETADO ✅

- ✅ UsuariosModule backend (9 endpoints)
- ✅ Feature usuarios/ hooks (9 hooks)
- ✅ Páginas /usuarios (lista, nuevo, detalle)
- ✅ Feature pagos/ hooks (8 hooks)
- ✅ Páginas /pagos (lista, nuevo, detalle)
- ✅ lib/utils.ts (formatCurrency, formatDate, formatPeriodo, etc.)

### Sprint 2 - COMPLETADO ✅

- ✅ Vitest configurado con React Testing Library
- ✅ 40+ tests para lib/utils.ts
- ✅ Feature notificaciones/ hooks (6 hooks)
- ✅ Componente NotificationCenter
- ✅ Página /notificaciones (lista con filtros)
- ✅ Feature amenities/ hooks (12 hooks)
- ✅ Páginas /amenities (lista, nuevo, detalle, editar, reservar)
- ✅ Página /amenities/reservas (gestión de reservas)
- ✅ Dashboard layout actualizado con navegación completa

### Sprint 3 - COMPLETADO ✅

- ✅ Feature asambleas/ hooks (17 hooks)
- ✅ Páginas /asambleas (lista, nueva, detalle con votación)
- ✅ Feature proveedores/ hooks (17 hooks)
- ✅ Páginas /proveedores (marketplace, nuevo, detalle)

### Sprint 4 - COMPLETADO ✅

- ✅ Feature documentos/ hooks (7 hooks)
- ✅ Páginas /documentos (lista, nuevo, detalle)
- ✅ Feature alertas/ hooks (5 hooks)
- ✅ Páginas /alertas (panel, nueva, detalle con resolver)
- ✅ Página /configuracion con tabs (General, Notificaciones, Pagos, Seguridad, Equipo, Apariencia)

### Sprint 5 - COMPLETADO ✅

- ✅ EmailModule con Resend (9 templates)
- ✅ StorageModule (S3/R2 upload/download)
- ✅ PdfModule (expensas + recibos)
- ✅ UploadController con validación por carpeta
- ✅ Integrar email en AlertasService
- ✅ Integrar email en AuthService (magic links)
- ✅ Integrar email en PagosService (confirmaciones)
- ✅ Integrar PDF en ExpensasController
- ✅ Corregir errores de TypeScript
- ✅ Build de producción verificado

### Sprint 6 - COMPLETADO ✅ (Integraciones externas)

- ✅ PushModule con Firebase Cloud Messaging
- ✅ WhatsAppModule con Business API Cloud
- ✅ WhatsAppTemplateService (8 templates predefinidos)
- ✅ Integrar PushService en NotificacionesService
- ✅ Integrar PushService y WhatsAppService en AlertasService
- ✅ Actualizar .env.example con nuevas variables
- ✅ Build de producción verificado
- ⏳ Tests para hooks de features
- ⏳ Playwright E2E tests

### Pendientes Transversales

- ✅ Generación de PDF (expensas, recibos)
- ✅ Subida de archivos a S3/R2
- ✅ Email con Resend (9 templates)
- ✅ Email integrado en Auth, Pagos, Alertas
- ✅ Firebase Cloud Messaging (push notifications)
- ✅ WhatsApp Business API (templates pre-aprobados)

---

## 📚 Documentación Relacionada

> Ver [docs/README.md](./docs/README.md) para índice completo con convención de nombres.

### Arquitectura
- [ARCH-001 System Overview](./docs/architecture/ARCH-001-system-overview.md) - Visión general
- [ARCH-002 Tech Stack](./docs/architecture/ARCH-002-tech-stack.md) - Stack tecnológico
- [ARCH-003 Critical Features](./docs/architecture/ARCH-003-critical-features.md) - Funcionalidades críticas
- [ARCH-004 Sitemap UI](./docs/architecture/ARCH-004-sitemap-ui.md) - Mapa de sitio

### Seguridad
- [SEC-001 Initial Audit](./docs/security/SEC-001-initial-audit.md) - Auditoría inicial
- [SEC-002 Remediation Plan](./docs/security/SEC-002-remediation-plan.md) - Plan de remediación
- [SEC-003 Expert Audit](./docs/security/SEC-003-expert-audit.md) - Auditoría exhaustiva OWASP

### Guías
- [GUIDE-001 Getting Started](./docs/guides/GUIDE-001-getting-started.md) - Inicio rápido
- [GUIDE-002 Coding Standards](./docs/guides/GUIDE-002-coding-standards.md) - Estándares de código
- [GUIDE-003 Deployment](./docs/guides/GUIDE-003-deployment.md) - Despliegue

### Proyecto
- [PROJ-001 Roadmap](./docs/project/PROJ-001-roadmap.md) - Estado y roadmap

### Infraestructura y Deploy
- [INFRA-001 Production Setup](./docs/infrastructure/INFRA-001-production-setup.md) - Guía completa de servicios
- [PROD-003 Deploy Final](./docs/project/PROD-003-deploy-final.md) - **Checklist de deploy pendiente**

### Otros
- [Copilot Instructions](./.github/copilot-instructions.md) - Guía para desarrollo con IA

---

## ⚠️ Reglas de Desarrollo

1. **NUNCA** leer ni modificar el archivo `.env`
2. **SIEMPRE** incluir `consorcioId` en queries (RLS)
3. **SIEMPRE** usar AuditLog para operaciones financieras
4. **SIEMPRE** sanitizar inputs de texto (XSS)
5. **SIEMPRE** validar acceso por consorcio antes de operar
6. Respetar WCAG 2.1 AA en UI (accesibilidad)
7. Usar Decimal para montos, nunca float

---

## 🏛️ Compliance Legal

### Ley 941 (CABA) y Código Civil
- Transparencia en movimiento de fondos
- Acceso a documentación para propietarios
- Validez legal de votaciones virtuales

### Ley 25.326 (Protección de Datos)
- Datos pertenecen al consorcio, no a la plataforma
- Portabilidad de datos (exportación completa)
- Derecho al olvido

### Regulación Financiera
- La plataforma NO toca el dinero del consorcio
- Split directo a CBU del consorcio
- Solo cobramos fee de servicio
