/**
 * Staff App API Client
 *
 * Cliente HTTP configurado para la app de encargados.
 *
 * SEGURIDAD: Ya NO obtiene token de localStorage
 * El access token se setea desde AuthContext
 *
 * NOTA: El sync-manager.ts necesita acceso especial al token offline
 * - Usar useAuth() hook para obtener el token
 * - Para sync-manager, expondremos una función helper
 *
 * Usar para:
 * - Autenticación (/auth/me)
 * - Consultas mientras hay conexión
 *
 * NO usar para:
 * - sync-manager.ts (tiene lógica especial de offline sync)
 */
import { ApiClient } from '@vecinosimple/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = new ApiClient({
  baseUrl: API_BASE_URL,
  // ❌ NO usar getAccessToken desde localStorage
  // El access token se setea desde AuthContext
});

/**
 * Helper para sync-manager: Obtiene el token actual para operaciones offline
 * NOTA: Esta función es solo para sync-manager.ts
 * El resto de la app debe usar useAuth() hook
 */
export const getAccessTokenForSync = (): string | null => {
  if (globalThis.window === undefined) {
    return null;
  }

  // ✅ Obtener desde variable global que AuthContext expone
  return (globalThis as any).__STAFF_ACCESS_TOKEN__ ?? null;
};

export { ApiError } from '@vecinosimple/api-client';
export default apiClient;
