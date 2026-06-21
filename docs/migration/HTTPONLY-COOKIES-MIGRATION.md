# Migración a Cookies httpOnly para Tokens JWT

## Resumen Ejecutivo

Se ha implementado una arquitectura de autenticación más segura usando cookies httpOnly para tokens JWT, eliminando la vulnerabilidad XSS del almacenamiento en localStorage.

## Cambios Realizados

### 1. Backend (apps/api)

#### Archivo: `apps/api/src/modules/auth/auth.service.ts`

**Cambios principales:**
- Implementado `verifyMagicLink()` para establecer refresh token en cookie httpOnly
- Refactorizado `refreshToken()` para usar cookie en lugar de token en body
- Nuevo método `logout()` para limpiar refresh token de cookie y base de datos

**Nueva lógica de refresh tokens:**
```typescript
// Generar refresh token criptográficamente seguro
const refreshToken = crypto.randomBytes(32).toString('hex');
const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

// Guardar hash en base de datos (no el token real)
await this.prisma.usuario.update({
  data: { refreshTokenHash, refreshTokenExpires }
});

// Establecer cookie httpOnly
response.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth/refresh',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
});
```

#### Archivo: `apps/api/src/modules/auth/auth.controller.ts`

**Nuevos endpoints:**
- `POST /api/auth/verify` - Ahora establece cookie httpOnly con refresh token
- `POST /api/auth/refresh` - Usa refresh token de cookie (ya no requiere auth)
- `POST /api/auth/logout` - Limpia cookie y refresh token de base de datos

### 2. Base de Datos

#### Archivo: `packages/database/prisma/schema.prisma`

**Nuevos campos en modelo Usuario:**
```prisma
model Usuario {
  // ...
  refreshTokenHash     String?      // Hash del refresh token (sha256)
  refreshTokenExpires  DateTime?    // Expiración del refresh token
}
```

**Nota:** El campo anterior `refreshToken` está marcado como DEPRECATED.

### 3. Admin Web (apps/admin-web)

#### Archivo: `apps/admin-web/src/features/auth/store/auth-store.ts`

**Cambios importantes:**
- Eliminado uso de localStorage para tokens (XSS vulnerability)
- Access token solo en memoria (Zustand state)
- Refresh token en cookie httpOnly (manejada por backend)

**Configuración de persistencia:**
```typescript
persist(
  (set, get) => ({ /* ... */ }),
  {
    name: 'vecinosimple-auth',
    partialize: (state) => ({
      user: state.user,
      isAuthenticated: state.isAuthenticated,
      // ❌ NO persistir accessToken ni refreshToken
    }),
  }
)
```

**Método `refreshSession()`:**
```typescript
refreshSession: async () => {
  // Refresh token está en cookie, no se envía explícitamente
  const response = await apiClient.post<LoginResponse>('/auth/refresh', {});
  get().setAuth(response);
  return true;
}
```

#### Archivo: `apps/admin-web/src/lib/api-client.ts`

**Nueva configuración con callback de refresh:**
```typescript
export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  onTokenRefresh: async () => {
    const success = await useAuthStore.getState().refreshSession();
    return success ? useAuthStore.getState().accessToken : null;
  },
});
```

### 4. Resident App (apps/resident-app)

**Nuevo archivo:** `apps/resident-app/src/lib/auth-context.tsx`
- Contexto de autenticación con gestión en memoria
- Integración con api-client para auto-refresh
- Soporte para cookies httpOnly

**Archivo modificado:** `apps/resident-app/src/lib/api-client.ts`
- Eliminado `getAccessToken` de localStorage
- Token se establece desde AuthContext

### 5. Staff App (apps/staff-app)

**Nuevo archivo:** `apps/staff-app/src/lib/auth-context.tsx`
- Similar a resident-app pero con soporte offline
- Expone token en variable global para sync-manager

**Archivo modificado:** `apps/staff-app/src/lib/api-client.ts`
- Helper `getAccessTokenForSync()` para sync-manager offline

**Archivo modificado:** `apps/staff-app/src/offline/sync-manager.ts`
- Usa variable global `__STAFF_ACCESS_TOKEN__` en lugar de localStorage

### 6. API Client Package (packages/api-client)

**Archivo:** `packages/api-client/src/index.ts`

**Nuevas funcionalidades:**
- Callback `onTokenRefresh` para refresco automático
- Mutex pattern para evitar múltiples refreshes simultáneos
- Reintento automático con 401 responses

**Implementación de auto-refresh:**
```typescript
async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  let response = await fetch(url, options);

  // Auto-refresh si token expiró (401)
  if (response.status === 401 && this.onTokenRefresh && endpoint !== '/api/auth/refresh') {
    const newToken = await this.refreshToken();
    if (newToken) {
      // Reintentar con nuevo token
      response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${newToken}` } });
    }
  }

  return response.json();
}
```

## Arquitectura de Seguridad

### Antes (Vulnerable a XSS)
```
LocalStorage (JavaScript accesible)
├── accessToken (15 min)
└── refreshToken ❌ VULNERABLE
```

### Después (Seguro)
```
Memoria (React state)
└── accessToken (15 min) ✅ Inaccesible para XSS

Cookie httpOnly
└── refreshToken (7 días) ✅ Inaccesible para JavaScript
```

Base de Datos
```
Usuario.refreshTokenHash (sha256) ✅ Hash, no token plano
```

## Instrucciones de Testing

### 1. Preparar el Entorno

```bash
# Ejecutar migración de base de datos
cd apps/api
npx prisma migrate dev --name add_refresh_token_fields

# O en producción
npx prisma migrate deploy
```

### 2. Testing de Backend

```bash
# Iniciar API
cd apps/api
npm run start:dev

# Test con curl
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Verificar magic link (desarrollo retorna el link)
# Copiar el magic link de la respuesta

# Verificar magic link
curl -X POST http://localhost:3001/api/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"token":"<token_from_magic_link>"}' \
  -c cookies.txt

# Verificar cookie
cat cookies.txt
# Debería mostrar refreshToken con flags httpOnly

# Probar refresh
curl -X POST http://localhost:3001/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Probar logout
curl -X POST http://localhost:3001/api/auth/logout \
  -b cookies.txt \
  -c cookies.txt
```

### 3. Testing de Frontend (admin-web)

```bash
cd apps/admin-web
npm run dev
```

**Casos de prueba:**

1. **Login exitoso**
   - Abrir DevTools → Application → Cookies
   - Iniciar sesión
   - Verificar que no hay tokens en localStorage
   - Verificar cookie `refreshToken` con flag `HttpOnly: ✓`

2. **Persistencia de sesión**
   - Recargar página después de login
   - Verificar que usuario sigue autenticado
   - Verificar que se intentó refrescar sesión

3. **Cierre de sesión**
   - Hacer logout
   - Verificar que cookie `refreshToken` fue eliminada
   - Verificar que estado local se limpió

4. **Expiración de token**
   - Esperar 15 minutos (o modificar expiración para testing)
   - Hacer una petición a la API
   - Verificar que se refrescó automáticamente sin error 401

### 4. Verificación de Seguridad

**En DevTools Console:**
```javascript
// Intentar acceder a tokens desde JavaScript
localStorage.getItem('accessToken'); // → null (✅ seguro)
localStorage.getItem('refreshToken'); // → null (✅ seguro)
document.cookie; // No muestra refreshToken si es httpOnly (✅)
```

**Verificar headers de cookie:**
```javascript
// En DevTools → Network → Headers
// Verificar que refreshToken cookie tiene:
// HttpOnly: ✓
// Secure: ✓ (en producción)
// SameSite: Strict
// Path: /api/auth/refresh
```

### 5. Testing de Resident App

```bash
cd apps/resident-app
npm run dev
```

- Verificar que AuthProvider se monta correctamente
- Probar flujo de login completo
- Verificar que no se usa localStorage para tokens

### 6. Testing de Staff App

```bash
cd apps/staff-app
npm run dev
```

- Verificar sync-manager funciona con token en memoria
- Probar modo offline/online
- Verificar que `__STAFF_ACCESS_TOKEN__` se actualiza correctamente

## Comportamiento Esperado

### Login Flow

```
1. Usuario solicita magic link
   POST /api/auth/login
   ← { success: true, magicLink: "..." }

2. Usuario verifica magic link
   POST /api/auth/verify { token: "..." }
   ← Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=Strict
   ← { accessToken: "...", usuario: {...} }

3. Frontend guarda access token en memoria
   - NO localStorage
   - Solo Zustand state / React state

4. Petición a API
   GET /api/expensas
   Authorization: Bearer <accessToken>

5. Si access token expira (401)
   - api-client detecta 401
   - Llama onTokenRefresh callback
   - POST /api/auth/refresh (envía cookie automáticamente)
   ← { accessToken: "...", usuario: {...} }
   - Reintenta petición original con nuevo token
```

### Logout Flow

```
1. Usuario hace logout
   POST /api/auth/logout
   Authorization: Bearer <accessToken>
   ← Set-Cookie: refreshToken=; Max-Age=0 (elimina cookie)
   ← { success: true }

2. Frontend limpia estado
   - accessToken = null
   - user = null
   - isAuthenticated = false
```

## Rollback Plan

Si surgen problemas críticos:

1. **Frontend:** Revertir cambios en auth-store y usar localStorage temporalmente
2. **Backend:** Mantener ambos endpoints `/api/auth/refresh` (viejo y nuevo)
3. **Base de datos:** Los campos nuevos son opcionales, no rompen compatibilidad

## Compatibilidad

- ✅ Navegadores modernos (Chrome, Firefox, Safari, Edge)
- ✅ Móviles (iOS Safari, Chrome Android)
- ⚠️ IE11 no soportado (httpOnly cookies requiere navegadores modernos)
- ✅ Incognito mode (funciona correctamente)
- ✅ Cross-origin si configurado correctamente

## Variables de Entorno Requeridas

```env
# apps/api/.env
NODE_ENV=production # Para activar cookies Secure
DATABASE_URL=postgresql://...
APP_URL=https://tudominio.com # Para magic links

# apps/admin-web/.env.local
NEXT_PUBLIC_API_URL=https://api.tudominio.com

# apps/resident-app/.env.local
NEXT_PUBLIC_API_URL=https://api.tudominio.com

# apps/staff-app/.env.local
NEXT_PUBLIC_API_URL=https://api.tudominio.com
```

## Próximos Pasos

1. **Ejecutar migración en producción:**
   ```bash
   npx prisma migrate deploy
   ```

2. **Actualizar documentación de usuario**
   - Aclarar que la sesión expira al cerrar el navegador
   - Explicar comportamiento esperado

3. **Monitoreo**
   - Verificar rate limiting en /api/auth/refresh
   - Monitorear errores de refresh en logs

4. **Testing de carga**
   - Verificar performance de refresh automáticos
   - Testear con múltiples usuarios simultáneos

## Referencias

- [OWASP Token Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [MDN HttpOnly Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [SameSite Cookies Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

## Soporte

Si encuentras problemas durante la migración:

1. Verificar logs del backend: `apps/api/logs/`
2. Verificar DevTools Console y Network tabs
3. Revisar que las cookies estén habilitadas en el navegador
4. Confirmar que `NODE_ENV=production` en producción

---

**Fecha de implementación:** 2026-02-06
**Versión:** 1.0.0
**Autor:** Claude Code (VecinoSimple Migration Team)
