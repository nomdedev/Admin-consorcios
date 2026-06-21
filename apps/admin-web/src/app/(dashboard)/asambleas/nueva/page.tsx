'use client'

import {
  ArrowLeft,
  Vote,
  Calendar,
  MapPin,
  Video,
  Users,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import {
  useCreateAsamblea,
  type CreateAsambleaDto,
} from '@/features/asambleas'
import { useConsorcios } from '@/features/consorcios'
import { cn } from '@/lib/utils'

export default function NuevaAsambleaPage() {
  const router = useRouter()
  const createAsamblea = useCreateAsamblea()
  const { data: consorciosData } = useConsorcios({ limit: 100 })

  const [consorcioId, setConsorcioId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('19:00')
  const [lugar, setLugar] = useState('')
  const [linkVirtual, setLinkVirtual] = useState('')
  const [quorumRequerido, setQuorumRequerido] = useState('50')

  // Puntos del orden del día (se agregarán después de crear)
  const [puntos, setPuntos] = useState<
    { titulo: string; descripcion: string; requiereVotacion: boolean; mayoriaRequerida: string }[]
  >([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!consorcioId) newErrors.consorcioId = 'Seleccioná un consorcio'
    if (!titulo.trim()) newErrors.titulo = 'El título es obligatorio'
    if (titulo.length < 5) newErrors.titulo = 'El título debe tener al menos 5 caracteres'
    if (!fecha) newErrors.fecha = 'La fecha es obligatoria'
    if (!hora) newErrors.hora = 'La hora es obligatoria'

    const quorumNum = parseFloat(quorumRequerido)
    if (isNaN(quorumNum) || quorumNum < 0 || quorumNum > 100) {
      newErrors.quorumRequerido = 'El quórum debe ser entre 0 y 100'
    }

    // Validar fecha futura
    const fechaHora = new Date(`${fecha}T${hora}`)
    if (fechaHora <= new Date()) {
      newErrors.fecha = 'La fecha debe ser futura'
    }

    // Validar link virtual si existe
    if (linkVirtual && !isValidUrl(linkVirtual)) {
      newErrors.linkVirtual = 'El link debe ser una URL válida'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const fechaCompleta = new Date(`${fecha}T${hora}`)

    const data: CreateAsambleaDto = {
      consorcioId,
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      fecha: fechaCompleta.toISOString(),
      lugar: lugar.trim() || undefined,
      linkVirtual: linkVirtual.trim() || undefined,
      quorumRequerido: parseFloat(quorumRequerido),
    }

    try {
      const asamblea = await createAsamblea.mutateAsync(data)
      router.push(`/asambleas/${asamblea.id}`)
    } catch (error) {
      console.error('Error al crear asamblea:', error)
    }
  }

  const _agregarPunto = () => {
    setPuntos([
      ...puntos,
      { titulo: '', descripcion: '', requiereVotacion: false, mayoriaRequerida: '50.01' },
    ])
  }

  const _eliminarPunto = (index: number) => {
    setPuntos(puntos.filter((_, i) => i !== index))
  }

  const _actualizarPunto = (
    index: number,
    campo: keyof (typeof puntos)[0],
    valor: string | boolean
  ) => {
    const nuevosPuntos = [...puntos]
    const puntoActual = nuevosPuntos[index]
    if (puntoActual) {
      nuevosPuntos[index] = { ...puntoActual, [campo]: valor }
      setPuntos(nuevosPuntos)
    }
  }

  // Fecha mínima: mañana
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          aria-label="Volver a asambleas"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          href="/asambleas"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nueva Asamblea</h1>
          <p className="text-gray-500 mt-1">
            Programá una asamblea de propietarios
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Datos básicos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Vote className="h-5 w-5 text-primary-600" />
            Datos de la Asamblea
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Consorcio */}
            <div className="md:col-span-2">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="consorcio"
              >
                Consorcio *
              </label>
              <select
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.consorcioId ? 'border-red-500' : 'border-gray-300'
                )}
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
              {errors.consorcioId && (
                <p className="text-red-500 text-sm mt-1">{errors.consorcioId}</p>
              )}
            </div>

            {/* Título */}
            <div className="md:col-span-2">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="titulo"
              >
                Título *
              </label>
              <input
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.titulo ? 'border-red-500' : 'border-gray-300'
                )}
                id="titulo"
                maxLength={200}
                placeholder="Ej: Asamblea Ordinaria Anual 2026"
                type="text"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
              {errors.titulo && (
                <p className="text-red-500 text-sm mt-1">{errors.titulo}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                {titulo.length}/200 caracteres
              </p>
            </div>

            {/* Descripción */}
            <div className="md:col-span-2">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="descripcion"
              >
                Descripción
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                id="descripcion"
                maxLength={2000}
                placeholder="Descripción o temas a tratar..."
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
              <p className="text-gray-400 text-xs mt-1">
                {descripcion.length}/2000 caracteres
              </p>
            </div>

            {/* Fecha */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="fecha"
              >
                <Calendar className="h-4 w-4 inline mr-1" />
                Fecha *
              </label>
              <input
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.fecha ? 'border-red-500' : 'border-gray-300'
                )}
                id="fecha"
                min={minDateStr}
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
              {errors.fecha && (
                <p className="text-red-500 text-sm mt-1">{errors.fecha}</p>
              )}
            </div>

            {/* Hora */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="hora"
              >
                Hora *
              </label>
              <input
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.hora ? 'border-red-500' : 'border-gray-300'
                )}
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
              />
              {errors.hora && (
                <p className="text-red-500 text-sm mt-1">{errors.hora}</p>
              )}
            </div>

            {/* Lugar */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="lugar"
              >
                <MapPin className="h-4 w-4 inline mr-1" />
                Lugar
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                id="lugar"
                maxLength={200}
                placeholder="Ej: SUM del edificio"
                type="text"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
              />
            </div>

            {/* Quórum requerido */}
            <div>
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="quorum"
              >
                <Users className="h-4 w-4 inline mr-1" />
                Quórum Requerido (%)
              </label>
              <input
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.quorumRequerido ? 'border-red-500' : 'border-gray-300'
                )}
                id="quorum"
                max="100"
                min="0"
                step="0.01"
                type="number"
                value={quorumRequerido}
                onChange={(e) => setQuorumRequerido(e.target.value)}
              />
              {errors.quorumRequerido && (
                <p className="text-red-500 text-sm mt-1">{errors.quorumRequerido}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Porcentaje de coeficientes necesario para alcanzar quórum
              </p>
            </div>

            {/* Link virtual */}
            <div className="md:col-span-2">
              <label
                className="block text-sm font-medium text-gray-700 mb-1"
                htmlFor="linkVirtual"
              >
                <Video className="h-4 w-4 inline mr-1" />
                Link para Asamblea Virtual
              </label>
              <input
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.linkVirtual ? 'border-red-500' : 'border-gray-300'
                )}
                id="linkVirtual"
                placeholder="https://zoom.us/j/... o https://meet.google.com/..."
                type="url"
                value={linkVirtual}
                onChange={(e) => setLinkVirtual(e.target.value)}
              />
              {errors.linkVirtual && (
                <p className="text-red-500 text-sm mt-1">{errors.linkVirtual}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Link de Zoom, Meet u otra plataforma para participación virtual
              </p>
            </div>
          </div>
        </div>

        {/* Información sobre puntos */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Sobre los puntos del orden del día</p>
            <p className="mt-1">
              Los puntos del orden del día se pueden agregar después de crear la asamblea,
              mientras esté en estado &quot;Programada&quot;.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Link
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            href="/asambleas"
          >
            Cancelar
          </Link>
          <button
            className="px-6 py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 rounded-lg transition-colors flex items-center gap-2"
            disabled={createAsamblea.isPending}
            type="submit"
          >
            {createAsamblea.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creando...
              </>
            ) : (
              <>
                <Vote className="h-4 w-4" />
                Crear Asamblea
              </>
            )}
          </button>
        </div>

        {/* Error global */}
        {createAsamblea.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error al crear la asamblea. Por favor intentá nuevamente.
          </div>
        )}
      </form>
    </div>
  )
}
