'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Save, Building2 } from 'lucide-react'
import Link from 'next/link'

import { useCreateAmenity } from '@/features/amenities'

// Schema de validación
const amenitySchema = z.object({
  consorcioId: z.string().min(1, 'Seleccioná un consorcio'),
  nombre: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede superar 100 caracteres'),
  descripcion: z.string().max(500, 'La descripción no puede superar 500 caracteres').optional(),
  capacidad: z.coerce.number().int().positive('La capacidad debe ser mayor a 0').optional(),
  requiereAprobacion: z.boolean().default(false),
  anticipacionMinima: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo 1 hora')
    .max(168, 'Máximo 168 horas (1 semana)')
    .default(24),
  anticipacionMaxima: z.coerce
    .number()
    .int()
    .min(24, 'Mínimo 24 horas')
    .max(2160, 'Máximo 2160 horas (90 días)')
    .default(720),
  duracionMaxima: z.coerce
    .number()
    .int()
    .min(1, 'Mínimo 1 hora')
    .max(24, 'Máximo 24 horas')
    .default(4),
  costoReserva: z.coerce.number().min(0, 'El costo no puede ser negativo').optional(),
})

type AmenityFormData = z.infer<typeof amenitySchema>

export default function NuevoAmenityPage() {
  const router = useRouter()
  const createAmenity = useCreateAmenity()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AmenityFormData>({
    resolver: zodResolver(amenitySchema),
    defaultValues: {
      requiereAprobacion: false,
      anticipacionMinima: 24,
      anticipacionMaxima: 720,
      duracionMaxima: 4,
    },
  })

  const requiereAprobacion = watch('requiereAprobacion')
  const costoReserva = watch('costoReserva')

  const onSubmit = async (data: AmenityFormData) => {
    try {
      await createAmenity.mutateAsync(data)
      router.push('/amenities')
    } catch (error) {
      console.error('Error creando amenity:', error)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/amenities"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Amenity</h1>
          <p className="text-gray-500 mt-1">Creá un nuevo espacio común para reservar</p>
        </div>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Información básica */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Información básica
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Consorcio *
            </label>
            <select
              {...register('consorcioId')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            >
              <option value="">Seleccionar consorcio</option>
              {/* TODO: Cargar consorcios desde hook */}
              <option value="consorcio-1">Edificio Torre Norte</option>
              <option value="consorcio-2">Edificio Plaza Sur</option>
            </select>
            {errors.consorcioId && (
              <p className="mt-1 text-sm text-red-600">{errors.consorcioId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              {...register('nombre')}
              placeholder="Ej: SUM, Pileta, Parrilla"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              {...register('descripcion')}
              rows={3}
              placeholder="Describe el amenity, sus características y reglas de uso..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {errors.descripcion && (
              <p className="mt-1 text-sm text-red-600">{errors.descripcion.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Capacidad máxima (personas)
            </label>
            <input
              type="number"
              {...register('capacidad')}
              placeholder="Ej: 50"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {errors.capacidad && (
              <p className="mt-1 text-sm text-red-600">{errors.capacidad.message}</p>
            )}
          </div>
        </div>

        {/* Configuración de reservas */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Configuración de reservas</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anticipación mínima (horas)
              </label>
              <input
                type="number"
                {...register('anticipacionMinima')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Cuántas horas antes se puede reservar como mínimo
              </p>
              {errors.anticipacionMinima && (
                <p className="mt-1 text-sm text-red-600">{errors.anticipacionMinima.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Anticipación máxima (horas)
              </label>
              <input
                type="number"
                {...register('anticipacionMaxima')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Cuántas horas antes se puede reservar como máximo
              </p>
              {errors.anticipacionMaxima && (
                <p className="mt-1 text-sm text-red-600">{errors.anticipacionMaxima.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duración máxima por reserva (horas)
            </label>
            <input
              type="number"
              {...register('duracionMaxima')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            {errors.duracionMaxima && (
              <p className="mt-1 text-sm text-red-600">{errors.duracionMaxima.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <input
              type="checkbox"
              id="requiereAprobacion"
              {...register('requiereAprobacion')}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="requiereAprobacion" className="text-sm text-gray-700">
              <span className="font-medium">Requiere aprobación del administrador</span>
              <p className="text-gray-500">
                Si está activo, las reservas quedarán pendientes hasta que un admin las apruebe
              </p>
            </label>
          </div>
        </div>

        {/* Costo */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Costo de reserva</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Costo por reserva ($)
            </label>
            <input
              type="number"
              {...register('costoReserva')}
              placeholder="0 = Gratis"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Dejá en 0 si el amenity es gratuito. El costo se sumará a la próxima expensa.
            </p>
            {errors.costoReserva && (
              <p className="mt-1 text-sm text-red-600">{errors.costoReserva.message}</p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/amenities"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createAmenity.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSubmitting || createAmenity.isPending ? 'Guardando...' : 'Crear Amenity'}
          </button>
        </div>
      </form>
    </div>
  )
}
