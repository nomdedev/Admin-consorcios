/**
 * Hooks de autenticación
 */

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { apiClient } from '@/lib/api-client';

import { useAuthStore } from '../store/auth-store';

import type { LoginResponse } from '@/lib/types';

interface LoginCredentials {
  email: string;
  password?: string;
}

interface MagicLinkRequest {
  email: string;
}

interface MagicLinkVerify {
  token: string;
}

/**
 * Hook para login con email/password
 */
export function useLogin() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiClient.post<LoginResponse>('/auth/login', credentials);
      return response;
    },
    onSuccess: (data) => {
      setAuth(data);
      router.push('/');
    },
  });
}

/**
 * Hook para solicitar magic link
 */
export function useRequestMagicLink() {
  return useMutation({
    mutationFn: async (data: MagicLinkRequest) => {
      const response = await apiClient.post<{ mensaje: string }>('/auth/magic-link', data);
      return response;
    },
  });
}

/**
 * Hook para verificar magic link
 */
export function useVerifyMagicLink() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (data: MagicLinkVerify) => {
      const response = await apiClient.post<LoginResponse>('/auth/magic-link/verify', data);
      return response;
    },
    onSuccess: (data) => {
      setAuth(data);
      router.push('/');
    },
  });
}

/**
 * Hook para logout
 */
export function useLogout() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      // Opcionalmente invalidar token en el servidor
      try {
        await apiClient.post('/auth/logout');
      } catch {
        // Ignorar errores, el logout local siempre debe funcionar
      }
    },
    onSettled: () => {
      logout();
      router.push('/login');
    },
  });
}

/**
 * Hook para obtener estado de autenticación
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  return {
    user,
    isAuthenticated,
    isLoading,
    consorcioId: user?.consorcioActivo ?? null,
    isAdmin: user?.rol === 'ADMINISTRADOR' || user?.rol === 'SUPER_ADMIN',
    isSuperAdmin: user?.rol === 'SUPER_ADMIN',
    isStaff: user?.rol === 'ADMIN_STAFF',
  };
}
