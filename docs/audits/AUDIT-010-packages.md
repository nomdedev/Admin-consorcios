# 📦 AUDIT-010: Packages (Librerías Compartidas)

**Fecha:** 5 de febrero de 2026  
**Versión:** 1.0  
**Health Score:** 7/10  

---

## 1. Visión General

El monorepo contiene 7 packages compartidos entre las apps:

| Package | Propósito | Usado por |
|---------|-----------|-----------|
| `@vecinosimple/ui` | Design System (componentes, themes) | admin-web |
| `@vecinosimple/database` | Prisma schema + client | api |
| `@vecinosimple/api-client` | Cliente HTTP tipado | admin-web, resident-app |
| `@vecinosimple/business-logic` | Calculadores, validadores | Todas las apps |
| `@vecinosimple/eslint-config` | Configuración ESLint | Todas |
| `@vecinosimple/typescript-config` | tsconfig base | Todas |
| `@vecinosimple/tailwind-config` | Tailwind presets | Apps frontend |

---

## 2. Estado por Package

### 2.1 @vecinosimple/ui

**Path:** `packages/ui/`  
**Estado:** ✅ Saludable (8/10)

#### Exports
```typescript
// Componentes
export { Button, Input, Card, Dialog, ... }

// Hooks
export { useToast, useMediaQuery, ... }

// Themes
export { themes, highContrastTheme }
```

#### Problemas
| Issue | Severidad |
|-------|-----------|
| ~~lucide-react ^0.562.0 (inconsistente)~~ | ✅ Resuelto |

#### Acciones Completadas
- [x] ~~Actualizar lucide-react a ^0.563.0 (alinear con apps)~~ **HECHO**

---

### 2.2 @vecinosimple/database

**Path:** `packages/database/`  
**Estado:** ✅ Saludable (9/10)

#### Exports
```typescript
export { PrismaClient } from '@prisma/client'
export type { User, Consorcio, Gasto, ... }
```

#### Schema Features
- Multi-tenancy con `consorcioId`
- Auditoría con `AuditLog`
- Campos encriptados marcados
- Enums para roles, estados

#### Problemas
- Ninguno crítico

---

### 2.3 @vecinosimple/api-client

**Path:** `packages/api-client/`  
**Estado:** ⚠️ Parcialmente usado (6/10)

#### Exports
```typescript
export { ApiClient } from './api-client'
export { ApiError } from './errors'
export type { ApiClientConfig, ... }
```

#### Features
- ✅ Retry automático
- ✅ Interceptors para auth
- ✅ Manejo de errores tipado
- ✅ TypeScript completo

#### Problemas
| Issue | Severidad |
|-------|-----------|
| **No usado en staff-app** | ⚠️ Alta |
| Algunos fetch directos en resident-app | ⚠️ Media |

#### Acción Requerida
- [ ] Agregar `@vecinosimple/api-client` a staff-app
- [ ] Migrar fetch directos en resident-app

---

### 2.4 @vecinosimple/business-logic

**Path:** `packages/business-logic/`  
**Estado:** ✅ Saludable (8/10)

#### Exports
```typescript
// Calculadores
export { calcularProrrateo, calcularExpensa, ... }

// Validadores
export { validarCUIT, validarCBU, ... }

// Constantes
export { ROLES, ESTADOS_PAGO, ... }
```

#### Uso
- ✅ Transpilado por todas las apps frontend
- ✅ Importado directamente en API

#### Problemas
- Ninguno crítico

---

### 2.5 @vecinosimple/eslint-config

**Path:** `packages/eslint-config/`  
**Estado:** ✅ Saludable (9/10)

#### Configuraciones
```
├── base.js           # Reglas comunes
├── next.js           # Next.js specific
├── nest.js           # NestJS specific
└── react.js          # React hooks, etc.
```

#### Problemas
| Issue | Nota |
|-------|------|
| `ignoreDuringBuilds: true` en apps | Las apps ignoran las reglas en CI |

---

### 2.6 @vecinosimple/typescript-config

**Path:** `packages/typescript-config/`  
**Estado:** ✅ Saludable (9/10)

#### Configuraciones
```
├── base.json         # Configuración común
├── nextjs.json       # Next.js apps
├── nestjs.json       # NestJS API
└── library.json      # Packages
```

---

### 2.7 @vecinosimple/tailwind-config

**Path:** `packages/tailwind-config/`  
**Estado:** ✅ Saludable (9/10)

#### Features
```typescript
// Preset personalizado
export const vecinoSimplePreset = {
  theme: {
    extend: {
      colors: { ... },
      spacing: {
        touch: '44px',  // Mínimo para accesibilidad
      }
    }
  }
}
```

---

## 3. Matriz de Dependencias

```
                    ┌─────────────┐
                    │   api-client │
                    └──────┬──────┘
                           │ usa
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌──────────┐  ┌────────────┐  ┌───────────┐
      │admin-web │  │resident-app│  │ staff-app │ ← ❌ No usa
      └────┬─────┘  └──────┬─────┘  └─────┬─────┘
           │               │              │
           └───────────────┼──────────────┘
                           ▼
                 ┌────────────────┐
                 │ business-logic │
                 └────────────────┘
                           │
            ┌──────────────┼──────────────┐
            ▼              ▼              ▼
      ┌──────────┐  ┌────────────┐  ┌──────────┐
      │    ui    │  │  database  │  │   api    │
      └──────────┘  └────────────┘  └──────────┘
```

---

## 4. Versiones de Dependencias Compartidas

### Inconsistencias Detectadas

| Dependencia | admin-web | resident-app | staff-app | ui |
|-------------|-----------|--------------|-----------|-----|
| lucide-react | 0.309.0 | 0.563.0 | 0.563.0 | 0.562.0 |
| @prisma/client | 5.22.0 | - | - | 5.10.0 |

### Recomendación
Unificar a:
- `lucide-react`: `^0.563.0`
- `@prisma/client`: `^5.22.0`

---

## 5. Plan de Acción por Package

### api-client
| Prioridad | Acción |
|-----------|--------|
| P1 | Agregar a staff-app como dependencia |
| P1 | Migrar fetch directos en resident-app |
| P2 | Agregar tipos para todos los endpoints |

### ui
| Prioridad | Acción |
|-----------|--------|
| P1 | Actualizar lucide-react a ^0.563.0 |
| P2 | Agregar más componentes accesibles |
| P2 | Documentar con Storybook |

### database
| Prioridad | Acción |
|-----------|--------|
| P2 | Unificar versión @prisma/client |
| P2 | Agregar más validaciones en schema |

### business-logic
| Prioridad | Acción |
|-----------|--------|
| P2 | Agregar tests unitarios |
| P2 | Documentar funciones de cálculo |

---

## 6. Scripts de Workspace

### package.json (root)
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "build:packages": "turbo run build --filter=./packages/*"
  }
}
```

### Comandos Útiles
```bash
# Build solo packages
pnpm build:packages

# Lint en package específico
pnpm lint --filter=@vecinosimple/ui

# Agregar dependencia a un package
pnpm add lucide-react --filter=@vecinosimple/ui
```

---

## 7. Verificación de Integración

### Checklist
- [ ] Todos los packages compilan sin errores
- [ ] Exports correctamente tipados
- [ ] Sin circular dependencies
- [ ] Versiones de dependencias alineadas

### Comando de Verificación
```bash
# Verificar que todo compila
pnpm build

# Verificar tipos
pnpm typecheck
```

---

## 8. Recomendaciones de Arquitectura

### Corto plazo
1. **Unificar versiones de lucide-react** – evitar breaking changes
2. **staff-app debe usar api-client** – consistencia de manejo de errores
3. **Documentar exports de cada package** – facilitar onboarding

### Mediano plazo
1. **Storybook para ui** – documentación visual de componentes
2. **Tests para business-logic** – validar cálculos críticos
3. **Changelog automatizado** – semantic-release por package

### Largo plazo
1. **Publicar packages en npm interno** – si escala a múltiples proyectos
2. **Versionado independiente** – permitir releases por package

---

## 9. Métricas de Health

| Package | Build | Types | Tests | Docs | Score |
|---------|-------|-------|-------|------|-------|
| ui | ✅ | ✅ | ⚠️ | ⚠️ | 8/10 |
| database | ✅ | ✅ | N/A | ⚠️ | 9/10 |
| api-client | ✅ | ✅ | ⚠️ | ⚠️ | 6/10 |
| business-logic | ✅ | ✅ | ⚠️ | ⚠️ | 8/10 |
| eslint-config | ✅ | N/A | N/A | ✅ | 9/10 |
| typescript-config | ✅ | N/A | N/A | ✅ | 9/10 |
| tailwind-config | ✅ | ✅ | N/A | ⚠️ | 9/10 |

**Promedio:** 8.3/10

---

**Última actualización:** 5 de febrero de 2026
