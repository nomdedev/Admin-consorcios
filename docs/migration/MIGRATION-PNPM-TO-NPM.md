# Plan de Migración: pnpm a npm

**Proyecto:** Admin-consorcios (vecinosimple)  
**Fecha:** 27 de enero de 2026  
**Versión del Documento:** 1.0  
**Estado:** Pendiente de Ejecución

---

## 1. Resumen Ejecutivo

Este documento detalla el plan completo para migrar el proyecto Admin-consorcios del gestor de paquetes **pnpm@9.0.0** a **npm@10.0.0**. La migración es necesaria para garantizar compatibilidad total con plataformas de despliegue como Vercel y Railway, simplificar el stack tecnológico del proyecto y reducir la complejidad de dependencias.

**Alcance:**
- Monorepo con 3 aplicaciones y 6 paquetes compartidos
- Migración de archivos de configuración y scripts
- Regeneración completa de lockfiles
- Verificación de funcionalidad en todas las aplicaciones

**Tiempo Estimado:** 30-45 minutos  
**Nivel de Riesgo:** Bajo-Medio  

---

## 2. Estado Actual

### 2.1 Estructura del Monorepo

```
Admin-consorcios/
├── apps/
│   ├── api/              (NestJS API)
│   ├── staff-app/        (Next.js - Staff)
│   └── admin-web-deploy/ (Next.js - Admin)
├── packages/
│   ├── business-logic/   (Lógica de negocio compartida)
│   ├── database/         (Prisma Database)
│   ├── eslint-config/    (Configuración ESLint)
│   ├── tailwind-config/  (Configuración Tailwind)
│   ├── typescript-config/ (Configuración TypeScript)
│   └── ui/               (Componentes UI compartidos)
└── scripts/              (Scripts de utilidad)
```

### 2.2 Configuración Actual

| Componente | Versión Actual | Estado |
|------------|----------------|--------|
| Package Manager | pnpm@9.0.0 | A migrar |
| Node.js | >=20.0.0 | Compatible |
| Turbo | ^2.7.6 | Compatible con npm |
| Workspaces | pnpm-workspace.yaml | A migrar |

### 2.3 Herramientas de Monorepo

- **Turbo**: Gestor de tareas del monorepo (compatible con npm workspaces)
- **pnpm-workspace.yaml**: Define los paquetes del workspace (a eliminar)
- **package-lock.json**: Lockfile actual generado con pnpm (a regenerar)

### 2.4 Lista de Proyectos y Dependencias Internas

| Proyecto | Dependencias Internas | Dependencias de Workspace |
|----------|----------------------|--------------------------|
| `@vecinosimple/api` | @vecinosimple/business-logic, @vecinosimple/database | workspace:* |
| `@vecinosimple/staff-app` | @vecinosimple/database, @vecinosimple/ui | workspace:* |
| `@vecinosimple/ui` | @vecinosimple/eslint-config, @vecinosimple/tailwind-config, @vecinosimple/typescript-config | workspace:* |
| `@vecinosimple/business-logic` | - | workspace:* |
| `@vecinosimple/database` | - | workspace:* |
| `@vecinosimple/eslint-config` | - | workspace:* |
| `@vecinosimple/tailwind-config` | - | workspace:* |
| `@vecinosimple/typescript-config` | - | workspace:* |

---

## 3. Objetivos de la Migración

### 3.1 Razones para Cambiar a npm

#### 3.1.1 Compatibilidad con Vercel
- Vercel soporta nativamente npm workspaces
- Configuraciones de Vercel ya usan comandos npm
- Elimina la necesidad de configuraciones adicionales

#### 3.1.2 Simplificación del Stack
- Reducción de una dependencia de herramienta (pnpm)
- npm es el gestor de paquetes estándar de Node.js
- Menor curva de aprendizaje para nuevos desarrolladores

#### 3.1.3 Reducción de Dependencias
- Eliminación de pnpm-workspace.yaml
- Un solo lockfile (package-lock.json) en lugar de múltiples
- Simplificación de scripts de CI/CD

#### 3.1.4 Compatibilidad con Railway
- Railway soporta nativamente npm
- Configuración actual ya usa comandos npm
- Mejor integración con plataformas de despliegue

---

## 4. Plan de Migración Paso a Paso

### FASE 1: Preparación

#### Paso 1.1: Verificar Estado Actual
```bash
# Verificar versión de pnpm instalada
pnpm --version

# Verificar versión de npm instalada
npm --version

# Verificar que no hay procesos corriendo
# (Opcional) Revisar puertos en uso
netstat -ano | findstr ":3000 :3001 :3002"
```

**Resultado Esperado:**
- pnpm versión 9.0.0 o superior
- npm versión 10.0.0 o superior
- No hay procesos de desarrollo corriendo

#### Paso 1.2: Documentar Versiones de Dependencias
```bash
# Crear archivo de referencia de versiones
npm list --depth=0 > docs/migration/npm-versions-before.txt
pnpm list --depth=0 > docs/migration/pnpm-versions-before.txt
```

**Resultado Esperado:**
- Archivos creados en `docs/migration/` con versiones actuales

#### Paso 1.3: Verificar Estado de Git
```bash
# Verificar que no hay cambios sin commit
git status

# Si hay cambios, hacer commit o stash
git add .
git commit -m "Backup antes de migración a npm"
# O
git stash save "Backup antes de migración a npm"
```

**Resultado Esperado:**
- Directorio de trabajo limpio
- Todos los cambios están commitados o en stash

#### Paso 1.4: Crear Branch de Migración
```bash
# Crear nueva branch para la migración
git checkout -b feature/migrate-pnpm-to-npm
```

**Resultado Esperado:**
- Branch `feature/migrate-pnpm-to-npm` creada y activa

---

### FASE 2: Modificación de Archivos

#### Paso 2.1: Verificar Configuración Actual del package.json Raíz

**Archivo:** `package.json`

**Estado Actual:**
```json
{
  "name": "vecinosimple",
  "version": "0.1.0",
  "private": true,
  "packageManager": "npm@10.0.0",
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  ...
}
```

**Acción Requerida:**
✅ **NO REQUIERE CAMBIOS** - El package.json raíz ya está configurado correctamente con npm@10.0.0 y workspaces definidos.

#### Paso 2.2: Eliminar pnpm-workspace.yaml

**Archivo:** `pnpm-workspace.yaml`

**Acción Requerida:**
```bash
# Eliminar archivo pnpm-workspace.yaml
del pnpm-workspace.yaml
```

**Resultado Esperado:**
- Archivo `pnpm-workspace.yaml` eliminado
- Los workspaces ahora se gestionan desde `package.json` raíz

#### Paso 2.3: Eliminar package-lock.json Raíz (Generado con pnpm)

**Archivo:** `package-lock.json`

**Acción Requerida:**
```bash
# Eliminar package-lock.json actual (generado con pnpm)
del package-lock.json
```

**Resultado Esperado:**
- Archivo `package-lock.json` eliminado
- Se regenerará en la Fase 3 con npm

#### Paso 2.4: Actualizar Script postinstall en apps/api/package.json

**Archivo:** `apps/api/package.json`

**Estado Actual:**
```json
{
  "scripts": {
    "prebuild": "rimraf dist",
    "postinstall": "pnpm --filter @vecinosimple/database run generate || true",
    "build": "nest build",
    ...
  }
}
```

**Acción Requerida:**
Cambiar el script `postinstall` para usar npm en lugar de pnpm:

**Nuevo Contenido:**
```json
{
  "scripts": {
    "prebuild": "rimraf dist",
    "postinstall": "npm run generate --workspace=@vecinosimple/database || true",
    "build": "nest build",
    ...
  }
}
```

**Instrucciones de Modificación:**
1. Abrir el archivo `apps/api/package.json` en un editor de texto
2. Buscar la línea 7: `"postinstall": "pnpm --filter @vecinosimple/database run generate || true",`
3. Reemplazar con: `"postinstall": "npm run generate --workspace=@vecinosimple/database || true",`
4. Guardar el archivo

**Resultado Esperado:**
- Script `postinstall` actualizado para usar npm
- Sintaxis `--workspace=@vecinosimple/database` es equivalente a `pnpm --filter @vecinosimple/database`

#### Paso 2.5: Verificar Otros Scripts que Usen pnpm

**Archivos a Revisar:**
- `scripts/*.sh`
- `scripts/*.ps1`
- `package.json` de cada proyecto
- `turbo.json`

**Comandos de Búsqueda:**
```bash
# Buscar referencias a pnpm en scripts
findstr /S /I "pnpm" scripts\*
```

**Acción Requerida:**
Si se encuentran referencias a pnpm en scripts, actualizarlas a npm:

| Sintaxis pnpm | Sintaxis npm equivalente |
|---------------|--------------------------|
| `pnpm install` | `npm install` |
| `pnpm --filter <pkg> <cmd>` | `npm run <cmd> --workspace=<pkg>` |
| `pnpm run <cmd>` | `npm run <cmd>` |
| `pnpm add <pkg>` | `npm install <pkg>` |
| `pnpm add -D <pkg>` | `npm install --save-dev <pkg>` |

**Resultado Esperado:**
- Todos los scripts actualizados para usar npm
- No hay referencias a pnpm en scripts del proyecto

---

### FASE 3: Regeneración de Dependencias

#### Paso 3.1: Limpiar node_modules Antiguos

```bash
# Eliminar node_modules raíz y de todos los workspaces
npm run clean

# O manualmente:
rmdir /S /Q node_modules
rmdir /S /Q apps\api\node_modules
rmdir /S /Q apps\staff-app\node_modules
rmdir /S /Q apps\admin-web-deploy\node_modules
rmdir /S /Q packages\business-logic\node_modules
rmdir /S /Q packages\database\node_modules
rmdir /S /Q packages\eslint-config\node_modules
rmdir /S /Q packages\tailwind-config\node_modules
rmdir /S /Q packages\typescript-config\node_modules
rmdir /S /Q packages\ui\node_modules
```

**Resultado Esperado:**
- Todos los directorios `node_modules` eliminados
- Sistema limpio para instalación nueva

#### Paso 3.2: Limpiar Caché de npm

```bash
# Limpiar caché de npm
npm cache clean --force
```

**Resultado Esperado:**
- Caché de npm limpiada
- Se asegura instalación limpia de dependencias

#### Paso 3.3: Instalar Dependencias con npm

```bash
# Instalar todas las dependencias del monorepo
npm install
```

**Este comando:**
1. Lee `package.json` raíz con la configuración de workspaces
2. Instala dependencias en el workspace raíz
3. Instala dependencias en cada workspace (apps/* y packages/*)
4. Genera nuevo `package-lock.json` raíz
5. Resuelve dependencias internas con `workspace:*`

**Resultado Esperado:**
- Nuevo `package-lock.json` generado en la raíz
- Todos los `node_modules` instalados correctamente
- Sin errores de instalación
- Sin advertencias de dependencias faltantes

**Tiempo Estimado:** 2-5 minutos

#### Paso 3.4: Verificar Instalación de Dependencias

```bash
# Verificar que todas las dependencias se instalaron
npm list --depth=0

# Verificar dependencias de un workspace específico
npm list --workspace=@vecinosimple/api --depth=0
npm list --workspace=@vecinosimple/staff-app --depth=0
npm list --workspace=@vecinosimple/ui --depth=0
```

**Resultado Esperado:**
- Lista de dependencias sin errores
- Todas las dependencias internas resueltas correctamente
- Sin dependencias faltantes (UNMET PEER DEPENDENCY)

#### Paso 3.5: Verificar Estructura de node_modules

```bash
# Verificar estructura de node_modules
dir node_modules\.workspace

# O verificar que los workspaces están vinculados
dir apps\api\node_modules\@vecinosimple
dir packages\ui\node_modules\@vecinosimple
```

**Resultado Esperado:**
- Estructura de workspaces creada correctamente
- Enlaces simbólicos o referencias a paquetes internos funcionando

---

### FASE 4: Verificación

#### Paso 4.1: Ejecutar Build de Todo el Proyecto

```bash
# Construir todos los proyectos del monorepo
npm run build
```

**Este comando:**
1. Ejecuta Turbo para construir todos los proyectos
2. Turbo detecta automáticamente los workspaces de npm
3. Construye en el orden correcto según dependencias

**Resultado Esperado:**
- Todos los proyectos construidos exitosamente
- Sin errores de compilación
- Directorios `dist/` o `.next/` generados en cada proyecto

**Tiempo Estimado:** 3-5 minutos

#### Paso 4.2: Ejecutar Linting

```bash
# Ejecutar linter en todos los proyectos
npm run lint
```

**Resultado Esperado:**
- Linting completado sin errores
- Posibles advertencias (warnings) pero sin errores fatales

#### Paso 4.3: Ejecutar Type Checking

```bash
# Verificar tipos de TypeScript en todos los proyectos
npm run type-check
```

**Resultado Esperado:**
- Type checking completado sin errores
- Todas las dependencias de tipos resueltas correctamente

#### Paso 4.4: Ejecutar Tests (si existen)

```bash
# Ejecutar tests en todos los proyectos
npm run test
```

**Resultado Esperado:**
- Tests ejecutados exitosamente
- Sin fallos de tests

#### Paso 4.5: Verificar Funcionamiento Local de Apps

**4.5.1: Iniciar API (apps/api)**
```bash
# En una terminal nueva
cd apps/api
npm run dev
```

**Verificación:**
- API inicia sin errores
- Puerto por defecto (usualmente 3000 o 3001) disponible
- Logs de inicio de NestJS visibles

**4.5.2: Iniciar Staff App (apps/staff-app)**
```bash
# En otra terminal nueva
cd apps/staff-app
npm run dev
```

**Verificación:**
- Staff App inicia sin errores
- Puerto 3002 disponible
- Next.js compila correctamente
- Acceso a http://localhost:3002 funciona

**4.5.3: Verificar Integración de Workspaces**
```bash
# Verificar que las dependencias internas funcionan
# En apps/api, verificar que puede importar de @vecinosimple/database
# En apps/staff-app, verificar que puede importar de @vecinosimple/ui
```

**Resultado Esperado:**
- Todas las aplicaciones funcionan localmente
- Dependencias internas se importan correctamente
- Sin errores de runtime relacionados con módulos

---

### FASE 5: Configuración de Deploy

#### Paso 5.1: Verificar Configuración de Vercel (apps/staff-app)

**Archivo:** `apps/staff-app/vercel.json`

**Estado Actual:**
```json
{
  "framework": "nextjs",
  "installCommand": "npm install --prefer-offline",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  ...
}
```

**Acción Requerida:**
✅ **NO REQUIERE CAMBIOS** - La configuración ya usa comandos npm.

#### Paso 5.2: Verificar Configuración de Railway (apps/api)

**Archivo:** `apps/api/railway.json`

**Estado Actual:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    ...
  }
}
```

**Acción Requerida:**
✅ **NO REQUIERE CAMBIOS** - La configuración ya usa comandos npm.

#### Paso 5.3: Verificar Configuración de Vercel (admin-web-deploy)

**Archivo:** `admin-web-deploy/vercel.json`

**Estado Actual:**
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  ...
}
```

**Acción Requerida:**
✅ **NO REQUIERE CAMBIOS** - La configuración ya usa comandos npm.

#### Paso 5.4: Actualizar Documentación de Deploy

**Archivos a Actualizar:**
- `docs/deploy.md`
- `docs/guides/GUIDE-003-deployment.md`
- `docs/guides/GUIDE-004-independent-deploy.md`
- `README.md`

**Acción Requerida:**
Buscar y reemplazar referencias a pnpm en la documentación:

| Texto a Buscar | Reemplazar Con |
|----------------|----------------|
| `pnpm install` | `npm install` |
| `pnpm run build` | `npm run build` |
| `pnpm run dev` | `npm run dev` |
| `pnpm --filter` | `npm run --workspace=` |
| `pnpm-workspace.yaml` | `workspaces` en package.json |

**Resultado Esperado:**
- Documentación actualizada para usar comandos npm
- No hay referencias a pnpm en la documentación de deploy

---

## 5. Archivos Afectados

### Tabla de Archivos a Modificar/Eliminar

| Archivo | Acción | Ruta | Prioridad |
|---------|--------|------|-----------|
| `pnpm-workspace.yaml` | **ELIMINAR** | Raíz | Alta |
| `package-lock.json` | **REGENERAR** | Raíz | Alta |
| `apps/api/package.json` | **MODIFICAR** | Línea 7: script `postinstall` | Alta |
| `docs/deploy.md` | **MODIFICAR** | Reemplazar referencias a pnpm | Media |
| `docs/guides/GUIDE-003-deployment.md` | **MODIFICAR** | Reemplazar referencias a pnpm | Media |
| `docs/guides/GUIDE-004-independent-deploy.md` | **MODIFICAR** | Reemplazar referencias a pnpm | Media |
| `README.md` | **MODIFICAR** | Reemplazar referencias a pnpm | Media |
| `apps/staff-app/vercel.json` | **VERIFICAR** | Ya usa npm | Baja |
| `apps/api/railway.json` | **VERIFICAR** | Ya usa npm | Baja |
| `admin-web-deploy/vercel.json` | **VERIFICAR** | Ya usa npm | Baja |

### Archivos que NO Requieren Cambios

| Archivo | Razón |
|---------|-------|
| `package.json` (raíz) | Ya configurado con npm@10.0.0 y workspaces |
| `turbo.json` | Turbo es compatible con npm workspaces |
| `apps/*/package.json` | Solo `apps/api/package.json` requiere modificación |
| `packages/*/package.json` | Scripts ya usan comandos genéricos |
| `apps/*/vercel.json` | Ya usan comandos npm |
| `apps/api/railway.json` | Ya usa comandos npm |

---

## 6. Comandos de Migración

### 6.1 Comandos para Windows (cmd.exe)

```batch
:: ============================================
:: FASE 1: PREPARACIÓN
:: ============================================

:: Paso 1.1: Verificar versiones
pnpm --version
npm --version

:: Paso 1.2: Documentar versiones actuales
mkdir docs\migration
npm list --depth=0 > docs\migration\npm-versions-before.txt
pnpm list --depth=0 > docs\migration\pnpm-versions-before.txt

:: Paso 1.3: Verificar estado de git
git status

:: Paso 1.4: Crear branch de migración
git checkout -b feature/migrate-pnpm-to-npm

:: ============================================
:: FASE 2: MODIFICACIÓN DE ARCHIVOS
:: ============================================

:: Paso 2.1: Verificar package.json (ya está correcto)
type package.json

:: Paso 2.2: Eliminar pnpm-workspace.yaml
del pnpm-workspace.yaml

:: Paso 2.3: Eliminar package-lock.json
del package-lock.json

:: Paso 2.4: Modificar apps/api/package.json
:: (Este paso debe hacerse manualmente en un editor)
:: Abrir apps/api/package.json y cambiar:
:: "postinstall": "pnpm --filter @vecinosimple/database run generate || true"
:: Por:
:: "postinstall": "npm run generate --workspace=@vecinosimple/database || true"

:: Paso 2.5: Buscar referencias a pnpm en scripts
findstr /S /I "pnpm" scripts\*

:: ============================================
:: FASE 3: REGENERACIÓN DE DEPENDENCIAS
:: ============================================

:: Paso 3.1: Limpiar node_modules
npm run clean

:: Paso 3.2: Limpiar caché de npm
npm cache clean --force

:: Paso 3.3: Instalar dependencias con npm
npm install

:: Paso 3.4: Verificar instalación
npm list --depth=0
npm list --workspace=@vecinosimple/api --depth=0

:: ============================================
:: FASE 4: VERIFICACIÓN
:: ============================================

:: Paso 4.1: Build del proyecto
npm run build

:: Paso 4.2: Linting
npm run lint

:: Paso 4.3: Type checking
npm run type-check

:: Paso 4.4: Tests (si existen)
npm run test

:: Paso 4.5: Verificar funcionamiento local
:: Terminal 1:
cd apps\api
npm run dev

:: Terminal 2:
cd apps\staff-app
npm run dev

:: ============================================
:: FASE 5: CONFIGURACIÓN DE DEPLOY
:: ============================================

:: Paso 5.1-5.3: Verificar configuraciones (ya usan npm)
type apps\staff-app\vercel.json
type apps\api\railway.json
type admin-web-deploy\vercel.json

:: Paso 5.4: Actualizar documentación (manual)
:: Buscar y reemplazar referencias a pnpm en:
:: - docs\deploy.md
:: - docs\guides\GUIDE-003-deployment.md
:: - docs\guides\GUIDE-004-independent-deploy.md
:: - README.md
```

### 6.2 Comandos para PowerShell

```powershell
# ============================================
# FASE 1: PREPARACIÓN
# ============================================

# Paso 1.1: Verificar versiones
pnpm --version
npm --version

# Paso 1.2: Documentar versiones actuales
New-Item -ItemType Directory -Force -Path docs\migration
npm list --depth=0 | Out-File -FilePath docs\migration\npm-versions-before.txt
pnpm list --depth=0 | Out-File -FilePath docs\migration\pnpm-versions-before.txt

# Paso 1.3: Verificar estado de git
git status

# Paso 1.4: Crear branch de migración
git checkout -b feature/migrate-pnpm-to-npm

# ============================================
# FASE 2: MODIFICACIÓN DE ARCHIVOS
# ============================================

# Paso 2.1: Verificar package.json (ya está correcto)
Get-Content package.json

# Paso 2.2: Eliminar pnpm-workspace.yaml
Remove-Item pnpm-workspace.yaml

# Paso 2.3: Eliminar package-lock.json
Remove-Item package-lock.json

# Paso 2.4: Modificar apps/api/package.json
# (Este paso debe hacerse manualmente en un editor)
# Abrir apps/api/package.json y cambiar el script postinstall

# Paso 2.5: Buscar referencias a pnpm en scripts
Get-ChildItem -Path scripts -Recurse | Select-String -Pattern "pnpm"

# ============================================
# FASE 3: REGENERACIÓN DE DEPENDENCIAS
# ============================================

# Paso 3.1: Limpiar node_modules
npm run clean

# Paso 3.2: Limpiar caché de npm
npm cache clean --force

# Paso 3.3: Instalar dependencias con npm
npm install

# Paso 3.4: Verificar instalación
npm list --depth=0
npm list --workspace=@vecinosimple/api --depth=0

# ============================================
# FASE 4: VERIFICACIÓN
# ============================================

# Paso 4.1: Build del proyecto
npm run build

# Paso 4.2: Linting
npm run lint

# Paso 4.3: Type checking
npm run type-check

# Paso 4.4: Tests (si existen)
npm run test

# Paso 4.5: Verificar funcionamiento local
# Terminal 1:
Set-Location apps\api
npm run dev

# Terminal 2:
Set-Location apps\staff-app
npm run dev
```

### 6.3 Comandos para Linux/macOS (bash)

```bash
# ============================================
# FASE 1: PREPARACIÓN
# ============================================

# Paso 1.1: Verificar versiones
pnpm --version
npm --version

# Paso 1.2: Documentar versiones actuales
mkdir -p docs/migration
npm list --depth=0 > docs/migration/npm-versions-before.txt
pnpm list --depth=0 > docs/migration/pnpm-versions-before.txt

# Paso 1.3: Verificar estado de git
git status

# Paso 1.4: Crear branch de migración
git checkout -b feature/migrate-pnpm-to-npm

# ============================================
# FASE 2: MODIFICACIÓN DE ARCHIVOS
# ============================================

# Paso 2.1: Verificar package.json (ya está correcto)
cat package.json

# Paso 2.2: Eliminar pnpm-workspace.yaml
rm pnpm-workspace.yaml

# Paso 2.3: Eliminar package-lock.json
rm package-lock.json

# Paso 2.4: Modificar apps/api/package.json
# (Este paso debe hacerse manualmente en un editor)
# Usar sed para cambiar el script:
sed -i 's/"postinstall": "pnpm --filter @vecinosimple\/database run generate || true"/"postinstall": "npm run generate --workspace=@vecinosimple\/database || true"/' apps/api/package.json

# Paso 2.5: Buscar referencias a pnpm en scripts
grep -r "pnpm" scripts/

# ============================================
# FASE 3: REGENERACIÓN DE DEPENDENCIAS
# ============================================

# Paso 3.1: Limpiar node_modules
npm run clean

# Paso 3.2: Limpiar caché de npm
npm cache clean --force

# Paso 3.3: Instalar dependencias con npm
npm install

# Paso 3.4: Verificar instalación
npm list --depth=0
npm list --workspace=@vecinosimple/api --depth=0

# ============================================
# FASE 4: VERIFICACIÓN
# ============================================

# Paso 4.1: Build del proyecto
npm run build

# Paso 4.2: Linting
npm run lint

# Paso 4.3: Type checking
npm run type-check

# Paso 4.4: Tests (si existen)
npm run test

# Paso 4.5: Verificar funcionamiento local
# Terminal 1:
cd apps/api
npm run dev

# Terminal 2:
cd apps/staff-app
npm run dev
```

---

## 7. Consideraciones Especiales

### 7.1 Turbo y npm Workspaces

**Estado:** ✅ **COMPATIBLE**

Turbo es totalmente compatible con npm workspaces. No requiere cambios en la configuración de Turbo.

**Por qué funciona:**
- Turbo detecta automáticamente la configuración de workspaces de npm
- El comando `turbo run build` funciona igual con npm workspaces
- La estructura del monorepo permanece igual

**Verificación:**
```bash
# Turbo detecta workspaces automáticamente
turbo run build --dry-run
```

### 7.2 Configuraciones de Vercel

**Estado:** ✅ **YA COMPATIBLES**

Las configuraciones de Vercel ya usan comandos npm:

| Archivo | Comando de Instalación | Comando de Build |
|---------|------------------------|------------------|
| `apps/staff-app/vercel.json` | `npm install --prefer-offline` | `npm run build` |
| `admin-web-deploy/vercel.json` | (default: npm install) | `npm run build` |

**No requieren cambios.**

### 7.3 Configuraciones de Railway

**Estado:** ✅ **YA COMPATIBLE**

La configuración de Railway ya usa comandos npm:

| Archivo | Comando de Build | Comando de Start |
|---------|------------------|------------------|
| `apps/api/railway.json` | `npm run build` | `npm run start:prod` |

**No requieren cambios.**

### 7.4 Dependencias Internas con workspace:*

**Estado:** ✅ **COMPATIBLE**

La sintaxis `workspace:*` es compatible con npm workspaces.

**Ejemplo:**
```json
{
  "dependencies": {
    "@vecinosimple/ui": "workspace:*",
    "@vecinosimple/database": "workspace:*"
  }
}
```

**Cómo funciona con npm:**
- npm resuelve `workspace:*` a la versión local del paquete
- Mantiene la referencia al paquete en el mismo monorepo
- Funciona igual que con pnpm

### 7.5 transpilePackages en Next.js

**Estado:** ✅ **COMPATIBLE**

La configuración `transpilePackages` en Next.js sigue funcionando con npm workspaces.

**Ejemplo:**
```javascript
// next.config.js
module.exports = {
  transpilePackages: ['@vecinosimple/ui', '@vecinosimple/database'],
}
```

**No requiere cambios.**

### 7.6 Scripts de Husky y Lint-staged

**Estado:** ✅ **COMPATIBLE**

Los scripts de Husky y lint-staged funcionan igual con npm.

**Verificación:**
```bash
# Verificar que Husky funciona
npm run prepare

# Verificar lint-staged
git add .
git commit -m "test"
```

### 7.7 Compatibilidad con Node.js

**Estado:** ✅ **COMPATIBLE**

- npm@10.0.0 requiere Node.js >=18.0.0
- El proyecto requiere Node.js >=20.0.0
- **Conclusión:** Completamente compatible

---

## 8. Riesgos y Mitigación

### 8.1 Posibles Conflictos de Versiones

**Riesgo:** Las dependencias pueden resolverse con versiones diferentes al cambiar de pnpm a npm.

**Probabilidad:** Media  
**Impacto:** Medio

**Mitigación:**
1. Documentar versiones antes de la migración (Fase 1)
2. Revisar `package-lock.json` generado para detectar cambios
3. Ejecutar tests completos después de la migración
4. Verificar que todas las aplicaciones funcionan localmente

**Plan de Contingencia:**
- Si se detectan conflictos de versiones, ajustar versiones específicas en `package.json`
- Usar `npm install <paquete>@<versión>` para forzar versiones específicas
- Revisar y actualizar `package.json` si es necesario

### 8.2 Problemas con Scripts Específicos de pnpm

**Riesgo:** Scripts que usan características específicas de pnpm pueden fallar.

**Probabilidad:** Baja  
**Impacto:** Alto

**Mitigación:**
1. Buscar todas las referencias a pnpm en scripts (Fase 2)
2. Documentar sintaxis equivalente en npm
3. Actualizar todos los scripts encontrados
4. Verificar que los scripts actualizados funcionan

**Plan de Contingencia:**
- Si un script falla, revisar la sintaxis de pnpm y adaptarla a npm
- Consultar documentación de npm para sintaxis equivalente
- Si no hay equivalente directo, reescribir el script

### 8.3 Problemas con Dependencias Internas

**Riesgo:** Las dependencias internas (`workspace:*`) pueden no resolverse correctamente.

**Probabilidad:** Baja  
**Impacto:** Alto

**Mitigación:**
1. Verificar que `workspaces` está configurado en `package.json` raíz
2. Verificar que todos los paquetes tienen `name` y `version` en su `package.json`
3. Ejecutar `npm list --workspace=<paquete>` para verificar resolución
4. Verificar que las aplicaciones pueden importar dependencias internas

**Plan de Contingencia:**
- Si una dependencia interna no se resuelve, verificar:
  - Que el paquete está listado en `workspaces` de `package.json` raíz
  - Que el `name` del paquete coincide con la referencia
  - Que el paquete tiene un `package.json` válido
- Usar rutas relativas como fallback temporal

### 8.4 Problemas con Deploy

**Riesgo:** Los despliegues pueden fallar si las configuraciones no son compatibles.

**Probabilidad:** Baja  
**Impacto:** Alto

**Mitigación:**
1. Verificar que todas las configuraciones de deploy usan comandos npm
2. Probar despliegue en un entorno de staging primero
3. Monitorear logs de despliegue
4. Tener plan de rollback listo

**Plan de Contingencia:**
- Si el despliegue falla, revisar logs para identificar el problema
- Si es un problema de dependencias, ajustar versiones y reintentar
- Si es un problema de scripts, corregir scripts y reintentar
- Revertir a la versión anterior si no se puede resolver rápidamente

### 8.5 Plan de Rollback

**Si la migración falla:**

1. **Restaurar desde Git:**
   ```bash
   git checkout main
   git branch -D feature/migrate-pnpm-to-npm
   ```

2. **O Restaurar desde Stash:**
   ```bash
   git stash pop
   ```

3. **Reinstalar con pnpm:**
   ```bash
   pnpm install
   ```

4. **Verificar Funcionamiento:**
   ```bash
   npm run build
   npm run dev
   ```

**Tiempo de Rollback:** 5-10 minutos

---

## 9. Post-Migración

### 9.1 Verificación Final

#### Checklist de Validación

- [ ] `pnpm-workspace.yaml` eliminado
- [ ] `package-lock.json` regenerado con npm
- [ ] Script `postinstall` en `apps/api/package.json` actualizado
- [ ] Todas las referencias a pnpm en scripts actualizadas
- [ ] `npm install` completado sin errores
- [ ] `npm run build` completado sin errores
- [ ] `npm run lint` completado sin errores
- [ ] `npm run type-check` completado sin errores
- [ ] Tests (si existen) pasan
- [ ] Apps funcionan localmente
- [ ] Dependencias internas se resuelven correctamente
- [ ] Configuraciones de deploy verificadas
- [ ] Documentación actualizada

### 9.2 Documentación de Versiones Después de la Migración

```bash
# Documentar versiones después de la migración
npm list --depth=0 > docs/migration/npm-versions-after.txt
```

### 9.3 Actualizar Documentación del Proyecto

**Archivos a Actualizar:**

1. **README.md**
   - Actualizar instrucciones de instalación
   - Cambiar `pnpm install` por `npm install`
   - Actualizar comandos de desarrollo

2. **docs/deploy.md**
   - Actualizar comandos de deploy
   - Eliminar referencias a pnpm

3. **docs/guides/GUIDE-001-getting-started.md**
   - Actualizar instrucciones de setup inicial
   - Cambiar comandos de pnpm a npm

4. **docs/guides/GUIDE-002-coding-standards.md**
   - Actualizar referencias a comandos de package manager

5. **docs/guides/GUIDE-003-deployment.md**
   - Verificar que todos los comandos usan npm

6. **docs/guides/GUIDE-004-independent-deploy.md**
   - Verificar que todos los comandos usan npm

### 9.4 Limpiar Archivos Temporales

```bash
# Eliminar archivos temporales si existen
del docs\migration\npm-versions-before.txt
del docs\migration\pnpm-versions-before.txt

# O mantenerlos como referencia
```

### 9.5 Commit de Cambios

```bash
# Agregar todos los cambios
git add .

# Commit de la migración
git commit -m "chore: migrate from pnpm to npm

- Remove pnpm-workspace.yaml
- Regenerate package-lock.json with npm
- Update postinstall script in apps/api/package.json
- Update documentation to use npm commands
- All deploy configurations already use npm

BREAKING CHANGE: Project now uses npm instead of pnpm"

# Push al repositorio
git push origin feature/migrate-pnpm-to-npm
```

### 9.6 Crear Pull Request

```bash
# Crear PR desde la branch
# (Esto se hace en GitHub/GitLab interface)
```

**Descripción del PR:**

```markdown
## Migración de pnpm a npm

### Cambios Realizados

- ✅ Eliminado `pnpm-workspace.yaml`
- ✅ Regenerado `package-lock.json` con npm
- ✅ Actualizado script `postinstall` en `apps/api/package.json`
- ✅ Actualizada documentación para usar comandos npm
- ✅ Verificadas configuraciones de deploy (ya usaban npm)

### Verificación

- [ ] Build exitoso: `npm run build`
- [ ] Linting exitoso: `npm run lint`
- [ ] Type-check exitoso: `npm run type-check`
- [ ] Apps funcionan localmente
- [ ] Dependencias internas resueltas correctamente

### Pruebas Realizadas

- Instalación de dependencias con npm
- Build de todos los proyectos
- Ejecución de apps localmente
- Verificación de dependencias internas

### Notas

- Turbo es compatible con npm workspaces (no requiere cambios)
- Configuraciones de Vercel y Railway ya usaban npm
- Dependencias internas con `workspace:*` funcionan igual

### Checklist de Review

- [ ] Todos los tests pasan
- [ ] No hay referencias a pnpm en el código
- [ ] Documentación actualizada
- [ ] Configuraciones de deploy verificadas
- [ ] No hay errores de dependencias
```

### 9.7 Merge y Deploy

```bash
# Después de aprobación del PR
git checkout main
git merge feature/migrate-pnpm-to-npm
git push origin main

# Eliminar branch
git branch -d feature/migrate-pnpm-to-npm
git push origin --delete feature/migrate-pnpm-to-npm
```

### 9.8 Monitoreo Post-Deploy

**Después del deploy a producción:**

1. **Monitorear logs de Vercel:**
   - Verificar que el build es exitoso
   - Verificar que no hay errores de runtime

2. **Monitorear logs de Railway:**
   - Verificar que el API inicia correctamente
   - Verificar que no hay errores de dependencias

3. **Verificar funcionalidad:**
   - Probar todas las rutas principales
   - Verificar que las dependencias internas funcionan
   - Verificar que no hay errores en consola

4. **Monitorear errores:**
   - Revisar herramientas de monitoreo (Sentry, etc.)
   - Verificar que no hay nuevos errores relacionados con la migración

---

## 10. Checklist de Validación

### Checklist Completo de Migración

#### Fase 1: Preparación
- [ ] Verificar versión de pnpm instalada
- [ ] Verificar versión de npm instalada
- [ ] Verificar que no hay procesos corriendo
- [ ] Documentar versiones de dependencias antes de migración
- [ ] Verificar estado de Git (directorio limpio)
- [ ] Crear branch de migración

#### Fase 2: Modificación de Archivos
- [ ] Verificar configuración de package.json raíz
- [ ] Eliminar pnpm-workspace.yaml
- [ ] Eliminar package-lock.json raíz
- [ ] Modificar script postinstall en apps/api/package.json
- [ ] Buscar y actualizar referencias a pnpm en scripts
- [ ] Verificar configuraciones de deploy (Vercel, Railway)

#### Fase 3: Regeneración de Dependencias
- [ ] Limpiar node_modules antiguos
- [ ] Limpiar caché de npm
- [ ] Ejecutar npm install
- [ ] Verificar que todas las dependencias se instalaron
- [ ] Verificar estructura de node_modules
- [ ] Verificar resolución de dependencias internas

#### Fase 4: Verificación
- [ ] Ejecutar npm run build (todos los proyectos)
- [ ] Ejecutar npm run lint
- [ ] Ejecutar npm run type-check
- [ ] Ejecutar tests (si existen)
- [ ] Verificar funcionamiento local de API
- [ ] Verificar funcionamiento local de Staff App
- [ ] Verificar integración de workspaces

#### Fase 5: Configuración de Deploy
- [ ] Verificar configuración de Vercel (apps/staff-app)
- [ ] Verificar configuración de Railway (apps/api)
- [ ] Verificar configuración de Vercel (admin-web-deploy)
- [ ] Actualizar docs/deploy.md
- [ ] Actualizar docs/guides/GUIDE-003-deployment.md
- [ ] Actualizar docs/guides/GUIDE-004-independent-deploy.md
- [ ] Actualizar README.md

#### Post-Migración
- [ ] Completar checklist de validación
- [ ] Documentar versiones después de migración
- [ ] Actualizar documentación del proyecto
- [ ] Limpiar archivos temporales (si aplica)
- [ ] Commit de cambios
- [ ] Crear Pull Request
- [ ] Merge y deploy
- [ ] Monitorear post-deploy

### Checklist de Validación Final

- [ ] No hay referencias a pnpm en el código
- [ ] package-lock.json está generado con npm
- [ ] Todos los proyectos construyen exitosamente
- [ ] Todas las aplicaciones funcionan localmente
- [ ] Dependencias internas se resuelven correctamente
- [ ] Configuraciones de deploy usan comandos npm
- [ ] Documentación actualizada
- [ ] Tests pasan (si existen)
- [ ] No hay errores de dependencias
- [ ] Pull Request creado y aprobado
- [ ] Deploy exitoso a producción
- [ ] Monitoreo post-deploy sin errores

---

## 11. Recursos y Referencias

### 11.1 Documentación Oficial

- **npm Workspaces:** https://docs.npmjs.com/cli/using-npm/workspaces
- **Turbo:** https://turbo.build/repo/docs
- **Vercel:** https://vercel.com/docs
- **Railway:** https://docs.railway.app

### 11.2 Comparación pnpm vs npm

| Característica | pnpm | npm |
|----------------|------|-----|
| Uso de disco | Eficiente (hard links) | Menos eficiente |
| Velocidad | Más rápido | Más lento |
| Workspaces | pnpm-workspace.yaml | workspaces en package.json |
| Compatibilidad Vercel | Requiere configuración | Nativa |
| Compatibilidad Railway | Requiere configuración | Nativa |
| Sintaxis workspace:* | Compatible | Compatible |
| Popularidad | Menos popular | Muy popular |

### 11.3 Comandos Equivalentes

| Tarea | pnpm | npm |
|-------|------|-----|
| Instalar | `pnpm install` | `npm install` |
| Agregar dependencia | `pnpm add <pkg>` | `npm install <pkg>` |
| Agregar dev dependency | `pnpm add -D <pkg>` | `npm install --save-dev <pkg>` |
| Ejecutar script | `pnpm run <cmd>` | `npm run <cmd>` |
| Ejecutar en workspace | `pnpm --filter <pkg> <cmd>` | `npm run <cmd> --workspace=<pkg>` |
| Listar dependencias | `pnpm list` | `npm list` |
| Limpiar caché | `pnpm store prune` | `npm cache clean --force` |

### 11.4 Troubleshooting

#### Problema: Dependencias no se resuelven

**Solución:**
```bash
# Limpiar caché y reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### Problema: Error "workspace protocol not supported"

**Solución:**
```bash
# Verificar que workspaces está configurado en package.json
# Verificar que todos los paquetes tienen name y version
npm list --workspace=<paquete>
```

#### Problema: Scripts fallan después de migración

**Solución:**
```bash
# Verificar sintaxis de scripts
# Buscar comandos específicos de pnpm y reemplazar
grep -r "pnpm" scripts/
```

#### Problema: Build falla en Vercel

**Solución:**
```bash
# Verificar logs de build en Vercel
# Verificar que installCommand usa npm
# Verificar que buildCommand usa npm
```

---

## 12. Apéndice

### 12.1 Historial de Cambios del Documento

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 27/01/2026 | Documentation Writer | Versión inicial |

### 12.2 Aprobaciones

| Rol | Nombre | Fecha | Firma |
|-----|--------|-------|-------|
| Autor | - | 27/01/2026 | - |
| Revisor Técnico | - | - | - |
| Aprobador | - | - | - |

### 12.3 Notas Adicionales

- Este documento debe seguirse paso a paso para garantizar una migración exitosa
- Si surge algún problema no documentado, agregarlo a la sección de Troubleshooting
- Mantener este documento actualizado después de la migración con lecciones aprendidas

---

**Fin del Documento**
