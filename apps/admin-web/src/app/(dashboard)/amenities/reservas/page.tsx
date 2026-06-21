'use client'

import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Calendar,
  Search,
  Building2,
  User,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
  useReservas,
  useAmenities,
  useProcesarReserva,
  useCancelarReserva,
  getEstadoReservaConfig,
  type Reserva,
  type EstadoReserva,
} from '@/features/amenities'
import { cn } from '@/lib/utils'

type FilterEstado = EstadoReserva | 'TODAS'

export default function ReservasPage() {
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<FilterEstado>('TODAS')
  const [filterAmenity, setFilterAmenity] = useState<string>('')

  const { data: reservasData, isLoading } = useReservas({
    estado: filterEstado !== 'TODAS' ? filterEstado : undefined,
    amenityId: filterAmenity || undefined,
    limit: 50,
  })

  const { data: amenitiesData } = useAmenities()

  const procesarReserva = useProcesarReserva()
  const cancelarReserva = useCancelarReserva()

  const reservas = reservasData?.data ?? []
  const amenities = amenitiesData ?? []

  // Filtrar por búsqueda
  const filteredReservas = reservas.filter((r) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      r.usuario?.nombre?.toLowerCase().includes(searchLower) ||
      r.usuario?.apellido?.toLowerCase().includes(searchLower) ||
      r.amenity?.nombre?.toLowerCase().includes(searchLower) ||
      r.motivo?.toLowerCase().includes(searchLower)
    )
  })

  // Stats
  const stats = {
    total: reservas.length,
    pendientes: reservas.filter((r) => r.estado === 'PENDIENTE').length,
    aprobadas: reservas.filter((r) => r.estado === 'APROBADA').length,
    rechazadas: reservas.filter((r) => r.estado === 'RECHAZADA').length,
  }

  const handleAprobar = async (id: string) => {
    await procesarReserva.mutateAsync({ id, aprobada: true })
  }

  const handleRechazar = async (id: string) => {
    await procesarReserva.mutateAsync({ id, aprobada: false })
  }

  const handleCancelar = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar esta reserva?')) return
    await cancelarReserva.mutateAsync(id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
          <p className="text-gray-500">Gestión de reservas de amenities</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendientes}</p>
              <p className="text-sm text-gray-500">Pendientes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.aprobadas}</p>
              <p className="text-sm text-gray-500">Aprobadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.rechazadas}</p>
              <p className="text-sm text-gray-500">Rechazadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <label className="sr-only" htmlFor="buscar-reservas">
              Buscar por usuario, amenity o motivo
            </label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              id="buscar-reservas"
              placeholder="Buscar por usuario, amenity o motivo..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Filter by estado */}
          <div>
            <label className="sr-only" htmlFor="filtro-estado">
              Filtrar por estado
            </label>
            <select
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              id="filtro-estado"
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value as FilterEstado)}
            >
              <option value="TODAS">Todos los estados</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="APROBADA">Aprobadas</option>
              <option value="RECHAZADA">Rechazadas</option>
              <option value="CANCELADA">Canceladas</option>
              <option value="COMPLETADA">Completadas</option>
              <option value="NO_SHOW">No show</option>
            </select>
          </div>

          {/* Filter by amenity */}
          <div>
            <label className="sr-only" htmlFor="filtro-amenity">
              Filtrar por amenity
            </label>
            <select
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
              id="filtro-amenity"
              value={filterAmenity}
              onChange={(e) => setFilterAmenity(e.target.value)}
            >
              <option value="">Todos los amenities</option>
              {amenities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de reservas */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-500">Cargando reservas...</p>
          </div>
        ) : filteredReservas.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-16 w-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Sin reservas</h3>
            <p className="mt-2 text-gray-500">
              {search || filterEstado !== 'TODAS' || filterAmenity
                ? 'No se encontraron reservas con los filtros aplicados'
                : 'No hay reservas registradas todavía'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Amenity
                  </th>
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
                {filteredReservas.map((reserva) => (
                  <ReservaRow
                    isPending={procesarReserva.isPending || cancelarReserva.isPending}
                    key={reserva.id}
                    reserva={reserva}
                    onAprobar={() => handleAprobar(reserva.id)}
                    onCancelar={() => handleCancelar(reserva.id)}
                    onRechazar={() => handleRechazar(reserva.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente fila de reserva
interface ReservaRowProps {
  reserva: Reserva
  onAprobar: () => void
  onRechazar: () => void
  onCancelar: () => void
  isPending: boolean
}

function ReservaRow({ reserva, onAprobar, onRechazar, onCancelar, isPending }: ReservaRowProps) {
  const config = getEstadoReservaConfig(reserva.estado)
  const fechaInicio = new Date(reserva.fechaInicio)
  const fechaFin = new Date(reserva.fechaFin)

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <Link
          className="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-primary-600"
          href={`/amenities/${reserva.amenityId}`}
        >
          <Building2 className="h-4 w-4 text-gray-400" />
          {reserva.amenity?.nombre || 'N/A'}
          <ExternalLink className="h-3 w-3" />
        </Link>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {reserva.usuario?.nombre} {reserva.usuario?.apellido}
            </p>
            <p className="text-xs text-gray-500">{reserva.usuario?.email}</p>
          </div>
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm text-gray-900">
          {format(fechaInicio, "EEE d 'de' MMM", { locale: es })}
        </p>
        <p className="text-xs text-gray-500">
          {format(fechaInicio, 'yyyy')}
        </p>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <p className="text-sm text-gray-900">
          {format(fechaInicio, 'HH:mm')} - {format(fechaFin, 'HH:mm')}
        </p>
        {reserva.motivo && (
          <p className="text-xs text-gray-500 truncate max-w-[150px]" title={reserva.motivo}>
            {reserva.motivo}
          </p>
        )}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={cn('px-2.5 py-1 text-xs font-medium rounded-full', config.bgColor)}>
          {config.label}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-right">
        {reserva.estado === 'PENDIENTE' ? (
          <div className="flex items-center justify-end gap-2">
            <button
              className="px-3 py-1.5 text-xs font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors disabled:opacity-50"
              disabled={isPending}
              onClick={onAprobar}
            >
              Aprobar
            </button>
            <button
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
              disabled={isPending}
              onClick={onRechazar}
            >
              Rechazar
            </button>
          </div>
        ) : reserva.estado === 'APROBADA' ? (
          <button
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            disabled={isPending}
            onClick={onCancelar}
          >
            Cancelar
          </button>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>
    </tr>
  )
}
