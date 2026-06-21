/**
 * Store de Autenticación con Zustand
 * Maneja el estado del usuario y tokens
 *
 * SEGURIDAD: Los tokens ya NO se persisten en localStorage
 * - Access token: Solo en memoria (React state)
 * - Refresh token: Cookie httpOnly (manejada por backend)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { apiClient } from '@/lib/api-client';

import type { Usuario, LoginResponse } from '@/lib/types';

interface AuthState {
  // Estado
  user: Usuario | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Acciones
  setAuth: (data: LoginResponse) => void;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  refreshSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      accessToken: null,
      isLoading: true,
      isAuthenticated: false,

      // Guardar datos de autenticación
      setAuth: (data: LoginResponse) => {
        // Configurar token en el cliente API
        apiClient.setAccessToken(data.accessToken);

        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      // Cerrar sesión
      logout: async () => {
        try {
          // Llamar endpoint de logout para limpiar cookie
          await apiClient.post('/auth/logout');
        } catch (error) {
          console.error('Error al cerrar sesión:', error);
        } finally {
          // Limpiar estado local
          apiClient.setAccessToken(null);

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      // Cambiar estado de carga
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Refrescar sesión usando refresh token de cookie
      refreshSession: async (): Promise<boolean> => {
        try {
          // El refresh token está en cookie httpOnly, no se envía explícitamente
          const response = await apiClient.post<LoginResponse>('/auth/refresh', {});

          get().setAuth(response);
          return true;
        } catch (error) {
          console.error('Error al refrescar sesión:', error);
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'vecinosimple-auth',
      storage: createJSONStorage(() => localStorage),
      // ✅ SEGURIDAD: Solo persistir usuario, NO tokens
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // NO persistir accessToken ni refreshToken
      }),
      onRehydrateStorage: () => (state) => {
        // Al rehidratar, NO configurar token (ya no existe)
        // El usuario deberá autenticarse nuevamente si recarga la página
        state?.setLoading(false);

        // Si hay un usuario guardado, intentar refrescar sesión
        if (state?.isAuthenticated && state?.user) {
          state.refreshSession();
        }
      },
    }
  )
);
