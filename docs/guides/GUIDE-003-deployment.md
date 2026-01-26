# Guía de Despliegue - VecinoSimple

> **Categoría:** GUIDE  
> **Versión:** 1.0  
> **Última actualización:** Enero 2026  
> **Autor:** Equipo VecinoSimple

---

## 📋 Arquitectura de Despliegue

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCCIÓN                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │  Vercel     │    │  Vercel     │    │  Vercel     │         │
│  │  admin-web  │    │ resident-app│    │  staff-app  │         │
│  │  (Next.js)  │    │  (Next.js)  │    │  (Next.js)  │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                  │                 │
│         └──────────────────┼──────────────────┘                 │
│                            │                                    │
│                            ▼                                    │
│                   ┌─────────────────┐                          │
│                   │    Railway      │                          │
│                   │   (NestJS API)  │                          │
│                   └────────┬────────┘                          │
│                            │                                    │
│                            ▼                                    │
│                   ┌─────────────────┐                          │
│                   │   Neon/Railway  │                          │
│                   │  (PostgreSQL)   │                          │
│                   └─────────────────┘                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Despliegue Frontend (Vercel)

### Configuración Inicial

1. **Conectar repositorio** en [vercel.com](https://vercel.com)
2. **Configurar proyecto**:
   - Framework Preset: Next.js
   - Root Directory: `apps/admin-web` (o app correspondiente)
   - Build Command: `pnpm turbo build --filter=admin-web`
   - Install Command: `pnpm install`

### Variables de Entorno (Vercel)

```env
# API
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com

# Autenticación
NEXTAUTH_SECRET=secret-de-produccion
NEXTAUTH_URL=https://admin.vecinosimple.com
```

### Dominios Sugeridos

| App | Dominio |
|-----|---------|
| admin-web | admin.vecinosimple.com |
| resident-app | app.vecinosimple.com |
| staff-app | staff.vecinosimple.com |

---

## 🔧 Despliegue Backend (Railway)

### Configuración

1. **Crear proyecto** en [railway.app](https://railway.app)
2. **Agregar servicio** desde GitHub
3. **Configurar**:
   - Root Directory: `apps/api`
   - Build Command: `pnpm install && pnpm build --filter=api`
   - Start Command: `node dist/main.js`

### Variables de Entorno (Railway)

```env
# Base de datos (Railway o Neon)
DATABASE_URL=postgresql://user:pass@host:5432/vecinosimple

# JWT - CRÍTICO: Generar secreto seguro
JWT_SECRET=tu-secreto-de-produccion-minimo-32-chars

# Entorno
NODE_ENV=production
PORT=4000

# CORS
ALLOWED_ORIGINS=https://admin.vecinosimple.com,https://app.vecinosimple.com

# Mercado Pago
MERCADO_PAGO_PUBLIC_KEY=APP_USR-xxx
MERCADO_PAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADO_PAGO_WEBHOOK_SECRET=webhook-secret
```

---

## 🗄️ Base de Datos (Neon/Railway)

### Opción 1: Neon (Recomendado)

1. Crear cuenta en [neon.tech](https://neon.tech)
2. Crear proyecto y base de datos
3. Copiar connection string a `DATABASE_URL`

**Ventajas:**
- Serverless (escala automáticamente)
- Branching de BD para staging
- Free tier generoso

### Opción 2: Railway PostgreSQL

1. En Railway, agregar servicio PostgreSQL
2. Variables se conectan automáticamente

### Migraciones en Producción

```bash
# Ejecutar migraciones (usar con cuidado)
DATABASE_URL="postgres://..." pnpm prisma migrate deploy

# Solo generar cliente (sin modificar BD)
DATABASE_URL="postgres://..." pnpm prisma generate
```

---

## 🔐 Checklist de Seguridad Pre-Deploy

### Crítico

- [ ] `JWT_SECRET` es único y >= 32 caracteres
- [ ] `NODE_ENV=production`
- [ ] CORS configurado solo para dominios permitidos
- [ ] `DATABASE_URL` no expuesto en logs
- [ ] Rate limiting activado
- [ ] HTTPS obligatorio

### Recomendado

- [ ] Webhook de Mercado Pago con firma HMAC
- [ ] Logs centralizados (LogTail, Datadog)
- [ ] Monitoreo de errores (Sentry)
- [ ] Backups automáticos de BD

---

## 📊 Monitoreo

### Métricas Recomendadas

| Métrica | Herramienta | Alerta |
|---------|-------------|--------|
| Uptime | Railway/Vercel | < 99.9% |
| Latencia API | Vercel Analytics | > 500ms |
| Errores 5xx | Sentry | > 1% |
| BD Conexiones | Neon Dashboard | > 80% pool |

### Health Check

```
GET https://api.vecinosimple.com/health

Response: { "status": "ok", "database": "connected" }
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions (Ejemplo)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm build --filter=api
      # Railway deploy automático via GitHub integration

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Vercel deploy automático via GitHub integration
```

---

## 🆘 Troubleshooting

### "Build failed on Vercel"

```bash
# Verificar que el build funciona localmente
pnpm turbo build --filter=admin-web
```

### "Database connection timeout"

1. Verificar que la IP de Railway está en whitelist de Neon
2. Verificar connection string
3. Verificar que no hay demasiadas conexiones (pool exhausted)

### "CORS error en producción"

Verificar `ALLOWED_ORIGINS` en Railway incluye el dominio del frontend.

---

## 📚 Referencias

- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Neon Docs](https://neon.tech/docs)
- [Turborepo Deployment](https://turbo.build/repo/docs/handbook/deploying-with-docker)
