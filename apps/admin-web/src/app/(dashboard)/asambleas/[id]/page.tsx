'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Vote,
  Calendar,
  MapPin,
  Video,
  Users,
  Clock,
  PlayCircle,
  StopCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  FileText,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Loader2,
  Download,
} from 'lucide-react'

import { cn, formatDate } from '@/lib/utils'
import { useAuth } from '@/features/auth'
import {
  useAsamblea,
  useIniciarAsamblea,
  useFinalizarAsamblea,
  useCancelarAsamblea,
  useAgregarPuntoOrden,
  useEliminarPuntoOrden,
  useRegistrarAsistencia,
  useAsistencia,
  useQuorum,
  useEmitirVoto,
  useResultadoVotacion,
  useMiVoto,
  useGenerarActa,
  type EstadoAsamblea,
  type TipoVoto,
  type PuntoOrden,
  estadoAsambleaLabels,
  tipoVotoLabels,
} from '@/features/asambleas'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AsambleaDetallePage({ params }: PageProps) {
  const { id } = use(params)
  const router = useRouter()
  const { consorcioId } = useAuth()

  const { data: asamblea, isLoading, error } = useAsamblea(id, consorcioId ?? '')
  const { data: quorum } = useQuorum(id, consorcioId ?? '')
  const { data: asistencias } = useAsistencia(id, consorcioId ?? '')

  const iniciarAsamblea = useIniciarAsamblea()
  const finalizarAsamblea = useFinalizarAsamblea()
  const cancelarAsamblea = useCancelarAsamblea()
  const generarActa = useGenerarActa()

  const [showAgregarPunto, setShowAgregarPunto] = useState(false)
  const [showConfirmacion, setShowConfirmacion] = useState<
    'iniciar' | 'finalizar' | 'cancelar' | null
  >(null)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    )
  }

  if (!consorcioId) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">
          No hay consorcio seleccionado
        </h2>
        <p className="text-gray-500 mt-2">
          Seleccioná un consorcio para continuar
        </p>
      </div>
    )
  }

  if (error || !asamblea) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900">
          Error al cargar la asamblea
        </h2>
        <p className="text-gray-500 mt-2">
          No se pudo encontrar la asamblea solicitada
        </p>
        <Link
          href="/asambleas"
          className="inline-flex items-center gap-2 mt-4 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a asambleas
        </Link>
      </div>
    )
  }

  const fecha = new Date(asamblea.fecha)
  const esProgramada = asamblea.estado === 'PROGRAMADA'
  const esEnCurso = asamblea.estado === 'EN_CURSO'
  const esFinalizada = asamblea.estado === 'FINALIZADA'
  const esCancelada = asamblea.estado === 'CANCELADA'

  const badgeColors: Record<EstadoAsamblea, string> = {
    PROGRAMADA: 'bg-gray-100 text-gray-700',
    EN_CURSO: 'bg-yellow-100 text-yellow-700',
    FINALIZADA: 'bg-green-100 text-green-700',
    CANCELADA: 'bg-red-100 text-red-700',
  }

  const handleIniciar = async () => {
    try {
      await iniciarAsamblea.mutateAsync({ id, consorcioId })
      setShowConfirmacion(null)
    } catch (error) {
      console.error('Error al iniciar:', error)
    }
  }

  const handleFinalizar = async () => {
    try {
      await finalizarAsamblea.mutateAsync({ id, consorcioId })
      setShowConfirmacion(null)
    } catch (error) {
      console.error('Error al finalizar:', error)
    }
  }

  const handleCancelar = async () => {
    try {
      await cancelarAsamblea.mutateAsync({ id, consorcioId })
      setShowConfirmacion(null)
    } catch (error) {
      console.error('Error al cancelar:', error)
    }
  }

  const handleGenerarActa = async () => {
    try {
      await generarActa.mutateAsync({
        asambleaId: id,
        consorcioId,
        data: {},
      })
    } catch (error) {
      console.error('Error al generar acta:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/asambleas"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"
            aria-label="Volver a asambleas"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {asamblea.titulo}
              </h1>
              <span
                className={cn(
                  'px-3 py-1 text-sm font-medium rounded-full',
                  badgeColors[asamblea.estado]
                )}
              >
                {estadoAsambleaLabels[asamblea.estado]}
              </span>
            </div>
            {asamblea.descripcion && (
              <p className="text-gray-500">{asamblea.descripcion}</p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {esProgramada && (
            <>
              <button
                onClick={() => setShowConfirmacion('iniciar')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                <PlayCircle className="h-4 w-4" />
                Iniciar
              </button>
              <button
                onClick={() => setShowConfirmacion('cancelar')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              >
                <XCircle className="h-4 w-4" />
                Cancelar
              </button>
            </>
          )}
          {esEnCurso && (
            <button
              onClick={() => setShowConfirmacion('finalizar')}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              <StopCircle className="h-4 w-4" />
              Finalizar
            </button>
          )}
          {esFinalizada && !asamblea.actaUrl && (
            <button
              onClick={handleGenerarActa}
              disabled={generarActa.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              {generarActa.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Generar Acta
            </button>
          )}
          {asamblea.actaUrl && (
            <a
              href={asamblea.actaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <Download className="h-4 w-4" />
              Descargar Acta
            </a>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha</p>
              <p className="font-medium text-gray-900">
                {formatDate(asamblea.fecha)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hora</p>
              <p className="font-medium text-gray-900">
                {fecha.toLocaleTimeString('es-AR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <MapPin className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Lugar</p>
              <p className="font-medium text-gray-900">
                {asamblea.lugar || 'No especificado'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Users className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Quórum Requerido</p>
              <p className="font-medium text-gray-900">
                {asamblea.quorumRequerido}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Link virtual */}
      {asamblea.linkVirtual && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Asamblea Virtual</p>
              <p className="text-sm text-blue-700">
                Link disponible para participación remota
              </p>
            </div>
          </div>
          <a
            href={asamblea.linkVirtual}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-700 bg-white hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
          >
            Unirse
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Columna principal - Puntos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Puntos del orden del día */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Orden del Día
              </h2>
              {esProgramada && (
                <button
                  onClick={() => setShowAgregarPunto(true)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Agregar punto
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-200">
              {asamblea.puntosOrden && asamblea.puntosOrden.length > 0 ? (
                asamblea.puntosOrden
                  .sort((a, b) => a.orden - b.orden)
                  .map((punto) => (
                    <PuntoOrdenItem
                      key={punto.id}
                      punto={punto}
                      asambleaId={id}
                      consorcioId={consorcioId}
                      estadoAsamblea={asamblea.estado}
                    />
                  ))
              ) : (
                <div className="p-8 text-center">
                  <Vote className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">
                    No hay puntos en el orden del día
                  </p>
                  {esProgramada && (
                    <button
                      onClick={() => setShowAgregarPunto(true)}
                      className="mt-4 inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar el primer punto
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna lateral - Quórum y Asistencia */}
        <div className="space-y-6">
          {/* Quórum */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Estado del Quórum</h3>

            {quorum ? (
              <div className="space-y-4">
                <div
                  className={cn(
                    'p-4 rounded-lg text-center',
                    quorum.alcanzado
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  )}
                >
                  <p className="text-3xl font-bold">{quorum.actual.toFixed(1)}%</p>
                  <p className="text-sm">
                    {quorum.alcanzado ? 'Quórum alcanzado' : 'Quórum actual'}
                  </p>
                </div>

                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Requerido:</span>
                    <span className="font-medium">{quorum.requerido}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Presentes:</span>
                    <span className="font-medium">
                      {quorum.presentes} de {quorum.totalPropietarios}
                    </span>
                  </div>
                </div>

                {!quorum.alcanzado && (
                  <p className="text-xs text-gray-500 text-center">
                    Faltan {(quorum.requerido - quorum.actual).toFixed(1)}% para
                    alcanzar el quórum
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Información de quórum no disponible</p>
              </div>
            )}
          </div>

          {/* Lista de asistencia */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Asistencia</h3>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {asistencias && asistencias.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {asistencias.map((asistencia) => (
                    <div
                      key={asistencia.usuarioId}
                      className="p-3 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        {asistencia.presente ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-300" />
                        )}
                        <span className="text-sm">
                          {asistencia.usuario
                            ? `${asistencia.usuario.nombre} ${asistencia.usuario.apellido}`
                            : 'Usuario'}
                        </span>
                      </div>
                      {asistencia.coeficiente && (
                        <span className="text-xs text-gray-500">
                          {asistencia.coeficiente.toFixed(2)}%
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No hay asistencia registrada
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmacion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {showConfirmacion === 'iniciar' && '¿Iniciar asamblea?'}
              {showConfirmacion === 'finalizar' && '¿Finalizar asamblea?'}
              {showConfirmacion === 'cancelar' && '¿Cancelar asamblea?'}
            </h3>
            <p className="text-gray-500 mb-6">
              {showConfirmacion === 'iniciar' &&
                'Se verificará el quórum y se habilitará la votación.'}
              {showConfirmacion === 'finalizar' &&
                'Se cerrarán las votaciones y podrás generar el acta.'}
              {showConfirmacion === 'cancelar' &&
                'Esta acción no se puede deshacer.'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirmacion(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={
                  showConfirmacion === 'iniciar'
                    ? handleIniciar
                    : showConfirmacion === 'finalizar'
                    ? handleFinalizar
                    : handleCancelar
                }
                className={cn(
                  'px-4 py-2 text-white rounded-lg transition-colors',
                  showConfirmacion === 'cancelar'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-primary-600 hover:bg-primary-700'
                )}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// COMPONENTE DE PUNTO DEL ORDEN
// ============================================================================

function PuntoOrdenItem({
  punto,
  asambleaId,
  consorcioId,
  estadoAsamblea,
}: {
  punto: PuntoOrden
  asambleaId: string
  consorcioId: string
  estadoAsamblea: EstadoAsamblea
}) {
  const [showVotar, setShowVotar] = useState(false)
  const emitirVoto = useEmitirVoto()
  const { data: miVoto } = useMiVoto(asambleaId, punto.id, consorcioId)
  const { data: resultado } = useResultadoVotacion(asambleaId, punto.id, consorcioId)

  const esEnCurso = estadoAsamblea === 'EN_CURSO'
  const esFinalizada = estadoAsamblea === 'FINALIZADA'
  const puedeVotar = esEnCurso && punto.requiereVotacion && !miVoto

  const handleVotar = async (voto: TipoVoto) => {
    try {
      await emitirVoto.mutateAsync({
        asambleaId,
        puntoId: punto.id,
        consorcioId,
        data: { voto },
      })
      setShowVotar(false)
    } catch (error) {
      console.error('Error al votar:', error)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
          {punto.orden}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900">{punto.titulo}</h4>
            {punto.requiereVotacion && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                Votación
              </span>
            )}
          </div>

          {punto.descripcion && (
            <p className="text-sm text-gray-500 mb-3">{punto.descripcion}</p>
          )}

          {/* Mi voto */}
          {miVoto && (
            <div className="flex items-center gap-2 text-sm mb-3">
              <span className="text-gray-500">Tu voto:</span>
              <span
                className={cn(
                  'font-medium',
                  miVoto.voto === 'A_FAVOR' && 'text-green-600',
                  miVoto.voto === 'EN_CONTRA' && 'text-red-600',
                  miVoto.voto === 'ABSTENCION' && 'text-gray-500'
                )}
              >
                {tipoVotoLabels[miVoto.voto]}
              </span>
            </div>
          )}

          {/* Resultado de votación */}
          {resultado && (esFinalizada || resultado.totalVotos > 0) && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Resultado:</span>
                {resultado.aprobado !== null && (
                  <span
                    className={cn(
                      'font-medium',
                      resultado.aprobado ? 'text-green-600' : 'text-red-600'
                    )}
                  >
                    {resultado.aprobado ? 'APROBADO' : 'RECHAZADO'}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-green-50 rounded p-2">
                  <p className="font-bold text-green-600">{resultado.aFavor}</p>
                  <p className="text-green-600">A favor</p>
                </div>
                <div className="bg-red-50 rounded p-2">
                  <p className="font-bold text-red-600">{resultado.enContra}</p>
                  <p className="text-red-600">En contra</p>
                </div>
                <div className="bg-gray-100 rounded p-2">
                  <p className="font-bold text-gray-600">{resultado.abstenciones}</p>
                  <p className="text-gray-600">Abstención</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                {resultado.porcentajeAFavor.toFixed(1)}% a favor
                {resultado.mayoriaRequerida &&
                  ` (requerido: ${resultado.mayoriaRequerida}%)`}
              </p>
            </div>
          )}

          {/* Botón votar */}
          {puedeVotar && (
            <div className="mt-3">
              {showVotar ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVotar('A_FAVOR')}
                    disabled={emitirVoto.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    A favor
                  </button>
                  <button
                    onClick={() => handleVotar('EN_CONTRA')}
                    disabled={emitirVoto.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    En contra
                  </button>
                  <button
                    onClick={() => handleVotar('ABSTENCION')}
                    disabled={emitirVoto.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                    Abstención
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowVotar(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                >
                  <Vote className="h-4 w-4" />
                  Emitir voto
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
