# AUDIT-013: Type Safety de TypeScript

**Fecha:** 2025-02-05
**Auditor:** Claude Code
**Prioridad:** P0 (Crítico)
**Estado:** Completado

## Resumen Ejecutivo

Se realizó una auditoría exhaustiva de type safety en todo el proyecto TypeScript. Se identificaron **9 errores de compilación activos**, múltiples usos de type assertions inseguros, y oportunidades de mejora en el manejo de errores y validación de tipos.

**Hallazgos Clave:**
- ✅ **Configuración TypeScript:** `strict: true` habilitado en todas las apps
- ❌ **9 errores de compilación** en admin-web que bloquean type-check
- ⚠️ **Type assertions inseguros** en middleware y API client
- ⚠️ **Manejo de errores** inconsistente (mix de `unknown` y sin tipo)
- ✅ **Librerías con tipos:** Todas las dependencias principales tienen tipos

---

## 1. Configuración de TypeScript

### 1.1 Configuración Base (packages/typescript-config/base.json)

```json
{
  "compilerOptions": {
    "strict": true,                    ✅
    "noUncheckedIndexedAccess": true,  ✅
    "noImplicitOverride": true,        ✅
    "forceConsistentCasingInFileNames": true ✅
  }
}
```

**Estado:** ✅ **EXCELENTE**

La configuración base tiene activadas todas las opciones de strict mode importantes.

### 1.2 Configuración API (apps/api/tsconfig.json)

```json
{
  "compilerOptions": {
    "strict": true,                          ✅
    "strictPropertyInitialization": false,   ⚠️ VER
    "emitDecoratorMetadata": true,           ✅
    "experimentalDecorators": true            ✅
  }
}
```

**Estado:** ⚠️ **ACEPTABLE**

`strictPropertyInitialization: false` es necesario para NestJS con decoradores, pero puede ocultar propiedades no inicializadas.

### 1.3 Configuración Next.js Apps

```json
{
  "extends": "@vecinosimple/typescript-config/nextjs.json"
}
```

**Estado:** ✅ **CORRECTO**

Todas las apps (admin-web, resident-app, staff-app) extienden la configuración base correctamente.

---

## 2. Errores de Compilación Activos (P0 - CRÍTICO)

### 2.1 Admin-Web: 9 errores TypeScript

**Impacto:** Bloquea `npm run type-check`, oculta bugs en tiempo de desarrollo

#### Error 1: Variable no definida
```typescript
// apps/admin-web/src/app/(dashboard)/asambleas/[id]/page.tsx:354
onClick={() => setShowAgregarPunto(true)}
// ❌ TS2552: Cannot find name 'setShowAgregarPunto'. Did you mean '_setShowAgregarPunto'?
```
**Severidad:** P0 - Runtime error garantizado
**Fix:** Renombrar `_setShowAgregarPunto` a `setShowAgregarPunto`

#### Error 2: Import incorrecto
```typescript
// apps/admin-web/src/app/(dashboard)/notificaciones/page.tsx:42
VENCIMIENTO: Clock,
// ❌ TS2552: Cannot find name 'Clock'. Did you mean 'Lock'?
```
**Severidad:** P0 - Runtime error garantizado
**Fix:** Importar `Clock` desde 'lucide-react'

#### Error 3: Propiedades que no existen
```typescript
// apps/admin-web/src/app/(dashboard)/usuarios/[id]/page.tsx:442-447
{rc.consorcio?.nombre || 'Consorcio'}        // ❌ Property 'consorcio' does not exist
{rc.unidadFuncional && ...}                   // ❌ Property 'unidadFuncional' does not exist
```
**Severidad:** P0 - Accede a propiedades inexistentes
**Fix:** Usar `consorcioId` y `unidadFuncionalId`, o actualizar el tipo `UsuarioConsorcioResponse`

#### Errores 4-9: Tests con tipos incorrectos
```typescript
// apps/admin-web/src/features/amenities/hooks.test.ts
expect(result.current.data?.data).toBeInstanceOf(Array); // ❌ 'data' does not exist on type 'Amenity[]'
expect(result.current.data?.horariosDisponibles)       // ❌ Property does not exist
.sort((a, b) => a.orden - b.orden)                     // ❌ Parameter 'a' implicitly has 'any' type
```
**Severidad:** P1 - Tests no tipados correctamente
**Fix:** Actualizar mock data y expectativas

### 2.2 Staff-App: 1 error en tests

```typescript
// apps/staff-app/src/test/offline.test.ts:16
error TS2698: Spread types may only be created from object types.
```

**Severidad:** P1 - Test broken
**Fix:** Verificar tipos de objetos en spread operator

---

## 3. Type Assertions Inseguros (P1 - ALTO)

### 3.1 Middleware JWT (CRÍTICO)

```typescript
// apps/admin-web/src/middleware.ts:161
return payload as unknown as JwtPayload;
```

**Problema:**
- `as unknown as` es un double cast que evade TODA validación de tipos
- Si el payload del JWT cambia en el backend, el frontend no detectará el error
- Puede causar runtime errors si `payload` no tiene la estructura esperada

**Impacto:** Si el JWT payload cambia, el código fallará en runtime sin previo aviso

**Recomendación:**
```typescript
// ✅ Type guard con validación
function isJwtPayload(payload: unknown): payload is JwtPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sub' in payload &&
    'email' in payload &&
    typeof (payload as JwtPayload).sub === 'string' &&
    typeof (payload as JwtPayload).email === 'string'
  );
}

if (!isJwtPayload(payload)) {
  throw new Error('Invalid JWT payload structure');
}
return payload;
```

### 3.2 Response.json() sin validación

```typescript
// apps/staff-app/src/offline/sync-manager.ts:205, 239, 273
const errorData = await response.json().catch(() => ({}));
throw new Error(errorData.message || `HTTP ${response.status}`);
// ⚠️ errorData es implicitamente 'any', no se valida que tenga 'message'
```

**Problema:**
- `errorData.message` puede causar runtime error si la respuesta no tiene esa propiedad
- No hay validación de estructura

**Recomendación:**
```typescript
// ✅ Validar estructura antes de acceder
interface ErrorResponse {
  message?: string;
  error?: string;
}

const errorData = await response.json().catch((): ErrorResponse => ({}));
throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
```

### 3.3 API Client - Response typing

```typescript
// packages/api-client/src/index.ts:88
return response.json(); // ⚠️ Retorna T sin validar que el response coincida
```

**Problema:**
- No hay validación runtime de que el JSON coincida con el tipo genérico `T`
- Confiamos ciegamente en que el backend respeta el contrato

**Recomendación:**
```typescript
// ✅ Agregar validador Zod o similar
import { z } from 'zod';

async fetch<T extends z.ZodType>(
  endpoint: string,
  schema: T,
  options: FetchOptions = {}
): Promise<z.infer<T>> {
  const response = await fetch(/* ... */);
  const json = await response.json();
  return schema.parse(json); // Validación runtime
}
```

---

## 4. Manejo de Errores (P2 - MEDIO)

### 4.1 Patrones Correctos ✅

**Admin-Web Frontend:**
```typescript
// ✅ Usa 'unknown' correctamente
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : 'Unknown error';
}
```

**API Services:**
```typescript
// ✅ Type guard con instanceof
if (error instanceof Error) {
  this.logger.error(error.message);
}
```

### 4.2 Patrones Problemáticos ⚠️

**Staff-App Sync Manager:**
```typescript
// ❌ Error sin tipo
} catch (error) {
  result.errors.push(`Bitácora ${entry.localId}: ${error}`);
}
```

**Problema:**
- Si `error` no es un Error, puede ser number, string, object, etc.
- `${error}` puede producir "[object Object]" en runtime

**Recomendación:**
```typescript
// ✅ Type guard
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  result.errors.push(`Bitácora ${entry.localId}: ${message}`);
}
```

### 4.3 API - catch sin tipo

**Ubicación:** Múltiples servicios en apps/api/src/modules

```typescript
// ❌ Patron común en API
} catch (error) {
  throw new UnauthorizedException("Token inválido");
}
```

**Problema:**
- El error original se pierde
- No hay logging del error real
- Dificulta debugging

**Recomendación:**
```typescript
// ✅ Preservar información del error
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  this.logger.error(`Auth failed: ${message}`);
  throw new UnauthorizedException("Token inválido");
}
```

---

## 5. Uso de `any` y Tipos Débiles

### 5.1 Resultados de Búsqueda

**Uso de `:` (type assertions) en código fuente:**
- ✅ **NO se encontraron** usos problemáticos de `: any` en el código fuente
- La mayoría de los matches son `as const` (type assertions seguros)

**Uso de `unknown` (correcto):**
```typescript
// ✅ Buen uso de unknown para configs genéricas
list: (filters?: Record<string, unknown>) => [...]

// ✅ Buen uso en callbacks
updateConfig = (key: string, value: unknown) => {...}
```

### 5.2 Type Assertions Seguros ✅

```typescript
// ✅ 'as const' es seguro (narra tipos correctamente)
] as const;
} as const;

// ✅ Type assertion de parámetros conocidos
params as Record<string, string | number | boolean | undefined>

// ✅ Type assertions necesarios para callbacks
}) as T;
```

---

## 6. Librerías sin Tipos

### 6.1 Verificación de Dependencias

**Comando:** `npm ls --depth=0`

**Resultado:** ✅ **TODAS las dependencias principales tienen tipos**

```
✓ @types/node@20.19.30
✓ @types/react@18.3.27
✓ @types/react-dom@18.3.7
✓ @types/express@4.17.25
✓ @types/jest@29.5.14
✓ @types/multer@2.0.0
✓ @types/passport-jwt@4.0.1
✓ @types/pdfkit@0.17.4
```

### 6.2 Librerías que proveen sus propios tipos ✅

- Next.js (tipos incluidos)
- React (tipos incluidos)
- NestJS (tipos incluidos)
- Prisma (tipos generados)
- Zod (tipos incluidos)

**Estado:** ✅ **EXCELENTE** - No hay librerías sin tipos en uso

---

## 7. Discriminadores y Type Guards

### 7.1 Type Guards Implementados ✅

**Middleware:**
```typescript
// ✅ Buen type guard con instanceof
if (!(error instanceof Error)) {
  return 'Token inválido';
}
```

**API Services:**
```typescript
// ✅ Validación de tipo antes de acceder
if (error instanceof BadRequestException) throw error;
```

### 7.2 Uniones que Necesitan Discriminadores

**API Client Error:**
```typescript
// packages/api-client/src/index.ts:3-11
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown,  // ⚠️ Podría ser más específico
  ) {
    super(`API Error: ${status} ${statusText}`);
  }
}
```

**Recomendación:**
```typescript
// ✅ Discriminated union para respuestas de error
type ApiErrorResponse = {
  status: number;
  statusText: string;
  data: {
    message: string;
    errors?: Record<string, string[]>;
    statusCode: number;
  }
};

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: ApiErrorResponse['data']
  ) {
    super(`API Error: ${status} ${statusText}`);
  }
}
```

### 7.3 Optional Chaining en Request User

**API Controllers:**
```typescript
// apps/api/src/modules/amenities/amenities.controller.ts:176
const esAdmin = req.user?.roles?.some((r) => ROLES_GESTION.includes(r)) || false;
```

**Problema:**
- `req.user` puede ser undefined (authenticated vs unauthenticated)
- `req.user.id` se usa sin validar en línea 179

**Recomendación:**
```typescript
// ✅ Type guard para autenticación
function isAuthenticated(req: AuthenticatedRequest): req is AuthenticatedRequest & { user: NonNullable<AuthenticatedRequest['user']> } {
  return req.user !== undefined;
}

if (!isAuthenticated(req)) {
  throw new UnauthorizedException();
}
// Ahora req.user y req.user.id están garantizados
```

---

## 8. TypeScript Compiler Errors

### 8.1 Errores Bloqueantes

| Archivo | Línea | Error | Severidad | Estado |
|---------|-------|-------|-----------|--------|
| asambleas/[id]/page.tsx | 354 | `setShowAgregarPunto` no existe | P0 | ❌ Fix pendiente |
| asambleas/[id]/page.tsx | 384 | `setShowAgregarPunto` no existe | P0 | ❌ Fix pendiente |
| notificaciones/page.tsx | 42 | `Clock` no importado | P0 | ❌ Fix pendiente |
| usuarios/[id]/page.tsx | 442 | `consorcio` no existe en tipo | P0 | ❌ Fix pendiente |
| usuarios/[id]/page.tsx | 446 | `unidadFuncional` no existe | P0 | ❌ Fix pendiente |
| usuarios/[id]/page.tsx | 447 | `unidadFuncional` no existe | P0 | ❌ Fix pendiente |
| amenities/hooks.test.ts | 34 | `data` no existe en tipo | P1 | ❌ Fix pendiente |
| amenities/hooks.test.ts | 57 | Parámetro implícito `any` | P1 | ❌ Fix pendiente |
| expensas/use-expensas.test.ts | 166 | Propiedad desconocida | P1 | ❌ Fix pendiente |

### 8.2 Comando de Verificación

```bash
# Verificar todos los errores
npm run type-check

# Verificar por app
cd apps/admin-web && npx tsc --noEmit
cd apps/api && npx tsc --noEmit
cd apps/resident-app && npx tsc --noEmit
cd apps/staff-app && npx tsc --noEmit
```

---

## 9. Recomendaciones Prioritarias

### 9.1 CRÍTICAS (P0) - Hacer YA

1. **Fix errores de compilación en admin-web**
   ```bash
   cd apps/admin-web
   # Corregir las 9 referencias rotas antes de continuar
   ```

2. **Reemplazar `as unknown as` en middleware**
   - Implementar type guard para JWT payload
   - Evitar double casts que evaden type checking

3. **Validar responses.json() en staff-app**
   - Agregar interfaces para ErrorResponse
   - Validar propiedades antes de acceder

### 9.2 ALTAS (P1) - Esta semana

4. **Estandarizar manejo de errores en API**
   ```typescript
   // Template para catch blocks
   } catch (error) {
     const message = error instanceof Error ? error.message : 'Unknown error';
     this.logger.error(`Operation failed: ${message}`);
     throw new InternalServerErrorException('Operation failed');
   }
   ```

5. **Agregar validación runtime a API Client**
   - Considerar Zod para validar respuestas
   - O al menos validar estructura básica

6. **Type guards para `req.user`**
   - Implementar `isAuthenticated()` guard
   - Usar en todos los endpoints protegidos

### 9.3 MEDIAS (P2) - Próximo sprint

7. **Mejorar tipado de errors en logs**
   - Crear interfaz unificada para error logging
   - Incluir stack traces cuando sea Error instance

8. **Agregar tests de tipos**
   ```typescript
   // tests/type-tests.ts
   import { expectTypeOf } from 'vitest';

   expectTypeOf JwtPayload).toMatchTypeOf<{
     sub: string;
     email: string;
   }>();
   ```

9. **Review de `strictPropertyInitialization: false`**
   - Evaluar si se puede activar
   - Documentar por qué es necesario si no se puede

---

## 10. Métricas de Type Safety

### 10.1 Score Actual

| Categoría | Score | Nota |
|-----------|-------|------|
| Configuración TypeScript | 9/10 | strict mode activado |
| Librerías con tipos | 10/10 | Todas tienen tipos |
| Errores de compilación | 2/10 | 9 errores activos |
| Type assertions seguros | 7/10 | Algunos `as unknown as` problemáticos |
| Manejo de errores | 6/10 | Mix de unknown y sin tipo |
| Type guards | 7/10 | Buenos ejemplos pero faltan algunos |
| **PROMEDIO GENERAL** | **6.8/10** | **Aceptable pero mejorable** |

### 10.2 Comparativa

| Métrica | Antes (Estimado) | Actual | Mejora |
|---------|------------------|--------|--------|
| Errores de compilación conocidos | ? | 9 | - |
| Líneas con `: any` en código | ? | 0 | ✅ |
| Librerías sin tipos | ? | 0 | ✅ |
| Type guards implementados | ? | 20+ | ✅ |

---

## 11. Plan de Acción

### Fase 1: Fixes Críticos (Día 1)
- [ ] Fix 9 errores de compilación en admin-web
- [ ] Reemplazar `as unknown as` en middleware
- [ ] Validar responses.json() en sync-manager

### Fase 2: Type Guards (Semana 1)
- [ ] Implementar `isAuthenticated()` guard
- [ ] Agregar type guards para JWT payload
- [ ] Estandarizar catch blocks en API

### Fase 3: Validación Runtime (Semana 2)
- [ ] Evaluar Zod para API client
- [ ] Agregar validadores de respuesta
- [ ] Implementar error types discriminados

### Fase 4: Testing de Tipos (Semana 3)
- [ ] Agregar tests de tipos con vitest
- [ ] Configurar type checking en CI
- [ ] Documentar patrones de type safety

---

## 12. Herramientas Recomendadas

### 12.1 Para Desarrollo

```bash
# Type checking en watch mode
npm run type-check -- --watch

# Verificar tipos específicos
npx tsc --noEmit --pretty

# Buscar 'any' en código (excepto node_modules)
grep -r ": any" apps/*/src --include="*.ts" --include="*.tsx"
```

### 12.2 Para CI/CD

```yaml
# .github/workflows/type-check.yml
- name: Type Check
  run: |
    npm run type-check
    if [ $? -ne 0 ]; then
      echo "❌ Type check failed"
      exit 1
    fi
```

### 12.3 Para VSCode

```json
// .vscode/settings.json
{
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.strictFunctionTypes": true
}
```

---

## 13. Patrones Recomendados

### 13.1 Type Guard Template

```typescript
// ✅ Type guard para validación
function isJwtPayload(payload: unknown): payload is JwtPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'sub' in payload &&
    'email' in payload
  );
}

// Uso
if (!isJwtPayload(payload)) {
  throw new Error('Invalid payload');
}
// Ahora TypeScript sabe que payload es JwtPayload
```

### 13.2 Error Handling Template

```typescript
// ✅ Error handling con tipo seguro
try {
  await operation();
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown error';
  logger.error(`Operation failed: ${message}`, { error });
  throw new OperationFailedException(message);
}
```

### 13.3 API Response Template

```typescript
// ✅ Validar respuesta antes de usar
const response = await fetch(url);
const data = await response.json();

if (!isExpectedResponse(data)) {
  throw new Error('Invalid response structure');
}

// Ahora TypeScript conoce la estructura de data
```

---

## 14. Conclusión

El proyecto tiene una **base sólida de type safety** con TypeScript configurado correctamente y todas las dependencias con tipos. Sin embargo, hay **9 errores de compilación activos** que deben corregirse urgentemente, y varios patrones de type assertions inseguros que deben mejorarse.

**Próximos pasos inmediatos:**
1. Corregir los 9 errores de compilación en admin-web
2. Reemplazar `as unknown as` en middleware por type guards
3. Estandarizar manejo de errores con `unknown`

Una vez implementadas estas correcciones, el nivel de type safety mejorará de **6.8/10 a 8.5+/10**.

---

## 15. Referencias

- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates)
- [Zod Runtime Validation](https://zod.dev/)
- [TypeScript Error Handling Best Practices](https://kentcdodds.com/blog/use-a-error-boundary)

---

**Firma del Auditor:** Claude Code
**Fecha de Revisión:** 2025-02-05
**Próxima Revisión Sugerida:** 2025-03-05 (después de implementar fixes)
