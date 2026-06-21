/**
 * Hooks de Consorcios
 * React Query hooks para gestión de consorcios
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { 
  Consorcio, 
  CreateConsorcioDto, 
  PaginatedResponse,
  UnidadFuncional,
} from '@/lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const consorciosKeys = {
  all: ['consorcios'] as const,
  lists: () => [...consorciosKeys.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...consorciosKeys.lists(), filters] as const,
  details: () => [...consorciosKeys.all, 'detail'] as const,
  detail: (id: string) => [...consorciosKeys.details(), id] as const,
  unidades: (consorcioId: string) => [...consorciosKeys.detail(consorcioId), 'unidades'] as const,
  stats: (consorcioId: string) => [...consorciosKeys.detail(consorcioId), 'stats'] as const,
  dashboardStats: () => [...consorciosKeys.all, 'dashboard-stats'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

interface FiltrosConsorcio {
  busqueda?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Hook para listar consorcios
 */
export function useConsorcios(filtros?: FiltrosConsorcio) {
  return useQuery({
    queryKey: consorciosKeys.list(filtros as Record<string, unknown>),
    queryFn: () => 
      apiClient.get<PaginatedResponse<Consorcio>>('/consorcios', {
        busqueda: filtros?.busqueda,
        activo: filtros?.activo,
        page: filtros?.page,
        limit: filtros?.limit,
      }),
  });
}

/**
 * Hook para obtener un consorcio por ID
 */
export function useConsorcio(id: string | undefined) {
  return useQuery({
    queryKey: consorciosKeys.detail(id!),
    queryFn: () => apiClient.get<Consorcio>(`/consorcios/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook para obtener unidades de un consorcio
 */
export function useUnidadesFuncionales(consorcioId: string | undefined, filtros?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: consorciosKeys.unidades(consorcioId!),
    queryFn: () => 
      apiClient.get<PaginatedResponse<UnidadFuncional>>(`/consorcios/${consorcioId}/unidades`, {
        page: filtros?.page,
        limit: filtros?.limit,
      }),
    enabled: !!consorcioId,
  });
}

/**
 * Tipo de respuesta de estadísticas del dashboard
 */
export interface DashboardStats {
  totalConsorcios: number;
  totalUnidades: number;
  recaudacionMes: number;
  unidadesConDeuda: number;
  porcentajeMorosidad: number;
}

/**
 * Hook para obtener estadísticas globales del dashboard
 */
export function useDashboardStats() {
  return useQuery({
    queryKey: consorciosKeys.dashboardStats(),
    queryFn: () => apiClient.get<DashboardStats>('/consorcios/dashboard/stats'),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Tipo de respuesta de estadísticas de un consorcio específico
 */
export interface ConsorcioStats {
  totalUnidades: number;
  unidadesConDeuda: number;
  porcentajeMorosidad: number;
  totalRecaudadoMes: number;
  totalGastosMes: number;
}

/**
 * Hook para obtener estadísticas de un consorcio específico
 */
export function useConsorcioStats(consorcioId: string | undefined) {
  return useQuery({
    queryKey: consorciosKeys.stats(consorcioId!),
    queryFn: () => apiClient.get<ConsorcioStats>(`/consorcios/${consorcioId}/estadisticas`),
    enabled: !!consorcioId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook para crear un consorcio
 */
export function useCreateConsorcio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateConsorcioDto) => 
      apiClient.post<Consorcio>('/consorcios', data),
    onSuccess: () => {
      // Invalidar lista de consorcios
      queryClient.invalidateQueries({ queryKey: consorciosKeys.lists() });
    },
  });
}

/**
 * Hook para actualizar un consorcio
 */
export function useUpdateConsorcio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateConsorcioDto> }) => 
      apiClient.patch<Consorcio>(`/consorcios/${id}`, data),
    onSuccess: (_, { id }) => {
      // Invalidar el consorcio específico y la lista
      queryClient.invalidateQueries({ queryKey: consorciosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: consorciosKeys.lists() });
    },
  });
}

/**
 * Hook para eliminar un consorcio (soft delete)
 */
export function useDeleteConsorcio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ mensaje: string }>(`/consorcios/${id}`),
    onSuccess: () => {
      // Invalidar lista de consorcios
      queryClient.invalidateQueries({ queryKey: consorciosKeys.lists() });
    },
  });
}
