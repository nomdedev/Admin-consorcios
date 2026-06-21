// Feature: Notificaciones
// Hooks de TanStack Query para gestión de notificaciones

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const notificacionesKeys = {
  all: ['notificaciones'] as const,
  lists: () => [...notificacionesKeys.all, 'list'] as const,
  list: (filters?: NotificacionesFilters) => [...notificacionesKeys.lists(), filters] as const,
  contador: () => [...notificacionesKeys.all, 'contador'] as const,
  details: () => [...notificacionesKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificacionesKeys.details(), id] as const,
}

// ============================================================================
// TYPES
// ============================================================================

export type TipoNotificacion =
  | 'PAGO'
  | 'EXPENSA'
  | 'RECLAMO'
  | 'COMUNICADO'
  | 'ASAMBLEA'
  | 'VENCIMIENTO'
  | 'EMERGENCIA'
  | 'SISTEMA'

export interface Notificacion {
  id: string
  usuarioId: string
  titulo: string
  mensaje: string
  tipo: TipoNotificacion
  referenciaId?: string
  referenciaTipo?: string
  leida: boolean
  createdAt: string
}

export interface NotificacionesFilters {
  leida?: boolean
  tipo?: TipoNotificacion
  page?: number
  limit?: number
}

export interface ContadorNotificaciones {
  total: number
  noLeidas: number
}

export interface PaginatedNotificaciones {
  data: Notificacion[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ============================================================================
// QUERY HOOKS
// ============================================================================

/**
 * Obtener lista de notificaciones del usuario actual
 */
export function useNotificaciones(params?: NotificacionesFilters) {
  return useQuery({
    queryKey: notificacionesKeys.list(params),
    queryFn: () => apiClient.get<PaginatedNotificaciones>('/notificaciones', params as Record<string, string | number | boolean | undefined>),
    staleTime: 30 * 1000, // 30 segundos (data más fresca para notificaciones)
  })
}

/**
 * Obtener contador de notificaciones no leídas
 * Se usa para el badge en el header/navbar
 */
export function useContadorNotificaciones() {
  return useQuery({
    queryKey: notificacionesKeys.contador(),
    queryFn: () => apiClient.get<ContadorNotificaciones>('/notificaciones/contador'),
    staleTime: 10 * 1000, // 10 segundos
    refetchInterval: 60 * 1000, // Refetch cada minuto
  })
}

/**
 * Obtener detalle de una notificación específica
 */
export function useNotificacion(id: string) {
  return useQuery({
    queryKey: notificacionesKeys.detail(id),
    queryFn: () => apiClient.get<Notificacion>(`/notificaciones/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Marcar una notificación como leída
 */
export function useMarcarLeida() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.patch(`/notificaciones/${id}/leer`),
    onSuccess: () => {
      // Invalidar lista y contador
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.contador() })
    },
  })
}

/**
 * Marcar todas las notificaciones como leídas
 */
export function useMarcarTodasLeidas() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.patch('/notificaciones/leer-todas'),
    onSuccess: () => {
      // Invalidar lista y contador
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.contador() })
    },
  })
}

/**
 * Eliminar una notificación
 */
export function useEliminarNotificacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/notificaciones/${id}`),
    onSuccess: () => {
      // Invalidar lista y contador
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.contador() })
    },
  })
}

/**
 * Limpiar notificaciones leídas antiguas (>90 días)
 */
export function useLimpiarNotificaciones() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => apiClient.delete('/notificaciones/limpiar'),
    onSuccess: () => {
      // Invalidar lista y contador
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.lists() })
      queryClient.invalidateQueries({ queryKey: notificacionesKeys.contador() })
    },
  })
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtener configuración visual según tipo de notificación
 */
export function getNotificacionConfig(tipo: TipoNotificacion) {
  const configs: Record<TipoNotificacion, { color: string; icon: string; label: string }> = {
    PAGO: { color: 'green', icon: 'CreditCard', label: 'Pago' },
    EXPENSA: { color: 'blue', icon: 'FileText', label: 'Expensa' },
    RECLAMO: { color: 'orange', icon: 'MessageCircle', label: 'Reclamo' },
    COMUNICADO: { color: 'purple', icon: 'Bell', label: 'Comunicado' },
    ASAMBLEA: { color: 'indigo', icon: 'Users', label: 'Asamblea' },
    VENCIMIENTO: { color: 'yellow', icon: 'Clock', label: 'Vencimiento' },
    EMERGENCIA: { color: 'red', icon: 'AlertTriangle', label: 'Emergencia' },
    SISTEMA: { color: 'gray', icon: 'Settings', label: 'Sistema' },
  }
  return configs[tipo] || configs.SISTEMA
}

/**
 * Obtener la URL de destino según la referencia
 */
export function getNotificacionUrl(notificacion: Notificacion): string | null {
  if (!notificacion.referenciaId || !notificacion.referenciaTipo) return null

  const routes: Record<string, string> = {
    Pago: '/pagos',
    Expensa: '/expensas',
    Ticket: '/tickets',
    Comunicado: '/comunicados',
    Asamblea: '/asambleas',
  }

  const baseRoute = routes[notificacion.referenciaTipo]
  if (!baseRoute) return null

  return `${baseRoute}/${notificacion.referenciaId}`
}
