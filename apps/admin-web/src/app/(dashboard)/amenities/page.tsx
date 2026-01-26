'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Calendar,
  Users,
  Clock,
  DollarSign,
  Settings,
  CheckCircle,
  XCircle,
  MoreVertical,
  Search,
} from 'lucide-react'

import { cn, formatCurrency } from '@/lib/utils'
import { useAmenities, type Amenity } from '@/features/amenities'

export default function AmenitiesPage() {
  const [consorcioId, setConsorcioId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data: amenities, isLoading } = useAmenities(consorcioId || undefined)

  // Filtrar por búsqueda
  const amenitiesFiltrados = (amenities ?? []).filter(
    (amenity) =>
      amenity.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      amenity.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const totalAmenities = amenities?.length ?? 0
  const activos = amenities?.filter((a) => a.activo).length ?? 0
  const conCosto = amenities?.filter((a) => a.costoReserva && a.costoReserva > 0).length ?? 0
  const requierenAprobacion = amenities?.filter((a) => a.requiereAprobacion).length ?? 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Amenities</h1>
          <p className="text-gray-500 mt-1">
            Gestioná los espacios comunes y sus reservas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/amenities/reservas"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Calendar className="h-4 w-4" />
            Ver Reservas
          </Link>
          <Link
            href="/amenities/nuevo"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Amenity
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalAmenities}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{activos}</p>
              <p className="text-sm text-gray-500">Activos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <DollarSign className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{conCosto}</p>
              <p className="text-sm text-gray-500">Con costo</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{requierenAprobacion}</p>
              <p className="text-sm text-gray-500">Requieren aprobación</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Amenities */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-500">Cargando amenities...</p>
        </div>
      ) : amenitiesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="h-16 w-16 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No hay amenities</h3>
          <p className="mt-2 text-gray-500">
            {searchTerm
              ? 'No se encontraron amenities con ese criterio'
              : 'Creá el primer amenity para comenzar'}
          </p>
          {!searchTerm && (
            <Link
              href="/amenities/nuevo"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <Plus className="h-4 w-4" />
              Crear Amenity
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenitiesFiltrados.map((amenity) => (
            <AmenityCard key={amenity.id} amenity={amenity} />
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de tarjeta de amenity
function AmenityCard({ amenity }: { amenity: Amenity }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Header con imagen placeholder */}
      <div className="h-32 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
        <Building2 className="h-12 w-12 text-white/80" />
      </div>

      {/* Contenido */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{amenity.nombre}</h3>
            {amenity.descripcion && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{amenity.descripcion}</p>
            )}
          </div>
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

        {/* Info */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
          {amenity.capacidad && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-4 w-4" />
              <span>{amenity.capacidad} personas</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Máx {amenity.duracionMaxima}hs</span>
          </div>
          {amenity.costoReserva && amenity.costoReserva > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span>{formatCurrency(amenity.costoReserva)}</span>
            </div>
          )}
          {amenity.requiereAprobacion && (
            <div className="flex items-center gap-2 text-yellow-600">
              <CheckCircle className="h-4 w-4" />
              <span>Requiere aprobación</span>
            </div>
          )}
        </div>

        {/* Reglas */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          <span>Anticipación: {amenity.anticipacionMinima}h - {amenity.anticipacionMaxima}h</span>
          {amenity._count && (
            <span>{amenity._count.reservas} reservas</span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 mt-4">
          <Link
            href={`/amenities/${amenity.id}`}
            className="flex-1 px-3 py-2 text-sm font-medium text-center text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Ver detalle
          </Link>
          <Link
            href={`/amenities/${amenity.id}/reservar`}
            className="flex-1 px-3 py-2 text-sm font-medium text-center text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          >
            Reservar
          </Link>
        </div>
      </div>
    </div>
  )
}
