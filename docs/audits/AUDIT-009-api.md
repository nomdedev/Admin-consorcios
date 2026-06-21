# 🔧 AUDIT-009: API (Backend NestJS)

**Fecha:** 5 de febrero de 2026  
**Versión:** 1.0  
**Health Score:** 6/10  

---

## 1. Información General

| Aspecto | Valor |
|---------|-------|
| Path | `apps/api/` |
| Framework | NestJS 10.x |
| Runtime | Node.js 20+ |
| Deploy | Railway |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma |

---

## 2. Estado Actual

### ✅ Correcto
- Build funciona correctamente
- Swagger/OpenAPI documentado
- Sentry integrado (requestHandler + errorHandler)
- Helmet configurado (headers de seguridad)
- Rate limiting implementado (ThrottlerModule)
- Encriptación de campos sensibles (AES-256-GCM)
- Bull Queue para emails async
- Redis caching implementado

### ⚠️ Advertencias
- **71 errores de lint** en asambleas.service.ts
- 12 instancias de `: any` en servicios
- Console.log en scripts de migración
- Tests básicos (solo 2 specs)

### ❌ Errores que Bloquean Build
- Ninguno actualmente (lint no bloquea)

---

## 3. Errores de Lint Activos

### asambleas.service.ts (0 errores) ✅
**Corregido el 5 feb 2026** — De 71 errores a 0:
- ✅ `parseFloat` → `Number.parseFloat` (25 instancias)
- ✅ `replace` → `replaceAll` (5 instancias)
- ✅ `Array.push()` múltiple → Arrays literales
- ✅ `node:crypto` import
- ✅ Reducción de complejidad con `generarLineasVotacion()`
- ✅ Tipado de parámetros (eliminado `: any`)
- ✅ Condiciones negadas invertidas

### Otros archivos con `: any`
| Archivo | Líneas | Severidad |
|---------|--------|-----------|
| alertas.service.ts | ~425 | Media |
| amenity-rules.service.ts | ~187 | Media |
| tickets.service.ts | Varios | Media |

---

## 4. Estructura de Módulos

```
apps/api/src/
├── main.ts                    # Bootstrap + Sentry
├── app.module.ts              # Root module
├── database/                  # Prisma + encriptación
│   ├── prisma.module.ts
│   ├── prisma.service.ts
│   └── field-encryption.service.ts  # AES-256-GCM
├── modules/
│   ├── auth/                  # Autenticación
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── guards/           # JWT guards
│   ├── usuarios/             # CRUD usuarios
│   ├── consorcios/           # CRUD consorcios + RLS
│   ├── expensas/             # Liquidación
│   ├── gastos/               # Con adjunto obligatorio
│   ├── pagos/                # Mercado Pago Split
│   ├── tickets/              # Reclamos
│   ├── comunicados/          # Anuncios
│   ├── asambleas/            # ⚠️ 71 lint errors
│   ├── notificaciones/       # WhatsApp + Email
│   ├── email/                # Bull Queue processor
│   ├── alertas/              # Sistema de alertas
│   ├── amenities/            # Reservas
│   ├── snapshots/            # Auditoría
│   └── ...
├── common/                   # Shared utilities
├── config/                   # Configuración
└── scripts/                  # Migraciones, seeds
```

---

## 5. Seguridad Implementada

### 5.1 Autenticación
- [x] JWT con RS256
- [x] Magic Links (sin password)
- [x] Refresh tokens
- [ ] 2FA (pendiente)

### 5.2 Autorización
- [x] Guards por rol (RBAC)
- [x] Multi-tenancy con `consorcioId`
- [x] RLS en queries Prisma

### 5.3 Headers de Seguridad (Helmet)
```typescript
// main.ts
app.use(helmet({
  contentSecurityPolicy: false,  // Permitir Swagger UI
  crossOriginEmbedderPolicy: false,
}));
```

### 5.4 Rate Limiting
```typescript
// ThrottlerModule configurado
{
  short: { ttl: 1000, limit: 3 },   // 3/segundo
  medium: { ttl: 10000, limit: 20 }, // 20/10s
  long: { ttl: 60000, limit: 100 },  // 100/minuto
}
```

### 5.5 Encriptación de Campos
```typescript
// Campos encriptados con AES-256-GCM
- Usuario.dni
- Usuario.cbu
- Usuario.telefono
```

---

## 6. Integraciones Externas

| Servicio | Estado | Notas |
|----------|--------|-------|
| Mercado Pago | ✅ Implementado | Split payments |
| WhatsApp Business | ⚠️ Parcial | TODOs pendientes |
| Resend (Email) | ✅ Implementado | Via Bull Queue |
| AFIP | ❌ No implementado | Pendiente |
| Supabase | ✅ Conectado | PostgreSQL |

---

## 7. Cola de Jobs (Bull)

### Configuración
```typescript
// email.module.ts
BullModule.registerQueue({
  name: 'email',
  redis: { host, port }
})
```

### Procesador
```typescript
// email.processor.ts
@Processor('email')
export class EmailProcessor {
  @Process('send')
  async handleSend(job: Job<EmailJobData>) {
    // Envío via Resend
  }
}
```

### TODOs
- [ ] Agregar queue para PDFs
- [ ] Agregar queue para WhatsApp
- [ ] Dashboard de monitoreo de jobs

---

## 8. Tests

### Unit Tests (Jest)
| Archivo | Coverage | Estado |
|---------|----------|--------|
| auth.service.spec.ts | ~40% | ⚠️ Básico |
| pagos.service.spec.ts | ~35% | ⚠️ Básico |

### E2E Tests
**No implementados** ❌

### Tests Críticos Faltantes
```
test/
├── auth/
│   ├── auth.service.spec.ts     # ✅ Existe
│   ├── auth.controller.spec.ts  # ❌ Falta
│   └── auth.e2e-spec.ts         # ❌ Falta
├── expensas/
│   ├── liquidacion.spec.ts      # ❌ Crítico
│   └── prorrateo.spec.ts        # ❌ Crítico
├── pagos/
│   ├── pagos.service.spec.ts    # ✅ Existe
│   ├── mercadopago.spec.ts      # ❌ Falta (mock)
│   └── split.spec.ts            # ❌ Falta
└── asambleas/
    └── votacion.spec.ts         # ❌ Crítico
```

---

## 9. Plan de Acción

### P0 - Crítico (1-3 días)
- [ ] **Corregir 71 errores de lint en asambleas.service.ts**
  - Cambiar `parseFloat` → `Number.parseFloat`
  - Cambiar `replace` → `replaceAll`
  - Usar spread operator para múltiples `push`
  - Refactorizar `generarContenidoActa()` (complejidad)
- [ ] Eliminar `: any` restantes (12 instancias)
- [ ] Agregar tests para liquidación de expensas

### P1 - Alto (1-2 semanas)
- [ ] Habilitar lint en CI/CD
- [ ] Agregar tests E2E para auth flow
- [ ] Completar integración WhatsApp
- [ ] Agregar queue para PDFs/facturas
- [ ] Cobertura mínima 50% en servicios críticos

### P2 - Medio (3-4 semanas)
- [ ] Tests de integración con Mercado Pago (mock)
- [ ] Implementar 2FA opcional
- [ ] WebSockets para eventos en tiempo real
- [ ] Observabilidad avanzada (trazas)

---

## 10. Dependencias Clave

| Dependencia | Versión | Estado |
|-------------|---------|--------|
| @nestjs/core | ^10.4.14 | ✅ OK |
| @nestjs/swagger | ^8.0.7 | ✅ OK |
| @prisma/client | ^5.22.0 | ✅ OK |
| @nestjs/bull | ^10.2.3 | ✅ OK |
| @sentry/node | ^8.50.0 | ✅ OK |
| helmet | ^8.0.0 | ✅ OK |
| ioredis | ^5.4.2 | ✅ OK |

---

## 11. Comandos de Desarrollo

```bash
# Desarrollo
pnpm dev --filter=api

# Build
pnpm build --filter=api

# Tests
pnpm test --filter=api

# Generar Prisma client
cd apps/api && npx prisma generate

# Migraciones
cd apps/api && npx prisma migrate dev
```

---

## 12. Variables de Entorno Requeridas

```env
# Database
DATABASE_URL=
DIRECT_URL=

# Auth
JWT_SECRET=
JWT_REFRESH_SECRET=

# Servicios externos
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_PUBLIC_KEY=
RESEND_API_KEY=
WHATSAPP_TOKEN=

# Redis
REDIS_URL=

# Monitoring
SENTRY_DSN=

# Encryption
ENCRYPTION_KEY=  # 32 bytes hex para AES-256
```

---

## 13. Verificación de Build Railway

### Checklist Pre-Deploy
- [ ] `pnpm build --filter=api` exitoso
- [ ] Prisma client generado
- [ ] Variables de entorno en Railway
- [ ] Redis accesible
- [ ] Database migrada

### Health Check
```
GET /health
→ { status: 'ok', database: 'connected', redis: 'connected' }
```

---

## 14. TODOs Pendientes en Código

| Categoría | Cantidad | Prioridad |
|-----------|----------|-----------|
| Mercado Pago webhooks | 4 | 🔴 Alta |
| WhatsApp Bot | 3 | 🟠 Media |
| AFIP integración | 2 | 🟡 Baja |
| S3 para archivos | 1 | 🟠 Media |
| PDF generación | 1 | 🟠 Media |

---

## 15. Métricas de Calidad

| Métrica | Target | Actual | Estado |
|---------|--------|--------|--------|
| Lint errors | 0 | 71 | ❌ |
| `: any` count | 0 | 12 | ⚠️ |
| Test coverage | 60% | ~20% | ⚠️ |
| Build time | < 60s | ~45s | ✅ |

---

**Última actualización:** 5 de febrero de 2026
