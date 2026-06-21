/**
 * Hooks de Expensas
 * React Query hooks para gestión de liquidaciones
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { 
  Expensa, 
  DetalleExpensa,
  PaginatedResponse,
  EstadoExpensa,
} from '@/lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const expensasKeys = {
  all: ['expensas'] as const,
  lists: () => [...expensasKeys.all, 'list'] as const,
  list: (consorcioId: string, filters?: Record<string, unknown>) => 
    [...expensasKeys.lists(), consorcioId, filters] as const,
  details: () => [...expensasKeys.all, 'detail'] as const,
  detail: (id: string) => [...expensasKeys.details(), id] as const,
  detalles: (expensaId: string) => [...expensasKeys.detail(expensaId), 'detalles'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

interface FiltrosExpensa {
  estado?: EstadoExpensa;
  periodo?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook para listar expensas de un consorcio
 */
export function useExpensas(consorcioId: string | undefined, filtros?: FiltrosExpensa) {
  return useQuery({
    queryKey: expensasKeys.list(consorcioId!, filtros as Record<string, unknown>),
    queryFn: () => 
      apiClient.get<PaginatedResponse<Expensa>>(`/expensas`, {
        consorcioId,
        estado: filtros?.estado,
        periodo: filtros?.periodo,
        page: filtros?.page,
        limit: filtros?.limit,
      }),
    enabled: !!consorcioId,
  });
}

/**
 * Hook para obtener una expensa por ID
 */
export function useExpensa(id: string | undefined) {
  return useQuery({
    queryKey: expensasKeys.detail(id!),
    queryFn: () => apiClient.get<Expensa>(`/expensas/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook para obtener detalles de expensa por UF
 */
export function useDetallesExpensa(expensaId: string | undefined) {
  return useQuery({
    queryKey: expensasKeys.detalles(expensaId!),
    queryFn: () => 
      apiClient.get<DetalleExpensa[]>(`/expensas/${expensaId}/detalles`),
    enabled: !!expensaId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

interface CreateExpensaDto {
  consorcioId: string;
  periodo: string;
  fechaVencimiento: string;
  fechaSegundoVencimiento?: string;
  recargoSegundoVencimiento?: number;
  observaciones?: string;
}

interface LiquidarExpensaDto {
  gastosIds?: string[];
  fondoReserva?: number;
}

/**
 * Hook para crear una expensa (borrador)
 */
export function useCreateExpensa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpensaDto) => 
      apiClient.post<Expensa>('/expensas', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: expensasKeys.list(variables.consorcioId) 
      });
    },
  });
}

/**
 * Hook para liquidar una expensa (calcular prorrateo)
 */
export function useLiquidarExpensa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LiquidarExpensaDto }) => 
      apiClient.post<Expensa>(`/expensas/${id}/liquidar`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: expensasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expensasKeys.lists() });
    },
  });
}

/**
 * Hook para publicar una expensa
 */
export function usePublicarExpensa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      apiClient.post<Expensa>(`/expensas/${id}/publicar`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: expensasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expensasKeys.lists() });
    },
  });
}

/**
 * Hook para cerrar una expensa (inmutable)
 */
export function useCerrarExpensa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => 
      apiClient.post<Expensa>(`/expensas/${id}/cerrar`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: expensasKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: expensasKeys.lists() });
    },
  });
}
