'use client'

import {
  ArrowLeft,
  FileText,
  Download,
  Edit2,
  Trash2,
  Calendar,
  Globe,
  Lock,
  ExternalLink,
  AlertCircle,
  Save,
  X,
} from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/features/auth'
import {
  useDocumento,
  useUpdateDocumento,
  useDeleteDocumento,
  type CategoriaDocumento,
  CATEGORIAS_DOCUMENTO,
  categoriaLabels,
  categoriaColors,
  categoriaIcons,
  formatFileSize,
  getFileIcon,
} from '@/features/documentos'
import { cn, formatDate } from '@/lib/utils'

export default function DocumentoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const documentoId = params.id as string
  const { consorcioId } = useAuth()

  const { data: documento, isLoading, error } = useDocumento(documentoId, consorcioId ?? '')
  const updateDocumento = useUpdateDocumento()
  const deleteDocumento = useDeleteDocumento()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nombre: '',
    descripcion: '',
    categoria: 'otro' as CategoriaDocumento,
    esPublico: true,
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Initialize edit form when documento loads
  const handleStartEdit = () => {
    if (documento) {
      setEditForm({
        nombre: documento.nombre,
        descripcion: documento.descripcion || '',
        categoria: documento.categoria,
        esPublico: documento.esPublico,
      })
      setIsEditing(true)
    }
  }

  const handleSave = async () => {
    try {
      await updateDocumento.mutateAsync({
        id: documentoId,
        data: {
          nombre: editForm.nombre,
          descripcion: editForm.descripcion || undefined,
          categoria: editForm.categoria,
          esPublico: editForm.esPublico,
        },
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error al actualizar:', error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteDocumento.mutateAsync(documentoId)
      router.push('/documentos')
    } catch (error) {
      console.error('Error al eliminar:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error || !documento) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          Documento no encontrado
        </h2>
        <p className="text-gray-500 mt-2">
          El documento que buscás no existe o fue eliminado
        </p>
        <Link
          className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          href="/documentos"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            aria-label="Volver a documentos"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            href="/documentos"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            {isEditing ? (
              <input
                className="text-2xl font-bold text-gray-900 border-b-2 border-primary-500 outline-none bg-transparent"
                type="text"
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{documento.nombre}</h1>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  categoriaColors[documento.categoria]
                )}
              >
                {categoriaIcons[documento.categoria]} {categoriaLabels[documento.categoria]}
              </span>
              {documento.esPublico ? (
                <span className="flex items-center gap-1 text-green-600 text-sm">
                  <Globe className="h-4 w-4" />
                  Público
                </span>
              ) : (
                <span className="flex items-center gap-1 text-orange-600 text-sm">
                  <Lock className="h-4 w-4" />
                  Privado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setIsEditing(false)}
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
                disabled={updateDocumento.isPending}
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                {updateDocumento.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </>
          ) : (
            <>
              <button
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
                onClick={handleStartEdit}
              >
                <Edit2 className="h-4 w-4" />
                Editar
              </button>
              <button
                className="px-4 py-2 text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
                onClick={() => setShowDeleteModal(true)}
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Vista Previa</h2>

          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">{getFileIcon(documento.archivoTipo)}</div>
            <p className="font-medium text-gray-900">{documento.archivoNombre}</p>
            <p className="text-sm text-gray-500 mt-1">
              {formatFileSize(documento.archivoTamano)}
            </p>

            <div className="flex justify-center gap-3 mt-6">
              <a
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                href={documento.archivoUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                <ExternalLink className="h-4 w-4" />
                Abrir archivo
              </a>
              <a
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                download={documento.archivoNombre}
                href={documento.archivoUrl}
              >
                <Download className="h-4 w-4" />
                Descargar
              </a>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Información
          </h2>

          <div className="space-y-4">
            {/* Descripción */}
            <div>
              <p className="text-sm text-gray-500">Descripción</p>
              {isEditing ? (
                <textarea
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  value={editForm.descripcion}
                  onChange={(e) => setEditForm({ ...editForm, descripcion: e.target.value })}
                />
              ) : (
                <p className="text-gray-900">
                  {documento.descripcion || 'Sin descripción'}
                </p>
              )}
            </div>

            {/* Categoría */}
            <div>
              <p className="text-sm text-gray-500">Categoría</p>
              {isEditing ? (
                <select
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value as CategoriaDocumento })}
                >
                  {CATEGORIAS_DOCUMENTO.map((cat) => (
                    <option key={cat} value={cat}>
                      {categoriaIcons[cat]} {categoriaLabels[cat]}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-gray-900">
                  {categoriaIcons[documento.categoria]} {categoriaLabels[documento.categoria]}
                </p>
              )}
            </div>

            {/* Visibilidad */}
            {isEditing && (
              <div>
                <p className="text-sm text-gray-500">Visibilidad</p>
                <div className="flex gap-2 mt-1">
                  <button
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                      editForm.esPublico
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700'
                    )}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, esPublico: true })}
                  >
                    <Globe className="h-4 w-4 inline mr-1" />
                    Público
                  </button>
                  <button
                    className={cn(
                      'flex-1 px-3 py-2 text-sm rounded-lg border transition-colors',
                      !editForm.esPublico
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-300 text-gray-700'
                    )}
                    type="button"
                    onClick={() => setEditForm({ ...editForm, esPublico: false })}
                  >
                    <Lock className="h-4 w-4 inline mr-1" />
                    Privado
                  </button>
                </div>
              </div>
            )}

            {/* Fechas */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>Subido: {formatDate(new Date(documento.createdAt))}</span>
              </div>
              {documento.updatedAt !== documento.createdAt && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>Actualizado: {formatDate(new Date(documento.updatedAt))}</span>
                </div>
              )}
            </div>

            {/* Archivo */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Detalles del archivo</p>
              <div className="mt-2 text-sm">
                <p><span className="text-gray-500">Nombre:</span> {documento.archivoNombre}</p>
                <p><span className="text-gray-500">Tipo:</span> {documento.archivoTipo}</p>
                <p><span className="text-gray-500">Tamaño:</span> {formatFileSize(documento.archivoTamano)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Eliminar documento?
            </h3>
            <p className="text-gray-500 mt-2">
              Esta acción no se puede deshacer. El documento &quot;{documento.nombre}&quot;
              será eliminado permanentemente.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancelar
              </button>
              <button
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                disabled={deleteDocumento.isPending}
                onClick={handleDelete}
              >
                {deleteDocumento.isPending ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
