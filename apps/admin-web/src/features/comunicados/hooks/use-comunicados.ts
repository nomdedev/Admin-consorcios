/**
 * Hooks de Comunicados
 * React Query hooks para gestión de comunicados y novedades
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

import type { 
  Comunicado, 
  PaginatedResponse,
} from '@/lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const comunicadosKeys = {
  all: ['comunicados'] as const,
  lists: () => [...comunicadosKeys.all, 'list'] as const,
  list: (consorcioId: string, filters?: Record<string, unknown>) => 
    [...comunicadosKeys.lists(), consorcioId, filters] as const,
  details: () => [...comunicadosKeys.all, 'detail'] as const,
  detail: (id: string) => [...comunicadosKeys.details(), id] as const,
  activos: (consorcioId: string) => [...comunicadosKeys.all, 'activos', consorcioId] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

interface FiltrosComunicado {
  importante?: boolean;
  soloActivos?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Hook para listar comunicados de un consorcio
 */
export function useComunicados(consorcioId: string | undefined, filtros?: FiltrosComunicado) {
  return useQuery({
    queryKey: comunicadosKeys.list(consorcioId!, filtros as Record<string, unknown>),
    queryFn: () => 
      apiClient.get<PaginatedResponse<Comunicado>>(`/comunicados`, {
        consorcioId,
        ...filtros,
      }),
    enabled: !!consorcioId,
  });
}

/**
 * Hook para obtener comunicados activos (vigentes)
 */
export function useComunicadosActivos(consorcioId: string | undefined) {
  return useQuery({
    queryKey: comunicadosKeys.activos(consorcioId!),
    queryFn: () => 
      apiClient.get<Comunicado[]>(`/comunicados/activos`, { consorcioId }),
    enabled: !!consorcioId,
  });
}

/**
 * Hook para obtener un comunicado por ID
 */
export function useComunicado(id: string | undefined) {
  return useQuery({
    queryKey: comunicadosKeys.detail(id!),
    queryFn: () => apiClient.get<Comunicado>(`/comunicados/${id}`),
    enabled: !!id,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

interface CreateComunicadoDto {
  consorcioId: string;
  titulo: string;
  contenido: string;
  importante?: boolean;
  publicarDesde?: string;
  publicarHasta?: string;
  enviarEmail?: boolean;
  enviarWhatsapp?: boolean;
}

interface UpdateComunicadoDto extends Partial<Omit<CreateComunicadoDto, 'consorcioId'>> {}

/**
 * Hook para crear un comunicado
 */
export function useCreateComunicado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateComunicadoDto) => 
      apiClient.post<Comunicado>('/comunicados', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: comunicadosKeys.list(variables.consorcioId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: comunicadosKeys.activos(variables.consorcioId) 
      });
    },
  });
}

/**
 * Hook para actualizar un comunicado
 */
export function useUpdateComunicado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateComunicadoDto }) => 
      apiClient.patch<Comunicado>(`/comunicados/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comunicadosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: comunicadosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: comunicadosKeys.all });
    },
  });
}

/**
 * Hook para eliminar un comunicado
 */
export function useDeleteComunicado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/comunicados/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: comunicadosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: comunicadosKeys.all });
    },
  });
}

/**
 * Hook para enviar notificaciones de un comunicado
 */
export function useEnviarNotificacionesComunicado() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, canales }: { id: string; canales: { email?: boolean; whatsapp?: boolean } }) => 
      apiClient.post<{ enviados: number }>(`/comunicados/${id}/enviar`, canales),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: comunicadosKeys.detail(id) });
    },
  });
}
