// Feature: Amenities
// Hooks de TanStack Query para gestión de amenities y reservas

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { apiClient } from '@/lib/api-client'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const amenitiesKeys = {
  all: ['amenities'] as const,
  lists: () => [...amenitiesKeys.all, 'list'] as const,
  list: (consorcioId?: string) => [...amenitiesKeys.lists(), consorcioId] as const,
  details: () => [...amenitiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...amenitiesKeys.details(), id] as const,
  disponibilidad: (amenityId: string, fecha: string) =>
    [...amenitiesKeys.all, 'disponibilidad', amenityId, fecha] as const,
  misStats: () => [...amenitiesKeys.all, 'mis-stats'] as const,
}

export const reservasKeys = {
  all: ['reservas'] as const,
  lists: () => [...reservasKeys.all, 'list'] as const,
  list: (filters?: ReservasFilters) => [...reservasKeys.lists(), filters] as const,
  details: () => [...reservasKeys.all, 'detail'] as const,
  detail: (id: string) => [...reservasKeys.details(), id] as const,
}

// ============================================================================
// TYPES
// ============================================================================

export interface Amenity {
  id: string
  consorcioId: string
  nombre: string
  descripcion?: string
  capacidad?: number
  requiereAprobacion: boolean
  anticipacionMinima: number // horas
  anticipacionMaxima: number // horas
  duracionMaxima: number // horas
  costoReserva?: number
  activo: boolean
  createdAt: string
  updatedAt: string
  // Relaciones
  _count?: {
    reservas: number
    reglas: number
  }
}

export interface CreateAmenityDto {
  consorcioId: string
  nombre: string
  descripcion?: string
  capacidad?: number
  requiereAprobacion?: boolean
  anticipacionMinima?: number
  anticipacionMaxima?: number
  duracionMaxima?: number
  costoReserva?: number
}

export interface UpdateAmenityDto {
  nombre?: string
  descripcion?: string
  capacidad?: number
  requiereAprobacion?: boolean
  anticipacionMinima?: number
  anticipacionMaxima?: number
  duracionMaxima?: number
  costoReserva?: number
  activo?: boolean
}

export type EstadoReserva =
  | 'PENDIENTE'
  | 'APROBADA'
  | 'RECHAZADA'
  | 'CANCELADA'
  | 'COMPLETADA'
  | 'NO_SHOW'

export interface Reserva {
  id: string
  amenityId: string
  usuarioId: string
  fechaInicio: string
  fechaFin: string
  motivo?: string
  aprobada?: boolean
  estado: EstadoReserva
  createdAt: string
  updatedAt: string
  // Relaciones
  amenity?: Amenity
  usuario?: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
}

export interface CreateReservaDto {
  amenityId: string
  fechaInicio: string
  fechaFin: string
  motivo?: string
}

export interface ReservasFilters {
  amenityId?: string
  consorcioId?: string
  usuarioId?: string
  estado?: EstadoReserva
  fechaDesde?: string
  fechaHasta?: string
  page?: number
  limit?: number
}

export interface PaginatedReservas {
  data: Reserva[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface DisponibilidadSlot {
  inicio: string
  fin: string
  disponible: boolean
  reservaId?: string
}

export interface DisponibilidadResponse {
  fecha: string
  amenity: Amenity
  slots: DisponibilidadSlot[]
}

export interface MisStatsAmenities {
  totalReservas: number
  reservasAprobadas: number
  reservasPendientes: number
  reservasCanceladas: number
  proximaReserva?: Reserva
  amenitiesMasUsados: Array<{
    amenity: Amenity
    cantidad: number
  }>
}

// ============================================================================
// QUERY HOOKS - AMENITIES
// ============================================================================

/**
 * Obtener lista de amenities de un consorcio
 */
export function useAmenities(consorcioId?: string) {
  return useQuery({
    queryKey: amenitiesKeys.list(consorcioId),
    queryFn: () =>
      apiClient.get<Amenity[]>('/amenities', consorcioId ? { consorcioId } : undefined),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!consorcioId,
  })
}

/**
 * Obtener detalle de un amenity
 */
export function useAmenity(id: string) {
  return useQuery({
    queryKey: amenitiesKeys.detail(id),
    queryFn: () => apiClient.get<Amenity>(`/amenities/${id}`),
    enabled: !!id,
  })
}

/**
 * Consultar disponibilidad de un amenity en una fecha
 */
export function useDisponibilidad(amenityId: string, fecha: string) {
  return useQuery({
    queryKey: amenitiesKeys.disponibilidad(amenityId, fecha),
    queryFn: () =>
      apiClient.get<DisponibilidadResponse>('/amenities/disponibilidad', { amenityId, fecha }),
    enabled: !!amenityId && !!fecha,
    staleTime: 60 * 1000, // 1 minuto
  })
}

/**
 * Obtener estadísticas del usuario actual
 */
export function useMisStatsAmenities() {
  return useQuery({
    queryKey: amenitiesKeys.misStats(),
    queryFn: () => apiClient.get<MisStatsAmenities>('/amenities/mis-stats'),
    staleTime: 5 * 60 * 1000,
  })
}

// ============================================================================
// MUTATION HOOKS - AMENITIES
// ============================================================================

/**
 * Crear un nuevo amenity
 */
export function useCreateAmenity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAmenityDto) => apiClient.post<Amenity>('/amenities', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: amenitiesKeys.list(variables.consorcioId) })
    },
  })
}

/**
 * Actualizar un amenity
 */
export function useUpdateAmenity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAmenityDto }) =>
      apiClient.patch<Amenity>(`/amenities/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: amenitiesKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: amenitiesKeys.lists() })
    },
  })
}

/**
 * Eliminar un amenity
 */
export function useDeleteAmenity() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/amenities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: amenitiesKeys.lists() })
    },
  })
}

// ============================================================================
// QUERY HOOKS - RESERVAS
// ============================================================================

/**
 * Obtener lista de reservas con filtros
 */
export function useReservas(params?: ReservasFilters) {
  return useQuery({
    queryKey: reservasKeys.list(params),
    queryFn: () => apiClient.get<PaginatedReservas>('/amenities/reservas/listar', params as Record<string, string | number | boolean | undefined>),
    staleTime: 60 * 1000, // 1 minuto
  })
}

/**
 * Obtener detalle de una reserva
 */
export function useReserva(id: string) {
  return useQuery({
    queryKey: reservasKeys.detail(id),
    queryFn: () => apiClient.get<Reserva>(`/amenities/reservas/${id}`),
    enabled: !!id,
  })
}

// ============================================================================
// MUTATION HOOKS - RESERVAS
// ============================================================================

/**
 * Crear una nueva reserva
 */
export function useCreateReserva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateReservaDto) =>
      apiClient.post<Reserva>('/amenities/reservas', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.lists() })
      const amenityId = data.amenityId as string
      const fechaInicio = data.fechaInicio as string
      if (amenityId && fechaInicio) {
        const fecha = fechaInicio.split('T')[0] ?? fechaInicio
        queryClient.invalidateQueries({
          queryKey: amenitiesKeys.disponibilidad(amenityId, fecha),
        })
      }
      queryClient.invalidateQueries({ queryKey: amenitiesKeys.misStats() })
    },
  })
}

/**
 * Aprobar o rechazar una reserva
 */
export function useProcesarReserva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, aprobada }: { id: string; aprobada: boolean }) =>
      apiClient.patch<Reserva>(`/amenities/reservas/${id}/aprobar`, { aprobada }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: reservasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: amenitiesKeys.misStats() })
    },
  })
}

/**
 * Cancelar una reserva
 */
export function useCancelarReserva() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/amenities/reservas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reservasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: amenitiesKeys.misStats() })
    },
  })
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Obtener configuración visual según estado de reserva
 */
export function getEstadoReservaConfig(estado: EstadoReserva) {
  const configs: Record<EstadoReserva, { color: string; label: string; bgColor: string }> = {
    PENDIENTE: { color: 'yellow', label: 'Pendiente', bgColor: 'bg-yellow-100 text-yellow-800' },
    APROBADA: { color: 'green', label: 'Aprobada', bgColor: 'bg-green-100 text-green-800' },
    RECHAZADA: { color: 'red', label: 'Rechazada', bgColor: 'bg-red-100 text-red-800' },
    CANCELADA: { color: 'gray', label: 'Cancelada', bgColor: 'bg-gray-100 text-gray-800' },
    COMPLETADA: { color: 'blue', label: 'Completada', bgColor: 'bg-blue-100 text-blue-800' },
    NO_SHOW: { color: 'orange', label: 'No Show', bgColor: 'bg-orange-100 text-orange-800' },
  }
  return configs[estado] || configs.PENDIENTE
}

/**
 * Verificar si una reserva puede ser cancelada
 */
export function puedesCancelarReserva(reserva: Reserva): boolean {
  const estadosCancelables: EstadoReserva[] = ['PENDIENTE', 'APROBADA']
  return estadosCancelables.includes(reserva.estado)
}

/**
 * Formatear duración de reserva
 */
export function formatDuracionReserva(fechaInicio: string, fechaFin: string): string {
  const inicio = new Date(fechaInicio)
  const fin = new Date(fechaFin)
  const diffMs = fin.getTime() - inicio.getTime()
  const diffHoras = Math.round(diffMs / (1000 * 60 * 60))

  if (diffHoras < 1) {
    const diffMinutos = Math.round(diffMs / (1000 * 60))
    return `${diffMinutos} minutos`
  }
  if (diffHoras === 1) {
    return '1 hora'
  }
  return `${diffHoras} horas`
}
