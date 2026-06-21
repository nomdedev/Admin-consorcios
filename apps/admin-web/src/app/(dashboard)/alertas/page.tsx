'use client'

import {
  AlertTriangle,
  Bell,
  CheckCircle,
  Clock,
  Users,
  Filter,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import {
  useAlertas,
  useAlertasActivas,
  type AlertaEmergencia,
  type TipoEmergencia,
  TIPOS_EMERGENCIA,
  tipoEmergenciaLabels,
  tipoEmergenciaColors,
  tipoEmergenciaIcons,
  formatTiempoTranscurrido,
  getAlertaPrioridad,
} from '@/features/alertas'
import { useAuth } from '@/features/auth'
import { cn, formatDate } from '@/lib/utils'

export default function AlertasPage() {
  const { consorcioId } = useAuth()
  const [filtroTipo, setFiltroTipo] = useState<TipoEmergencia | ''>('')
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'resueltas'>('todas')

  const { data: alertas, isLoading, refetch } = useAlertas(consorcioId ?? '', {
    tipo: filtroTipo || undefined,
    activa: filtroEstado === 'todas' ? undefined : filtroEstado === 'activas',
  })

  const { data: alertasActivas } = useAlertasActivas(consorcioId ?? '')

  const totalActivas = alertasActivas?.length || 0
  const totalResueltas = alertas?.filter((a) => !a.activa).length || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Panel de Emergencias
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de alertas y comunicaciones de emergencia
          </p>
        </div>
        <Link
          className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          href="/alertas/nueva"
        >
          <AlertTriangle className="h-4 w-4" />
          Nueva Emergencia
        </Link>
      </div>

      {/* Alertas Activas Banner */}
      {totalActivas > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg animate-pulse">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-red-800">
                {totalActivas} {totalActivas === 1 ? 'emergencia activa' : 'emergencias activas'}
              </p>
              <p className="text-sm text-red-600">
                Requieren atención inmediata
              </p>
            </div>
            <button
              className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
              title="Actualizar"
              onClick={() => refetch()}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{totalActivas}</p>
              <p className="text-sm text-gray-500">Activas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{totalResueltas}</p>
              <p className="text-sm text-gray-500">Resueltas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{alertas?.length || 0}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {alertas?.reduce((acc, a) => acc + a.destinatariosTotal, 0) || 0}
              </p>
              <p className="text-sm text-gray-500">Notificados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as TipoEmergencia | '')}
            >
              <option value="">Todos los tipos</option>
              {TIPOS_EMERGENCIA.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipoEmergenciaIcons[tipo]} {tipoEmergenciaLabels[tipo]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            {(['todas', 'activas', 'resueltas'] as const).map((estado) => (
              <button
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-colors capitalize',
                  filtroEstado === estado
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                key={estado}
                onClick={() => setFiltroEstado(estado)}
              >
                {estado}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alertas List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          </div>
        ) : alertas?.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-gray-900 font-medium">Sin emergencias</p>
            <p className="text-gray-500 text-sm mt-1">
              No hay alertas registradas para los filtros seleccionados
            </p>
          </div>
        ) : (
          alertas?.map((alerta) => (
            <AlertaCard alerta={alerta} key={alerta.id} />
          ))
        )}
      </div>
    </div>
  )
}

function AlertaCard({ alerta }: { alerta: AlertaEmergencia }) {
  const prioridad = getAlertaPrioridad(alerta.tipo)

  return (
    <Link
      className={cn(
        'block bg-white rounded-xl border-2 p-6 transition-all hover:shadow-md',
        alerta.activa
          ? prioridad === 'critica'
            ? 'border-red-400 bg-red-50'
            : prioridad === 'alta'
            ? 'border-orange-300 bg-orange-50'
            : 'border-yellow-300 bg-yellow-50'
          : 'border-gray-200'
      )}
      href={`/alertas/${alerta.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'p-3 rounded-xl text-2xl',
            alerta.activa ? 'animate-pulse' : '',
            tipoEmergenciaColors[alerta.tipo]
          )}
        >
          {tipoEmergenciaIcons[alerta.tipo]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{alerta.titulo}</h3>
            {alerta.activa ? (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">
                ACTIVA
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                RESUELTA
              </span>
            )}
          </div>

          <p className="text-gray-600 mt-1 line-clamp-2">{alerta.descripcion}</p>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium',
                tipoEmergenciaColors[alerta.tipo]
              )}
            >
              {tipoEmergenciaLabels[alerta.tipo]}
            </span>

            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatTiempoTranscurrido(alerta.createdAt)}
            </span>

            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {alerta.enviosExitosos}/{alerta.destinatariosTotal} notificados
            </span>

            {/* Canales usados */}
            <div className="flex items-center gap-1">
              {alerta.enviadoPush && <span title="Push">📱</span>}
              {alerta.enviadoEmail && <span title="Email">📧</span>}
              {alerta.enviadoWhatsapp && <span title="WhatsApp">💬</span>}
              {alerta.enviadoSms && <span title="SMS">📲</span>}
            </div>
          </div>

          {alerta.resolucion && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Resolución:</strong> {alerta.resolucion}
              </p>
              <p className="text-xs text-green-600 mt-1">
                Resuelta: {formatDate(new Date(alerta.resueltaAt!))}
              </p>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
