'use client'

import { format, formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  FileText,
  MessageCircle,
  Users,
  AlertTriangle,
  Settings,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  useNotificaciones,
  useContadorNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
  useEliminarNotificacion,
  useLimpiarNotificaciones,
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

const tiposNotificacion: Array<{ value: TipoNotificacion | ''; label: string }> = [
  { value: '', label: 'Todos los tipos' },
  { value: 'PAGO', label: 'Pagos' },
  { value: 'EXPENSA', label: 'Expensas' },
  { value: 'RECLAMO', label: 'Reclamos' },
  { value: 'COMUNICADO', label: 'Comunicados' },
  { value: 'ASAMBLEA', label: 'Asambleas' },
  { value: 'VENCIMIENTO', label: 'Vencimientos' },
  { value: 'EMERGENCIA', label: 'Emergencias' },
  { value: 'SISTEMA', label: 'Sistema' },
]

export default function NotificacionesPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [filtroTipo, setFiltroTipo] = useState<TipoNotificacion | ''>('')
  const [filtroLeida, setFiltroLeida] = useState<'todas' | 'leidas' | 'no-leidas'>('todas')

  // Queries
  const { data: contadorData } = useContadorNotificaciones()
  const { data: notificacionesData, isLoading } = useNotificaciones({
    page,
    limit: 20,
    tipo: filtroTipo || undefined,
    leida: filtroLeida === 'todas' ? undefined : filtroLeida === 'leidas',
  })

  // Mutations
  const marcarLeida = useMarcarLeida()
  const marcarTodasLeidas = useMarcarTodasLeidas()
  const eliminar = useEliminarNotificacion()
  const limpiar = useLimpiarNotificaciones()

  const noLeidas = contadorData?.noLeidas ?? 0
  const total = contadorData?.total ?? 0
  const notificaciones = notificacionesData?.data ?? []
  const pagination = notificacionesData?.pagination

  const handleNotificacionClick = (notificacion: Notificacion) => {
    if (!notificacion.leida) {
      marcarLeida.mutate(notificacion.id)
    }
    const url = getNotificacionUrl(notificacion)
    if (url) {
      router.push(url)
    }
  }

  const handleMarcarTodasLeidas = () => {
    marcarTodasLeidas.mutate()
  }

  const handleLimpiarAntiguas = () => {
    if (confirm('¿Eliminar todas las notificaciones leídas de más de 90 días?')) {
      limpiar.mutate()
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notificaciones</h1>
          <p className="text-gray-500 mt-1">
            {noLeidas > 0 ? `${noLeidas} sin leer de ${total} total` : `${total} notificaciones`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {noLeidas > 0 && (
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors disabled:opacity-50"
              disabled={marcarTodasLeidas.isPending}
              onClick={handleMarcarTodasLeidas}
            >
              <CheckCheck className="h-4 w-4" />
              Marcar todas como leídas
            </button>
          )}
          <button
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            disabled={limpiar.isPending}
            onClick={handleLimpiarAntiguas}
          >
            <Trash2 className="h-4 w-4" />
            Limpiar antiguas
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bell className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{noLeidas}</p>
              <p className="text-sm text-gray-500">Sin leer</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{total - noLeidas}</p>
              <p className="text-sm text-gray-500">Leídas</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {notificaciones.filter((n) => n.tipo === 'EMERGENCIA' && !n.leida).length}
              </p>
              <p className="text-sm text-gray-500">Urgentes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <p className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de notificación
            </p>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={filtroTipo}
              onChange={(e) => {
                setFiltroTipo(e.target.value as TipoNotificacion | '')
                setPage(1)
              }}
            >
              {tiposNotificacion.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <p className="block text-sm font-medium text-gray-700 mb-1">Estado</p>
            <select
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              value={filtroLeida}
              onChange={(e) => {
                setFiltroLeida(e.target.value as 'todas' | 'leidas' | 'no-leidas')
                setPage(1)
              }}
            >
              <option value="todas">Todas</option>
              <option value="no-leidas">Sin leer</option>
              <option value="leidas">Leídas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-500">Cargando notificaciones...</p>
          </div>
        ) : notificaciones.length === 0 ? (
          <div className="p-12 text-center">
            <BellOff className="h-16 w-16 mx-auto text-gray-300" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No hay notificaciones</h3>
            <p className="mt-2 text-gray-500">
              {filtroTipo || filtroLeida !== 'todas'
                ? 'No hay notificaciones que coincidan con los filtros'
                : 'Cuando tengas notificaciones, aparecerán aquí'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notificaciones.map((notificacion) => (
              <NotificacionItem
                key={notificacion.id}
                notificacion={notificacion}
                onClick={() => handleNotificacionClick(notificacion)}
                onDelete={() => eliminar.mutate(notificacion.id)}
                onMarcarLeida={() => marcarLeida.mutate(notificacion.id)}
              />
            ))}
          </ul>
        )}

        {/* Paginación */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
            <p className="text-sm text-gray-500">
              Mostrando {(page - 1) * pagination.limit + 1} -{' '}
              {Math.min(page * pagination.limit, pagination.total)} de {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </button>
              <button
                className="px-3 py-1 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={page === pagination.totalPages}
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Componente individual de notificación
interface NotificacionItemProps {
  notificacion: Notificacion
  onClick: () => void
  onDelete: () => void
  onMarcarLeida: () => void
}

function NotificacionItem({
  notificacion,
  onClick,
  onDelete,
  onMarcarLeida,
}: NotificacionItemProps) {
  const Icon = iconMap[notificacion.tipo] || Bell
  const bgColor = bgColorMap[notificacion.tipo] || 'bg-gray-100 text-gray-700'
  const config = getNotificacionConfig(notificacion.tipo)

  const timeAgo = formatDistanceToNow(new Date(notificacion.createdAt), {
    addSuffix: true,
    locale: es,
  })

  const fechaCompleta = format(new Date(notificacion.createdAt), "d 'de' MMMM 'a las' HH:mm", {
    locale: es,
  })

  return (
    <li>
      <button
        className={cn(
          'w-full px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group text-left',
          !notificacion.leida && 'bg-blue-50/50'
        )}
        type="button"
        onClick={onClick}
      >
        <div className="flex gap-4">
        {/* Icono */}
        <div
          className={cn(
            'flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center',
            bgColor
          )}
        >
          <Icon className="h-6 w-6" />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p
                  className={cn(
                    'text-base text-gray-900',
                    !notificacion.leida && 'font-semibold'
                  )}
                >
                  {notificacion.titulo}
                </p>
                {!notificacion.leida && (
                  <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{notificacion.mensaje}</p>
              <div className="flex items-center gap-4 mt-2">
                <span
                  className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                    bgColor
                  )}
                >
                  {config.label}
                </span>
                <span className="text-xs text-gray-400" title={fechaCompleta}>
                  {timeAgo}
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!notificacion.leida && (
                <button
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Marcar como leída"
                  onClick={(e) => {
                    e.stopPropagation()
                    onMarcarLeida()
                  }}
                >
                  <Check className="h-4 w-4 text-gray-500" />
                </button>
              )}
              <button
                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                title="Eliminar"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
              >
                <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
      </button>
    </li>
  )
}
