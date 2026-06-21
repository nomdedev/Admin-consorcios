# 🚀 AUDIT-011: Troubleshooting de Build en Vercel

**Fecha:** 5 de febrero de 2026  
**Versión:** 1.0  
**Última actualización:** 5 de febrero de 2026

---

## 1. Estado Actual de Builds

| App | Build Local | Build Vercel | Bloqueantes |
|-----|-------------|--------------|-------------|
| admin-web | ✅ Funciona | ⚠️ Depende | ESLint ignorado |
| resident-app | ✅ Funciona | ⚠️ Depende | ESLint ignorado |
| staff-app | ✅ Funciona | ⚠️ Depende | ESLint ignorado |

---

## 2. Problemas Conocidos y Soluciones

### 2.1 ESLint Deshabilitado en Build

**Problema:** Todas las apps tienen `ignoreDuringBuilds: true` en next.config.js

**Archivos afectados:**
- `apps/admin-web/next.config.js:13`
- `apps/resident-app/next.config.js:15`
- `apps/staff-app/next.config.js:18`

**Solución a implementar:**
```javascript
// Paso 1: Identificar errores actuales
pnpm lint --filter=admin-web

// Paso 2: Corregir errores de lint
// - import/order
// - jsx-a11y
// - unused-vars

// Paso 3: Cambiar configuración
eslint: {
  ignoreDuringBuilds: false,  // Habilitar validación
}
```

**Estado:** ⏳ Pendiente - requiere corregir errores de lint primero

---

### 2.2 Errores en asambleas.service.ts (API)

**Problema:** 71 errores de lint que aunque no bloquean el build del API, impactan la calidad

**Errores principales:**
| Tipo | Cantidad | Fix |
|------|----------|-----|
| `parseFloat` → `Number.parseFloat` | 25 | Reemplazo directo |
| `replace` → `replaceAll` | 5 | Reemplazo directo |
| `Array.push()` múltiple | 20+ | Usar spread: `lineas.push(...items)` |
| Cognitive Complexity > 15 | 1 | Refactor de `generarContenidoActa()` |

**Solución:**
```bash
# Comando para corregir automáticamente
cd apps/api
npx eslint src/modules/asambleas/asambleas.service.ts --fix
```

---

### 2.3 Variables de Entorno Faltantes

**Problema:** Build falla si faltan variables críticas

**Variables requeridas para admin-web:**
```env
# Auth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=https://admin.vecinosimple.com

# Database (para SSR)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# API
NEXT_PUBLIC_API_URL=https://api.vecinosimple.com

# Error tracking
SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=xxx
```

**Verificación:**
```bash
# En Vercel Dashboard:
# Settings → Environment Variables
# Verificar que todas estén configuradas para Production/Preview/Development
```

---

### 2.4 Prisma Client No Generado

**Problema:** Error "PrismaClient is unable to run in this browser environment"

**Causa:** El build no genera el Prisma client antes de compilar

**Solución en vercel.json:**
```json
{
  "buildCommand": "prisma generate && turbo build --filter=admin-web"
}
```

**Verificación:**
```bash
# Localmente
cd apps/admin-web
npx prisma generate
pnpm build
```

---

### 2.5 Transpile Packages Faltante

**Problema:** Error de importación de packages internos

**Solución en next.config.js:**
```javascript
const nextConfig = {
  transpilePackages: [
    "@vecinosimple/ui",
    "@vecinosimple/business-logic",
    "@vecinosimple/api-client"
  ],
  // ...
}
```

---

### 2.6 Timeout de Build (> 45 minutos)

**Problema:** Build excede el tiempo límite de Vercel

**Causas posibles:**
1. Cache de Turborepo no configurado
2. Instalación de dependencias lenta
3. Build de Sentry source maps

**Soluciones:**

```json
// turbo.json - Habilitar cache remoto
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    }
  }
}
```

```bash
# Vercel Settings → General → Build & Development Settings
# Build Command: turbo build --filter=admin-web --cache-dir=.turbo
```

---

### 2.7 Sentry Source Maps Error

**Problema:** Build falla al subir source maps a Sentry

**Solución temporal:**
```javascript
// next.config.js
module.exports = withSentryConfig(
  nextConfig,
  { 
    silent: true,  // Silenciar errores
    dryRun: process.env.VERCEL_ENV !== 'production'  // Solo en prod
  },
  { 
    hideSourceMaps: true,
    disableLogger: true
  }
);
```

---

## 3. Checklist Pre-Deploy

### Admin-Web
- [ ] Variables de entorno configuradas en Vercel
- [ ] `pnpm build --filter=admin-web` exitoso localmente
- [ ] Prisma client generado
- [ ] No errores de TypeScript

### Resident-App
- [ ] Variables de entorno configuradas
- [ ] Service Worker generado correctamente
- [ ] Manifest.json válido
- [ ] PWA assets en public/

### Staff-App
- [ ] Variables de entorno configuradas
- [ ] Service Worker con rutas offline
- [ ] IndexedDB schema correcto
- [ ] PWA assets en public/

### API (Railway)
- [ ] Variables de entorno en Railway
- [ ] Database accesible desde Railway
- [ ] Redis accesible
- [ ] Health endpoint funcional

---

## 4. Comandos de Debug

### Replicar build de Vercel localmente
```bash
# Simular build de Vercel
cd apps/admin-web
VERCEL=1 pnpm build

# Ver output detallado
turbo build --filter=admin-web --summarize --dry
```

### Ver errores de TypeScript
```bash
# Check tipos sin build
pnpm typecheck --filter=admin-web
```

### Ver errores de ESLint
```bash
# Lint con output detallado
pnpm lint --filter=admin-web -- --format=stylish

# Auto-fix errores
pnpm lint --filter=admin-web -- --fix
```

---

## 5. Configuración de vercel.json por App

### admin-web/vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "turbo build --filter=admin-web",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### resident-app/vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "turbo build --filter=resident-app",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### staff-app/vercel.json
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "turbo build --filter=staff-app",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

---

## 6. Errores Comunes y Fixes Rápidos

| Error | Causa | Fix Rápido |
|-------|-------|------------|
| `Module not found: @vecinosimple/xxx` | Package no transpilado | Agregar a `transpilePackages` |
| `PrismaClient unable to run` | Client no generado | `prisma generate` en buildCommand |
| `NEXTAUTH_URL must be defined` | Env var faltante | Agregar en Vercel Dashboard |
| `Build exceeded 45 minute timeout` | Cache no configurado | Habilitar Turborepo cache |
| `Error: Cannot find module 'xxx'` | Dependencia no instalada | Verificar package.json |
| `ESBuild failed` | Syntax error en código | Revisar archivos modificados |

---

## 7. Monitoreo Post-Deploy

### Verificar deploy exitoso
```bash
# Smoke test básico
curl -I https://admin.vecinosimple.com/api/health

# Verificar Sentry
# 1. Ir a Sentry Dashboard
# 2. Verificar que hay eventos del nuevo release
```

### Rollback si falla
```bash
# Desde Vercel Dashboard:
# Deployments → Seleccionar deploy anterior → Promote to Production

# O via CLI:
vercel alias set <deployment-url> admin.vecinosimple.com
```

---

## 8. Plan de Mejora Progresiva

### Fase 1 (Esta semana)
1. [ ] Corregir errores de lint en admin-web
2. [ ] Habilitar `ignoreDuringBuilds: false` en admin-web
3. [ ] Verificar build exitoso en Vercel

### Fase 2 (Próxima semana)
1. [ ] Repetir para resident-app
2. [ ] Repetir para staff-app
3. [ ] Configurar alerts de build fallido

### Fase 3 (2 semanas)
1. [ ] Corregir 71 errores en asambleas.service.ts
2. [ ] Habilitar lint en CI/CD para API
3. [ ] Configurar Turborepo remote cache

---

## 9. Contactos de Soporte

| Servicio | Documentación | Status Page |
|----------|---------------|-------------|
| Vercel | https://vercel.com/docs | https://www.vercel-status.com |
| Railway | https://docs.railway.app | https://status.railway.app |
| Sentry | https://docs.sentry.io | https://status.sentry.io |
| Supabase | https://supabase.com/docs | https://status.supabase.com |

---

**Última actualización:** 5 de febrero de 2026
