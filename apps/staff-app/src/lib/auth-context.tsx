/**
 * Contexto de Autenticación para Staff App
 *
 * SEGURIDAD: Los tokens ya NO se persisten en localStorage
 * - Access token: Solo en memoria (React state)
 * - Refresh token: Cookie httpOnly (manejada por backend)
 *
 * NOTA: Staff App necesita soporte offline especial para sync-manager
 */

'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Configurar el callback de refresh en el apiClient
  useEffect(() => {
    (apiClient as any).onTokenRefresh = async () => {
      try {
        const success = await refreshSession();
        if (success) {
          return accessToken;
        }
        return null;
      } catch (error) {
        console.error('Error en onTokenRefresh:', error);
        return null;
      }
    };
  }, [accessToken]);

  const setAuth = useCallback((token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    setIsAuthenticated(true);
    apiClient.setAccessToken(token);
    // ❌ NO guardar en localStorage (vulnerable a XSS)
    // ✅ Exponer para sync-manager (offline support)
    if (globalThis.window !== undefined) {
      (globalThis as any).__STAFF_ACCESS_TOKEN__ = token;
    }
  }, []);

  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      // El refresh token está en cookie httpOnly
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Importante para enviar cookies
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      setAuth(data.accessToken, data.usuario);
      return true;
    } catch (error) {
      console.error('Error al refrescar sesión:', error);
      await logout();
      return false;
    }
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      // Llamar endpoint de logout para limpiar cookie
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      // Limpiar estado
      setAccessToken(null);
      setUser(null);
      setIsAuthenticated(false);
      apiClient.setAccessToken(null);
      // ❌ NO usar localStorage.removeItem
    }
  }, [accessToken]);

  // Verificar autenticación al montar (opcional)
  useEffect(() => {
    // Ya no verificamos localStorage porque no guardamos tokens allí
    setIsLoading(false);
  }, []);

  const value: AuthContextType = useMemo(() => ({
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    setAuth,
    logout,
    refreshSession,
  }), [user, accessToken, isLoading, isAuthenticated, setAuth, logout, refreshSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
