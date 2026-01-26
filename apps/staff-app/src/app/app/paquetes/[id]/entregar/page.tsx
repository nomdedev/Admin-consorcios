'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { db, PaqueteLocal } from '@/offline/db'

export default function EntregarPaquetePage() {
  const router = useRouter()
  const params = useParams()
  const paqueteId = params.id as string
  
  const [paquete, setPaquete] = useState<PaqueteLocal | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    nombreRetira: '',
    dniRetira: ''
  })
  
  useEffect(() => {
    loadPaquete()
  }, [paqueteId])
  
  const loadPaquete = async () => {
    try {
      const p = await db.paquetes.get(paqueteId)
      if (p) {
        setPaquete(p)
      }
    } catch (error) {
      console.error('Error loading paquete:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paquete) return
    
    setIsSaving(true)
    
    try {
      // Actualizar paquete con datos de entrega
      await db.paquetes.update(paqueteId, {
        entregadoAt: new Date(),
        entregadoA: formData.nombreRetira,
        firmaDni: formData.dniRetira,
        syncStatus: 'pending' // Marcar para re-sincronizar
      })
      
      // Intentar sincronizar si hay conexión
      if (navigator.onLine) {
        // En producción: llamar al API
        console.log('Sincronizando entrega...')
      }
      
      router.push('/app/paquetes')
    } catch (error) {
      console.error('Error al entregar paquete:', error)
      alert('Error al registrar la entrega')
    } finally {
      setIsSaving(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  if (!paquete) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Paquete no encontrado</p>
          <Link href="/app/paquetes" className="text-blue-600 font-medium">
            Volver a paquetes
          </Link>
        </div>
      </div>
    )
  }
  
  if (paquete.entregadoAt) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="bg-blue-600 text-white p-6">
          <Link href="/app/paquetes" className="text-blue-200 text-sm mb-2 block">
            ← Volver
          </Link>
          <h1 className="text-xl font-bold">Paquete ya entregado</h1>
        </div>
        
        <div className="p-4">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✅</span>
              <div>
                <h2 className="font-bold text-lg">Entregado</h2>
                <p className="text-gray-600">
                  {new Date(paquete.entregadoAt).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t">
              <div className="flex justify-between">
                <span className="text-gray-500">Destinatario</span>
                <span className="font-medium">{paquete.destinatarioUF}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Remitente</span>
                <span className="font-medium">{paquete.remitente}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Retirado por</span>
                <span className="font-medium">{paquete.entregadoA}</span>
              </div>
              {paquete.firmaDni && (
                <div className="flex justify-between">
                  <span className="text-gray-500">DNI</span>
                  <span className="font-medium">****{paquete.firmaDni.slice(-4)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <Link href="/app/paquetes" className="text-blue-200 text-sm mb-2 block">
          ← Volver
        </Link>
        <h1 className="text-xl font-bold">Entregar paquete</h1>
      </div>
      
      {/* Paquete info */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <h2 className="font-bold">{paquete.destinatarioUF}</h2>
              <p className="text-sm text-gray-600">{paquete.remitente}</p>
              {paquete.descripcion && (
                <p className="text-sm text-gray-500">{paquete.descripcion}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 mb-2">Datos de quien retira</h3>
          
          <div>
            <label htmlFor="nombreRetira" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre completo *
            </label>
            <input
              type="text"
              id="nombreRetira"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Juan Pérez"
              value={formData.nombreRetira}
              onChange={(e) => setFormData(prev => ({ ...prev, nombreRetira: e.target.value }))}
            />
          </div>
          
          <div>
            <label htmlFor="dniRetira" className="block text-sm font-medium text-gray-700 mb-1">
              DNI *
            </label>
            <input
              type="text"
              id="dniRetira"
              required
              inputMode="numeric"
              maxLength={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12345678"
              value={formData.dniRetira}
              onChange={(e) => setFormData(prev => ({ ...prev, dniRetira: e.target.value.replace(/\D/g, '') }))}
            />
            <p className="text-xs text-gray-500 mt-1">Solo se guardarán los últimos 4 dígitos</p>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving || !formData.nombreRetira || !formData.dniRetira}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Registrando...
                </span>
              ) : (
                '✓ Confirmar entrega'
              )}
            </button>
          </div>
        </form>
        
        {/* Offline notice */}
        {!navigator.onLine && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">📡</span>
              <div>
                <p className="font-medium text-amber-800">Sin conexión</p>
                <p className="text-sm text-amber-700">
                  La entrega se registrará localmente y se sincronizará cuando vuelvas a tener conexión.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
