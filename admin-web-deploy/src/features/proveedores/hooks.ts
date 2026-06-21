// Feature: Proveedores
// Hooks de TanStack Query para gestión de proveedores y marketplace

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// ============================================================================
// QUERY KEYS
// ============================================================================

export const proveedoresKeys = {
  all: ['proveedores'] as const,
  lists: () => [...proveedoresKeys.all, 'list'] as const,
  list: (filters?: ProveedoresFilters) => [...proveedoresKeys.lists(), filters] as const,
  consorcio: (consorcioId?: string, filters?: ProveedoresFilters) =>
    [...proveedoresKeys.all, 'consorcio', consorcioId, filters] as const,
  details: () => [...proveedoresKeys.all, 'detail'] as const,
  detail: (id: string) => [...proveedoresKeys.details(), id] as const,
  servicios: () => [...proveedoresKeys.all, 'servicios'] as const,
  estadisticas: (id: string) => [...proveedoresKeys.all, 'estadisticas', id] as const,
}

export const trabajosKeys = {
  all: ['trabajos'] as const,
  lists: () => [...trabajosKeys.all, 'list'] as const,
  list: (filters?: TrabajosFilters) => [...trabajosKeys.lists(), filters] as const,
  proveedor: (proveedorId: string, filters?: TrabajosFilters) =>
    [...trabajosKeys.all, 'proveedor', proveedorId, filters] as const,
  details: () => [...trabajosKeys.all, 'detail'] as const,
  detail: (id: string) => [...trabajosKeys.details(), id] as const,
}

// ============================================================================
// TYPES
// ============================================================================

export type EstadoTrabajo = 'pendiente' | 'aprobado' | 'rechazado'

export interface Proveedor {
  id: string
  razonSocial: string
  cuit: string
  email?: string
  telefono?: string
  direccion?: string
  servicios: string[]
  puntuacionPromedio?: number
  cantidadResenas: number
  verificado: boolean
  activo: boolean
  createdAt: string
  updatedAt: string
  // Relaciones
  _count?: {
    consorcios: number
    trabajos: number
    gastos: number
  }
  // Asociación con consorcio (si viene de endpoint de consorcio)
  asociacion?: {
    esFavorito: boolean
    nota?: string
  }
}

export interface CreateProveedorDto {
  razonSocial: string
  cuit: string
  email?: string
  telefono?: string
  direccion?: string
  servicios: string[]
}

export interface UpdateProveedorDto {
  razonSocial?: string
  email?: string
  telefono?: string
  direccion?: string
  servicios?: string[]
  activo?: boolean
}

export interface AsociarProveedorDto {
  proveedorId: string
  consorcioId: string
  esFavorito?: boolean
  nota?: string
}

export interface UpdateAsociacionDto {
  esFavorito?: boolean
  nota?: string
}

export interface TrabajoProveedor {
  id: string
  proveedorId: string
  consorcioId: string
  descripcion: string
  monto: number
  facturaUrl?: string
  fotosUrls: string[]
  estado: EstadoTrabajo
  aprobadoPor?: string
  aprobadoAt?: string
  gastoId?: string
  fechaTrabajo: string
  createdAt: string
  updatedAt: string
  // Relaciones
  proveedor?: Proveedor
}

export interface CreateTrabajoDto {
  consorcioId: string
  descripcion: string
  monto: number
  facturaUrl?: string
  fotosUrls?: string[]
  fechaTrabajo: string
}

export interface UpdateTrabajoDto {
  descripcion?: string
  monto?: number
  facturaUrl?: string
  fotosUrls?: string[]
  fechaTrabajo?: string
}

export interface AprobarTrabajoDto {
  aprobado: boolean
  comentario?: string
}

export interface EstadisticasProveedor {
  totalTrabajos: number
  trabajosAprobados: number
  trabajosRechazados: number
  trabajosPendientes: number
  montoTotal: number
  puntuacionPromedio?: number
  consorciosActivos: number
}

export interface ProveedoresFilters {
  busqueda?: string
  servicio?: string
  verificado?: boolean
  activo?: boolean
  page?: number
  limit?: number
}

export interface TrabajosFilters {
  consorcioId?: string
  estado?: EstadoTrabajo
  fechaDesde?: string
  fechaHasta?: string
  page?: number
  limit?: number
}

export interface PaginatedProveedores {
  data: Proveedor[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface PaginatedTrabajos {
  data: TrabajoProveedor[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// ============================================================================
// PROVEEDORES HOOKS
// ============================================================================

/**
 * Lista proveedores del marketplace con filtros
 */
export function useProveedores(filters?: ProveedoresFilters) {
  return useQuery({
    queryKey: proveedoresKeys.list(filters),
    queryFn: async (): Promise<PaginatedProveedores> => {
      const params = new URLSearchParams()
      if (filters?.busqueda) params.append('busqueda', filters.busqueda)
      if (filters?.servicio) params.append('servicio', filters.servicio)
      if (filters?.verificado !== undefined)
        params.append('verificado', filters.verificado.toString())
      if (filters?.activo !== undefined)
        params.append('activo', filters.activo.toString())
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      return apiClient.get<PaginatedProveedores>(`/proveedores?${params.toString()}`)
    },
    staleTime: 60 * 1000, // 1 minuto
  })
}

/**
 * Lista proveedores asociados a un consorcio
 */
export function useProveedoresConsorcio(
  consorcioId?: string,
  filters?: ProveedoresFilters
) {
  return useQuery({
    queryKey: proveedoresKeys.consorcio(consorcioId, filters),
    queryFn: async (): Promise<PaginatedProveedores> => {
      const params = new URLSearchParams()
      if (consorcioId) params.append('consorcioId', consorcioId)
      if (filters?.busqueda) params.append('busqueda', filters.busqueda)
      if (filters?.servicio) params.append('servicio', filters.servicio)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      return apiClient.get<PaginatedProveedores>(
        `/proveedores/consorcio?${params.toString()}`
      )
    },
    enabled: !!consorcioId,
    staleTime: 30 * 1000,
  })
}

/**
 * Obtiene los servicios disponibles para filtros
 */
export function useServiciosDisponibles() {
  return useQuery({
    queryKey: proveedoresKeys.servicios(),
    queryFn: () => apiClient.get<string[]>('/proveedores/servicios'),
    staleTime: 5 * 60 * 1000, // 5 minutos
  })
}

/**
 * Obtiene el detalle de un proveedor
 */
export function useProveedor(id: string, consorcioId?: string) {
  return useQuery({
    queryKey: proveedoresKeys.detail(id),
    queryFn: () => {
      const params = consorcioId ? `?consorcioId=${consorcioId}` : ''
      return apiClient.get<Proveedor>(`/proveedores/${id}${params}`)
    },
    enabled: !!id,
    staleTime: 30 * 1000,
  })
}

/**
 * Obtiene estadísticas de un proveedor
 */
export function useEstadisticasProveedor(proveedorId: string) {
  return useQuery({
    queryKey: proveedoresKeys.estadisticas(proveedorId),
    queryFn: () => apiClient.get<EstadisticasProveedor>(
        `/proveedores/${proveedorId}/estadisticas`
      ),
    enabled: !!proveedorId,
    staleTime: 60 * 1000,
  })
}

/**
 * Crea un nuevo proveedor
 */
export function useCreateProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProveedorDto) =>
      apiClient.post<Proveedor>('/proveedores', data),
    onSuccess: (newProveedor) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      queryClient.setQueryData(
        proveedoresKeys.detail(newProveedor.id),
        newProveedor
      )
    },
  })
}

/**
 * Actualiza un proveedor
 */
export function useUpdateProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateProveedorDto
    }) => apiClient.patch<Proveedor>(`/proveedores/${id}`, data),
    onSuccess: (updatedProveedor) => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
      queryClient.setQueryData(
        proveedoresKeys.detail(updatedProveedor.id),
        updatedProveedor
      )
    },
  })
}

/**
 * Desactiva un proveedor (soft delete)
 */
export function useDesactivarProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await apiClient.delete(`/proveedores/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: proveedoresKeys.lists() })
    },
  })
}

// ============================================================================
// ASOCIACIONES
// ============================================================================

/**
 * Asocia un proveedor a un consorcio
 */
export function useAsociarProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: AsociarProveedorDto) =>
      apiClient.post<Proveedor>('/proveedores/asociar', data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: proveedoresKeys.consorcio(variables.consorcioId),
      })
    },
  })
}

/**
 * Actualiza asociación proveedor-consorcio (favorito, nota)
 */
export function useUpdateAsociacion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      proveedorId,
      consorcioId,
      data,
    }: {
      proveedorId: string
      consorcioId: string
      data: UpdateAsociacionDto
    }) => apiClient.patch<Proveedor>(
        `/proveedores/${proveedorId}/asociacion?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: proveedoresKeys.consorcio(variables.consorcioId),
      })
      queryClient.invalidateQueries({
        queryKey: proveedoresKeys.detail(variables.proveedorId),
      })
    },
  })
}

/**
 * Desasocia un proveedor de un consorcio
 */
export function useDesasociarProveedor() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      proveedorId,
      consorcioId,
    }: {
      proveedorId: string
      consorcioId: string
    }): Promise<void> => {
      await apiClient.delete(
        `/proveedores/${proveedorId}/asociacion?consorcioId=${consorcioId}`
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: proveedoresKeys.consorcio(variables.consorcioId),
      })
    },
  })
}

// ============================================================================
// TRABAJOS
// ============================================================================

/**
 * Lista trabajos de proveedores (admin)
 */
export function useTrabajos(filters?: TrabajosFilters) {
  return useQuery({
    queryKey: trabajosKeys.list(filters),
    queryFn: async (): Promise<PaginatedTrabajos> => {
      const params = new URLSearchParams()
      if (filters?.consorcioId) params.append('consorcioId', filters.consorcioId)
      if (filters?.estado) params.append('estado', filters.estado)
      if (filters?.fechaDesde) params.append('fechaDesde', filters.fechaDesde)
      if (filters?.fechaHasta) params.append('fechaHasta', filters.fechaHasta)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      return apiClient.get<PaginatedTrabajos>(
        `/proveedores/trabajos/listar?${params.toString()}`
      )
    },
    staleTime: 30 * 1000,
  })
}

/**
 * Lista trabajos de un proveedor específico
 */
export function useTrabajosProveedor(
  proveedorId: string,
  filters?: TrabajosFilters
) {
  return useQuery({
    queryKey: trabajosKeys.proveedor(proveedorId, filters),
    queryFn: async (): Promise<PaginatedTrabajos> => {
      const params = new URLSearchParams()
      if (filters?.estado) params.append('estado', filters.estado)
      if (filters?.page) params.append('page', filters.page.toString())
      if (filters?.limit) params.append('limit', filters.limit.toString())

      return apiClient.get<PaginatedTrabajos>(
        `/proveedores/${proveedorId}/trabajos?${params.toString()}`
      )
    },
    enabled: !!proveedorId,
    staleTime: 30 * 1000,
  })
}

/**
 * Crea un trabajo (para proveedores)
 */
export function useCreateTrabajo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      proveedorId,
      data,
    }: {
      proveedorId: string
      data: CreateTrabajoDto
    }) => apiClient.post<TrabajoProveedor>(
        `/proveedores/${proveedorId}/trabajos`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trabajosKeys.proveedor(variables.proveedorId),
      })
      queryClient.invalidateQueries({ queryKey: trabajosKeys.lists() })
    },
  })
}

/**
 * Actualiza un trabajo pendiente
 */
export function useUpdateTrabajo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      trabajoId,
      proveedorId,
      data,
    }: {
      trabajoId: string
      proveedorId: string
      data: UpdateTrabajoDto
    }) => apiClient.patch<TrabajoProveedor>(
        `/proveedores/trabajos/${trabajoId}?proveedorId=${proveedorId}`,
        data
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trabajosKeys.proveedor(variables.proveedorId),
      })
      queryClient.invalidateQueries({ queryKey: trabajosKeys.lists() })
    },
  })
}

/**
 * Aprueba o rechaza un trabajo (admin)
 */
export function useProcesarTrabajo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      trabajoId,
      consorcioId,
      data,
    }: {
      trabajoId: string
      consorcioId: string
      data: AprobarTrabajoDto
    }) => apiClient.post<TrabajoProveedor>(
        `/proveedores/trabajos/${trabajoId}/procesar?consorcioId=${consorcioId}`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trabajosKeys.lists() })
    },
  })
}

/**
 * Elimina un trabajo pendiente
 */
export function useDeleteTrabajo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      trabajoId,
      proveedorId,
    }: {
      trabajoId: string
      proveedorId: string
    }): Promise<void> => {
      await apiClient.delete(
        `/proveedores/trabajos/${trabajoId}?proveedorId=${proveedorId}`
      )
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: trabajosKeys.proveedor(variables.proveedorId),
      })
      queryClient.invalidateQueries({ queryKey: trabajosKeys.lists() })
    },
  })
}

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Colores para estados de trabajo
 */
export const estadoTrabajoColors: Record<EstadoTrabajo, string> = {
  pendiente: 'bg-yellow-100 text-yellow-700',
  aprobado: 'bg-green-100 text-green-700',
  rechazado: 'bg-red-100 text-red-700',
}

/**
 * Labels para estados de trabajo
 */
export const estadoTrabajoLabels: Record<EstadoTrabajo, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}

/**
 * Servicios comunes predefinidos
 */
export const serviciosComunes = [
  'plomeria',
  'electricidad',
  'limpieza',
  'pintura',
  'cerrajeria',
  'jardineria',
  'fumigacion',
  'ascensores',
  'seguridad',
  'mantenimiento',
  'albañileria',
  'vidrieria',
  'gas',
  'matafuegos',
  'bombas',
  'aire_acondicionado',
  'otro',
]

/**
 * Labels para servicios
 */
export const servicioLabels: Record<string, string> = {
  plomeria: 'Plomería',
  electricidad: 'Electricidad',
  limpieza: 'Limpieza',
  pintura: 'Pintura',
  cerrajeria: 'Cerrajería',
  jardineria: 'Jardinería',
  fumigacion: 'Fumigación',
  ascensores: 'Ascensores',
  seguridad: 'Seguridad',
  mantenimiento: 'Mantenimiento General',
  albañileria: 'Albañilería',
  vidrieria: 'Vidriería',
  gas: 'Gas',
  matafuegos: 'Matafuegos',
  bombas: 'Bombas de Agua',
  aire_acondicionado: 'Aire Acondicionado',
  otro: 'Otro',
}
