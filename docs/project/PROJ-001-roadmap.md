# 📋 Plan de Acción - VecinoSimple

> **Última actualización:** 20 de Enero 2026  
> **Repositorio:** nomdedev/vecinosimple  
> **Branch:** master

---

## 🎯 Visión del Proyecto

Plataforma SaaS B2B2C para administración de consorcios en Argentina con foco en:
- **Inclusión digital** de adultos mayores ("Abuela-Proof")
- **Transparencia financiera** (cada gasto con factura visible)
- **Automatización operativa** para administradores

---

## 📊 ESTADO ACTUAL DEL PROYECTO (Enero 2026)

### Métricas Generales

```
Backend API:      █████████████████████████  100% (25/25 módulos) ✅
Frontend Admin:   █████████████████████████  100% (38 páginas) ✅
Testing:          █████░░░░░░░░░░░░░░░░░░░░   25% (lib/utils)
Resident App:     █░░░░░░░░░░░░░░░░░░░░░░░░    5% (scaffold)
Staff App:        █░░░░░░░░░░░░░░░░░░░░░░░░    5% (scaffold)
Integraciones:    █████████████████░░░░░░░░   70% (Email, Storage, PDF)
```

### ✅ Infraestructura Base - COMPLETADA (100%)

| Componente | Estado |
|------------|--------|
| Monorepo Turborepo + pnpm | ✅ |
| TypeScript Config | ✅ |
| ESLint + Prettier | ✅ |
| Tailwind Config | ✅ |
| Git + GitHub | ✅ |
| Husky + Lint-staged | ✅ |

### ✅ Base de Datos (Prisma + PostgreSQL) - COMPLETADA (100%)

**35+ modelos implementados** incluyendo:
- Organizacion, Consorcio, Usuario, UsuarioConsorcio
- UnidadFuncional, Expensa, DetalleExpensa, Gasto
- Pago, MovimientoCuentaCorriente, TicketMantenimiento
- Comunicado, Notificacion, Asamblea, Amenity
- AuditLog, SnapshotExpensa, BadgeUsuario, etc.

### ✅ Backend API (NestJS) - 100% Completado

| Módulo | Controller | Service | DTOs | Estado |
|--------|-----------|---------|------|--------|
| `auth` | ✅ | ✅ | ✅ | ✅ Completo |
| `consorcios` | ✅ | ✅ | ✅ | ✅ Completo |
| `unidades-funcionales` | ✅ | ✅ | ✅ | ✅ Completo |
| `expensas` | ✅ | ✅ | ✅ | ✅ Completo |
| `gastos` | ✅ | ✅ | ✅ | ✅ Completo |
| `pagos` | ✅ | ✅ | ✅ | ✅ Completo |
| `tickets` | ✅ | ✅ | ✅ | ✅ Completo |
| `comunicados` | ✅ | ✅ | ✅ | ✅ Completo |
| `notificaciones` | ✅ | ✅ | ✅ | ✅ Completo |
| `amenities` | ✅ | ✅ | ✅ | ✅ Completo |
| `amenities-rules` | ✅ | ✅ | ✅ | ✅ Completo |
| `asambleas` | ✅ | ✅ | ✅ | ✅ Completo |
| `proveedores` | ✅ | ✅ | ✅ | ✅ Completo |
| `documentos` | ✅ | ✅ | ✅ | ✅ Completo |
| `alertas` | ✅ | ✅ | ✅ | ✅ Completo |
| `snapshots` | ✅ | ✅ | ✅ | ✅ Completo |
| `badges` | ✅ | ✅ | ✅ | ✅ Completo |
| `qr-tracking` | ✅ | ✅ | ✅ | ✅ Completo |
| `claiming` | ✅ | ✅ | ✅ | ✅ Completo |
| `usuarios` | ✅ | ✅ | ✅ | ✅ Completo |
| `audit` | - | ✅ | - | ✅ Completo |
| `health` | ✅ | - | - | ✅ Completo |
| `email` | - | ✅ | ✅ | ✅ Completo (Resend) |
| `storage` | ✅ | ✅ | ✅ | ✅ Completo (S3/R2) |
| `pdf` | - | ✅ | ✅ | ✅ Completo (Expensas/Recibos) |

**Total: ~185+ endpoints implementados**

### 🔄 Frontend admin-web - 100% Completado ✅

**Páginas implementadas (38):**

| Ruta | Estado | Descripción |
|------|--------|-------------|
| `/` | ✅ | Dashboard con stats reales |
| `/login` | ✅ | Login con magic link |
| `/consorcios` | ✅ | Lista con búsqueda |
| `/consorcios/nuevo` | ✅ | Formulario creación |
| `/consorcios/[id]` | ✅ | Detalle con UFs |
| `/gastos` | ✅ | Lista con filtros |
| `/gastos/nuevo` | ✅ | Formulario con validación |
| `/gastos/[id]` | ✅ | Detalle/edición |
| `/expensas` | ✅ | Lista con estados |
| `/expensas/nueva` | ✅ | Selector de periodo |
| `/expensas/[id]` | ✅ | Detalle + workflow |
| `/tickets` | ✅ | Lista con stats |
| `/tickets/nuevo` | ✅ | Formulario prioridad |
| `/tickets/[id]` | ✅ | Detalle + comentarios |
| `/comunicados` | ✅ | Lista activos/programados |
| `/comunicados/nuevo` | ✅ | Editor + programación |
| `/comunicados/[id]` | ✅ | Detalle + notificaciones |
| `/usuarios` | ✅ | Lista con filtros y búsqueda |
| `/usuarios/nuevo` | ✅ | Formulario con asignación de rol |
| `/usuarios/[id]` | ✅ | Detalle + gestión de roles |
| `/pagos` | ✅ | Lista con stats de recaudación |
| `/pagos/nuevo` | ✅ | Registro de pago manual |
| `/pagos/[id]` | ✅ | Detalle + cambio de estado |
| `/notificaciones` | ✅ | Centro con filtros |
| `/amenities` | ✅ | Lista + reservas |
| `/amenities/nuevo` | ✅ | Formulario creación |
| `/amenities/[id]` | ✅ | Detalle + calendario |
| `/amenities/[id]/editar` | ✅ | Edición amenity |
| `/amenities/reservas` | ✅ | Gestión de reservas |
| `/asambleas` | ✅ | Lista con estados |
| `/asambleas/nueva` | ✅ | Formulario creación |
| `/asambleas/[id]` | ✅ | Votación + quorum |
| `/proveedores` | ✅ | Marketplace |
| `/proveedores/nuevo` | ✅ | Formulario proveedor |
| `/proveedores/[id]` | ✅ | Detalle + trabajos |
| `/documentos` | ✅ | Lista con categorías |
| `/documentos/nuevo` | ✅ | Upload con drag-drop |
| `/documentos/[id]` | ✅ | Detalle + edición |
| `/alertas` | ✅ | Panel de emergencias |
| `/alertas/nueva` | ✅ | Creación multicanal |
| `/alertas/[id]` | ✅ | Detalle + resolver |
| `/configuracion` | ✅ | Configuración con tabs |

**Feature hooks implementados (14):**
- ✅ `features/auth/` - Store + hooks de autenticación
- ✅ `features/consorcios/` - CRUD completo + UFs
- ✅ `features/expensas/` - Liquidación + estados
- ✅ `features/gastos/` - CRUD + categorías
- ✅ `features/tickets/` - Estados + comentarios
- ✅ `features/comunicados/` - CRUD + notificaciones
- ✅ `features/usuarios/` - CRUD + roles + invitaciones
- ✅ `features/pagos/` - Pagos + cuenta corriente + stats
- ✅ `features/notificaciones/` - Centro de notificaciones
- ✅ `features/amenities/` - Reservas + reglas + penalizaciones
- ✅ `features/asambleas/` - Votación + quorum + asistencia
- ✅ `features/proveedores/` - Marketplace + trabajos
- ✅ `features/documentos/` - Categorías + upload + búsqueda
- ✅ `features/alertas/` - Emergencias multicanal

**Utilidades implementadas:**
- ✅ `lib/utils.ts` - formatCurrency, formatDate, formatPeriodo, CUIT, etc.
- ✅ `lib/api-client.ts` - Cliente HTTP con interceptors
- ✅ `lib/types.ts` - Tipos compartidos
- ✅ `lib/hooks/use-debounce.ts` - Hook de debounce

### 📦 Packages - 85% Completado

| Package | Estado | Descripción |
|---------|--------|-------------|
| `@vecinosimple/ui` | ✅ | 11 primitivos + 6 patterns |
| `@vecinosimple/database` | ✅ | 35+ modelos Prisma |
| `@vecinosimple/business-logic` | ✅ | Calculadores + validadores |
| `@vecinosimple/eslint-config` | ✅ | Reglas de estilo |
| `@vecinosimple/typescript-config` | ✅ | Configs TS |
| `@vecinosimple/tailwind-config` | ✅ | Temas y tokens |
| `@vecinosimple/api-client` | ❌ | **FALTA** (está en admin-web/lib) |

---

## ✅ SPRINTS COMPLETADOS

### SPRINT 1: Backend + Usuarios + Pagos ✅ COMPLETADO

| Tarea | Estado |
|-------|--------|
| Crear `UsuariosModule` completo (9 endpoints) | ✅ |
| Crear feature `usuarios/` en admin-web (9 hooks) | ✅ |
| Crear página `/usuarios` con CRUD completo | ✅ |
| Crear página `/usuarios/nuevo` con formulario | ✅ |
| Crear página `/usuarios/[id]` con detalle | ✅ |
| Crear feature `pagos/` hooks (8 hooks) | ✅ |
| Crear página `/pagos` con stats y filtros | ✅ |
| Crear página `/pagos/nuevo` para pago manual | ✅ |
| Crear página `/pagos/[id]` con detalle | ✅ |
| Crear `lib/utils.ts` con funciones de formato | ✅ |

### SPRINT 2: Testing + Notificaciones + Amenities ✅ COMPLETADO

| Tarea | Estado |
|-------|--------|
| Configurar Vitest para admin-web | ✅ |
| Tests básicos para lib/utils.ts (40+ tests) | ✅ |
| Crear feature `notificaciones/` hooks (6 hooks) | ✅ |
| Crear componente NotificationCenter | ✅ |
| Crear página `/notificaciones` con filtros | ✅ |
| Crear feature `amenities/` hooks (12 hooks) | ✅ |
| Crear páginas /amenities (5 páginas) | ✅ |
| Crear página `/amenities/reservas` | ✅ |

### SPRINT 3: Asambleas + Proveedores ✅ COMPLETADO

| Tarea | Estado |
|-------|--------|
| Crear feature `asambleas/` hooks (17 hooks) | ✅ |
| Crear página `/asambleas` con lista y filtros | ✅ |
| Crear página `/asambleas/nueva` con formulario | ✅ |
| Crear página `/asambleas/[id]` con votación | ✅ |
| Crear feature `proveedores/` hooks (17 hooks) | ✅ |
| Crear página `/proveedores` (marketplace) | ✅ |
| Crear página `/proveedores/nuevo` | ✅ |
| Crear página `/proveedores/[id]` con trabajos | ✅ |

### SPRINT 4: Documentos + Alertas + Configuración ✅ COMPLETADO

| Tarea | Estado |
|-------|--------|
| Crear feature `documentos/` hooks (7 hooks) | ✅ |
| Crear página `/documentos` con lista y stats | ✅ |
| Crear página `/documentos/nuevo` con upload | ✅ |
| Crear página `/documentos/[id]` con edición | ✅ |
| Crear feature `alertas/` hooks (5 hooks) | ✅ |
| Crear página `/alertas` (panel emergencias) | ✅ |
| Crear página `/alertas/nueva` con canales | ✅ |
| Crear página `/alertas/[id]` con resolver | ✅ |
| Crear página `/configuracion` con tabs | ✅ |
| Crear página `/asambleas/[id]` con votación | ✅ |
| Crear feature `proveedores/` hooks (17 hooks) | ✅ |
| Crear página `/proveedores` (marketplace) | ✅ |
| Crear página `/proveedores/nuevo` | ✅ |
| Crear página `/proveedores/[id]` con trabajos | ✅ |

---

## 🔴 GAPS PENDIENTES

### 1. Testing: 25% Cobertura
- ✅ Vitest configurado
- ✅ Tests para lib/utils.ts (40+ tests)
- ❌ No hay tests para hooks
- ❌ Sin E2E tests (Playwright)

### 2. Integraciones con TODOs
- ✅ `alertas.service.ts:188` - Email (Resend) - **IMPLEMENTADO**
- `alertas.service.ts:164` - Firebase Cloud Messaging (TODO)
- `alertas.service.ts:209` - WhatsApp Business API (TODO)
- `alertas.service.ts:229` - SMS (Twilio) (TODO)
- `expensas.service.ts:748` - Notificaciones a vecinos (TODO)

### 3. Apps secundarias vacías
- `resident-app` - Solo scaffold
- `staff-app` - Solo scaffold + Dexie DB

---

## 🚀 ROADMAP DE IMPLEMENTACIÓN

### SPRINT 5: Integraciones 🔄 EN PROGRESO (70%)
**Objetivo:** Notificaciones reales y archivos

| Tarea | Prioridad | Estado |
|-------|-----------|--------|
| Integrar Resend para emails | 🔴 Alta | ✅ Completado |
| Configurar templates de email (9 templates) | 🔴 Alta | ✅ Completado |
| Subida de archivos a R2/S3 | 🟡 Media | ✅ Completado |
| Generación de PDFs (expensas + recibos) | 🟡 Media | ✅ Completado |
| Endpoint de upload con validación | 🟡 Media | ✅ Completado |
| Integrar email en AlertasService | 🟡 Media | ✅ Completado |
| Integrar PDF en ExpensasController | 🟡 Media | ✅ Completado |
| Tests para hooks de features | 🟡 Media | ⏳ Pendiente |
| Integrar Firebase Cloud Messaging | 🟢 Baja | ⏳ Pendiente |
| Integrar WhatsApp Business API | 🟢 Baja | ⏳ Pendiente |

### SPRINT 6: Resident App MVP (2 semanas)
**Objetivo:** App funcional para vecinos

| Tarea | Prioridad | Estimado |
|-------|-----------|----------|
| Setup PWA con manifest | 🔴 Alta | 2h |
| Dashboard con expensa actual | 🔴 Alta | 4h |
| Flujo de pago con MP | 🔴 Alta | 8h |
| Historial de pagos | 🟡 Media | 4h |
| Ver comunicados | 🟡 Media | 4h |
| Crear reclamos | 🟡 Media | 4h |

### SPRINT 7: Staff App + Offline (2 semanas)
**Objetivo:** App offline para encargados

| Tarea | Prioridad | Estimado |
|-------|-----------|----------|
| Bitácora de seguridad | 🔴 Alta | 6h |
| Gestión de paquetes | 🔴 Alta | 6h |
| Sync con IndexedDB | 🔴 Alta | 8h |
| Service Worker completo | 🟡 Media | 4h |

---

## 📅 TIMELINE ESTIMADO

```
Semana 1 (Ene 20-24):  Sprint 4 - ✅ COMPLETADO
Semana 2-3 (Ene 27 - Feb 7): Sprint 5 - Integraciones
Semana 4-5 (Feb 10-21): Sprint 6 - Resident App
Semana 6-7 (Feb 24 - Mar 7): Sprint 7 - Staff App
```

**MVP Completo estimado:** Marzo 2026

---

## 📈 PROGRESO HISTÓRICO

| Fecha | Backend | Frontend | Hito |
|-------|---------|----------|------|
| 15 Ene 2026 | 85% | 55% | Auditoría inicial |
| 18 Ene 2026 | 100% | 70% | Sprint 1 completado |
| 19 Ene 2026 | 100% | 95% | Sprint 2 + 3 completados |
| 20 Ene 2026 | 100% | 100% | Sprint 4 completado - admin-web COMPLETO |
| 20 Ene 2026 | 100%+ | 100% | **Sprint 5 - Integraciones 70% (Email, Storage, PDF)** |

---

## ✅ CHECKLIST DE CALIDAD

### Antes de cada merge:
- [ ] TypeScript compila sin errores (`pnpm type-check`)
- [ ] ESLint pasa (`pnpm lint`)
- [ ] Tests pasan (`pnpm test`)
- [ ] Accesibilidad verificada (contraste, aria-labels)

### Antes de release:
- [ ] E2E tests pasan
- [ ] Performance audit (Lighthouse >90)
- [ ] Security headers configurados
- [ ] Logs sin datos sensibles

---

## 📚 DOCUMENTACIÓN RELACIONADA

- [Contexto del Proyecto](../context.md)
- [Arquitectura](./ARCHITECTURE.md)
- [Stack Tecnológico](./STACK.md)
- [Informe de Estructura](./INFORME-ESTRUCTURA.md)
- [Funcionalidades Críticas](./FUNCIONALIDADES-CRITICAS.md)
- [Copilot Instructions](../.github/copilot-instructions.md)

---

## ⚠️ REGLAS DE DESARROLLO

1. **NUNCA** leer ni modificar el archivo `.env`
2. **SIEMPRE** incluir `consorcioId` en queries (RLS)
3. **SIEMPRE** usar AuditLog para operaciones financieras
4. **SIEMPRE** sanitizar inputs de texto (XSS)
5. Respetar WCAG 2.1 AA en UI
6. Usar Decimal para montos, nunca float
7. Escribir tests para código nuevo
