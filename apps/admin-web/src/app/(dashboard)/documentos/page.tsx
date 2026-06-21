'use client'

import {
  FileText,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Calendar,
  File,
  Lock,
  Globe,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useAuth } from '@/features/auth'
import {
  useDocumentos,
  useDocumentosStats,
  useDeleteDocumento,
  type Documento,
  type CategoriaDocumento,
  CATEGORIAS_DOCUMENTO,
  categoriaLabels,
  categoriaColors,
  categoriaIcons,
  formatFileSize,
  getFileIcon,
} from '@/features/documentos'
import { cn, formatDate } from '@/lib/utils'

export default function DocumentosPage() {
  const { consorcioId } = useAuth()
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaDocumento | ''>('')
  const [visibilidadFiltro, setVisibilidadFiltro] = useState<'todos' | 'publicos' | 'privados'>('todos')

  const { data: documentosData, isLoading } = useDocumentos(consorcioId ?? '', {
    categoria: categoriaFiltro || undefined,
    esPublico: visibilidadFiltro === 'todos' ? undefined : visibilidadFiltro === 'publicos',
    busqueda: busqueda || undefined,
  })

  const { data: stats } = useDocumentosStats(consorcioId ?? '')
  const deleteDocumento = useDeleteDocumento()

  const documentos = documentosData?.data || []

  const handleDelete = async (id: string, nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      try {
        await deleteDocumento.mutateAsync(id)
      } catch (error) {
        console.error('Error al eliminar:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="text-gray-500 mt-1">
            Gestión de documentos del consorcio
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          href="/documentos/nuevo"
        >
          <Plus className="h-4 w-4" />
          Subir documento
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FileText className="h-5 w-5 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <File className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.porCategoria?.reglamento || 0}
              </p>
              <p className="text-sm text-gray-500">Reglamentos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.porCategoria?.acta || 0}
              </p>
              <p className="text-sm text-gray-500">Actas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Globe className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.publicos || 0}</p>
              <p className="text-sm text-gray-500">Públicos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Lock className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats?.privados || 0}</p>
              <p className="text-sm text-gray-500">Privados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Buscar documentos..."
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Categoria Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value as CategoriaDocumento | '')}
            >
              <option value="">Todas las categorías</option>
              {CATEGORIAS_DOCUMENTO.map((cat) => (
                <option key={cat} value={cat}>
                  {categoriaIcons[cat]} {categoriaLabels[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* Visibilidad Filter */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            value={visibilidadFiltro}
            onChange={(e) => setVisibilidadFiltro(e.target.value as 'todos' | 'publicos' | 'privados')}
          >
            <option value="todos">Todos</option>
            <option value="publicos">Solo públicos</option>
            <option value="privados">Solo privados</option>
          </select>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay documentos</p>
            <p className="text-sm text-gray-400 mt-1">
              Subí el primer documento del consorcio
            </p>
            <Link
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              href="/documentos/nuevo"
            >
              <Plus className="h-4 w-4" />
              Subir documento
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documentos.map((doc: Documento) => (
              <DocumentoRow
                documento={doc}
                key={doc.id}
                onDelete={() => handleDelete(doc.id, doc.nombre)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination info */}
      {documentosData && documentosData.total > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Mostrando {documentos.length} de {documentosData.total} documentos
        </div>
      )}
    </div>
  )
}

function DocumentoRow({
  documento,
  onDelete,
}: {
  documento: Documento
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
      {/* Icon */}
      <div className="text-3xl">{getFileIcon(documento.archivoTipo)}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            className="font-medium text-gray-900 hover:text-primary-600 truncate"
            href={`/documentos/${documento.id}`}
          >
            {documento.nombre}
          </Link>
          {documento.esPublico ? (
            <span title="Público">
              <Globe aria-hidden="true" className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="sr-only">Público</span>
            </span>
          ) : (
            <span title="Privado">
              <Lock aria-hidden="true" className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="sr-only">Privado</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium',
              categoriaColors[documento.categoria]
            )}
          >
            {categoriaIcons[documento.categoria]} {categoriaLabels[documento.categoria]}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(new Date(documento.createdAt))}
          </span>
          <span>{formatFileSize(documento.archivoTamano)}</span>
        </div>
        {documento.descripcion && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
            {documento.descripcion}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
          href={`/documentos/${documento.id}`}
          title="Ver detalle"
        >
          <Eye className="h-5 w-5" />
        </Link>
        <a
          className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
          href={documento.archivoUrl}
          rel="noopener noreferrer"
          target="_blank"
          title="Descargar"
        >
          <Download className="h-5 w-5" />
        </a>
        <button
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Eliminar"
          onClick={onDelete}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
