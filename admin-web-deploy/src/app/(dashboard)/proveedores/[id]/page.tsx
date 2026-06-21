'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Star,
  Shield,
  Edit2,
  Trash2,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Calendar,
  DollarSign,
} from 'lucide-react'

import { cn, formatCurrency, formatDate } from '@/lib/utils'
import {
  useProveedor,
  useEstadisticasProveedor,
  useTrabajosProveedor,
  useDesactivarProveedor,
  useProcesarTrabajo,
  useCreateTrabajo,
  type TrabajoProveedor,
  servicioLabels,
  estadoTrabajoLabels,
  estadoTrabajoColors,
} from '@/features/proveedores'

export default function ProveedorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const proveedorId = params.id as string

  const { data: proveedor, isLoading, error } = useProveedor(proveedorId)
  const { data: estadisticas } = useEstadisticasProveedor(proveedorId)
  const { data: trabajosData } = useTrabajosProveedor(proveedorId)
  const desactivar = useDesactivarProveedor()
  const procesarTrabajo = useProcesarTrabajo()
  const createTrabajo = useCreateTrabajo()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showTrabajoModal, setShowTrabajoModal] = useState(false)
  const [trabajoForm, setTrabajoForm] = useState({
    descripcion: '',
    monto: '',
    fechaTrabajo: new Date().toISOString().split('T')[0],
    consorcioId: '',
  })

  const trabajos = trabajosData?.data || []

  const handleDesactivar = async () => {
    try {
      await desactivar.mutateAsync(proveedorId)
      router.push('/proveedores')
    } catch (error) {
      console.error('Error al desactivar proveedor:', error)
    }
  }

  const handleProcesarTrabajo = async (trabajo: TrabajoProveedor, aprobado: boolean) => {
    try {
      await procesarTrabajo.mutateAsync({ trabajoId: trabajo.id, consorcioId: trabajo.consorcioId, data: { aprobado } })
    } catch (error) {
      console.error('Error al procesar trabajo:', error)
    }
  }

  const handleCreateTrabajo = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createTrabajo.mutateAsync({
        proveedorId,
        data: {
          descripcion: trabajoForm.descripcion,
          monto: parseFloat(trabajoForm.monto) || 0,
          fechaTrabajo: new Date(trabajoForm.fechaTrabajo || new Date()).toISOString(),
          consorcioId: trabajoForm.consorcioId,
        },
      })
      setShowTrabajoModal(false)
      setTrabajoForm({
        descripcion: '',
        monto: '',
        fechaTrabajo: new Date().toISOString().split('T')[0],
        consorcioId: '',
      })
    } catch (error) {
      console.error('Error al crear trabajo:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error || !proveedor) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          Proveedor no encontrado
        </h2>
        <p className="text-gray-500 mt-2">
          El proveedor que buscás no existe o fue eliminado
        </p>
        <Link
          href="/proveedores"
          className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
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
            href="/proveedores"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Volver a proveedores"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {proveedor.razonSocial}
              </h1>
              {proveedor.verificado && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  <Shield className="h-3 w-3" />
                  Verificado
                </span>
              )}
            </div>
            <p className="text-gray-500 mt-1">CUIT: {proveedor.cuit}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/proveedores/${proveedorId}/editar`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </Link>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 text-red-700 bg-white border border-red-300 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Desactivar
          </button>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Datos del Proveedor */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            Información de Contacto
          </h2>

          <div className="space-y-4">
            {proveedor.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <a
                  href={`mailto:${proveedor.email}`}
                  className="text-primary-600 hover:underline"
                >
                  {proveedor.email}
                </a>
              </div>
            )}

            {proveedor.telefono && (
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <a
                  href={`tel:${proveedor.telefono}`}
                  className="text-gray-700"
                >
                  {proveedor.telefono}
                </a>
              </div>
            )}

            {proveedor.direccion && (
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-gray-700">{proveedor.direccion}</span>
              </div>
            )}

            {!proveedor.email && !proveedor.telefono && !proveedor.direccion && (
              <p className="text-gray-500 text-sm">
                No hay información de contacto disponible
              </p>
            )}
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary-600" />
            Servicios
          </h2>

          <div className="flex flex-wrap gap-2">
            {proveedor.servicios.map((servicio: string) => (
              <span
                key={servicio}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm"
              >
                {servicioLabels[servicio] || servicio}
              </span>
            ))}
          </div>
        </div>

        {/* Estadísticas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Estadísticas
          </h2>

          {estadisticas ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Rating promedio</span>
                {proveedor.puntuacionPromedio ? (
                  <span className="flex items-center gap-1 text-amber-600 font-medium">
                    <Star className="h-4 w-4 fill-current" />
                    {proveedor.puntuacionPromedio.toFixed(1)}
                    <span className="text-gray-400 font-normal">
                      ({proveedor.cantidadResenas})
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400 text-sm">Sin reseñas</span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Trabajos totales</span>
                <span className="font-medium text-gray-900">
                  {estadisticas.totalTrabajos}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Trabajos aprobados</span>
                <span className="font-medium text-green-600">
                  {estadisticas.trabajosAprobados}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500">Monto total facturado</span>
                <span className="font-medium text-gray-900">
                  {formatCurrency(estadisticas.montoTotal || 0)}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Sin estadísticas disponibles</p>
          )}
        </div>
      </div>

      {/* Trabajos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary-600" />
            Trabajos realizados
          </h2>
          <button
            onClick={() => setShowTrabajoModal(true)}
            className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Registrar trabajo
          </button>
        </div>

        {trabajos.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay trabajos registrados</p>
            <p className="text-sm text-gray-400 mt-1">
              Los trabajos se crean cuando el proveedor realiza un servicio
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {trabajos.map((trabajo: TrabajoProveedor) => (
              <div
                key={trabajo.id}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          estadoTrabajoColors[trabajo.estado]
                        )}
                      >
                        {estadoTrabajoLabels[trabajo.estado]}
                      </span>
                      <span className="text-gray-500 text-sm flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(new Date(trabajo.fechaTrabajo))}
                      </span>
                    </div>
                    <p className="font-medium text-gray-900 mt-2">
                      {trabajo.descripcion}
                    </p>
                    <p className="text-lg font-semibold text-primary-600 mt-1 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      {formatCurrency(trabajo.monto)}
                    </p>
                  </div>

                  {trabajo.estado === 'pendiente' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleProcesarTrabajo(trabajo, true)}
                        disabled={procesarTrabajo.isPending}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Aprobar"
                      >
                        <CheckCircle className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleProcesarTrabajo(trabajo, false)}
                        disabled={procesarTrabajo.isPending}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Rechazar"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                {trabajo.facturaUrl && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <a
                      href={trabajo.facturaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Ver factura
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Desactivar */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900">
              ¿Desactivar proveedor?
            </h3>
            <p className="text-gray-500 mt-2">
              El proveedor no será eliminado pero dejará de aparecer en el 
              marketplace y no podrá recibir nuevos trabajos.
            </p>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDesactivar}
                disabled={desactivar.isPending}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                {desactivar.isPending ? 'Desactivando...' : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nuevo Trabajo */}
      {showTrabajoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registrar Trabajo
            </h3>
            <form onSubmit={handleCreateTrabajo} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción *
                </label>
                <textarea
                  value={trabajoForm.descripcion}
                  onChange={(e) =>
                    setTrabajoForm({ ...trabajoForm, descripcion: e.target.value })
                  }
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Descripción del trabajo realizado"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Monto *
                </label>
                <input
                  type="number"
                  value={trabajoForm.monto}
                  onChange={(e) =>
                    setTrabajoForm({ ...trabajoForm, monto: e.target.value })
                  }
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha del trabajo *
                </label>
                <input
                  type="date"
                  value={trabajoForm.fechaTrabajo}
                  onChange={(e) =>
                    setTrabajoForm({ ...trabajoForm, fechaTrabajo: e.target.value })
                  }
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTrabajoModal(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTrabajo.isPending}
                  className="px-4 py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 rounded-lg transition-colors"
                >
                  {createTrabajo.isPending ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
