'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Building2,
  Users,
  Clock,
  DollarSign,
  Calendar,
  Settings,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react'

import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import {
  useAmenity,
  useReservas,
  useUpdateAmenity,
  useDeleteAmenity,
  useProcesarReserva,
  getEstadoReservaConfig,
  type Reserva,
} from '@/features/amenities'

export default function AmenityDetallePage() {
  const params = useParams()
  const router = useRouter()
  const amenityId = params.id as string

  const [activeTab, setActiveTab] = useState<'info' | 'reservas' | 'reglas'>('info')

  const { data: amenity, isLoading: loadingAmenity } = useAmenity(amenityId)
  const { data: reservasData, isLoading: loadingReservas } = useReservas({
    amenityId,
    limit: 20,
  })

  const updateAmenity = useUpdateAmenity()
  const deleteAmenity = useDeleteAmenity()
  const procesarReserva = useProcesarReserva()

  const reservas = reservasData?.data ?? []
  const reservasPendientes = reservas.filter((r) => r.estado === 'PENDIENTE')

  const handleToggleActivo = async () => {
    if (!amenity) return
    await updateAmenity.mutateAsync({
      id: amenityId,
      data: { activo: !amenity.activo },
    })
  }

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este amenity? Esta acción no se puede deshacer.'))
      return
    await deleteAmenity.mutateAsync(amenityId)
    router.push('/amenities')
  }

  const handleAprobarReserva = async (reservaId: string, aprobada: boolean) => {
    await procesarReserva.mutateAsync({ id: reservaId, aprobada })
  }

  if (loadingAmenity) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!amenity) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 mx-auto text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Amenity no encontrado</h3>
        <Link href="/amenities" className="mt-2 text-primary-600 hover:underline">
          Volver a amenities
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link
            href="/amenities"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{amenity.nombre}</h1>
              <span
                className={cn(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  amenity.activo
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-700'
                )}
              >
                {amenity.activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {amenity.descripcion && (
              <p className="text-gray-500 mt-1">{amenity.descripcion}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {reservasPendientes.length > 0 && (
            <span className="px-3 py-1 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-full">
              {reservasPendientes.length} pendientes
            </span>
          )}
          <Link
            href={`/amenities/${amenityId}/reservar`}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Reservar
          </Link>
        </div>
      </div>

      {/* Stats rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {amenity.capacidad && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{amenity.capacidad}</p>
              <p className="text-sm text-gray-500">Capacidad</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Clock className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{amenity.duracionMaxima}h</p>
            <p className="text-sm text-gray-500">Duración máx</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {amenity.costoReserva ? formatCurrency(amenity.costoReserva) : 'Gratis'}
            </p>
            <p className="text-sm text-gray-500">Costo</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <Calendar className="h-5 w-5 text-yellow-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{reservas.length}</p>
            <p className="text-sm text-gray-500">Reservas</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'pb-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'info'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Información
          </button>
          <button
            onClick={() => setActiveTab('reservas')}
            className={cn(
              'pb-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'reservas'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Reservas
            {reservasPendientes.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                {reservasPendientes.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reglas')}
            className={cn(
              'pb-4 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'reglas'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            )}
          >
            Reglas
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuración */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración</h3>
            <dl className="space-y-4">
              <div className="flex justify-between">
                <dt className="text-gray-500">Anticipación mínima</dt>
                <dd className="font-medium">{amenity.anticipacionMinima} horas</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Anticipación máxima</dt>
                <dd className="font-medium">{amenity.anticipacionMaxima} horas</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Duración máxima</dt>
                <dd className="font-medium">{amenity.duracionMaxima} horas</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Requiere aprobación</dt>
                <dd className="font-medium">
                  {amenity.requiereAprobacion ? (
                    <span className="text-yellow-600">Sí</span>
                  ) : (
                    <span className="text-green-600">No</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          {/* Acciones */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h3>
            <div className="space-y-3">
              <Link
                href={`/amenities/${amenityId}/editar`}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit className="h-5 w-5" />
                <span>Editar amenity</span>
              </Link>

              <button
                onClick={handleToggleActivo}
                disabled={updateAmenity.isPending}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
              >
                {amenity.activo ? (
                  <>
                    <XCircle className="h-5 w-5 text-orange-500" />
                    <span>Desactivar amenity</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Activar amenity</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDelete}
                disabled={deleteAmenity.isPending}
                className="flex items-center gap-3 w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                <span>Eliminar amenity</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reservas' && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loadingReservas ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : reservas.length === 0 ? (
            <div className="p-12 text-center">
              <Calendar className="h-16 w-16 mx-auto text-gray-300" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">Sin reservas</h3>
              <p className="mt-2 text-gray-500">
                No hay reservas para este amenity todavía
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Horario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reservas.map((reserva) => (
                  <ReservaRow
                    key={reserva.id}
                    reserva={reserva}
                    onAprobar={() => handleAprobarReserva(reserva.id, true)}
                    onRechazar={() => handleAprobarReserva(reserva.id, false)}
                    isPending={procesarReserva.isPending}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'reglas' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Reglas de uso</h3>
            <Link
              href={`/amenities/${amenityId}/reglas`}
              className="text-sm text-primary-600 hover:underline"
            >
              Configurar reglas
            </Link>
          </div>

          <div className="text-center py-8 text-gray-500">
            <Settings className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-2">
              Las reglas de fair use permiten limitar reservas por período, aplicar
              penalizaciones y más.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// Componente fila de reserva
interface ReservaRowProps {
  reserva: Reserva
  onAprobar: () => void
  onRechazar: () => void
  isPending: boolean
}

function ReservaRow({ reserva, onAprobar, onRechazar, isPending }: ReservaRowProps) {
  const config = getEstadoReservaConfig(reserva.estado)
  const fechaInicio = new Date(reserva.fechaInicio)
  const fechaFin = new Date(reserva.fechaFin)

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {reserva.usuario?.nombre} {reserva.usuario?.apellido}
          </p>
          <p className="text-xs text-gray-500">{reserva.usuario?.email}</p>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm text-gray-900">
          {format(fechaInicio, "d 'de' MMMM", { locale: es })}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm text-gray-900">
          {format(fechaInicio, 'HH:mm')} - {format(fechaFin, 'HH:mm')}
        </p>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', config.bgColor)}>
          {config.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        {reserva.estado === 'PENDIENTE' && (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onAprobar}
              disabled={isPending}
              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
              title="Aprobar"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
            <button
              onClick={onRechazar}
              disabled={isPending}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              title="Rechazar"
            >
              <XCircle className="h-5 w-5" />
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}
