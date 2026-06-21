'use client'

import {
  Building2,
  Plus,
  Search,
  Star,
  Phone,
  Mail,
  Wrench,
  BadgeCheck,
  Briefcase,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { useConsorcios } from '@/features/consorcios'
import {
  useProveedores,
  useProveedoresConsorcio,
  useServiciosDisponibles,
  type Proveedor,
  servicioLabels,
} from '@/features/proveedores'
import { cn } from '@/lib/utils'

export default function ProveedoresPage() {
  const [consorcioId, setConsorcioId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [servicioFiltro, setServicioFiltro] = useState('')
  const [soloVerificados, setSoloVerificados] = useState(false)
  const [vistaMarketplace, setVistaMarketplace] = useState(true)

  const { data: consorciosData } = useConsorcios({ limit: 100 })
  const { data: servicios } = useServiciosDisponibles()

  // Según la vista, usamos marketplace o proveedores del consorcio
  const { data: dataMarketplace, isLoading: loadingMarketplace } = useProveedores({
    busqueda: searchTerm || undefined,
    servicio: servicioFiltro || undefined,
    verificado: soloVerificados || undefined,
    activo: true,
  })

  const { data: dataConsorcio, isLoading: loadingConsorcio } = useProveedoresConsorcio(
    vistaMarketplace ? undefined : consorcioId || undefined,
    {
      busqueda: searchTerm || undefined,
      servicio: servicioFiltro || undefined,
    }
  )

  const proveedores = vistaMarketplace
    ? dataMarketplace?.data ?? []
    : dataConsorcio?.data ?? []
  const isLoading = vistaMarketplace ? loadingMarketplace : loadingConsorcio

  // Filtrar por búsqueda local
  const proveedoresFiltrados = proveedores.filter(
    (p) =>
      p.razonSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.cuit.includes(searchTerm)
  )

  // Stats
  const total = proveedores.length
  const verificados = proveedores.filter((p) => p.verificado).length
  const conCalificacion = proveedores.filter((p) => p.puntuacionPromedio).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-500 mt-1">
            Marketplace de proveedores para tu consorcio
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            href="/proveedores/trabajos"
          >
            <Briefcase className="h-4 w-4" />
            Ver Trabajos
          </Link>
          <Link
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            href="/proveedores/nuevo"
          >
            <Plus className="h-4 w-4" />
            Nuevo Proveedor
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
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <BadgeCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{verificados}</p>
              <p className="text-sm text-gray-500">Verificados</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{conCalificacion}</p>
              <p className="text-sm text-gray-500">Con calificación</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wrench className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {servicios?.length ?? 0}
              </p>
              <p className="text-sm text-gray-500">Servicios</p>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle vista + filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Toggle marketplace / mis proveedores */}
          <div className="flex-shrink-0">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  vistaMarketplace
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                onClick={() => setVistaMarketplace(true)}
              >
                Marketplace
              </button>
              <button
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-md transition-colors',
                  !vistaMarketplace
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
                onClick={() => setVistaMarketplace(false)}
              >
                Mis Proveedores
              </button>
            </div>
          </div>

          {/* Selector de consorcio (solo mis proveedores) */}
          {!vistaMarketplace && (
            <div className="flex-1 max-w-xs">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={consorcioId}
                onChange={(e) => setConsorcioId(e.target.value)}
              >
                <option value="">Seleccionar consorcio...</option>
                {consorciosData?.data?.map((consorcio) => (
                  <option key={consorcio.id} value={consorcio.id}>
                    {consorcio.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Búsqueda */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Buscar por nombre o CUIT..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro de servicio */}
          <div className="w-full md:w-48">
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={servicioFiltro}
              onChange={(e) => setServicioFiltro(e.target.value)}
            >
              <option value="">Todos los servicios</option>
              {servicios?.map((servicio) => (
                <option key={servicio} value={servicio}>
                  {servicioLabels[servicio] || servicio}
                </option>
              ))}
            </select>
          </div>

          {/* Solo verificados */}
          {vistaMarketplace && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                checked={soloVerificados}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                type="checkbox"
                onChange={(e) => setSoloVerificados(e.target.checked)}
              />
              <span className="text-sm text-gray-700">Solo verificados</span>
            </label>
          )}
        </div>
      </div>

      {/* Lista de Proveedores */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-500 mt-4">Cargando proveedores...</p>
        </div>
      ) : proveedoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay proveedores
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || servicioFiltro
              ? 'No se encontraron proveedores con los filtros aplicados'
              : vistaMarketplace
              ? 'Aún no hay proveedores en el marketplace'
              : 'No tenés proveedores asociados a este consorcio'}
          </p>
          <Link
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            href="/proveedores/nuevo"
          >
            <Plus className="h-4 w-4" />
            Agregar Proveedor
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {proveedoresFiltrados.map((proveedor) => (
            <ProveedorCard key={proveedor.id} proveedor={proveedor} />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE DE CARD DE PROVEEDOR
// ============================================================================

function ProveedorCard({ proveedor }: { proveedor: Proveedor }) {
  return (
    <Link
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-primary-300 hover:shadow-md transition-all"
      href={`/proveedores/${proveedor.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 line-clamp-1">
              {proveedor.razonSocial}
            </h3>
            <p className="text-sm text-gray-500">{proveedor.cuit}</p>
          </div>
        </div>

        {proveedor.verificado && (
          <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            <BadgeCheck className="h-3 w-3" />
            Verificado
          </span>
        )}
      </div>

      {/* Servicios */}
      <div className="mb-3">
        <div className="flex flex-wrap gap-1">
          {proveedor.servicios.slice(0, 3).map((servicio) => (
            <span
              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
              key={servicio}
            >
              {servicioLabels[servicio] || servicio}
            </span>
          ))}
          {proveedor.servicios.length > 3 && (
            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
              +{proveedor.servicios.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Rating y contacto */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1">
          {proveedor.puntuacionPromedio ? (
            <>
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="font-medium text-gray-900">
                {proveedor.puntuacionPromedio.toFixed(1)}
              </span>
              <span className="text-gray-500">
                ({proveedor.cantidadResenas})
              </span>
            </>
          ) : (
            <span className="text-gray-400">Sin calificación</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-gray-400">
          {proveedor.email && <Mail className="h-4 w-4" />}
          {proveedor.telefono && <Phone className="h-4 w-4" />}
        </div>
      </div>

      {/* Asociación (favorito) */}
      {proveedor.asociacion?.esFavorito && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <Star className="h-3 w-3 fill-yellow-400" />
            Favorito
          </span>
        </div>
      )}
    </Link>
  )
}
