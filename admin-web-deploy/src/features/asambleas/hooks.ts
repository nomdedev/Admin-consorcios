// Feature: Asambleas
// Hooks de TanStack Query para gestión de asambleas, votaciones y actas

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const asambleasKeys = {
  all: ['asambleas'] as const,
  lists: () => [...asambleasKeys.all, 'list'] as const,
  list: (consorcioId?: string, filters?: AsambleasFilters) =>
    [...asambleasKeys.lists(), consorcioId, filters] as const,
  details: () => [...asambleasKeys.all, 'detail'] as const,
  detail: (id: string) => [...asambleasKeys.details(), id] as const,
  quorum: (asambleaId: string) =>
    [...asambleasKeys.all, 'quorum', asambleaId] as const,
  asistencia: (asambleaId: string) =>
    [...asambleasKeys.all, 'asistencia', asambleaId] as const,
  resultadoVotacion: (puntoId: string) =>
    [...asambleasKeys.all, 'resultado', puntoId] as const,
  miVoto: (puntoId: string) =>
    [...asambleasKeys.all, 'mi-voto', puntoId] as const,
}

// ============================================================================
// TYPES
// ============================================================================

export type EstadoAsamblea = 
  | 'PROGRAMADA' 
  | 'EN_CURSO' 
  | 'FINALIZADA' 
  | 'CANCELADA'

export type TipoVoto = 'A_FAVOR' | 'EN_CONTRA' | 'ABSTENCION'

export interface PuntoOrden {
  id: string
  orden: number
  titulo: string
  descripcion: string | null
  requiereVotacion: boolean
  mayoriaRequerida: number | null
  resultadoVotacion?: ResultadoVotacion
}

export interface Asistencia {
  usuarioId: string
  presente: boolean
  representadoPor: string | null
  horaRegistro: string | null
  usuario?: {
    id: string
    nombre: string
    apellido: string
  }
  coeficiente?: number
}

export interface Quorum {
  requerido: number
  actual: number
  alcanzado: boolean
  presentes: number
  totalPropietarios: number
}

export interface Asamblea {
  id: string
  consorcioId: string
  titulo: string
  descripcion: string | null
  fecha: string
  lugar: string | null
  linkVirtual: string | null
  estado: EstadoAsamblea
  quorumRequerido: number
  actaUrl: string | null
  actaHash?: string
  createdAt: string
  updatedAt?: string
  // Relaciones
  puntosOrden?: PuntoOrden[]
  asistencias?: Asistencia[]
  quorum?: Quorum
}

export interface CreateAsambleaDto {
  consorcioId: string
  titulo: string
  descripcion?: string
  fecha: string
  lugar?: string
  linkVirtual?: string
  quorumRequerido: number
}

export interface UpdateAsambleaDto {
  titulo?: string
  descripcion?: string
  fecha?: string
  lugar?: string
  linkVirtual?: string
  quorumRequerido?: number
}

export interface CreatePuntoOrdenDto {
  orden: number
  titulo: string
  descripcion?: string
  requiereVotacion?: boolean
  mayoriaRequerida?: number
}

export interface UpdatePuntoOrdenDto {
  orden?: number
  titulo?: string
  descripcion?: string
  requiereVotacion?: boolean
  mayoriaRequerida?: number
}

export interface RegistrarAsistenciaDto {
  usuarioId: string
  presente: boolean
  representadoPor?: string
  poderUrl?: string
}

export interface EmitirVotoDto {
  voto: TipoVoto
}

export interface ResultadoVotacion {
  puntoOrdenId: string
  titulo: string
  aFavor: number
  enContra: number
  abstenciones: number
  totalVotos: number
  totalCoeficiente: number
  porcentajeAFavor: number
  mayoriaRequerida: number
  aprobado: boolean | null
  votos?: {
    usuarioId: string
    nombre: string
    voto: TipoVoto
    coeficiente: number
  }[]
}

export interface MiVoto {
  puntoOrdenId: string
  voto: TipoVoto
  timestampVoto: string
}

export interface GenerarActaDto {
  observaciones?: string
}

export interface AsambleasFilters {
  estado?: EstadoAsamblea
  fechaDesde?: string
  fechaHasta?: string
  page?: number
  limit?: number
}

export interface PaginatedAsambleas {
  data: Asamblea[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ============================================================================
// ASAMBLEAS HOOKS
// ============================================================================

/**
 * Lista asambleas del consorcio con filtros y paginación
 */
export function useAsambleas(consorcioId?: string, filters?: AsambleasFilters) {
  return useQuery({
    queryKey: asambleasKeys.list(consorcioId, filters),
    queryFn: async (): Promise<PaginatedAsambleas> => {
      const params = new URLSearchParams()
      if (consorcioId) params.append('consorcioId', consorcioId)
      if (filters?.estado) params.append('estado', filters.estado)
      if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
      if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      return apiClient.get<PaginatedAsambleas>(`/asambleas?${params.toString()}`)
    },
    enabled: !!consorcioId,
    staleTime: 30 * 1000, // 30 segundos
  })
}

/**
 * Obtiene el detalle de una asamblea con sus puntos y asistencia
 */
export function useAsamblea(id: string, consorcioId?: string) {
  return useQuery({
    queryKey: asambleasKeys.detail(id),
    queryFn: () => apiClient.get<Asamblea>(`/asambleas/${id}?consorcioId=${consorcioId}`),
    enabled: !!id && !!consorcioId,
    staleTime: 15 * 1000, // 15 segundos - más fresco durante la asamblea
  })
}

/**
 * Crea una nueva asamblea
 */
export function useCreateAsamblea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAsambleaDto) =>
      apiClient.post<Asamblea>('/asambleas', data),
    onSuccess: (newAsamblea) => {
      queryClient.invalidateQueries({ queryKey: asambleasKeys.lists() })
      queryClient.setQueryData(
        asambleasKeys.detail(newAsamblea.id),
        newAsamblea
      )
    },
  })
}

/**
 * Actualiza una asamblea programada
 */
export function useUpdateAsamblea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      consorcioId,
      data,
    }: {
      id: string
      consorcioId: string
      data: UpdateAsambleaDto
    }) => apiClient.patch<Asamblea>(
        `/asambleas/${id}?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: (updatedAsamblea) => {
      queryClient.invalidateQueries({ queryKey: asambleasKeys.lists() })
      queryClient.setQueryData(
        asambleasKeys.detail(updatedAsamblea.id),
        updatedAsamblea
      )
    },
  })
}

// ============================================================================
// CAMBIOS DE ESTADO
// ============================================================================

/**
 * Inicia una asamblea (verifica quórum)
 */
export function useIniciarAsamblea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      consorcioId,
    }: {
      id: string
      consorcioId: string
    }) => apiClient.post<Asamblea>(
        `/asambleas/${id}/iniciar?consorcioId=${consorcioId}`
      ),
    onSuccess: (asamblea) => {
      queryClient.invalidateQueries({ queryKey: asambleasKeys.lists() })
      queryClient.setQueryData(asambleasKeys.detail(asamblea.id), asamblea)
    },
  })
}

/**
 * Finaliza una asamblea en curso
 */
export function useFinalizarAsamblea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      consorcioId,
    }: {
      id: string
      consorcioId: string
    }) => apiClient.post<Asamblea>(
        `/asambleas/${id}/finalizar?consorcioId=${consorcioId}`
      ),
    onSuccess: (asamblea) => {
      queryClient.invalidateQueries({ queryKey: asambleasKeys.lists() })
      queryClient.setQueryData(asambleasKeys.detail(asamblea.id), asamblea)
    },
  })
}

/**
 * Cancela una asamblea
 */
export function useCancelarAsamblea() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      consorcioId,
    }: {
      id: string
      consorcioId: string
    }) => apiClient.post<Asamblea>(
        `/asambleas/${id}/cancelar?consorcioId=${consorcioId}`
      ),
    onSuccess: (asamblea) => {
      queryClient.invalidateQueries({ queryKey: asambleasKeys.lists() })
      queryClient.setQueryData(asambleasKeys.detail(asamblea.id), asamblea)
    },
  })
}

// ============================================================================
// PUNTOS DE ORDEN DEL DÍA
// ============================================================================

/**
 * Agrega un punto al orden del día
 */
export function useAgregarPuntoOrden() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      asambleaId,
      consorcioId,
      data,
    }: {
      asambleaId: string
      consorcioId: string
      data: CreatePuntoOrdenDto
    }) => apiClient.post<PuntoOrden>(
        `/asambleas/${asambleaId}/puntos?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.detail(variables.asambleaId),
      })
    },
  })
}

/**
 * Actualiza un punto del orden del día
 */
export function useActualizarPuntoOrden() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      asambleaId,
      puntoId,
      consorcioId,
      data,
    }: {
      asambleaId: string
      puntoId: string
      consorcioId: string
      data: UpdatePuntoOrdenDto
    }) => apiClient.patch<PuntoOrden>(
        `/asambleas/${asambleaId}/puntos/${puntoId}?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.detail(variables.asambleaId),
      })
    },
  })
}

/**
 * Elimina un punto del orden del día
 */
export function useEliminarPuntoOrden() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      asambleaId,
      puntoId,
      consorcioId,
    }: {
      asambleaId: string
      puntoId: string
      consorcioId: string
    }): Promise<void> => {
      await apiClient.delete(
        `/asambleas/${asambleaId}/puntos/${puntoId}?consorcioId=${consorcioId}`
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.detail(variables.asambleaId),
      })
    },
  })
}

// ============================================================================
// ASISTENCIA Y QUÓRUM
// ============================================================================

/**
 * Obtiene la lista de asistencia de una asamblea
 */
export function useAsistencia(asambleaId: string, consorcioId?: string) {
  return useQuery({
    queryKey: asambleasKeys.asistencia(asambleaId),
    queryFn: () => apiClient.get<Asistencia[]>(
        `/asambleas/${asambleaId}/asistencia?consorcioId=${consorcioId}`
      ),
    enabled: !!asambleaId && !!consorcioId,
    staleTime: 10 * 1000, // 10 segundos - muy fresco durante la asamblea
  })
}

/**
 * Registra asistencia de un propietario
 */
export function useRegistrarAsistencia() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      asambleaId,
      consorcioId,
      data,
    }: {
      asambleaId: string
      consorcioId: string
      data: RegistrarAsistenciaDto
    }) => apiClient.post<Asistencia>(
        `/asambleas/${asambleaId}/asistencia?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.asistencia(variables.asambleaId),
      })
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.quorum(variables.asambleaId),
      })
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.detail(variables.asambleaId),
      })
    },
  })
}

/**
 * Obtiene información del quórum actual
 */
export function useQuorum(asambleaId: string, consorcioId?: string) {
  return useQuery({
    queryKey: asambleasKeys.quorum(asambleaId),
    queryFn: () => apiClient.get<Quorum>(
        `/asambleas/${asambleaId}/quorum?consorcioId=${consorcioId}`
      ),
    enabled: !!asambleaId && !!consorcioId,
    staleTime: 5 * 1000, // 5 segundos - muy fresco
    refetchInterval: 10 * 1000, // Refetch cada 10 segundos durante asamblea
  })
}

// ============================================================================
// VOTACIÓN
// ============================================================================

/**
 * Emite voto en un punto
 */
export function useEmitirVoto() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      asambleaId,
      puntoId,
      consorcioId,
      data,
    }: {
      asambleaId: string
      puntoId: string
      consorcioId: string
      data: EmitirVotoDto
    }) => apiClient.post<MiVoto>(
        `/asambleas/${asambleaId}/puntos/${puntoId}/votar?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.miVoto(variables.puntoId),
      })
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.resultadoVotacion(variables.puntoId),
      })
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.detail(variables.asambleaId),
      })
    },
  })
}

/**
 * Obtiene el resultado de votación de un punto
 */
export function useResultadoVotacion(
  asambleaId: string,
  puntoId: string,
  consorcioId?: string
) {
  return useQuery({
    queryKey: asambleasKeys.resultadoVotacion(puntoId),
    queryFn: () => apiClient.get<ResultadoVotacion>(
        `/asambleas/${asambleaId}/puntos/${puntoId}/resultado?consorcioId=${consorcioId}`
      ),
    enabled: !!asambleaId && !!puntoId && !!consorcioId,
    staleTime: 5 * 1000, // 5 segundos - muy fresco durante votación
  })
}

/**
 * Obtiene mi voto en un punto
 */
export function useMiVoto(
  asambleaId: string,
  puntoId: string,
  consorcioId?: string
) {
  return useQuery({
    queryKey: asambleasKeys.miVoto(puntoId),
    queryFn: () => apiClient.get<MiVoto | null>(
        `/asambleas/${asambleaId}/puntos/${puntoId}/mi-voto?consorcioId=${consorcioId}`
      ),
    enabled: !!asambleaId && !!puntoId && !!consorcioId,
  })
}

// ============================================================================
// ACTA
// ============================================================================

/**
 * Genera el acta de la asamblea
 */
export function useGenerarActa() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      asambleaId,
      consorcioId,
      data,
    }: {
      asambleaId: string
      consorcioId: string
      data: GenerarActaDto
    }) => apiClient.post<{ actaUrl: string; actaHash: string }>(
        `/asambleas/${asambleaId}/acta?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: asambleasKeys.detail(variables.asambleaId),
      })
      queryClient.invalidateQueries({ queryKey: asambleasKeys.lists() })
    },
  })
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Texto legible para estados de asamblea
 */
export const estadoAsambleaLabels: Record<EstadoAsamblea, string> = {
  PROGRAMADA: 'Programada',
  EN_CURSO: 'En curso',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

/**
 * Colores para estados de asamblea
 */
export const estadoAsambleaColors: Record<
  EstadoAsamblea,
  'default' | 'warning' | 'success' | 'destructive'
> = {
  PROGRAMADA: 'default',
  EN_CURSO: 'warning',
  FINALIZADA: 'success',
  CANCELADA: 'destructive',
}

/**
 * Texto legible para tipos de voto
 */
export const tipoVotoLabels: Record<TipoVoto, string> = {
  A_FAVOR: 'A favor',
  EN_CONTRA: 'En contra',
  ABSTENCION: 'Abstención',
}

/**
 * Colores para tipos de voto
 */
export const tipoVotoColors: Record<TipoVoto, string> = {
  A_FAVOR: 'text-green-600',
  EN_CONTRA: 'text-red-600',
  ABSTENCION: 'text-gray-500',
}
