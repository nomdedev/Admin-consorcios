# VecinoSimple

> **Plataforma SaaS B2B2C para administración de consorcios en Argentina**
>
> Prioriza: **Inclusión digital** de adultos mayores • **Transparencia financiera** • **Automatización operativa**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🎯 Visión

VecinoSimple es una plataforma completa para la administración de consorcios de propietarios que combina:

- **Transparencia total**: Cada gasto con factura visible
- **Accesibilidad**: Diseño "Abuela-Proof" con WCAG 2.1 AA
- **Automatización**: Liquidación automática de expensas
- **Multi-tenancy seguro**: RBAC avanzado con 8 roles diferenciados

## 🏗️ Arquitectura

| Componente | Tecnología | Despliegue |
|------------|------------|------------|
| **Frontend** | Next.js 14 (App Router) | Vercel |
| **Backend** | NestJS + TypeScript | Railway |
| **Base de Datos** | PostgreSQL + Prisma | Neon |
| **Estado** | Zustand + TanStack Query | - |
| **UI** | Radix UI + Tailwind CSS | - |
| **Offline** | Dexie.js (IndexedDB) | PWA |

### Apps del Sistema

- **🏢 Admin Web**: Portal para administradores (carga gastos, genera expensas)
- **🏠 Resident App**: PWA para vecinos (consulta expensas, paga online)
- **👷 Staff App**: PWA offline-first para encargados (bitácora, paquetes)

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js ≥20.0.0
- npm ≥10.0.0
- Git
- PostgreSQL 15+ (o cuenta en Neon)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/nomdedev/vecinosimple.git
cd vecinosimple

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Setup inicial (opcional, configura servicios externos)
./scripts/setup-production.sh

# Ejecutar en desarrollo
npm run dev
```

### Variables de Entorno Mínimas

Crea un archivo `.env` con:

```env
# Base de datos (requerido)
DATABASE_URL="postgresql://usuario:password@localhost:5432/vecinosimple"

# JWT (requerido)
JWT_SECRET="<generar-con: openssl rand -hex 32>"

# Entorno
NODE_ENV="development"
```

Ver [`.env.example`](.env.example) para la lista completa.

### Desarrollo

```bash
# Desarrollo completo (todas las apps)
npm run dev

# Desarrollo app específica
npm run dev -- --filter=admin-web

# Tests
npm run test              # Unit tests
npm run test:e2e          # E2E tests

# Build producción
npm run build

# Base de datos
npm run db:generate       # Generar Prisma client
npm run db:migrate        # Ejecutar migraciones
npm run db:seed           # Datos de prueba
npm run db:studio         # Prisma Studio GUI
```

### URLs de Desarrollo

| App | URL | Descripción |
|-----|-----|-------------|
| API | http://localhost:4000 | Backend NestJS |
| Swagger | http://localhost:4000/api/docs | Documentación API |
| Admin | http://localhost:3000 | Portal Administradores |
| Resident | http://localhost:3001 | App Vecinos |
| Staff | http://localhost:3002 | App Encargados |

## 📁 Estructura del Proyecto

```
vecinosimple/
├── apps/
│   ├── admin-web/        # Next.js - Portal Administradores
│   ├── resident-app/     # Next.js PWA - App Vecinos
│   ├── staff-app/        # Next.js PWA - App Encargados (Offline)
│   └── api/              # NestJS - Backend API
├── packages/
│   ├── ui/               # Design System compartido
│   ├── database/         # Prisma schema + tipos
│   ├── business-logic/   # Calculadores, validadores
│   ├── api-client/       # Cliente API tipado
│   └── config/           # ESLint, TypeScript, Tailwind
├── scripts/              # Utilidades de deploy
└── docs/                 # Documentación completa
```

## 🔐 Roles del Sistema

| Rol | Descripción |
|-----|-------------|
| `SUPER_ADMIN` | Staff VecinoSimple - Acceso total |
| `ADMINISTRADOR` | Dueño de la administración |
| `ADMIN_STAFF` | Empleado admin (carga gastos, no borra) |
| `PROPIETARIO` | Dueño UF - Vota, ve extraordinarios |
| `INQUILINO` | Inquilino - Paga ordinarias, no vota |
| `ENCARGADO` | Staff edificio - App offline |
| `AUDITOR` | Consejo - Solo lectura financiera |
| `PROVEEDOR_EXTERNO` | Proveedores - Sube facturas |

## 📊 Estado del Proyecto

### ✅ Completado (100%)

- [x] **Backend API**: 28 módulos, 195+ endpoints
- [x] **Frontend Admin**: 14 features, 38 páginas
- [x] **Frontend Resident**: 17 páginas PWA
- [x] **Frontend Staff**: 12 páginas PWA offline-first
- [x] **Base de Datos**: 35+ modelos Prisma
- [x] **Seguridad**: RBAC, RLS, auditoría
- [x] **Tests**: 40 unit + 37 E2E security
- [x] **CI/CD**: GitHub Actions completo

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| [Getting Started](docs/guides/GUIDE-001-getting-started.md) | Guía detallada de inicio |
| [Coding Standards](docs/guides/GUIDE-002-coding-standards.md) | Estándares de código |
| [Arquitectura](docs/architecture/) | Diseño técnico detallado |
| [Deploy](docs/guides/GUIDE-003-deployment.md) | Guía de despliegue |
| [Seguridad](docs/security/) | Checklist y auditorías |
| [CONTRIBUTING](CONTRIBUTING.md) | Guía de contribución |

## 🤝 Contribuir

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para la guía completa.

Resumen:
1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios usando [Conventional Commits](https://www.conventionalcommits.org/)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

- **Email**: info@vecinosimple.com
- **Web**: https://vecinosimple.com

---

**VecinoSimple** - Tecnología para una administración transparente y accesible.

Or using npx:

```bash
npx supabase bootstrap
```

The bootstrap command will guide you through the process of setting up a Supabase project using one of the [starter](https://github.com/supabase-community/supabase-samples/blob/main/samples.json) templates.

## Docs

Command & config reference can be found [here](https://supabase.com/docs/reference/cli/about).

## Breaking changes

We follow semantic versioning for changes that directly impact CLI commands, flags, and configurations.

However, due to dependencies on other service images, we cannot guarantee that schema migrations, seed.sql, and generated types will always work for the same CLI major version. If you need such guarantees, we encourage you to pin a specific version of CLI in package.json.

## Developing

To run from source:

```sh
# Go >= 1.22
go run . help
```
