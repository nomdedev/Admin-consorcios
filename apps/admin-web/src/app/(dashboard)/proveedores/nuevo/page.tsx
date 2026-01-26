'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Wrench,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react'

import { cn, isValidCUIT } from '@/lib/utils'
import {
  useCreateProveedor,
  type CreateProveedorDto,
  serviciosComunes,
  servicioLabels,
} from '@/features/proveedores'

export default function NuevoProveedorPage() {
  const router = useRouter()
  const createProveedor = useCreateProveedor()

  const [razonSocial, setRazonSocial] = useState('')
  const [cuit, setCuit] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [direccion, setDireccion] = useState('')
  const [servicios, setServicios] = useState<string[]>([])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!razonSocial.trim()) {
      newErrors.razonSocial = 'La razón social es obligatoria'
    }

    if (!cuit.trim()) {
      newErrors.cuit = 'El CUIT es obligatorio'
    } else if (!isValidCUIT(cuit.replace(/-/g, ''))) {
      newErrors.cuit = 'El CUIT no es válido'
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El email no es válido'
    }

    if (servicios.length === 0) {
      newErrors.servicios = 'Seleccioná al menos un servicio'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    const data: CreateProveedorDto = {
      razonSocial: razonSocial.trim(),
      cuit: cuit.replace(/-/g, ''),
      email: email.trim() || undefined,
      telefono: telefono.trim() || undefined,
      direccion: direccion.trim() || undefined,
      servicios,
    }

    try {
      const proveedor = await createProveedor.mutateAsync(data)
      router.push(`/proveedores/${proveedor.id}`)
    } catch (error) {
      console.error('Error al crear proveedor:', error)
    }
  }

  const toggleServicio = (servicio: string) => {
    if (servicios.includes(servicio)) {
      setServicios(servicios.filter((s) => s !== servicio))
    } else {
      setServicios([...servicios, servicio])
    }
  }

  // Formatear CUIT mientras escribe
  const handleCuitChange = (value: string) => {
    // Remover todo excepto números
    const numbers = value.replace(/\D/g, '').slice(0, 11)

    // Formatear como XX-XXXXXXXX-X
    if (numbers.length <= 2) {
      setCuit(numbers)
    } else if (numbers.length <= 10) {
      setCuit(`${numbers.slice(0, 2)}-${numbers.slice(2)}`)
    } else {
      setCuit(`${numbers.slice(0, 2)}-${numbers.slice(2, 10)}-${numbers.slice(10)}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/proveedores"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Volver a proveedores"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Proveedor</h1>
          <p className="text-gray-500 mt-1">
            Agregá un proveedor al marketplace
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos básicos */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary-600" />
            Datos del Proveedor
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Razón Social */}
            <div className="md:col-span-2">
              <label
                htmlFor="razonSocial"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Razón Social *
              </label>
              <input
                type="text"
                id="razonSocial"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                placeholder="Ej: Servicio de Plomería S.R.L."
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.razonSocial ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.razonSocial && (
                <p className="text-red-500 text-sm mt-1">{errors.razonSocial}</p>
              )}
            </div>

            {/* CUIT */}
            <div>
              <label
                htmlFor="cuit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                CUIT *
              </label>
              <input
                type="text"
                id="cuit"
                value={cuit}
                onChange={(e) => handleCuitChange(e.target.value)}
                placeholder="XX-XXXXXXXX-X"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.cuit ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.cuit && (
                <p className="text-red-500 text-sm mt-1">{errors.cuit}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <Mail className="h-4 w-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contacto@proveedor.com"
                className={cn(
                  'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                  errors.email ? 'border-red-500' : 'border-gray-300'
                )}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label
                htmlFor="telefono"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <Phone className="h-4 w-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej: 11 2345 6789"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Dirección */}
            <div>
              <label
                htmlFor="direccion"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                <MapPin className="h-4 w-4 inline mr-1" />
                Dirección
              </label>
              <input
                type="text"
                id="direccion"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Calle y número, localidad"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Servicios */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary-600" />
            Servicios que ofrece *
          </h2>

          {errors.servicios && (
            <p className="text-red-500 text-sm mb-4">{errors.servicios}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {serviciosComunes.map((servicio) => (
              <button
                key={servicio}
                type="button"
                onClick={() => toggleServicio(servicio)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg border transition-colors text-left',
                  servicios.includes(servicio)
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                )}
              >
                {servicioLabels[servicio] || servicio}
              </button>
            ))}
          </div>

          {servicios.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-2">
                Servicios seleccionados ({servicios.length}):
              </p>
              <div className="flex flex-wrap gap-2">
                {servicios.map((servicio) => (
                  <span
                    key={servicio}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {servicioLabels[servicio] || servicio}
                    <button
                      type="button"
                      onClick={() => toggleServicio(servicio)}
                      className="p-0.5 hover:bg-primary-200 rounded-full"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Info verificación */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Sobre la verificación</p>
            <p className="mt-1">
              Los proveedores serán verificados por el equipo de VecinoSimple 
              después de validar su documentación. Los proveedores verificados 
              tienen un distintivo especial en el marketplace.
            </p>
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Link
            href="/proveedores"
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createProveedor.isPending}
            className="px-6 py-2 text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-300 rounded-lg transition-colors flex items-center gap-2"
          >
            {createProveedor.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Creando...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Crear Proveedor
              </>
            )}
          </button>
        </div>

        {/* Error global */}
        {createProveedor.isError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            Error al crear el proveedor. Verificá que el CUIT no esté duplicado.
          </div>
        )}
      </form>
    </div>
  )
}
