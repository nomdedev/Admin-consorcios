'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

// ============================================================================
// TYPES
// ============================================================================

export type CategoriaDocumento =
  | 'reglamento'
  | 'acta'
  | 'contrato'
  | 'plano'
  | 'seguro'
  | 'habilitacion'
  | 'otro'

export interface Documento {
  id: string
  consorcioId: string
  nombre: string
  descripcion?: string
  categoria: CategoriaDocumento
  archivoUrl: string
  archivoNombre: string
  archivoTipo: string
  archivoTamano: number
  esPublico: boolean
  createdAt: string
  updatedAt: string
}

export interface DocumentosFilters {
  categoria?: CategoriaDocumento
  esPublico?: boolean
  busqueda?: string
  page?: number
  limit?: number
}

export interface PaginatedDocumentos {
  data: Documento[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DocumentosStats {
  total: number
  porCategoria: Record<CategoriaDocumento, number>
  publicos: number
  privados: number
  tamanoTotal: number
}

export interface CreateDocumentoDto {
  consorcioId: string
  nombre: string
  descripcion?: string
  categoria: CategoriaDocumento
  archivoUrl: string
  archivoNombre: string
  archivoTipo: string
  archivoTamano: number
  esPublico?: boolean
}

export interface UpdateDocumentoDto {
  nombre?: string
  descripcion?: string
  categoria?: CategoriaDocumento
  esPublico?: boolean
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const CATEGORIAS_DOCUMENTO: CategoriaDocumento[] = [
  'reglamento',
  'acta',
  'contrato',
  'plano',
  'seguro',
  'habilitacion',
  'otro',
]

export const categoriaLabels: Record<CategoriaDocumento, string> = {
  reglamento: 'Reglamento',
  acta: 'Acta',
  contrato: 'Contrato',
  plano: 'Plano',
  seguro: 'Seguro',
  habilitacion: 'Habilitación',
  otro: 'Otro',
}

export const categoriaColors: Record<CategoriaDocumento, string> = {
  reglamento: 'bg-blue-100 text-blue-700',
  acta: 'bg-purple-100 text-purple-700',
  contrato: 'bg-green-100 text-green-700',
  plano: 'bg-orange-100 text-orange-700',
  seguro: 'bg-yellow-100 text-yellow-700',
  habilitacion: 'bg-cyan-100 text-cyan-700',
  otro: 'bg-gray-100 text-gray-700',
}

export const categoriaIcons: Record<CategoriaDocumento, string> = {
  reglamento: '📜',
  acta: '📝',
  contrato: '📄',
  plano: '🗺️',
  seguro: '🛡️',
  habilitacion: '✅',
  otro: '📎',
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const documentosKeys = {
  all: ['documentos'] as const,
  lists: () => [...documentosKeys.all, 'list'] as const,
  list: (consorcioId: string, filters?: DocumentosFilters) =>
    [...documentosKeys.lists(), consorcioId, filters] as const,
  details: () => [...documentosKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentosKeys.details(), id] as const,
  stats: (consorcioId: string) => [...documentosKeys.all, 'stats', consorcioId] as const,
  categorias: () => [...documentosKeys.all, 'categorias'] as const,
}

// ============================================================================
// QUERIES
// ============================================================================

export function useDocumentos(consorcioId: string, filters?: DocumentosFilters) {
  return useQuery({
    queryKey: documentosKeys.list(consorcioId, filters),
    queryFn: async (): Promise<PaginatedDocumentos> => {
      const params = new URLSearchParams()
      params.set('consorcioId', consorcioId)
      if (filters?.categoria) params.set('categoria', filters.categoria)
      if (filters?.esPublico !== undefined) params.set('esPublico', String(filters.esPublico))
      if (filters?.busqueda) params.set('busqueda', filters.busqueda)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))

      return apiClient.get<PaginatedDocumentos>(`/documentos?${params.toString()}`)
    },
    enabled: !!consorcioId,
    staleTime: 60 * 1000,
  })
}

export function useDocumento(id: string, consorcioId: string) {
  return useQuery({
    queryKey: documentosKeys.detail(id),
    queryFn: () => apiClient.get<Documento>(`/documentos/${id}?consorcioId=${consorcioId}`),
    enabled: !!id && !!consorcioId,
  })
}

export function useDocumentosStats(consorcioId: string) {
  return useQuery({
    queryKey: documentosKeys.stats(consorcioId),
    queryFn: () => apiClient.get<DocumentosStats>(`/documentos/stats?consorcioId=${consorcioId}`),
    enabled: !!consorcioId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useCategorias() {
  return useQuery({
    queryKey: documentosKeys.categorias(),
    queryFn: () => apiClient.get<{ categorias: CategoriaDocumento[] }>('/documentos/categorias'),
    staleTime: Infinity,
  })
}

// ============================================================================
// MUTATIONS
// ============================================================================

export function useCreateDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateDocumentoDto) =>
      apiClient.post<Documento>('/documentos', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists() })
      queryClient.invalidateQueries({ queryKey: documentosKeys.stats(data.consorcioId) })
    },
  })
}

export function useUpdateDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: UpdateDocumentoDto
    }) => apiClient.patch<Documento>(`/documentos/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: documentosKeys.lists() })
    },
  })
}

export function useDeleteDocumento() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<{ mensaje: string }>(`/documentos/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentosKeys.all })
    },
  })
}

// ============================================================================
// UTILS
// ============================================================================

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileIcon(tipo: string): string {
  if (tipo.includes('pdf')) return '📕'
  if (tipo.includes('word') || tipo.includes('document')) return '📘'
  if (tipo.includes('excel') || tipo.includes('spreadsheet')) return '📗'
  if (tipo.includes('image')) return '🖼️'
  return '📄'
}
