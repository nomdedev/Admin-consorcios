'use client'

import {
  ArrowLeft,
  AlertTriangle,
  Send,
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  useCreateAlerta,
  type CreateAlertaDto,
  type TipoEmergencia,
  TIPOS_EMERGENCIA,
  tipoEmergenciaLabels,
  tipoEmergenciaIcons,
  tipoEmergenciaColors,
  getAlertaPrioridad,
} from '@/features/alertas'
import { useAuth } from '@/features/auth'
import { cn } from '@/lib/utils'

export default function NuevaAlertaPage() {
  const router = useRouter()
  const { consorcioId } = useAuth()
  const createAlerta = useCreateAlerta()

  const [tipo, setTipo] = useState<TipoEmergencia>('OTRO')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [instrucciones, setInstrucciones] = useState('')

  // Canales de notificación
  const [enviarPush, setEnviarPush] = useState(true)
  const [enviarEmail, setEnviarEmail] = useState(true)
  const [enviarWhatsapp, setEnviarWhatsapp] = useState(false)
  const [enviarSms, setEnviarSms] = useState(false)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const prioridad = getAlertaPrioridad(tipo)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!titulo.trim()) {
      newErrors.titulo = 'El título es obligatorio'
    } else if (titulo.length < 5) {
      newErrors.titulo = 'El título debe tener al menos 5 caracteres'
    }

    if (!descripcion.trim()) {
      newErrors.descripcion = 'La descripción es obligatoria'
    } else if (descripcion.length < 10) {
      newErrors.descripcion = 'La descripción debe tener al menos 10 caracteres'
    }

    if (!enviarPush && !enviarEmail && !enviarWhatsapp && !enviarSms) {
      newErrors.canales = 'Debés seleccionar al menos un canal de notificación'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return
    if (!consorcioId) return

    const data: CreateAlertaDto = {
      consorcioId,
      tipo,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      instrucciones: instrucciones.trim() || undefined,
      enviarPush,
      enviarEmail,
      enviarWhatsapp,
      enviarSms,
    }

    try {
      const alerta = await createAlerta.mutateAsync(data)
      router.push(`/alertas/${alerta.id}`)
    } catch (error) {
      console.error('Error al crear alerta:', error)
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
          aria-label="Volver a alertas"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          href="/alertas"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Emergencia</h1>
          <p className="text-gray-500 mt-1">
            Enviar alerta de emergencia a todos los vecinos
          </p>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex gap-3">
        <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
        <div>
          <p className="font-semibold text-red-800">
            ⚠️ Esta acción enviará notificaciones a TODOS los vecinos
          </p>
          <p className="text-sm text-red-600 mt-1">
            Asegurate de que sea una emergencia real antes de continuar.
            El uso indebido puede generar desconfianza en el sistema de alertas.
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Tipo de emergencia */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tipo de Emergencia
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TIPOS_EMERGENCIA.map((t) => (
              <button
                className={cn(
                  'p-4 rounded-xl border-2 transition-all text-center',
                  tipo === t
                    ? tipoEmergenciaColors[t] + ' border-current'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                key={t}
                type="button"
                onClick={() => setTipo(t)}
              >
                <span className="text-3xl block mb-2">{tipoEmergenciaIcons[t]}</span>
                <span className="text-sm font-medium">{tipoEmergenciaLabels[t]}</span>
              </button>
            ))}
          </div>

          {/* Prioridad indicator */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-gray-500">Prioridad:</span>
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium',
                prioridad === 'critica'
                  ? 'bg-red-100 text-red-700'
                  : prioridad === 'alta'
                  ? 'bg-orange-100 text-orange-700'
                  : 'bg-yellow-100 text-yellow-700'
              )}
            >
              {prioridad.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Contenido del Mensaje
          </h2>

          <div className="space-y-4">
            {/* Título */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="titulo"
              >
                Título de la alerta *
              </label>
              <input
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent',
                  errors.titulo ? 'border-red-500' : 'border-gray-300'
                )}
                id="titulo"
                placeholder="Ej: ⚠️ CORTE DE AGUA URGENTE"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              {errors.titulo && (
                <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="descripcion"
              >
                Descripción detallada *
              </label>
              <textarea
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent',
                  errors.descripcion ? 'border-red-500' : 'border-gray-300'
                )}
                id="descripcion"
                placeholder="Describí la situación con el mayor detalle posible..."
                rows={4}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              {errors.descripcion && (
                <p className="text-red-500 text-sm mt-1">{errors.descripcion}</p>
              )}
            </div>

            {/* Instrucciones */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="instrucciones"
              >
                Instrucciones para los vecinos (opcional)
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                id="instrucciones"
                placeholder="Ej: Por favor cerrar canillas y llaves de paso..."
                rows={3}
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Canales de notificación */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Canales de Notificación
          </h2>

          {errors.canales && (
            <p className="text-red-500 text-sm mb-4">{errors.canales}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Push */}
            <button
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-center',
                enviarPush
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              type="button"
              onClick={() => setEnviarPush(!enviarPush)}
            >
              <Bell className={cn('h-8 w-8 mx-auto mb-2', enviarPush ? 'text-primary-600' : 'text-gray-400')} />
              <span className="text-sm font-medium block">Push</span>
              <span className="text-xs text-gray-500">Instantáneo</span>
            </button>

            {/* Email */}
            <button
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-center',
                enviarEmail
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              type="button"
              onClick={() => setEnviarEmail(!enviarEmail)}
            >
              <Mail className={cn('h-8 w-8 mx-auto mb-2', enviarEmail ? 'text-primary-600' : 'text-gray-400')} />
              <span className="text-sm font-medium block">Email</span>
              <span className="text-xs text-gray-500">Incluido</span>
            </button>

            {/* WhatsApp */}
            <button
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-center',
                enviarWhatsapp
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              type="button"
              onClick={() => setEnviarWhatsapp(!enviarWhatsapp)}
            >
              <MessageCircle className={cn('h-8 w-8 mx-auto mb-2', enviarWhatsapp ? 'text-green-600' : 'text-gray-400')} />
              <span className="text-sm font-medium block">WhatsApp</span>
              <span className="text-xs text-orange-600">Costo extra</span>
            </button>

            {/* SMS */}
            <button
              className={cn(
                'p-4 rounded-xl border-2 transition-all text-center',
                enviarSms
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
              type="button"
              onClick={() => setEnviarSms(!enviarSms)}
            >
              <Smartphone className={cn('h-8 w-8 mx-auto mb-2', enviarSms ? 'text-blue-600' : 'text-gray-400')} />
              <span className="text-sm font-medium block">SMS</span>
              <span className="text-xs text-orange-600">Costo extra</span>
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Sobre las notificaciones</p>
            <p className="mt-1">
              Push y Email están incluidos en el plan. WhatsApp y SMS tienen costo 
              adicional por mensaje enviado.
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <Link
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            href="/alertas"
          >
            Cancelar
          </Link>
          <button
            className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 rounded-lg transition-colors flex items-center gap-2"
            disabled={createAlerta.isPending}
            type="submit"
          >
            {createAlerta.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Alerta
              </>
            )}
          </button>
        </div>

        {createAlerta.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error al enviar la alerta. Por favor intentá de nuevo.
          </div>
        )}
      </form>
    </div>
  )
}
