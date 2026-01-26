/**
 * Store de Autenticación con Zustand
 * Maneja el estado del usuario y tokens
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';
import type { Usuario, LoginResponse } from '@/lib/types';

interface AuthState {
  // Estado
  user: Usuario | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Acciones
  setAuth: (data: LoginResponse) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  refreshSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: true,
      isAuthenticated: false,

      // Guardar datos de autenticación
      setAuth: (data: LoginResponse) => {
        // Configurar token en el cliente API
        apiClient.setAccessToken(data.accessToken);
        
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      // Cerrar sesión
      logout: () => {
        apiClient.setAccessToken(null);
        
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      // Cambiar estado de carga
      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // Refrescar sesión con refresh token
      refreshSession: async (): Promise<boolean> => {
        const { refreshToken } = get();
        
        if (!refreshToken) {
          get().logout();
          return false;
        }

        try {
          const response = await apiClient.post<LoginResponse>('/auth/refresh', {
            refreshToken,
          });
          
          get().setAuth(response);
          return true;
        } catch {
          get().logout();
          return false;
        }
      },
    }),
    {
      name: 'vecinosimple-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Al rehidratar, configurar el token en el cliente
        if (state?.accessToken) {
          apiClient.setAccessToken(state.accessToken);
        }
        // Marcar como no cargando
        state?.setLoading(false);
      },
    }
  )
);
