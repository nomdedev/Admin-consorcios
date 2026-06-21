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

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/vecinosimple.git
cd vecinosimple

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores

# Setup inicial
./scripts/setup-production.sh

# Ejecutar en desarrollo
npm run dev
```

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
npm run db:studio         # Prisma Studio
```

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
│   ├── deploy-db.sh      # Migraciones automatizadas
│   ├── smoke-test.sh     # Tests post-deploy
│   └── setup-production.sh # Setup inicial
└── docs/                 # Documentación completa
```

## 🔐 Roles del Sistema

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `SUPER_ADMIN` | Staff VecinoSimple | Acceso total |
| `ADMINISTRADOR` | Dueño administración | CRUD completo |
| `ADMIN_STAFF` | Empleado admin | Carga gastos, no borra |
| `PROPIETARIO` | Dueño UF | Vota, ve extraordinarios |
| `INQUILINO` | Inquilino | Paga ordinarias, no vota |
| `ENCARGADO` | Staff edificio | App offline |
| `AUDITOR` | Consejo propietarios | Solo lectura financiera |
| `PROVEEDOR_EXTERNO` | Proveedores | Sube facturas |

## 🚀 Despliegue a Producción

### Configuración Inicial

```bash
# 1. Setup inicial
./scripts/setup-production.sh

# 2. Migrar base de datos
./scripts/deploy-db.sh

# 3. Push a main (trigger CI/CD automático)
git add .
git commit -m "Deploy inicial"
git push origin main
```

### Servicios Externos Requeridos

- **Railway**: Backend API (~$5-20/mes)
- **Vercel**: Frontend apps (Free tier)
- **Neon**: PostgreSQL (Free tier)
- **Resend**: Email transactional (Free)
- **Supabase**: Storage (Free)

### CI/CD Automático

El proyecto incluye GitHub Actions para:

- ✅ **Tests automáticos** en PRs
- ✅ **Build validation** antes de merge
- ✅ **Deploy automático** a push en main
- ✅ **Smoke tests** post-deploy
- ✅ **Rollback automático** si fallan tests

### Variables de Entorno

Ver [`.env.example`](.env.example) para la lista completa de variables requeridas.

**Críticas para producción:**
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Mínimo 32 caracteres
- `SUPABASE_*`: Para file storage
- `RESEND_API_KEY`: Para emails

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

### 🎯 Funcionalidades Clave

- **📄 Liquidación automática** de expensas
- **💳 Pagos online** con Mercado Pago
- **📱 Apps PWA** con offline-first
- **🔍 Transparencia total** (facturas visibles)
- **📊 Dashboard financiero** completo
- **🗳️ Asambleas virtuales** con votación
- **📦 Marketplace** de proveedores
- **📧 Notificaciones** multicanal

## 📚 Documentación

- **[Arquitectura](docs/architecture/)**: Diseño técnico detallado
- **[Guías](docs/guides/)**: Setup, desarrollo, deploy
- **[Seguridad](docs/security/)**: Checklist y auditorías
- **[Infraestructura](docs/infrastructure/)**: Configuración producción

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una branch (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

### Estándares de Código

- **TypeScript**: Tipado estricto obligatorio
- **ESLint**: Reglas personalizadas en `packages/config/`
- **Prettier**: Formateo automático
- **Husky**: Pre-commit hooks

## 📄 Licencia

MIT - Ver [LICENSE](LICENSE) para más detalles.

## 📞 Contacto

- **Email**: info@vecinosimple.com
- **Web**: https://vecinosimple.com
- **Docs**: https://docs.vecinosimple.com

---

**VecinoSimple** - Tecnología para una administración transparente y accesible.