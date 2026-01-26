/**
 * Hooks de Tickets
 * React Query hooks para gestión de reclamos y mantenimiento
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { 
  Ticket, 
  ComentarioTicket,
  PaginatedResponse,
  EstadoTicket,
  PrioridadTicket,
} from '@/lib/types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const ticketsKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketsKeys.all, 'list'] as const,
  list: (consorcioId: string, filters?: Record<string, unknown>) => 
    [...ticketsKeys.lists(), consorcioId, filters] as const,
  details: () => [...ticketsKeys.all, 'detail'] as const,
  detail: (id: string) => [...ticketsKeys.details(), id] as const,
  comentarios: (ticketId: string) => [...ticketsKeys.detail(ticketId), 'comentarios'] as const,
  stats: (consorcioId: string) => [...ticketsKeys.all, 'stats', consorcioId] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

interface FiltrosTicket {
  estado?: EstadoTicket;
  prioridad?: PrioridadTicket;
  asignadoId?: string;
  page?: number;
  limit?: number;
}

interface TicketStats {
  total: number;
  abiertos: number;
  enProgreso: number;
  resueltos: number;
  promedioResolucionHoras: number;
}

/**
 * Hook para listar tickets de un consorcio
 */
export function useTickets(consorcioId: string | undefined, filtros?: FiltrosTicket) {
  return useQuery({
    queryKey: ticketsKeys.list(consorcioId!, filtros as Record<string, unknown>),
    queryFn: () => 
      apiClient.get<PaginatedResponse<Ticket>>(`/tickets`, {
        consorcioId,
        ...filtros,
      }),
    enabled: !!consorcioId,
  });
}

/**
 * Hook para obtener un ticket por ID
 */
export function useTicket(id: string | undefined) {
  return useQuery({
    queryKey: ticketsKeys.detail(id!),
    queryFn: () => apiClient.get<Ticket>(`/tickets/${id}`),
    enabled: !!id,
  });
}

/**
 * Hook para obtener comentarios de un ticket
 */
export function useComentariosTicket(ticketId: string | undefined) {
  return useQuery({
    queryKey: ticketsKeys.comentarios(ticketId!),
    queryFn: () => apiClient.get<ComentarioTicket[]>(`/tickets/${ticketId}/comentarios`),
    enabled: !!ticketId,
  });
}

/**
 * Hook para obtener estadísticas de tickets
 */
export function useTicketStats(consorcioId: string | undefined) {
  return useQuery({
    queryKey: ticketsKeys.stats(consorcioId!),
    queryFn: () => apiClient.get<TicketStats>(`/tickets/stats`, { consorcioId }),
    enabled: !!consorcioId,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

interface CreateTicketDto {
  consorcioId: string;
  titulo: string;
  descripcion: string;
  ubicacion?: string;
  prioridad?: PrioridadTicket;
}

interface UpdateTicketDto {
  titulo?: string;
  descripcion?: string;
  ubicacion?: string;
  prioridad?: PrioridadTicket;
  estado?: EstadoTicket;
  asignadoId?: string | null;
}

interface CreateComentarioDto {
  contenido: string;
  esInterno?: boolean;
}

/**
 * Hook para crear un ticket
 */
export function useCreateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTicketDto) => 
      apiClient.post<Ticket>('/tickets', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ticketsKeys.list(variables.consorcioId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: ticketsKeys.stats(variables.consorcioId) 
      });
    },
  });
}

/**
 * Hook para actualizar un ticket
 */
export function useUpdateTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTicketDto }) => 
      apiClient.patch<Ticket>(`/tickets/${id}`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
    },
  });
}

/**
 * Hook para asignar un ticket
 */
export function useAsignarTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, usuarioId }: { ticketId: string; usuarioId: string | null }) => 
      apiClient.patch<Ticket>(`/tickets/${ticketId}/asignar`, { asignadoId: usuarioId }),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
    },
  });
}

/**
 * Hook para cambiar estado de un ticket
 */
export function useCambiarEstadoTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, estado }: { ticketId: string; estado: EstadoTicket }) => 
      apiClient.patch<Ticket>(`/tickets/${ticketId}`, { estado }),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
    },
  });
}

/**
 * Hook para agregar comentario a un ticket
 */
export function useAddComentarioTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ticketId, data }: { ticketId: string; data: CreateComentarioDto }) => 
      apiClient.post<ComentarioTicket>(`/tickets/${ticketId}/comentarios`, data),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.comentarios(ticketId) });
      queryClient.invalidateQueries({ queryKey: ticketsKeys.detail(ticketId) });
    },
  });
}

/**
 * Hook para eliminar un ticket
 */
export function useDeleteTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.delete<void>(`/tickets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketsKeys.lists() });
    },
  });
}
