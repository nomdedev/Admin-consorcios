/**
 * React Query Provider
 * Configuración global de TanStack Query
 */

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Datos se consideran frescos por 5 minutos
            staleTime: 5 * 60 * 1000,
            // Reintentar 2 veces en caso de error
            retry: 2,
            // Refetch al volver a la pestaña
            refetchOnWindowFocus: true,
          },
          mutations: {
            // Reintentar 1 vez en caso de error
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
