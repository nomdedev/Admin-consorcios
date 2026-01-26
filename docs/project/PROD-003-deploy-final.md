# 🚀 PROD-003: Deploy Final - Solo Tareas Pendientes

> **Fecha:** 27 de Enero 2026  
> **Estado:** LISTO PARA EJECUTAR  
> **Tiempo estimado:** 4-6 horas

---

## ✅ Estado del Código: 100% Listo

| Área | Estado | Verificación |
|------|--------|--------------|
| Build | ✅ 4/4 apps compilan | `pnpm build` |
| Tests | ✅ 40 unit + 37 E2E security | `pnpm test` |
| Seguridad | ✅ Auditoría aprobada | SEC-003 |
| Documentación | ✅ Scripts listos | `scripts/` |

**No hay código pendiente. Solo queda configurar infraestructura y deploy.**

---

## 📋 PASO 1: Crear Cuentas (1-2 horas)

### 1.1 Neon (PostgreSQL) ✅ COMPLETADO

```
[x] Cuenta creada
[x] DATABASE_URL obtenida
```

### 1.2 Railway (API Backend)

```
[ ] Ir a https://railway.app
[ ] Crear cuenta con GitHub
[ ] Nuevo proyecto → Deploy from GitHub repo
[ ] Seleccionar monorepo, configurar:
    - Root Directory: apps/api
    - Build Command: pnpm build
    - Start Command: node dist/main.js
```

### 1.3 Vercel (3 Frontends) ✅ COMPLETADO

```
[x] Cuenta creada
[x] Repositorio conectado
```

### 1.4 Resend (Email)

```
[ ] Ir a https://resend.com
[ ] Crear cuenta
[ ] Obtener API Key
[ ] (Opcional) Verificar dominio propio para emails
```

### 1.5 Supabase Storage (recomendado)

```
[x] Ir a https://supabase.com
[x] Proyecto `supabase-purple-dog` creado
[x] En Dashboard → Storage → Bucket `vecinosimple-uploads` creado
[x] Claves obtenidas: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET`
```

**Nota:** Guardá la `SUPABASE_SERVICE_ROLE_KEY` solo en Railway (backend). Usar `SUPABASE_ANON_KEY` en Vercel frontends.

---

## 📋 PASO 2: Configurar Variables de Entorno (30 min)

### 2.1 Railway (API)

Ir a Settings → Variables y agregar:

```env
# Base de datos (de Neon)
DATABASE_URL=postgresql://...

# Seguridad JWT (generar con: openssl rand -base64 32)
JWT_SECRET=<min 32 caracteres>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Entorno
NODE_ENV=production
PORT=3000

# CORS (dominios de Vercel)
ALLOWED_ORIGINS=https://admin.vecinosimple.com,https://app.vecinosimple.com,https://staff.vecinosimple.com

# Email (de Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@vecinosimple.com

# Storage (Supabase)
SUPABASE_URL=https://supabase-purple-dog.supabase.co
SUPABASE_ANON_KEY=<ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SERVICE_ROLE_KEY>  # SOLO backend
SUPABASE_BUCKET=vecinosimple-uploads

# Rate Limiting
THROTTLE_SHORT_LIMIT=10
THROTTLE_MEDIUM_LIMIT=50
THROTTLE_LONG_LIMIT=200
```

### 2.2 Vercel (cada frontend)

```env
# En admin-web
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
NEXTAUTH_URL=https://admin.vecinosimple.com
NEXTAUTH_SECRET=<generar con: openssl rand -base64 32>

# En resident-app
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com

# En staff-app
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com
```

---

## 📋 PASO 3: Migrar Base de Datos (15 min)

```bash
# Desde tu máquina local, con DATABASE_URL de producción

# 1. Ejecutar migraciones
DATABASE_URL="postgresql://..." pnpm prisma migrate deploy

# 2. Verificar que el schema coincide
DATABASE_URL="postgresql://..." pnpm prisma db pull --force

# 3. (Opcional) Seed de datos iniciales
DATABASE_URL="postgresql://..." pnpm db:seed
```

---

## 📋 PASO 4: Deploy (30 min)

### 4.1 Deploy API (Railway)

```
[ ] Push a main branch (o deploy manual desde Railway dashboard)
[ ] Verificar logs: "🚀 API listening on port 3000"
[ ] Verificar health: GET https://api-url.railway.app/health
```

### 4.2 Deploy Frontends (Vercel)

```
[ ] Push a main branch (auto-deploy) o trigger manual
[ ] Verificar que las 3 apps cargan
```

### 4.3 Configurar Dominios (Opcional)

```
[ ] En Railway: Settings → Domains → api.vecinosimple.com
[ ] En Vercel: Settings → Domains:
    - admin-web → admin.vecinosimple.com
    - resident-app → app.vecinosimple.com
    - staff-app → staff.vecinosimple.com
[ ] Configurar DNS en tu proveedor (CNAME records)
```

---

## 📋 PASO 5: Smoke Tests (30 min)

### 5.1 Tests Automáticos

```bash
# Ejecutar script de smoke tests
./scripts/smoke-test.sh https://api.vecinosimple.com
```

### 5.2 Tests Manuales

| Test | URL | Resultado Esperado | ✓ |
|------|-----|-------------------|---|
| API Health | /health | `{"status":"ok"}` | [ ] |
| API Docs | /api/docs | Swagger UI | [ ] |
| Admin Login | admin.../login | Página carga | [ ] |
| Resident Login | app.../login | Página carga | [ ] |
| Staff Login | staff.../login | Página carga | [ ] |

### 5.3 Flujos Críticos

| Flujo | Pasos | ✓ |
|-------|-------|---|
| **Magic Link** | 1. Ingresar email → 2. Recibir email → 3. Click → 4. Dashboard | [ ] |
| **Ver Expensa** | 1. Login → 2. Expensas → 3. Ver detalle → 4. Descargar PDF | [ ] |
| **Crear Ticket** | 1. Login → 2. Tickets → 3. Nuevo → 4. Guardar | [ ] |

---

## 📚 Documentación de Referencia

| Documento | Descripción |
|-----------|-------------|
| [INFRA-001-production-setup.md](../infrastructure/INFRA-001-production-setup.md) | Guía detallada de cada servicio |
| [.env.example](../../.env.example) | Todas las variables de entorno |
| [scripts/deploy-db.sh](../../scripts/deploy-db.sh) | Script de migraciones |
| [scripts/smoke-test.sh](../../scripts/smoke-test.sh) | Tests post-deploy |

---

## ⏱️ Timeline

| Paso | Tiempo | Acumulado |
|------|--------|-----------|
| 1. Crear cuentas | 1-2h | 2h |
| 2. Variables de entorno | 30min | 2.5h |
| 3. Migrar BD | 15min | 2.75h |
| 4. Deploy | 30min | 3.25h |
| 5. Smoke tests | 30min | 4h |
| Buffer para problemas | +2h | **6h max** |

---

## 🆘 Troubleshooting

### Build falla en Railway

```bash
# Verificar que el build funciona localmente
cd apps/api && pnpm build
```

### Migraciones fallan

```bash
# Verificar conexión a BD
DATABASE_URL="..." pnpm prisma db pull
```

### CORS errors

```bash
# Verificar ALLOWED_ORIGINS incluye el dominio del frontend
# Sin trailing slash, sin espacios
```

### Emails no llegan

```bash
# Verificar RESEND_API_KEY
# Verificar dominio verificado en Resend
# Revisar logs en Resend dashboard
```

---

> **¿Problemas?** Revisar [INFRA-001-production-setup.md](../infrastructure/INFRA-001-production-setup.md) para guía detallada de cada servicio.
