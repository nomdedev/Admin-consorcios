/**
 * Hooks de Gastos
 * React Query hooks para gestión de gastos y categorías
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  Gasto,
  CategoriaGasto,
  PaginatedResponse,
} from '@/lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const gastosKeys = {
  all: ['gastos'] as const,
  lists: () => [...gastosKeys.all, 'list'] as const,
  list: (consorcioId: string, filters?: Record<string, unknown>) => 
    [...gastosKeys.lists(), consorcioId, filters] as const,
  details: () => [...gastosKeys.all, 'detail'] as const,
  detail: (id: string) => [...gastosKeys.details(), id] as const,
  categorias: ['categorias-gasto'] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

interface FiltrosGasto {
  expensaId?: string;
  categoriaId?: string;
  esExtraordinario?: boolean;
  fechaDesde?: string;
  fechaHasta?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook para listar gastos de un consorcio
 */
export function useGastos(consorcioId: string | undefined, filtros?: FiltrosGasto) {
  return useQuery({
    queryKey: gastosKeys.list(consorcioId!, filtros as Record<string, unknown>),
    queryFn: () => 
      apiClient.get<PaginatedResponse<Gasto>>(`/gastos`, {
        consorcioId,
        ...filtros,
      }),
    enabled: !!consorcioId,
  });
}

/**
 * Hook para obtener un gasto por ID
 */
export function useGasto(id: string | undefined) {
  return useQuery({
    queryKey: gastosKeys.detail(id!),
    queryFn: () => apiClient.get<Gasto>(`/gastos/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook para listar categorías de gasto
 */
export function useCategoriasGasto() {
  return useQuery({
    queryKey: gastosKeys.categorias,
    queryFn: () => apiClient.get<CategoriaGasto[]>('/gastos/categorias'),
    staleTime: 1000 * 60 * 60, // 1 hora - categorías cambian poco
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

interface CreateGastoDto {
  consorcioId: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  categoriaId?: string;
  esExtraordinario?: boolean;
  esProrrateable?: boolean;
  tipoComprobante?: string;
  numeroComprobante?: string;
  caeAfip?: string;
  fechaComprobante?: string;
  proveedorId?: string;
  archivoUrl?: string;
  archivoNombre?: string;
  fechaGasto: string;
}

interface UpdateGastoDto extends Partial<CreateGastoDto> {
  expensaId?: string;
}

/**
 * Hook para crear un gasto
 */
export function useCreateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGastoDto) => 
      apiClient.post<Gasto>('/gastos', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: gastosKeys.list(variables.consorcioId) 
      });
    },
  });
}

/**
 * Hook para actualizar un gasto
 */
export function useUpdateGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGastoDto }) => 
      apiClient.patch<Gasto>(`/gastos/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: gastosKeys.lists() });
    },
  });
}

/**
 * Hook para eliminar un gasto
 */
export function useDeleteGasto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/gastos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.lists() });
    },
  });
}

/**
 * Hook para asignar un gasto a una expensa
 */
export function useAsignarGastoExpensa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ gastoId, expensaId }: { gastoId: string; expensaId: string }) => 
      apiClient.patch<Gasto>(`/gastos/${gastoId}`, { expensaId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gastosKeys.lists() });
    },
  });
}
