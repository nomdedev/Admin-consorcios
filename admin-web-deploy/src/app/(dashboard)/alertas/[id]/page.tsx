'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Shield,
  AlertCircle,
} from 'lucide-react'

import { cn, formatDate } from '@/lib/utils'
import {
  useAlerta,
  useResolverAlerta,
  tipoEmergenciaLabels,
  tipoEmergenciaColors,
  tipoEmergenciaIcons,
  formatTiempoTranscurrido,
  getAlertaPrioridad,
} from '@/features/alertas'

export default function AlertaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const alertaId = params.id as string

  const { data: alerta, isLoading, error } = useAlerta(alertaId)
  const resolverAlerta = useResolverAlerta()

  const [showResolverModal, setShowResolverModal] = useState(false)
  const [resolucion, setResolucion] = useState('')

  const handleResolver = async () => {
    if (resolucion.length < 10) return

    try {
      await resolverAlerta.mutateAsync({
        id: alertaId,
        data: { resolucion: resolucion.trim() },
      })
      setShowResolverModal(false)
    } catch (error) {
      console.error('Error al resolver:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (error || !alerta) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">
          Alerta no encontrada
        </h2>
        <p className="text-gray-500 mt-2">
          La alerta que buscás no existe
        </p>
        <Link
          href="/alertas"
          className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al panel
        </Link>
      </div>
    )
  }

  const prioridad = getAlertaPrioridad(alerta.tipo)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/alertas"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Volver al panel"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{tipoEmergenciaIcons[alerta.tipo]}</span>
              <h1 className="text-2xl font-bold text-gray-900">{alerta.titulo}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  tipoEmergenciaColors[alerta.tipo]
                )}
              >
                {tipoEmergenciaLabels[alerta.tipo]}
              </span>
              {alerta.activa ? (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium animate-pulse">
                  🔴 ACTIVA
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  ✅ RESUELTA
                </span>
              )}
              <span
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  prioridad === 'critica'
                    ? 'bg-red-100 text-red-700'
                    : prioridad === 'alta'
                    ? 'bg-orange-100 text-orange-700'
                    : 'bg-yellow-100 text-yellow-700'
                )}
              >
                Prioridad: {prioridad}
              </span>
            </div>
          </div>
        </div>

        {alerta.activa && (
          <button
            onClick={() => setShowResolverModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Marcar como resuelta
          </button>
        )}
      </div>

      {/* Active Alert Banner */}
      {alerta.activa && (
        <div className={cn(
          'rounded-xl p-4 border-2',
          prioridad === 'critica'
            ? 'bg-red-50 border-red-300'
            : prioridad === 'alta'
            ? 'bg-orange-50 border-orange-300'
            : 'bg-yellow-50 border-yellow-300'
        )}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn(
              'h-6 w-6 animate-pulse',
              prioridad === 'critica'
                ? 'text-red-600'
                : prioridad === 'alta'
                ? 'text-orange-600'
                : 'text-yellow-600'
            )} />
            <div>
              <p className="font-semibold">Emergencia activa</p>
              <p className="text-sm">
                Creada {formatTiempoTranscurrido(alerta.createdAt)}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Descripción
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{alerta.descripcion}</p>

            {alerta.instrucciones && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">
                  📋 Instrucciones para vecinos
                </h3>
                <p className="text-blue-800">{alerta.instrucciones}</p>
              </div>
            )}
          </div>

          {/* Resolución */}
          {alerta.resolucion && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-green-900">
                    Resolución
                  </h2>
                  <p className="text-green-800 mt-2">{alerta.resolucion}</p>
                  <p className="text-sm text-green-600 mt-2">
                    Resuelta el {formatDate(new Date(alerta.resueltaAt!))}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Notificaciones
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Destinatarios</span>
                <span className="font-medium">{alerta.destinatariosTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Exitosos</span>
                <span className="font-medium text-green-600">{alerta.enviosExitosos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Fallidos</span>
                <span className="font-medium text-red-600">{alerta.enviosFallidos}</span>
              </div>

              {/* Progress bar */}
              <div className="pt-2">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{
                      width: `${alerta.destinatariosTotal > 0 ? (alerta.enviosExitosos / alerta.destinatariosTotal) * 100 : 0}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  {alerta.destinatariosTotal > 0
                    ? Math.round((alerta.enviosExitosos / alerta.destinatariosTotal) * 100)
                    : 0}% entregados
                </p>
              </div>
            </div>
          </div>

          {/* Canales */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary-600" />
              Canales utilizados
            </h2>

            <div className="space-y-3">
              <div className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                alerta.enviadoPush ? 'bg-green-50' : 'bg-gray-50'
              )}>
                <Bell className={cn(
                  'h-5 w-5',
                  alerta.enviadoPush ? 'text-green-600' : 'text-gray-400'
                )} />
                <span className={alerta.enviadoPush ? 'text-green-700' : 'text-gray-500'}>
                  Push Notifications
                </span>
                {alerta.enviadoPush && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
              </div>

              <div className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                alerta.enviadoEmail ? 'bg-green-50' : 'bg-gray-50'
              )}>
                <Mail className={cn(
                  'h-5 w-5',
                  alerta.enviadoEmail ? 'text-green-600' : 'text-gray-400'
                )} />
                <span className={alerta.enviadoEmail ? 'text-green-700' : 'text-gray-500'}>
                  Email
                </span>
                {alerta.enviadoEmail && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
              </div>

              <div className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                alerta.enviadoWhatsapp ? 'bg-green-50' : 'bg-gray-50'
              )}>
                <MessageCircle className={cn(
                  'h-5 w-5',
                  alerta.enviadoWhatsapp ? 'text-green-600' : 'text-gray-400'
                )} />
                <span className={alerta.enviadoWhatsapp ? 'text-green-700' : 'text-gray-500'}>
                  WhatsApp
                </span>
                {alerta.enviadoWhatsapp && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
              </div>

              <div className={cn(
                'flex items-center gap-3 p-2 rounded-lg',
                alerta.enviadoSms ? 'bg-green-50' : 'bg-gray-50'
              )}>
                <Smartphone className={cn(
                  'h-5 w-5',
                  alerta.enviadoSms ? 'text-green-600' : 'text-gray-400'
                )} />
                <span className={alerta.enviadoSms ? 'text-green-700' : 'text-gray-500'}>
                  SMS
                </span>
                {alerta.enviadoSms && <CheckCircle className="h-4 w-4 text-green-600 ml-auto" />}
              </div>
            </div>
          </div>

          {/* Fechas */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600" />
              Timeline
            </h2>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div>
                  <p className="text-sm font-medium">Creada</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(new Date(alerta.createdAt))}
                  </p>
                </div>
              </div>

              {alerta.resueltaAt && (
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Resuelta</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(new Date(alerta.resueltaAt))}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resolver Modal */}
      {showResolverModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Resolver Emergencia
            </h3>
            <p className="text-gray-500 mt-2">
              Describí cómo se resolvió la situación. Esta información se 
              notificará a todos los vecinos.
            </p>

            <textarea
              value={resolucion}
              onChange={(e) => setResolucion(e.target.value)}
              rows={4}
              placeholder="Ej: Se reparó el caño principal. El servicio de agua ha sido restablecido."
              className="w-full mt-4 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            {resolucion.length > 0 && resolucion.length < 10 && (
              <p className="text-orange-500 text-sm mt-1">
                Mínimo 10 caracteres
              </p>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowResolverModal(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResolver}
                disabled={resolverAlerta.isPending || resolucion.length < 10}
                className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 disabled:bg-green-300 rounded-lg transition-colors"
              >
                {resolverAlerta.isPending ? 'Guardando...' : 'Marcar como resuelta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
