'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, addHours, setHours, setMinutes, startOfDay, isBefore, addDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ArrowLeft,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Building2,
} from 'lucide-react'

import { cn, formatCurrency } from '@/lib/utils'
import { useAmenity, useDisponibilidad, useCreateReserva } from '@/features/amenities'

// Schema de validación
const reservaSchema = z.object({
  fecha: z.string().min(1, 'Seleccioná una fecha'),
  horaInicio: z.string().min(1, 'Seleccioná hora de inicio'),
  duracion: z.number().min(1).max(12),
  motivo: z.string().max(500, 'El motivo no puede superar 500 caracteres').optional(),
})

type ReservaFormData = z.infer<typeof reservaSchema>

// Generar slots de horas
const generateTimeSlots = (startHour = 8, endHour = 22): string[] => {
  const slots: string[] = []
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`)
    slots.push(`${h.toString().padStart(2, '0')}:30`)
  }
  return slots
}

export default function ReservarAmenityPage() {
  const params = useParams()
  const router = useRouter()
  const amenityId = params.id as string

  const [selectedDate, setSelectedDate] = useState<string>(
    format(addDays(new Date(), 1), 'yyyy-MM-dd')
  )

  const { data: amenity, isLoading: loadingAmenity } = useAmenity(amenityId)
  const { data: disponibilidad, isLoading: loadingDisponibilidad } = useDisponibilidad(
    amenityId,
    selectedDate || ''
  )

  const createReserva = useCreateReserva()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservaFormData>({
    resolver: zodResolver(reservaSchema),
    defaultValues: {
      fecha: selectedDate,
      horaInicio: '',
      duracion: 2,
      motivo: '',
    },
  })

  const watchHoraInicio = watch('horaInicio')
  const watchDuracion = watch('duracion')

  const onSubmit = async (data: ReservaFormData) => {
    const parts = data.horaInicio.split(':')
    const hours = parseInt(parts[0] || '0', 10)
    const minutes = parseInt(parts[1] || '0', 10)
    const fechaInicio = setMinutes(setHours(new Date(data.fecha), hours), minutes)
    const fechaFin = addHours(fechaInicio, data.duracion)

    await createReserva.mutateAsync({
      amenityId,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      motivo: data.motivo || undefined,
    })

    router.push(`/amenities/${amenityId}?reserva=confirmada`)
  }

  // Manejar cambio de fecha
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setValue('fecha', e.target.value)
    setValue('horaInicio', '') // Limpiar hora al cambiar fecha
  }

  // Calcular hora de fin
  const getHoraFin = () => {
    if (!watchHoraInicio) return ''
    const parts = watchHoraInicio.split(':')
    const hours = parseInt(parts[0] || '0', 10)
    const minutes = parseInt(parts[1] || '0', 10)
    const inicio = setMinutes(setHours(new Date(), hours), minutes)
    const fin = addHours(inicio, watchDuracion)
    return format(fin, 'HH:mm')
  }

  // Fechas permitidas
  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd')
  const maxDate = amenity
    ? format(addHours(new Date(), amenity.anticipacionMaxima), 'yyyy-MM-dd')
    : format(addDays(new Date(), 30), 'yyyy-MM-dd')

  // Slots de tiempo
  const timeSlots = generateTimeSlots()
  // Extraer los slots ocupados desde la respuesta de disponibilidad
  const slotsOcupados = disponibilidad?.slots
    ?.filter(s => !s.disponible)
    ?.map(s => s.inicio.substring(11, 16)) ?? [] // Extraer HH:mm del ISO string

  if (loadingAmenity) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!amenity) {
    return (
      <div className="text-center py-12">
        <Building2 className="h-16 w-16 mx-auto text-gray-300" />
        <h3 className="mt-4 text-lg font-medium text-gray-900">Amenity no encontrado</h3>
        <Link href="/amenities" className="mt-2 text-primary-600 hover:underline">
          Volver a amenities
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/amenities/${amenityId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservar {amenity.nombre}</h1>
          <p className="text-gray-500">Seleccioná fecha y horario para tu reserva</p>
        </div>
      </div>

      {/* Información del amenity */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-medium text-blue-900 mb-2">Información</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Duración máxima: {amenity.duracionMaxima} horas</li>
          <li>
            • Anticipación: entre {amenity.anticipacionMinima}hs y {amenity.anticipacionMaxima}hs
          </li>
          {amenity.costoReserva && (
            <li>• Costo: {formatCurrency(amenity.costoReserva)}</li>
          )}
          {amenity.requiereAprobacion && (
            <li className="flex items-center gap-1 text-yellow-700">
              <AlertCircle className="h-4 w-4" />
              Esta reserva requiere aprobación del administrador
            </li>
          )}
        </ul>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Fecha */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-2" />
            Fecha de reserva
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            min={minDate}
            max={maxDate}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
          />
          {errors.fecha && (
            <p className="mt-2 text-sm text-red-600">{errors.fecha.message}</p>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Fecha seleccionada:{' '}
            <strong>
              {format(new Date(selectedDate), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
            </strong>
          </p>
        </div>

        {/* Horario */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="h-4 w-4 inline mr-2" />
            Horario
          </label>

          {loadingDisponibilidad ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Cargando disponibilidad...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-4">
                {timeSlots.map((slot) => {
                  const isOcupado = slotsOcupados.includes(slot)
                  const isSelected = watchHoraInicio === slot

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => !isOcupado && setValue('horaInicio', slot)}
                      disabled={isOcupado}
                      className={cn(
                        'px-3 py-2 text-sm rounded-lg border transition-all',
                        isOcupado
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                          : isSelected
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500 hover:bg-primary-50'
                      )}
                    >
                      {slot}
                    </button>
                  )
                })}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-white border border-gray-300" />
                  <span>Disponible</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                  <span>Ocupado</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded bg-primary-600" />
                  <span>Seleccionado</span>
                </div>
              </div>
            </>
          )}

          {errors.horaInicio && (
            <p className="mt-2 text-sm text-red-600">{errors.horaInicio.message}</p>
          )}
        </div>

        {/* Duración */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Duración
          </label>
          <select
            {...register('duracion', { valueAsNumber: true })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {Array.from({ length: amenity.duracionMaxima }, (_, i) => i + 1).map((h) => (
              <option key={h} value={h}>
                {h} {h === 1 ? 'hora' : 'horas'}
              </option>
            ))}
          </select>

          {watchHoraInicio && (
            <p className="mt-3 text-sm text-gray-600">
              Tu reserva será de <strong>{watchHoraInicio}</strong> a{' '}
              <strong>{getHoraFin()}</strong>
            </p>
          )}
        </div>

        {/* Motivo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Motivo (opcional)
          </label>
          <textarea
            {...register('motivo')}
            rows={3}
            placeholder="Ej: Cumpleaños, reunión familiar, etc."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {errors.motivo && (
            <p className="mt-2 text-sm text-red-600">{errors.motivo.message}</p>
          )}
        </div>

        {/* Resumen y Submit */}
        {watchHoraInicio && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h3 className="font-medium text-green-900 flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5" />
              Resumen de tu reserva
            </h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>
                <strong>Amenity:</strong> {amenity.nombre}
              </li>
              <li>
                <strong>Fecha:</strong>{' '}
                {format(new Date(selectedDate), "EEEE d 'de' MMMM", { locale: es })}
              </li>
              <li>
                <strong>Horario:</strong> {watchHoraInicio} a {getHoraFin()} ({watchDuracion}h)
              </li>
              {amenity.costoReserva && (
                <li>
                  <strong>Costo:</strong> {formatCurrency(amenity.costoReserva)}
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Link
            href={`/amenities/${amenityId}`}
            className="px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createReserva.isPending || !watchHoraInicio}
            className="px-6 py-3 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {createReserva.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {amenity.requiereAprobacion ? 'Solicitar reserva' : 'Confirmar reserva'}
          </button>
        </div>
      </form>
    </div>
  )
}
