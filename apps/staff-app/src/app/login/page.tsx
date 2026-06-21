'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<'credentials' | 'code'>('credentials')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    email: '',
    codigo: ''
  })
  
  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // Simulación - en producción llamaría al API
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Enviar código de acceso por email/WhatsApp
      setStep('code')
    } catch {
      setError('Error al enviar el código. Intentá de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    
    try {
      // Simulación - en producción verificaría el código
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Guardar sesión y redirigir
      localStorage.setItem('staff-session', JSON.stringify({
        userId: 'encargado-1',
        nombre: 'Carlos Pérez',
        consorcioId: 'consorcio-1',
        edificio: 'Edificio Central'
      }))
      
      router.push('/app')
    } catch {
      setError('Código inválido o expirado.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-800 flex flex-col">
      {/* Header */}
      <div className="p-6 text-center text-white">
        <Link className="inline-block" href="/">
          <h1 className="text-2xl font-bold">VecinoSimple</h1>
          <p className="text-blue-200 text-sm">Staff</p>
        </Link>
      </div>
      
      {/* Card */}
      <div className="flex-1 bg-white rounded-t-3xl p-6 flex flex-col">
        <div className="max-w-sm mx-auto w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {step === 'credentials' ? 'Ingresar' : 'Verificar código'}
          </h2>
          <p className="text-gray-600 mb-6">
            {step === 'credentials' 
              ? 'Ingresá tu email de encargado'
              : `Te enviamos un código a ${formData.email}`}
          </p>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {step === 'credentials' ? (
            <form className="space-y-4" onSubmit={handleSubmitEmail}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  id="email"
                  placeholder="tu@email.com"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <button
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors min-h-touch"
                disabled={isLoading}
                type="submit"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                    </svg>
                    Enviando...
                  </span>
                ) : (
                  'Enviar código'
                )}
              </button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleVerifyCode}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="codigo">
                  Código de verificación
                </label>
                <input
                  required
                  autoComplete="one-time-code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl text-center tracking-widest"
                  id="codigo"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData(prev => ({ ...prev, codigo: e.target.value.replace(/\D/g, '') }))}
                />
              </div>
              
              <button
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors min-h-touch"
                disabled={isLoading || formData.codigo.length < 6}
                type="submit"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" fill="none" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor" />
                    </svg>
                    Verificando...
                  </span>
                ) : (
                  'Verificar'
                )}
              </button>
              
              <button
                className="w-full text-blue-600 py-2 font-medium"
                type="button"
                onClick={() => setStep('credentials')}
              >
                ← Cambiar email
              </button>
            </form>
          )}
        </div>
        
        {/* Offline notice */}
        <div className="mt-auto pt-6">
          <div className="bg-blue-50 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="text-2xl">📱</div>
              <div>
                <p className="font-medium text-blue-900">Funciona sin conexión</p>
                <p className="text-sm text-blue-700 mt-1">
                  Una vez que inicies sesión, podrás usar la app aunque no tengas internet.
                  Los datos se sincronizarán automáticamente cuando vuelvas a conectarte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
