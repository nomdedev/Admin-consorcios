'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Building2, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { useAmenity, useUpdateAmenity } from '@/features/amenities'
import { cn } from '@/lib/utils'

// Schema de validación
const amenitySchema = z.object({
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: z
    .string()
    .max(500, 'La descripción no puede superar 500 caracteres')
    .optional(),
  capacidad: z
    .number()
    .min(1, 'La capacidad mínima es 1')
    .max(1000, 'La capacidad máxima es 1000')
    .optional()
    .nullable(),
  anticipacionMinima: z
    .number()
    .min(1, 'Mínimo 1 hora')
    .max(168, 'Máximo 168 horas (1 semana)'),
  anticipacionMaxima: z
    .number()
    .min(24, 'Mínimo 24 horas')
    .max(2160, 'Máximo 2160 horas (90 días)'),
  duracionMaxima: z
    .number()
    .min(1, 'Mínimo 1 hora')
    .max(24, 'Máximo 24 horas'),
  requiereAprobacion: z.boolean(),
  costoReserva: z
    .number()
    .min(0, 'El costo no puede ser negativo')
    .max(1000000, 'El costo máximo es $1.000.000')
    .optional()
    .nullable(),
  activo: z.boolean(),
})

type AmenityFormData = z.infer<typeof amenitySchema>

export default function EditarAmenityPage() {
  const params = useParams()
  const router = useRouter()
  const amenityId = params.id as string

  const { data: amenity, isLoading: loadingAmenity } = useAmenity(amenityId)
  const updateAmenity = useUpdateAmenity()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AmenityFormData>({
    resolver: zodResolver(amenitySchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      capacidad: null,
      anticipacionMinima: 24,
      anticipacionMaxima: 720,
      duracionMaxima: 4,
      requiereAprobacion: false,
      costoReserva: null,
      activo: true,
    },
  })

  // Cargar datos del amenity cuando estén disponibles
  useEffect(() => {
    if (amenity) {
      reset({
        nombre: amenity.nombre,
        descripcion: amenity.descripcion || '',
        capacidad: amenity.capacidad || null,
        anticipacionMinima: amenity.anticipacionMinima,
        anticipacionMaxima: amenity.anticipacionMaxima,
        duracionMaxima: amenity.duracionMaxima,
        requiereAprobacion: amenity.requiereAprobacion,
        costoReserva: amenity.costoReserva || null,
        activo: amenity.activo,
      })
    }
  }, [amenity, reset])

  const onSubmit = async (data: AmenityFormData) => {
    await updateAmenity.mutateAsync({
      id: amenityId,
      data: {
        nombre: data.nombre,
        descripcion: data.descripcion || undefined,
        capacidad: data.capacidad || undefined,
        anticipacionMinima: data.anticipacionMinima,
        anticipacionMaxima: data.anticipacionMaxima,
        duracionMaxima: data.duracionMaxima,
        requiereAprobacion: data.requiereAprobacion,
        costoReserva: data.costoReserva || undefined,
        activo: data.activo,
      },
    })
    router.push(`/amenities/${amenityId}`)
  }

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
        <Link className="mt-2 text-primary-600 hover:underline" href="/amenities">
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
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          href={`/amenities/${amenityId}`}
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Amenity</h1>
          <p className="text-gray-500">{amenity.nombre}</p>
        </div>
      </div>

      {/* Formulario */}
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Información Básica */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Básica</h3>

          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="nombre">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                id="nombre"
                type="text"
                {...register('nombre')}
                className={cn(
                  'w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  errors.nombre ? 'border-red-300' : 'border-gray-300'
                )}
                placeholder="Ej: SUM, Parrilla, Pileta"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="descripcion">
                Descripción
              </label>
              <textarea
                {...register('descripcion')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                id="descripcion"
                placeholder="Descripción del amenity y reglas de uso..."
                rows={3}
              />
              {errors.descripcion && (
                <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
              )}
            </div>

            {/* Capacidad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="capacidad">
                Capacidad máxima (personas)
              </label>
              <input
                id="capacidad"
                type="number"
                {...register('capacidad', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Ej: 50"
              />
              {errors.capacidad && (
                <p className="mt-1 text-sm text-red-600">{errors.capacidad.message}</p>
              )}
            </div>

            {/* Activo */}
            <div className="flex items-center gap-3">
              <input
                id="activo"
                type="checkbox"
                {...register('activo')}
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="text-sm font-medium text-gray-700" htmlFor="activo">
                Amenity activo (visible para reservas)
              </label>
            </div>
          </div>
        </div>

        {/* Configuración de Reservas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Configuración de Reservas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Anticipación mínima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="anticipacionMinima">
                Anticipación mínima (horas)
              </label>
              <input
                id="anticipacionMinima"
                type="number"
                {...register('anticipacionMinima', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tiempo mínimo antes para reservar
              </p>
              {errors.anticipacionMinima && (
                <p className="mt-1 text-sm text-red-600">{errors.anticipacionMinima.message}</p>
              )}
            </div>

            {/* Anticipación máxima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="anticipacionMaxima">
                Anticipación máxima (horas)
              </label>
              <input
                id="anticipacionMaxima"
                type="number"
                {...register('anticipacionMaxima', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tiempo máximo antes para reservar
              </p>
              {errors.anticipacionMaxima && (
                <p className="mt-1 text-sm text-red-600">{errors.anticipacionMaxima.message}</p>
              )}
            </div>

            {/* Duración máxima */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="duracionMaxima">
                Duración máxima (horas)
              </label>
              <input
                id="duracionMaxima"
                type="number"
                {...register('duracionMaxima', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              {errors.duracionMaxima && (
                <p className="mt-1 text-sm text-red-600">{errors.duracionMaxima.message}</p>
              )}
            </div>

            {/* Requiere aprobación */}
            <div className="flex items-center h-full pt-6">
              <div className="flex items-center gap-3">
                <input
                  id="requiereAprobacion"
                  type="checkbox"
                  {...register('requiereAprobacion')}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label className="text-sm font-medium text-gray-700" htmlFor="requiereAprobacion">
                  Requiere aprobación del administrador
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Costo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Costo</h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="costoReserva">
              Costo por reserva (ARS)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                id="costoReserva"
                step="0.01"
                type="number"
                {...register('costoReserva', { valueAsNumber: true })}
                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Dejá en blanco o 0 si es gratuito
            </p>
            {errors.costoReserva && (
              <p className="mt-1 text-sm text-red-600">{errors.costoReserva.message}</p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Link
            className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            href={`/amenities/${amenityId}`}
          >
            Cancelar
          </Link>
          <button
            className="px-6 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={updateAmenity.isPending || !isDirty}
            type="submit"
          >
            {updateAmenity.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar cambios
          </button>
        </div>
      </form>
    </div>
  )
}
