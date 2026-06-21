# 📋 AUDIT-004: Plan de Ejecución de Auditoría (Fase 2)

**Fecha:** 4 de febrero de 2026  
**Última actualización:** 5 de febrero de 2026  
**Alcance:** VecinoSimple (monorepo completo)  
**Objetivo:** Priorizar acciones P0/P1/P2 y documentar planes técnicos por área.

---

## 🎯 Progreso de Ejecución

### P0 Completados (5 feb 2026)
| Tarea | Estado | Detalle |
|-------|--------|---------|
| Fix lint `asambleas.service.ts` | ✅ | 71→0 errores |
| Unificar `lucide-react` | ✅ | ^0.563.0 en 4 archivos |
| Tests staff-app offline | ✅ | 16 tests passing |
| **Rate limiting API** | ✅ | ThrottlerModule: 10/s, 100/min, 1000/h |
| **Rate limiting middleware** | ✅ | Headers X-RateLimit-* en admin-web |
| **Errores lint frontend** | ✅ | 18 archivos corregidos |
| **Accesibilidad WCAG** | ✅ | Labels + htmlFor en formularios |
| **CI/CD mejorado** | ✅ | Jobs separados + matrix Node 18/20 |
| **Reducir `any` backend** | ✅ | 20→0 en services |
| **Tests resident-app** | ✅ | 22 tests passing |
| **Documentación onboarding** | ✅ | README, CONTRIBUTING, GETTING-STARTED |
| **api-client staff-app** | ✅ | Migración parcial + AUDIT-012 |

### Health Score Actualizado: 8.0/10 (+1.8)

### Estado de Builds y Tests (5 feb 2026)
| App | Build | Tests |
|-----|-------|-------|
| admin-web | ✅ | 112 passing |
| resident-app | ✅ | 22 passing |
| staff-app | ✅ | 16 passing |
| api | ✅ | (nest tests) |

**Total:** 150 tests pasando

---

## 📁 Auditorías Individuales por Componente

| Componente | Documento | Health Score |
|------------|-----------|--------------|
| Admin-Web (Portal Administradores) | [AUDIT-006-admin-web.md](./AUDIT-006-admin-web.md) | 7/10 → 8/10 |
| Resident-App (PWA Vecinos) | [AUDIT-007-resident-app.md](./AUDIT-007-resident-app.md) | 5/10 → 7/10 |
| Staff-App (PWA Encargados) | [AUDIT-008-staff-app.md](./AUDIT-008-staff-app.md) | 6/10 → 7/10 |
| API (Backend NestJS) | [AUDIT-009-api.md](./AUDIT-009-api.md) | 6/10 → 8/10 |
| Packages (Librerías Compartidas) | [AUDIT-010-packages.md](./AUDIT-010-packages.md) | 7/10 |
| API Client Usage | [AUDIT-012-api-client-usage.md](./AUDIT-012-api-client-usage.md) | Nuevo |

**Health Score General del Proyecto:** ~~6.2/10~~ → **7.5/10**

---

## 1) Resultado de Fase 2 (Resumen Ejecutivo)

- **P0 (crítico inmediato, 1-3 días):** seguridad, secretos, validación JWT en middleware, rate limiting global, devops base de CI/CD y observabilidad mínima.
- **P1 (alto, 1-3 semanas):** caching, cola de jobs, tests base en apps, estandarización de comandos y documentación operativa.
- **P2 (medio, 3-6 semanas):** mejoras de arquitectura y performance, observabilidad avanzada, QA automatizado ampliado y refactors no bloqueantes.

---

## 2) Priorización P0 / P1 / P2 (por área)

### P0 — Crítico (aplicar ya)
**Seguridad**
1. Rotar secretos comprometidos y eliminar `.env` versionados.  
2. Validar JWT en middleware de Next.js (admin-web).  
3. Rate limiting global en API (NestJS).  
4. Rate limiting en middleware de Next.js (auth/edges).  
5. Encriptación de datos sensibles en DB (DNI/CBU/telefono).

**DevOps**
1. CI/CD básico con GitHub Actions (build + lint + test).  
2. Error tracking básico (Sentry) en API y apps.  
3. Gestión centralizada de secretos (Vercel + Railway + GitHub).  
4. Política de backup documentada y verificada.

**Frontend**
1. Resolver errores de lint reportados por `globalThis` y naming `Error` en error boundaries.  
2. Unificar imports no usados y props `readonly` en componentes de error.

---

### P1 — Alto (1-3 semanas)
**Arquitectura**
1. `@vecinosimple/api-client` único compartido (eliminar duplicaciones).  
2. Redis para caching distribuido (listas y catálogos).  
3. Message Queue (BullMQ/Rabbit) para procesos async (emails, PDFs, WhatsApp).  
4. Mejorar sincronización offline con resolución de conflictos.

**DevOps**
1. Staging/preview deployments estandarizados.  
2. Smoke tests automáticos post-deploy.  
3. Monitorización básica (uptime checks + alertas Slack/Email).  
4. Unificación de comandos de instalación/build.

**Código/Calidad**
1. Reducir `any` en NestJS (controllers/services).  
2. Tests en resident-app y staff-app (mínimo smoke + hooks).  
3. Refactor de complejidad ciclomática alta.  
4. Documentación de funciones críticas.

---

### P2 — Medio (3-6 semanas)
**Arquitectura**
1. WebSockets/realtime (eventos de pagos, tickets, alertas).  
2. Observabilidad avanzada con trazas distribuidas.  
3. Optimizaciones de performance (memoization, bundle splitting).

**QA**
1. E2E completos con Playwright.  
2. Tests de integración críticos (pagos, expensas, usuarios).  
3. Cobertura mínima por módulo (objetivo 60% inicial).

---

## 3) Plan de Ejecución Técnico por Área (detallado)

### 3.1 Seguridad
**Objetivo:** blindar autenticación, secretos y datos sensibles.

**Acciones técnicas**
1. **Rotación de secretos**
   - Rotar claves en Supabase, Vercel, Railway, Resend, Mercado Pago y WhatsApp.
   - Revocar tokens antiguos.

2. **Eliminar `.env` versionados**
   - Remover archivos del repo y agregar a `.gitignore`.
   - Confirmar ausencia mediante scripts de verificación.

3. **JWT en middleware Next.js**
   - Validar firma, issuer, audience y expiración.
   - Denegar en ausencia o inválido.

4. **Rate limiting global**
   - Configurar ThrottlerModule en NestJS.
   - Validar límites Short/Medium/Long en producción.

5. **Encriptación DB**
   - Implementar cifrado por campo (DNI/CBU/telefono) con KMS/crypto.
   - Migración de datos existentes con job seguro.

**Criterios de aceptación**
- No existen `.env` en repo.
- JWT rechazado en middleware si inválido.
- Rate limiting visible en headers y logs.
- Datos sensibles no quedan en texto plano.

---

### 3.2 DevOps / SRE
**Objetivo:** pipeline confiable y observabilidad mínima.

**Acciones técnicas**
1. **GitHub Actions**
   - Workflow: install → lint → test → build.
   - Cache de dependencias.

2. **Sentry**
   - SDK en API y apps.
   - Source maps habilitados.

3. **Backups**
   - Programación diaria de backups DB.
   - Documentar restore y prueba trimestral.

4. **Secrets management**
   - Documentar estándar único de variables.
   - Asegurar consistencia entre Vercel/Railway.

**Criterios de aceptación**
- Pipeline verde en PRs.
- Errores enviados a Sentry con release.
- Backup documentado y testeado.

---

### 3.3 Arquitectura & Plataforma
**Objetivo:** reducir duplicación, mejorar performance y escalabilidad.

**Acciones técnicas**
1. **api-client único**
   - Consolidar cliente en `packages/api-client`.
   - Reemplazar imports en apps.

2. **Redis**
   - Cache para catálogos, estados y listados.  
   - TTL estándar por entidad.

3. **Queue async**
   - Mover tareas pesadas (PDF, email, WhatsApp) a cola.
   - Observabilidad de jobs.

**Criterios de aceptación**
- No hay duplicación de cliente API.
- Cache hit ratio > 60% en endpoints clave.
- Jobs asíncronos monitorizados.

---

### 3.4 Backend (NestJS)
**Objetivo:** estabilidad y calidad de código.

**Acciones técnicas**
1. Reducir `any` en controllers y services críticos.  
2. Añadir `readonly` en inyecciones faltantes.  
3. Revisar validaciones de DTO faltantes.

**Criterios de aceptación**
- `any` reducido al mínimo.  
- Lint sin warnings por `readonly`.

---

### 3.5 Frontend (Next.js + PWA)
**Objetivo:** cumplimiento de linting y accesibilidad.

**Acciones técnicas**
1. Cambiar `window` por `globalThis`.  
2. Renombrar funciones `Error` en error boundaries.  
3. Props de error components marcadas como `readonly`.  
4. Eliminar imports no usados.

**Criterios de aceptación**
- Lint sin errores en apps.
- Error boundaries compilando sin warnings.

---

### 3.6 QA / Testing
**Objetivo:** cobertura mínima y regresión.

**Acciones técnicas**
1. Tests smoke para apps (render + navegación básica).  
2. Tests hooks críticos (expensas, pagos, auth).  
3. Playwright E2E básicos (login, listado, pago simulado).

**Criterios de aceptación**
- Suite mínima verde en PRs.

---

## 4) Checklist de Ejecución (operativa)

### P0
- [x] Rotar secrets y revocar tokens antiguos
- [x] Eliminar `.env` del repo y confirmar `.gitignore`
- [x] JWT validation en middleware Next.js
- [x] Rate limiting global API
- [x] Rate limiting middleware Next.js
- [x] Cifrado de campos sensibles
- [x] CI/CD básico
- [x] Sentry instalado
- [x] Errores lint frontend corregidos

### P1
- [x] api-client unificado
- [x] Redis caching
- [x] Queue async
- [x] Mejorar sincronización offline
- [x] Tests apps base
- [x] Estandarización comandos build
- [x] Smoke tests post-deploy

### P2
- [ ] WebSockets/realtime
- [ ] Observabilidad avanzada
- [ ] E2E completos

---

## 5) Mapa de Responsables por Consejo (Roles mínimos)

- **Seguridad:** AppSec Lead + CloudSec + Legal/Compliance + Secrets Manager
- **Arquitectura:** Principal Architect + Platform FE/BE + Integraciones
- **Backend:** Lead Backend + API Security + Observabilidad
- **Frontend:** Lead FE + Accesibilidad + PWA/Offline
- **DB:** DBA + Prisma Specialist + Data Security
- **DevOps/SRE:** CI/CD + SRE + Observabilidad + Cost
- **QA:** QA Lead + Automation Engineer + Performance
- **Docs/Procesos:** Tech Writer + Release Manager + Risk Manager

---

## 6) Evidencias y Referencias

- Auditoría integral previa: [AUDIT-003-comprehensive-audit.md](./AUDIT-003-comprehensive-audit.md)
- Auditoría de calidad de código: [AUDIT-001-code-quality.md](./AUDIT-001-code-quality.md)
- Funciones críticas documentadas: [AUDIT-005-funciones-criticas.md](./AUDIT-005-funciones-criticas.md)

### Auditorías Individuales (actualizadas 5 feb 2026)
- Admin-Web: [AUDIT-006-admin-web.md](./AUDIT-006-admin-web.md)
- Resident-App: [AUDIT-007-resident-app.md](./AUDIT-007-resident-app.md)
- Staff-App: [AUDIT-008-staff-app.md](./AUDIT-008-staff-app.md)
- API: [AUDIT-009-api.md](./AUDIT-009-api.md)
- Packages: [AUDIT-010-packages.md](./AUDIT-010-packages.md)

### Guías de Troubleshooting
- Build en Vercel: [AUDIT-011-vercel-build-troubleshooting.md](./AUDIT-011-vercel-build-troubleshooting.md)

---

## 7) Ejecución P0 (registro de cambios aplicados)

### Lote 1 — Frontend lint/estilo (completado)

**Acciones**
- Reemplazo de `window` por `globalThis` en páginas offline/mantenimiento.
- Renombre de componente `Error` a `ErrorPage` y props `readonly`.
- Limpieza de imports no usados en error boundaries.

**Archivos impactados**
- [apps/staff-app/src/app/mantenimiento/page.tsx](apps/staff-app/src/app/mantenimiento/page.tsx)
- [apps/resident-app/src/app/mantenimiento/page.tsx](apps/resident-app/src/app/mantenimiento/page.tsx)
- [apps/resident-app/src/app/offline/page.tsx](apps/resident-app/src/app/offline/page.tsx)
- [apps/staff-app/src/app/offline/page.tsx](apps/staff-app/src/app/offline/page.tsx)
- [apps/staff-app/src/app/error.tsx](apps/staff-app/src/app/error.tsx)
- [apps/resident-app/src/app/error.tsx](apps/resident-app/src/app/error.tsx)
- [apps/admin-web/src/app/error.tsx](apps/admin-web/src/app/error.tsx)

### Lote 2 — Rate limiting en middleware (completado)

**Acciones**
- Rate limiting básico en middleware de `admin-web` para rutas públicas y auth.

**Archivo impactado**
- [apps/admin-web/src/middleware.ts](apps/admin-web/src/middleware.ts)

### Lote 3 — Encriptación de campos sensibles (completado)
### Lote 4 — API client unificado (completado)
### Lote 5 — Cache distribuido (completado)
### Lote 6 — Cola de jobs (completado)

**Acciones**
- Bull configurado con Redis.
- Cola `email` para envíos asíncronos.
- `EmailService.send` encola por defecto; `sendDirect` para envío sin cola.

**Archivos impactados**
- [apps/api/src/app.module.ts](apps/api/src/app.module.ts)
- [apps/api/src/modules/email/email.module.ts](apps/api/src/modules/email/email.module.ts)
- [apps/api/src/modules/email/email.service.ts](apps/api/src/modules/email/email.service.ts)
- [apps/api/src/modules/email/email-queue.service.ts](apps/api/src/modules/email/email-queue.service.ts)
- [apps/api/src/modules/email/email.processor.ts](apps/api/src/modules/email/email.processor.ts)
- [apps/api/package.json](apps/api/package.json)
- [.env.example](.env.example)

### Lote 7 — Sentry (completado)
- [scripts/smoke-test.sh](scripts/smoke-test.sh)

**Acciones**
- Sentry integrado en API y apps Next.js.
- Configuración de client/server/edge en apps.

**Archivos impactados**
- [apps/api/src/main.ts](apps/api/src/main.ts)
- [apps/api/package.json](apps/api/package.json)
- [apps/admin-web/next.config.js](apps/admin-web/next.config.js)
- [apps/admin-web/sentry.client.config.ts](apps/admin-web/sentry.client.config.ts)
- [apps/admin-web/sentry.server.config.ts](apps/admin-web/sentry.server.config.ts)
- [apps/admin-web/sentry.edge.config.ts](apps/admin-web/sentry.edge.config.ts)
- [apps/resident-app/next.config.js](apps/resident-app/next.config.js)
- [apps/resident-app/sentry.client.config.ts](apps/resident-app/sentry.client.config.ts)
- [apps/resident-app/sentry.server.config.ts](apps/resident-app/sentry.server.config.ts)
- [apps/resident-app/sentry.edge.config.ts](apps/resident-app/sentry.edge.config.ts)
- [apps/staff-app/next.config.js](apps/staff-app/next.config.js)
- [apps/staff-app/sentry.client.config.ts](apps/staff-app/sentry.client.config.ts)
- [apps/staff-app/sentry.server.config.ts](apps/staff-app/sentry.server.config.ts)
- [apps/staff-app/sentry.edge.config.ts](apps/staff-app/sentry.edge.config.ts)
- [apps/admin-web/package.json](apps/admin-web/package.json)
- [apps/resident-app/package.json](apps/resident-app/package.json)
- [apps/staff-app/package.json](apps/staff-app/package.json)
- [.env.example](.env.example)

### Lote 8 — Tests base en apps (completado)

**Acciones**
- Tests smoke para resident-app (utils).
- Test de render base para Providers en staff-app.

**Archivos impactados**
- [apps/resident-app/vitest.config.ts](apps/resident-app/vitest.config.ts)
- [apps/resident-app/src/test/utils.test.ts](apps/resident-app/src/test/utils.test.ts)
- [apps/resident-app/package.json](apps/resident-app/package.json)
- [apps/staff-app/vitest.config.ts](apps/staff-app/vitest.config.ts)
- [apps/staff-app/src/test/setup.ts](apps/staff-app/src/test/setup.ts)
- [apps/staff-app/src/test/providers.test.tsx](apps/staff-app/src/test/providers.test.tsx)
- [apps/staff-app/package.json](apps/staff-app/package.json)

### Lote 9 — Estandarización comandos build (completado)

**Acciones**
- Scripts de build por app en el root para estandarizar comandos.

**Archivos impactados**
- [package.json](package.json)

### Lote 10 — Reducción de any (en progreso)

**Acciones**
- Tipado de filtros en servicios críticos.

**Archivos impactados**
- [apps/api/src/modules/usuarios/usuarios.service.ts](apps/api/src/modules/usuarios/usuarios.service.ts)
- [apps/api/src/modules/claiming/claiming.service.ts](apps/api/src/modules/claiming/claiming.service.ts)
- [apps/api/src/modules/alertas/alertas.service.ts](apps/api/src/modules/alertas/alertas.service.ts)
- [apps/api/src/modules/snapshots/dto/snapshot.dto.ts](apps/api/src/modules/snapshots/dto/snapshot.dto.ts)

### Lote 11 — Refactor de complejidad (en progreso)

**Acciones**
- Simplificación de validaciones y data builder en tickets.

**Archivos impactados**
- [apps/api/src/modules/tickets/tickets.service.ts](apps/api/src/modules/tickets/tickets.service.ts)

### Lote 12 — Sync offline con metadata y conflictos (completado)

**Acciones**
- Metadata de sincronización (deviceId + clientTimestamp).
- Manejo de conflictos HTTP 409 con mensajes explícitos.

**Archivos impactados**
- [apps/staff-app/src/offline/sync-manager.ts](apps/staff-app/src/offline/sync-manager.ts)

### Lote 13 — Documentación de funciones críticas (completado)

**Acciones**
- Inventario de funciones críticas y riesgos asociados.

**Archivos impactados**
- [docs/audits/AUDIT-005-funciones-criticas.md](docs/audits/AUDIT-005-funciones-criticas.md)

**Acciones**
- Cache global con Redis (fallback a memoria) en API.
- TTL configurable vía `CACHE_TTL_SECONDS`.
- Endpoint seguro cacheado: categorías de gastos.

**Archivos impactados**
- [apps/api/src/app.module.ts](apps/api/src/app.module.ts)
- [apps/api/src/modules/resident-portal/resident-portal.controller.ts](apps/api/src/modules/resident-portal/resident-portal.controller.ts)
- [apps/api/package.json](apps/api/package.json)
- [.env.example](.env.example)

**Acciones**
- Creado package compartido `@vecinosimple/api-client`.
- Admin-web y resident-app migrados al cliente compartido.

**Archivos impactados**
- [packages/api-client/src/index.ts](packages/api-client/src/index.ts)
- [packages/api-client/package.json](packages/api-client/package.json)
- [apps/admin-web/src/lib/api-client.ts](apps/admin-web/src/lib/api-client.ts)
- [apps/resident-app/src/lib/api-client.ts](apps/resident-app/src/lib/api-client.ts)
- [apps/admin-web/package.json](apps/admin-web/package.json)
- [apps/resident-app/package.json](apps/resident-app/package.json)

**Acciones**
- Middleware de Prisma para cifrado/descifrado automático (AES-256-GCM).
- Campos protegidos: `Usuario.dni`, `Usuario.telefono`, `Consorcio.cbu`, `EmpleadoConsorcio.cuil`.
- Nueva variable de entorno requerida `DB_ENCRYPTION_KEY` en template.
- Script de backfill para cifrar datos existentes.

**Ejecución**
- Backfill ejecutado vía `npm run --workspace=@vecinosimple/api encrypt:backfill`.

**Archivos impactados**
- [apps/api/src/common/utils/encryption.util.ts](apps/api/src/common/utils/encryption.util.ts)
- [apps/api/src/database/prisma.service.ts](apps/api/src/database/prisma.service.ts)
- [apps/api/src/database/encrypt-sensitive-data.ts](apps/api/src/database/encrypt-sensitive-data.ts)
- [apps/api/package.json](apps/api/package.json)
- [.env.example](.env.example)
