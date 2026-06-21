'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// ============================================================================
// TYPES
// ============================================================================

export type TipoEmergencia =
  | 'CORTE_AGUA'
  | 'CORTE_GAS'
  | 'CORTE_LUZ'
  | 'INCENDIO'
  | 'EVACUACION'
  | 'SEGURIDAD'
  | 'OTRO'

export interface AlertaEmergencia {
  id: string
  consorcioId: string
  creadoPorId: string
  tipo: TipoEmergencia
  titulo: string
  descripcion: string
  instrucciones?: string
  activa: boolean
  resueltaAt?: string
  resolucion?: string
  enviadoPush: boolean
  enviadoEmail: boolean
  enviadoWhatsapp: boolean
  enviadoSms: boolean
  destinatariosTotal: number
  enviosExitosos: number
  enviosFallidos: number
  createdAt: string
  updatedAt: string
  creadoPor?: {
    id: string
    nombre: string
    apellido: string
  }
}

export interface AlertasFilters {
  activa?: boolean
  tipo?: TipoEmergencia
}

export interface CreateAlertaDto {
  consorcioId: string
  tipo: TipoEmergencia
  titulo: string
  descripcion: string
  instrucciones?: string
  enviarPush?: boolean
  enviarEmail?: boolean
  enviarWhatsapp?: boolean
  enviarSms?: boolean
}

export interface ResolverAlertaDto {
  resolucion: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIPOS_EMERGENCIA: TipoEmergencia[] = [
  'CORTE_AGUA',
  'CORTE_GAS',
  'CORTE_LUZ',
  'INCENDIO',
  'EVACUACION',
  'SEGURIDAD',
  'OTRO',
]

export const tipoEmergenciaLabels: Record<TipoEmergencia, string> = {
  CORTE_AGUA: 'Corte de Agua',
  CORTE_GAS: 'Corte de Gas',
  CORTE_LUZ: 'Corte de Luz',
  INCENDIO: 'Incendio',
  EVACUACION: 'Evacuación',
  SEGURIDAD: 'Seguridad',
  OTRO: 'Otro',
}

export const tipoEmergenciaColors: Record<TipoEmergencia, string> = {
  CORTE_AGUA: 'bg-blue-100 text-blue-700 border-blue-300',
  CORTE_GAS: 'bg-orange-100 text-orange-700 border-orange-300',
  CORTE_LUZ: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  INCENDIO: 'bg-red-100 text-red-700 border-red-300',
  EVACUACION: 'bg-purple-100 text-purple-700 border-purple-300',
  SEGURIDAD: 'bg-rose-100 text-rose-700 border-rose-300',
  OTRO: 'bg-gray-100 text-gray-700 border-gray-300',
}

export const tipoEmergenciaIcons: Record<TipoEmergencia, string> = {
  CORTE_AGUA: '💧',
  CORTE_GAS: '🔥',
  CORTE_LUZ: '⚡',
  INCENDIO: '🚒',
  EVACUACION: '🚨',
  SEGURIDAD: '🔒',
  OTRO: '⚠️',
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const alertasKeys = {
  all: ['alertas'] as const,
  lists: () => [...alertasKeys.all, 'list'] as const,
  list: (consorcioId: string, filters?: AlertasFilters) =>
    [...alertasKeys.lists(), consorcioId, filters] as const,
  details: () => [...alertasKeys.all, 'detail'] as const,
  detail: (id: string) => [...alertasKeys.details(), id] as const,
  activas: (consorcioId: string) => [...alertasKeys.all, 'activas', consorcioId] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

export function useAlertas(consorcioId: string, filters?: AlertasFilters) {
  return useQuery({
    queryKey: alertasKeys.list(consorcioId, filters),
    queryFn: async (): Promise<AlertaEmergencia[]> => {
      const params = new URLSearchParams()
      if (filters?.activa !== undefined) params.set('activa', String(filters.activa))
      if (filters?.tipo) params.set('tipo', filters.tipo)

      const url = `/alertas/consorcio/${consorcioId}${params.toString() ? `?${params.toString()}` : ''}`
      return apiClient.get<AlertaEmergencia[]>(url)
    },
    enabled: !!consorcioId,
    staleTime: 30 * 1000, // 30 segundos - las alertas son críticas
  })
}

export function useAlerta(id: string) {
  return useQuery({
    queryKey: alertasKeys.detail(id),
    queryFn: async (): Promise<AlertaEmergencia> => {
      return apiClient.get<AlertaEmergencia>(`/alertas/${id}`)
    },
    enabled: !!id,
  })
}

export function useAlertasActivas(consorcioId: string) {
  return useQuery({
    queryKey: alertasKeys.activas(consorcioId),
    queryFn: async (): Promise<AlertaEmergencia[]> => {
      return apiClient.get<AlertaEmergencia[]>(`/alertas/consorcio/${consorcioId}/activas`)
    },
    enabled: !!consorcioId,
    refetchInterval: 30 * 1000, // Polling cada 30 segundos para alertas activas
    staleTime: 10 * 1000,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useCreateAlerta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAlertaDto): Promise<AlertaEmergencia> => {
      return apiClient.post<AlertaEmergencia>('/alertas', data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: alertasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertasKeys.activas(data.consorcioId) })
    },
  })
}

export function useResolverAlerta() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: ResolverAlertaDto
    }): Promise<AlertaEmergencia> => {
      return apiClient.patch<AlertaEmergencia>(`/alertas/${id}/resolver`, data)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: alertasKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: alertasKeys.lists() })
      queryClient.invalidateQueries({ queryKey: alertasKeys.activas(data.consorcioId) })
    },
  })
}

// ============================================================================
// UTILS
// ============================================================================

export function getAlertaPrioridad(tipo: TipoEmergencia): 'alta' | 'media' | 'critica' {
  switch (tipo) {
    case 'INCENDIO':
    case 'EVACUACION':
      return 'critica'
    case 'CORTE_GAS':
    case 'SEGURIDAD':
      return 'alta'
    default:
      return 'media'
  }
}

export function formatTiempoTranscurrido(fecha: string): string {
  const ahora = new Date()
  const fechaAlerta = new Date(fecha)
  const diff = ahora.getTime() - fechaAlerta.getTime()

  const minutos = Math.floor(diff / (1000 * 60))
  const horas = Math.floor(diff / (1000 * 60 * 60))
  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (minutos < 60) {
    return `hace ${minutos} min`
  } else if (horas < 24) {
    return `hace ${horas} hs`
  } else {
    return `hace ${dias} días`
  }
}
