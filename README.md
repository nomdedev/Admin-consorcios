# VecinoSimple

> **Plataforma SaaS B2B2C para administración de consorcios en Argentina**

## ✅ SEGURIDAD - REPOSITORIO LIMPIO

**26 Enero 2026:** Este repositorio ha sido completamente recreado desde cero. No contiene historial contaminado ni secrets expuestos.

### 🔐 Reglas de Seguridad Implementadas

- ✅ **Repositorio completamente nuevo** - Sin historial contaminado
- ✅ **Secrets nunca expuestos** - Solo templates y placeholders
- ✅ **Variables de entorno protegidas** - `.env.local` ignorado por Git
- ✅ **Scripts de generación seguros** - `scripts/generate-secrets.js`
- ✅ **Validación automática** - `scripts/verify-secrets.js`

### 📋 Checklist de Seguridad

- [x] Repositorio recreado desde cero
- [x] Secrets rotados en producción
- [x] Variables de entorno verificadas
- [ ] Deploy inicial completado
- [ ] Funcionalidades probadas en producción

## 🏗️ Arquitectura

- **Monorepo:** Turborepo + pnpm workspaces
- **Frontend:** Next.js 14 (App Router) + Radix UI + Tailwind
- **Backend:** NestJS + Prisma + PostgreSQL
- **Deploy:** Vercel (frontend) + Railway (backend)

## 🏗️ Arquitectura

- **Monorepo:** Turborepo + npm workspaces
- **Frontend:** Next.js 14 (App Router) + Radix UI + Tailwind
- **Backend:** NestJS + Prisma + PostgreSQL
- **Deploy:** Vercel (frontend) + Railway (backend)

## 🚀 Deploy por Servicio

Cada servicio se deploya **independientemente** para mayor control y seguridad:

### 🔍 Verificación Pre-Deploy

Antes de cualquier deploy, ejecutar verificación:

```bash
# Verificar una app específica
bash scripts/pre-deploy-verification.sh admin-web
bash scripts/pre-deploy-verification.sh resident-app
bash scripts/pre-deploy-verification.sh staff-app

# Verificar todas las apps
bash scripts/pre-deploy-verification.sh all
```

### API Backend (Railway)
```bash
cd apps/api && railway deploy
# o usando script:
bash scripts/deploy-api.sh
```

### Admin Web (Vercel)
```bash
# Deploy directo
cd apps/admin-web && vercel --prod

# O usando script unificado
bash scripts/deploy.sh admin-web
# o script específico:
bash scripts/deploy-admin-web.sh
```

### Resident App (Vercel)
```bash
# Deploy directo
cd apps/resident-app && vercel --prod

# O usando script unificado
bash scripts/deploy.sh resident-app
# o script específico:
bash scripts/deploy-resident-app.sh
```

### Staff App (Vercel)
```bash
# Deploy directo
cd apps/staff-app && vercel --prod

# O usando script unificado
bash scripts/deploy.sh staff-app
# o script específico:
bash scripts/deploy-staff-app.sh
```

### Deploy Masivo
```bash
# Deploy todas las apps de frontend
bash scripts/deploy.sh all
```

### 🔄 Orden Recomendado
1. **API Backend** (primero, los frontends dependen de él)
2. **Admin Web**
3. **Resident App**
4. **Staff App**

### ✅ Beneficios del Deploy Independiente
- **Rollback selectivo** si algo falla
- **Deploy incremental** solo de cambios
- **Debugging aislado** por servicio
- **Zero-downtime** en otros servicios
- **Mejor CI/CD** pipelines

## 📁 Estructura

```
vecinosimple/
├── apps/
│   ├── admin-web/        # Portal Administradores
│   ├── resident-app/     # PWA Vecinos
│   ├── staff-app/        # PWA Encargados (Offline)
│   └── api/              # NestJS Backend
├── packages/
│   ├── ui/               # Design System
│   ├── database/         # Prisma Schema
│   ├── business-logic/   # Calculadores
│   └── config/           # ESLint, TypeScript
└── scripts/              # Utilidades
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Todos los servicios
npm run build           # Build de producción
npm run lint            # Linting
npm run type-check      # TypeScript check

# Base de datos
npm run db:generate     # Generar Prisma client
npm run db:push         # Push schema a DB
npm run db:studio       # Prisma Studio
npm run db:seed         # Datos de prueba

# Testing
npm run test            # Unit tests
npm run test:e2e        # E2E tests

# Deploy y verificación
bash scripts/pre-deploy-verification.sh [app|all]  # Verificar antes de deploy
bash scripts/deploy.sh [app|all]                   # Deploy unificado
bash scripts/deploy-admin-web.sh                   # Deploy admin-web
bash scripts/deploy-resident-app.sh                # Deploy resident-app
bash scripts/deploy-staff-app.sh                   # Deploy staff-app
bash scripts/pre-deploy-check.sh                   # Checklist completo
```

## 🚨 Pre-Deploy Checklist

Antes de cada deploy, ejecutar:

```bash
bash scripts/pre-deploy-check.sh
```

Verifica:
- ✅ Rama correcta (main/master)
- ✅ No hay cambios sin commit
- ✅ Dependencias instaladas
- ✅ TypeScript sin errores
- ✅ Linting pasa
- ✅ Tests pasan
- ✅ Build de producción OK
- ✅ No archivos sensibles en git

## 🔐 Variables de Entorno

### Backend (Railway)
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<generar-nuevo>
SUPABASE_SERVICE_ROLE_KEY=<rotar>
# ... ver .env.example
```

### Frontend (Vercel)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=<rotar>
NEXTAUTH_SECRET=<generar-nuevo>
# ... ver scripts/envs/vercel.*.env.template
```

## 📚 Documentación

- [Arquitectura](./docs/architecture/)
- [Guías de desarrollo](./docs/guides/)
- [Seguridad](./docs/security/)
- [Incident de seguridad](./SECURITY-INCIDENT-2026-01-26.md)

## 🤝 Contribución

1. Crear branch desde `master`
2. Hacer cambios
3. Ejecutar `npm run pre-deploy-check.sh`
4. Crear PR con descripción detallada
5. Esperar revisión y aprobación

## 📞 Soporte

- **Issues:** Para bugs y features
- **Discussions:** Para preguntas generales
- **Security:** Para vulnerabilidades (NO commitear secrets)

---

**⚠️ Recordatorio:** Si encuentras cualquier archivo con secrets reales, repórtalo inmediatamente y no lo commitees.</content>
<parameter name="filePath">d:\martin\Proyectos\Admin-consorcios\README.md