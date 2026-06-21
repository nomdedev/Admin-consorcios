# 🚀 Getting Started - VecinoSimple

> **Guía rápida para nuevos desarrolladores**  
> Tiempo estimado: ~15 minutos

---

## Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/nomdedev/vecinosimple.git
cd vecinosimple
```

---

## Paso 2: Instalar Dependencias

**Prerrequisitos:**
- Node.js ≥20.0.0 ([descargar](https://nodejs.org/))
- Git ([descargar](https://git-scm.com/))

```bash
npm install
```

> ⏱️ La instalación inicial puede tomar unos minutos por las dependencias de Prisma.

---

## Paso 3: Configurar Base de Datos

### Opción A: Base de datos local (recomendado para desarrollo)

1. Instalar PostgreSQL 15+ ([descargar](https://www.postgresql.org/download/))

2. Crear base de datos:
   ```bash
   createdb vecinosimple
   ```

3. Copiar variables de entorno:
   ```bash
   cp .env.example .env
   ```

4. Editar `.env` con tu conexión:
   ```env
   DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/vecinosimple"
   ```

### Opción B: Base de datos en la nube (Neon)

1. Crear cuenta gratuita en [neon.tech](https://neon.tech/)
2. Crear proyecto y copiar connection string
3. Pegar en `.env`:
   ```env
   DATABASE_URL="postgresql://...@...neon.tech/vecinosimple"
   ```

---

## Paso 4: Variables de Entorno

Archivo `.env` mínimo requerido:

```env
# Base de datos (requerido)
DATABASE_URL="postgresql://..."

# Autenticación (requerido)
JWT_SECRET="$(openssl rand -hex 32)"

# Entorno
NODE_ENV="development"
```

> 💡 Genera JWT_SECRET con: `openssl rand -hex 32`  
> En Windows PowerShell: `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))`

Ver `.env.example` para todas las variables disponibles.

---

## Paso 5: Ejecutar Migraciones

```bash
# Crear tablas en la base de datos
npm run db:migrate

# (Opcional) Cargar datos de prueba
npm run db:seed
```

---

## Paso 6: Iniciar el Proyecto

```bash
npm run dev
```

### URLs de Desarrollo

| App | URL | Descripción |
|-----|-----|-------------|
| **Admin Web** | http://localhost:3000 | Portal administradores |
| **Resident App** | http://localhost:3001 | PWA vecinos |
| **Staff App** | http://localhost:3002 | PWA encargados |
| **API Backend** | http://localhost:4000 | NestJS API |
| **Swagger Docs** | http://localhost:4000/api/docs | Documentación API |

---

## Paso 7: Verificar Funcionamiento

1. Abre http://localhost:3000 - Deberías ver el login de Admin Web
2. Abre http://localhost:4000/api/docs - Deberías ver Swagger UI

### Si usaste `db:seed`, credenciales de prueba:

| Email | Password | Rol |
|-------|----------|-----|
| admin@test.com | Test123! | ADMINISTRADOR |
| vecino@test.com | Test123! | PROPIETARIO |

---

## 📚 Próximos Pasos

### Entender el Proyecto

1. **[context.md](../../context.md)** - Estado actual del proyecto
2. **[ARCH-001](../architecture/ARCH-001-system-overview.md)** - Arquitectura del sistema
3. **[Schema Prisma](../../packages/database/prisma/schema.prisma)** - Modelos de datos

### Comenzar a Desarrollar

1. **[Estándares de Código](GUIDE-002-coding-standards.md)** - Convenciones del proyecto
2. **[CONTRIBUTING.md](../../CONTRIBUTING.md)** - Guía de contribución
3. **[copilot-instructions.md](../../.github/copilot-instructions.md)** - Instrucciones detalladas para AI/devs

### Deploy

1. **[Deployment Guide](GUIDE-003-deployment.md)** - Desplegar a producción

---

## ❓ Troubleshooting

### "Cannot find module" o errores de tipos

```bash
rm -rf node_modules
npm install
npm run db:generate
```

### "Database connection failed"

1. Verificar PostgreSQL está corriendo
2. Verificar `DATABASE_URL` en `.env`
3. Verificar credenciales

### Puerto en uso

```bash
# Windows - ver qué usa el puerto
netstat -ano | findstr :3000

# Cambiar puerto de una app específica
PORT=3005 npm run dev -- --filter=admin-web
```

### Migraciones fallan

```bash
# Resetear BD (borra todos los datos)
npm run db:push

# Re-aplicar migraciones
npm run db:migrate
```

---

## 🆘 Ayuda

- **Issues**: [GitHub Issues](https://github.com/nomdedev/vecinosimple/issues)
- **Documentación completa**: [GUIDE-001](GUIDE-001-getting-started.md)
- **Slack/Discord**: Preguntar al equipo

---

**¡Bienvenido al equipo!** 🏢
