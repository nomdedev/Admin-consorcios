'use client'

import {
  ArrowLeft,
  Upload,
  FileText,
  Globe,
  Lock,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuth } from '@/features/auth'
import {
  useCreateDocumento,
  type CreateDocumentoDto,
  type CategoriaDocumento,
  CATEGORIAS_DOCUMENTO,
  categoriaLabels,
  categoriaIcons,
} from '@/features/documentos'
import { cn } from '@/lib/utils'

export default function NuevoDocumentoPage() {
  const router = useRouter()
  const { consorcioId } = useAuth()
  const createDocumento = useCreateDocumento()

  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDocumento>('otro')
  const [esPublico, setEsPublico] = useState(true)

  // Simulación de archivo subido - En producción usaría un servicio de storage
  const [archivo, setArchivo] = useState<File | null>(null)
  const [archivoUrl, setArchivoUrl] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!nombre.trim()) {
      newErrors.nombre = 'El nombre es obligatorio'
    } else if (nombre.length < 3) {
      newErrors.nombre = 'El nombre debe tener al menos 3 caracteres'
    }

    if (!archivoUrl && !archivo) {
      newErrors.archivo = 'Debés subir un archivo'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño (máx 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrors({ ...errors, archivo: 'El archivo no puede superar 50MB' })
        return
      }

      setArchivo(file)
      // En producción, aquí subirías el archivo a S3/R2 y obtendrías la URL
      setArchivoUrl(`https://cdn.vecinosimple.com/docs/${file.name}`)
      setErrors({ ...errors, archivo: '' })

      // Auto-completar nombre si está vacío
      if (!nombre) {
        setNombre(file.name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    if (!consorcioId) return

    const data: CreateDocumentoDto = {
      consorcioId,
      nombre: nombre.trim(),
      descripcion: descripcion.trim() || undefined,
      categoria,
      archivoUrl,
      archivoNombre: archivo?.name || 'documento',
      archivoTipo: archivo?.type || 'application/octet-stream',
      archivoTamano: archivo?.size || 0,
      esPublico,
    }

    try {
      const documento = await createDocumento.mutateAsync(data)
      router.push(`/documentos/${documento.id}`)
    } catch (error) {
      console.error('Error al crear documento:', error)
    }
  }

  // Si no hay consorcio, mostrar mensaje
  if (!consorcioId) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">
          No hay consorcio seleccionado
        </h2>
        <p className="text-gray-500 mt-2">
          Seleccioná un consorcio para continuar
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          aria-label="Volver a documentos"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          href="/documentos"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subir Documento</h1>
          <p className="text-gray-500 mt-1">
            Agregá un documento al repositorio del consorcio
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Upload Area */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary-600" />
            Archivo
          </h2>

          <div
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
              archivo
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 hover:border-primary-400'
            )}
          >
            {archivo ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 text-green-600 mx-auto" />
                <p className="font-medium text-gray-900">{archivo.name}</p>
                <p className="text-sm text-gray-500">
                  {(archivo.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <button
                  className="text-sm text-red-600 hover:underline"
                  type="button"
                  onClick={() => {
                    setArchivo(null)
                    setArchivoUrl('')
                  }}
                >
                  Cambiar archivo
                </button>
              </div>
            ) : (
              <label className="cursor-pointer space-y-2 block">
                <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="font-medium text-gray-900">
                  Arrastrá un archivo o hacé click para seleccionar
                </p>
                <p className="text-sm text-gray-500">
                  PDF, Word, Excel, imágenes (máx. 50MB)
                </p>
                <input
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                  className="hidden"
                  type="file"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>

          {errors.archivo && (
            <p className="text-red-500 text-sm mt-2">{errors.archivo}</p>
          )}
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Información del Documento
          </h2>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="nombre"
              >
                Nombre del documento *
              </label>
              <input
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.nombre ? 'border-red-500' : 'border-gray-300'
                )}
                id="nombre"
                placeholder="Ej: Reglamento de Copropiedad 2024"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              {errors.nombre && (
                <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="descripcion"
              >
                Descripción
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                id="descripcion"
                placeholder="Descripción opcional del documento..."
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            {/* Categoría */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="categoria"
              >
                Categoría *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                id="categoria"
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaDocumento)}
              >
                {CATEGORIAS_DOCUMENTO.map((cat) => (
                  <option key={cat} value={cat}>
                    {categoriaIcons[cat]} {categoriaLabels[cat]}
                  </option>
                ))}
              </select>
            </div>

            {/* Visibilidad */}
            <div>
              <p className="block text-sm font-medium text-gray-700 mb-2">
                Visibilidad
              </p>
              <div className="flex gap-4">
                <button
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors',
                    esPublico
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                  type="button"
                  onClick={() => setEsPublico(true)}
                >
                  <Globe className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Público</p>
                    <p className="text-xs opacity-75">Visible para todos los vecinos</p>
                  </div>
                </button>
                <button
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg transition-colors',
                    !esPublico
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  )}
                  type="button"
                  onClick={() => setEsPublico(false)}
                >
                  <Lock className="h-5 w-5" />
                  <div className="text-left">
                    <p className="font-medium">Privado</p>
                    <p className="text-xs opacity-75">Solo administradores</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Sobre los documentos</p>
            <p className="mt-1">
              Los documentos públicos serán visibles para todos los vecinos del 
              consorcio. Los privados solo podrán ser accedidos por administradores.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            href="/documentos"
          >
            Cancelar
          </Link>
          <button
            className="px-6 py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 rounded-lg transition-colors flex items-center gap-2"
            disabled={createDocumento.isPending}
            type="submit"
          >
            {createDocumento.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Subiendo...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Subir Documento
              </>
            )}
          </button>
        </div>

        {createDocumento.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error al subir el documento. Por favor intentá de nuevo.
          </div>
        )}
      </form>
    </div>
  )
}
