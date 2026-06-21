# Guía de Inicio Rápido - VecinoSimple

> **Categoría:** GUIDE  
> **Versión:** 1.0  
> **Última actualización:** Enero 2026  
> **Autor:** Equipo VecinoSimple

---

## 📋 Requisitos Previos

### Software Necesario

| Software | Versión Mínima | Verificar |
|----------|----------------|-----------|
| Node.js | 20.x LTS | `node --version` |
| npm | 10.x | `npm --version` |
| PostgreSQL | 15.x | `psql --version` (opcional, puede usar Neon) |
| Git | 2.x | `git --version` |

### Verificar npm

```bash
# npm viene incluido con Node.js
# Verificar versión
npm --version
```

---

## 🚀 Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone https://github.com/nomdedev/vecinosimple.git
cd vecinosimple
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con tus valores
# ⚠️ NUNCA commitear el archivo .env
```

#### Variables Requeridas

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/vecinosimple"

# JWT
JWT_SECRET="<generar-con: openssl rand -hex 32>"

# Entorno
NODE_ENV="development"
```

### 4. Configurar Base de Datos

```bash
# Ejecutar migraciones
npm run db:migrate

# (Opcional) Cargar datos de prueba
npm run db:seed

# (Opcional) Abrir Prisma Studio
npm run db:studio
```

### 5. Iniciar Desarrollo

```bash
# Todas las apps
npm run dev

# Solo backend API
npm run dev -- --filter=api

# Solo admin-web
npm run dev -- --filter=admin-web
```

---

## 📁 Estructura del Proyecto

```
vecinosimple/
├── apps/
│   ├── api/              # NestJS Backend (Puerto 4000)
│   ├── admin-web/        # Next.js Admin (Puerto 3000)
│   ├── resident-app/     # Next.js PWA Vecinos (Puerto 3001)
│   └── staff-app/        # Next.js PWA Staff (Puerto 3002)
├── packages/
│   ├── database/         # Prisma Schema
│   ├── ui/               # Componentes compartidos
│   ├── business-logic/   # Lógica de negocio
│   └── config/           # Configuraciones compartidas
└── docs/                 # Esta documentación
```

---

## 🔧 Comandos Útiles

### Desarrollo

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia todas las apps en modo desarrollo |
| `npm run dev -- --filter=api` | Inicia solo el backend |
| `npm run build` | Compila todas las apps |
| `npm run lint` | Ejecuta ESLint en todo el proyecto |
| `npm run format` | Formatea código con Prettier |

### Base de Datos

| Comando | Descripción |
|---------|-------------|
| `npm run db:migrate` | Ejecuta migraciones pendientes |
| `npm run db:generate` | Regenera cliente Prisma |
| `npm run db:studio` | Abre Prisma Studio |
| `npm run db:seed` | Carga datos de prueba |
| `npm run db:push` | Sincroniza schema a BD (sin migración) |

### Testing

| Comando | Descripción |
|---------|-------------|
| `npm run test` | Ejecuta tests unitarios |
| `npm run test:e2e` | Ejecuta tests E2E |

---

## 🌐 URLs de Desarrollo

| App | URL | Descripción |
|-----|-----|-------------|
| API | http://localhost:4000 | Backend NestJS |
| Swagger | http://localhost:4000/api/docs | Documentación API |
| Admin | http://localhost:3000 | Portal Administradores |
| Resident | http://localhost:3001 | App Vecinos |
| Staff | http://localhost:3002 | App Encargados |
| Prisma Studio | http://localhost:5555 | UI de Base de Datos |

---

## ❓ Troubleshooting

### Error: "Cannot find module"

```bash
# Reinstalar dependencias
rm -rf node_modules
npm install
```

### Error: "Database connection failed"

1. Verificar que PostgreSQL esté corriendo
2. Verificar `DATABASE_URL` en `.env`
3. Verificar que la base de datos existe

```bash
# Crear base de datos manualmente
createdb vecinosimple
```

### Error: "JWT_SECRET no configurado"

Asegurarse de que `.env` tiene:
```env
JWT_SECRET="<generar-con: openssl rand -hex 32>"
```

---

## 📚 Próximos Pasos

1. Leer [ARCH-001-system-overview](../architecture/ARCH-001-system-overview.md) para entender la arquitectura
2. Revisar [copilot-instructions.md](../../.github/copilot-instructions.md) para convenciones de código
3. Explorar [schema.prisma](../../packages/database/prisma/schema.prisma) para entender los modelos
4. Revisar el [Swagger](http://localhost:4000/api/docs) para ver los endpoints disponibles

---

## 🆘 Soporte

- **Documentación:** Este repositorio en `/docs`
- **Issues:** [GitHub Issues](https://github.com/nomdedev/vecinosimple/issues)
- **Contexto:** Ver [context.md](../../context.md) para estado actual del proyecto
