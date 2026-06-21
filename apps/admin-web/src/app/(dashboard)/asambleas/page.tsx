'use client'

import {
  Vote,
  Plus,
  Calendar,
  Users,
  Clock,
  CheckCircle,
  PlayCircle,
  Search,
  MapPin,
  Video,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
  useAsambleas,
  type Asamblea,
  type EstadoAsamblea,
  estadoAsambleaLabels,
} from '@/features/asambleas'
import { useConsorcios } from '@/features/consorcios'
import { cn } from '@/lib/utils'

export default function AsambleasPage() {
  const [consorcioId, setConsorcioId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoAsamblea | ''>('')

  const { data: consorciosData } = useConsorcios({ limit: 100 })
  const { data, isLoading } = useAsambleas(consorcioId || undefined, {
    estado: estadoFiltro || undefined,
  })

  const asambleas = data?.data ?? []

  // Filtrar por búsqueda
  const asambleasFiltradas = asambleas.filter(
    (asamblea) =>
      asamblea.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asamblea.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Stats
  const total = asambleas.length
  const programadas = asambleas.filter((a) => a.estado === 'PROGRAMADA').length
  const enCurso = asambleas.filter((a) => a.estado === 'EN_CURSO').length
  const finalizadas = asambleas.filter((a) => a.estado === 'FINALIZADA').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asambleas</h1>
          <p className="text-gray-500 mt-1">
            Gestioná las asambleas de propietarios y votaciones
          </p>
        </div>

        <Link
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
          href="/asambleas/nueva"
        >
          <Plus className="h-4 w-4" />
          Nueva Asamblea
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Vote className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{programadas}</p>
              <p className="text-sm text-gray-500">Programadas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <PlayCircle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{enCurso}</p>
              <p className="text-sm text-gray-500">En curso</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{finalizadas}</p>
              <p className="text-sm text-gray-500">Finalizadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Selector de Consorcio + Búsqueda + Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Selector de consorcio */}
          <div className="flex-1">
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="consorcio"
            >
              Consorcio
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              id="consorcio"
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

          {/* Búsqueda */}
          <div className="flex-1">
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="search"
            >
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                id="search"
                placeholder="Buscar por título..."
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Filtro de estado */}
          <div className="w-full md:w-48">
            <label
              className="block text-sm font-medium text-gray-700 mb-1"
              htmlFor="estado"
            >
              Estado
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              id="estado"
              value={estadoFiltro}
              onChange={(e) =>
                setEstadoFiltro(e.target.value as EstadoAsamblea | '')
              }
            >
              <option value="">Todos</option>
              <option value="PROGRAMADA">Programadas</option>
              <option value="EN_CURSO">En curso</option>
              <option value="FINALIZADA">Finalizadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Asambleas */}
      {!consorcioId ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Vote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Seleccioná un consorcio
          </h3>
          <p className="text-gray-500">
            Elegí un consorcio para ver sus asambleas
          </p>
        </div>
      ) : isLoading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-500 mt-4">Cargando asambleas...</p>
        </div>
      ) : asambleasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Vote className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay asambleas
          </h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || estadoFiltro
              ? 'No se encontraron asambleas con los filtros aplicados'
              : 'Creá la primera asamblea del consorcio'}
          </p>
          <Link
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            href="/asambleas/nueva"
          >
            <Plus className="h-4 w-4" />
            Nueva Asamblea
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {asambleasFiltradas.map((asamblea) => (
            <AsambleaCard asamblea={asamblea} key={asamblea.id} />
          ))}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE DE CARD DE ASAMBLEA
// ============================================================================

function AsambleaCard({ asamblea }: { asamblea: Asamblea }) {
  const fecha = new Date(asamblea.fecha)
  const esFutura = fecha > new Date()
  const esHoy =
    fecha.toDateString() === new Date().toDateString()

  const badgeColors: Record<
    EstadoAsamblea,
    string
  > = {
    PROGRAMADA: 'bg-gray-100 text-gray-700',
    EN_CURSO: 'bg-yellow-100 text-yellow-700',
    FINALIZADA: 'bg-green-100 text-green-700',
    CANCELADA: 'bg-red-100 text-red-700',
  }

  return (
    <Link
      className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
      href={`/asambleas/${asamblea.id}`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Fecha destacada */}
        <div
          className={cn(
            'flex-shrink-0 w-20 h-20 rounded-xl flex flex-col items-center justify-center',
            esHoy
              ? 'bg-primary-100 text-primary-700'
              : esFutura
              ? 'bg-blue-50 text-blue-700'
              : 'bg-gray-100 text-gray-600'
          )}
        >
          <span className="text-2xl font-bold">{fecha.getDate()}</span>
          <span className="text-xs uppercase">
            {fecha.toLocaleString('es-AR', { month: 'short' })}
          </span>
          <span className="text-xs">{fecha.getFullYear()}</span>
        </div>

        {/* Contenido principal */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {asamblea.titulo}
            </h3>
            <span
              className={cn(
                'px-2.5 py-0.5 text-xs font-medium rounded-full',
                badgeColors[asamblea.estado]
              )}
            >
              {estadoAsambleaLabels[asamblea.estado]}
            </span>
            {esHoy && (
              <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary-100 text-primary-700">
                Hoy
              </span>
            )}
          </div>

          {asamblea.descripcion && (
            <p className="text-gray-500 text-sm mb-3 line-clamp-2">
              {asamblea.descripcion}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {fecha.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>

            {asamblea.lugar && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {asamblea.lugar}
              </div>
            )}

            {asamblea.linkVirtual && (
              <div className="flex items-center gap-1.5">
                <Video className="h-4 w-4 text-blue-500" />
                <span className="text-blue-500">Virtual disponible</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              Quórum: {asamblea.quorumRequerido}%
            </div>

            {asamblea.actaUrl && (
              <div className="flex items-center gap-1.5 text-green-600">
                <FileText className="h-4 w-4" />
                Acta disponible
              </div>
            )}
          </div>
        </div>

        {/* Indicador de quórum (si está en curso) */}
        {asamblea.estado === 'EN_CURSO' && asamblea.quorum && (
          <div className="flex-shrink-0">
            <div
              className={cn(
                'px-4 py-2 rounded-lg text-center',
                asamblea.quorum.alcanzado
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              )}
            >
              <p className="text-2xl font-bold">
                {asamblea.quorum.actual.toFixed(1)}%
              </p>
              <p className="text-xs">
                {asamblea.quorum.alcanzado
                  ? 'Quórum alcanzado'
                  : `Falta ${(asamblea.quorumRequerido - asamblea.quorum.actual).toFixed(1)}%`}
              </p>
            </div>
          </div>
        )}
      </div>
    </Link>
  )
}
