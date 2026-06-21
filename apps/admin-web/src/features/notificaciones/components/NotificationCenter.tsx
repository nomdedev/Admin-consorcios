'use client'

import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Bell,
  BellOff,
  CheckCheck,
  CreditCard,
  FileText,
  MessageCircle,
  Users,
  Clock,
  AlertTriangle,
  Settings,
  Trash2,
  X,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  useNotificaciones,
  useContadorNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
  useEliminarNotificacion,
  type Notificacion,
  type TipoNotificacion,
  getNotificacionConfig,
  getNotificacionUrl,
} from '@/features/notificaciones'
import { cn } from '@/lib/utils'

// Mapeo de iconos por tipo
const iconMap: Record<TipoNotificacion, React.ElementType> = {
  PAGO: CreditCard,
  EXPENSA: FileText,
  RECLAMO: MessageCircle,
  COMUNICADO: Bell,
  ASAMBLEA: Users,
  VENCIMIENTO: Clock,
  EMERGENCIA: AlertTriangle,
  SISTEMA: Settings,
}

// Colores de fondo por tipo
const bgColorMap: Record<TipoNotificacion, string> = {
  PAGO: 'bg-green-100 text-green-700',
  EXPENSA: 'bg-blue-100 text-blue-700',
  RECLAMO: 'bg-orange-100 text-orange-700',
  COMUNICADO: 'bg-purple-100 text-purple-700',
  ASAMBLEA: 'bg-indigo-100 text-indigo-700',
  VENCIMIENTO: 'bg-yellow-100 text-yellow-700',
  EMERGENCIA: 'bg-red-100 text-red-700',
  SISTEMA: 'bg-gray-100 text-gray-700',
}

interface NotificationCenterProps {
  className?: string
}

export function NotificationCenter({ className }: NotificationCenterProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)

  // Queries
  const { data: contadorData } = useContadorNotificaciones()
  const { data: notificacionesData, isLoading } = useNotificaciones({
    page: 1,
    limit: 10,
  })

  // Mutations
  const marcarLeida = useMarcarLeida()
  const marcarTodasLeidas = useMarcarTodasLeidas()
  const eliminar = useEliminarNotificacion()

  const noLeidas = contadorData?.noLeidas ?? 0
  const notificaciones = notificacionesData?.data ?? []

  const handleNotificacionClick = (notificacion: Notificacion) => {
    // Marcar como leída si no lo está
    if (!notificacion.leida) {
      marcarLeida.mutate(notificacion.id)
    }

    // Navegar al recurso si tiene referencia
    const url = getNotificacionUrl(notificacion)
    if (url) {
      router.push(url)
      setIsOpen(false)
    }
  }

  const handleMarcarTodasLeidas = () => {
    marcarTodasLeidas.mutate()
  }

  const handleEliminar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    eliminar.mutate(id)
  }

  return (
    <div className={cn('relative', className)}>
      {/* Botón de notificaciones */}
      <button
        aria-label={`Notificaciones${noLeidas > 0 ? ` (${noLeidas} sin leer)` : ''}`}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {noLeidas > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <>
          {/* Overlay para cerrar al hacer clic fuera */}
          <button
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-transparent cursor-default"
            tabIndex={-1}
            type="button"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsOpen(false)
              }
            }}
          />

          {/* Panel */}
          <div className="absolute right-0 mt-2 w-96 max-h-[70vh] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {noLeidas > 0 && (
                  <button
                    className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                    disabled={marcarTodasLeidas.isPending}
                    onClick={handleMarcarTodasLeidas}
                  >
                    <CheckCheck className="h-4 w-4" />
                    Marcar todas
                  </button>
                )}
                <button
                  className="p-1 hover:bg-gray-200 rounded"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="overflow-y-auto flex-1">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
                  <p className="mt-2 text-sm">Cargando...</p>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <BellOff className="h-12 w-12 mx-auto text-gray-300" />
                  <p className="mt-2 text-sm">No tenés notificaciones</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {notificaciones.map((notificacion) => (
                    <NotificationItem
                      key={notificacion.id}
                      notificacion={notificacion}
                      onClick={() => handleNotificacionClick(notificacion)}
                      onDelete={(e) => handleEliminar(e, notificacion.id)}
                    />
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {notificaciones.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <button
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                  onClick={() => {
                    router.push('/notificaciones')
                    setIsOpen(false)
                  }}
                >
                  Ver todas las notificaciones
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Componente individual de notificación
interface NotificationItemProps {
  notificacion: Notificacion
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}

function NotificationItem({ notificacion, onClick, onDelete }: NotificationItemProps) {
  const Icon = iconMap[notificacion.tipo] || Bell
  const bgColor = bgColorMap[notificacion.tipo] || 'bg-gray-100 text-gray-700'
  const _config = getNotificacionConfig(notificacion.tipo)

  const timeAgo = formatDistanceToNow(new Date(notificacion.createdAt), {
    addSuffix: true,
    locale: es,
  })

  return (
    <li>
      <button
        className={cn(
          'w-full px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors group text-left',
          !notificacion.leida && 'bg-blue-50/50'
        )}
        type="button"
        onClick={onClick}
      >
        <div className="flex gap-3">
        {/* Icono */}
        <div className={cn('flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center', bgColor)}>
          <Icon className="h-5 w-5" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={cn(
              'text-sm text-gray-900 truncate',
              !notificacion.leida && 'font-semibold'
            )}>
              {notificacion.titulo}
            </p>
            {/* Indicador de no leída */}
            {!notificacion.leida && (
              <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
            )}
          </div>

          <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">
            {notificacion.mensaje}
          </p>

          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-gray-400">{timeAgo}</span>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
              title="Eliminar notificación"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
      </button>
    </li>
  )
}

export default NotificationCenter
