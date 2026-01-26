'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { db } from '@/offline/db'

interface UserSession {
  userId: string
  nombre: string
  consorcioId: string
  edificio: string
}

export default function PerfilPage() {
  const router = useRouter()
  const [session, setSession] = useState<UserSession | null>(null)
  const [stats, setStats] = useState({
    bitacoraTotal: 0,
    paquetesHoy: 0,
    rondasHoy: 0,
    pendientesSync: 0
  })
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  
  useEffect(() => {
    // Cargar sesión
    const savedSession = localStorage.getItem('staff-session')
    if (savedSession) {
      setSession(JSON.parse(savedSession))
    }
    
    // Cargar estadísticas
    loadStats()
  }, [])
  
  const loadStats = async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [bitacora, paquetes, rondas] = await Promise.all([
      db.bitacora.count(),
      db.paquetes.where('recibidoAt').above(today).count(),
      db.rondas.where('inicioAt').above(today).count()
    ])
    
    const pendientesBitacora = await db.bitacora.where('syncStatus').equals('pending').count()
    const pendientesPaquetes = await db.paquetes.where('syncStatus').equals('pending').count()
    const pendientesRondas = await db.rondas.where('syncStatus').equals('pending').count()
    
    setStats({
      bitacoraTotal: bitacora,
      paquetesHoy: paquetes,
      rondasHoy: rondas,
      pendientesSync: pendientesBitacora + pendientesPaquetes + pendientesRondas
    })
  }
  
  const handleLogout = () => {
    localStorage.removeItem('staff-session')
    router.push('/')
  }
  
  const handleClearLocalData = async () => {
    if (confirm('¿Estás seguro? Esto eliminará todos los datos locales no sincronizados.')) {
      await db.bitacora.clear()
      await db.paquetes.clear()
      await db.rondas.clear()
      loadStats()
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-6">
        <h1 className="text-xl font-bold">Mi Perfil</h1>
      </div>
      
      {/* User Info */}
      <div className="p-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{session?.nombre || 'Encargado'}</h2>
              <p className="text-gray-600">{session?.edificio || 'Edificio'}</p>
            </div>
          </div>
          
          <div className="space-y-3 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rol</span>
              <span className="font-medium">Encargado</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estado</span>
              <span className="text-green-600 font-medium">Activo</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Statistics */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Estadísticas locales</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">{stats.bitacoraTotal}</div>
            <div className="text-sm text-gray-600">Entradas bitácora</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">{stats.paquetesHoy}</div>
            <div className="text-sm text-gray-600">Paquetes hoy</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">{stats.rondasHoy}</div>
            <div className="text-sm text-gray-600">Rondas hoy</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className={`text-2xl font-bold ${stats.pendientesSync > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
              {stats.pendientesSync}
            </div>
            <div className="text-sm text-gray-600">Pendientes sync</div>
          </div>
        </div>
      </div>
      
      {/* Options */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Opciones</h3>
        <div className="bg-white rounded-xl shadow-sm divide-y">
          <button
            onClick={() => window.location.reload()}
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">🔄</span>
            <div>
              <div className="font-medium">Forzar sincronización</div>
              <div className="text-sm text-gray-500">Sincronizar datos pendientes ahora</div>
            </div>
          </button>
          
          <button
            onClick={handleClearLocalData}
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">🗑️</span>
            <div>
              <div className="font-medium text-red-600">Limpiar datos locales</div>
              <div className="text-sm text-gray-500">Eliminar datos no sincronizados</div>
            </div>
          </button>
          
          <Link
            href="/app"
            className="w-full p-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
          >
            <span className="text-xl">📋</span>
            <div>
              <div className="font-medium">Ir al inicio</div>
              <div className="text-sm text-gray-500">Volver a la pantalla principal</div>
            </div>
          </Link>
        </div>
      </div>
      
      {/* Logout */}
      <div className="p-4">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full bg-red-50 text-red-600 py-4 rounded-xl font-semibold hover:bg-red-100 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
      
      {/* App info */}
      <div className="p-4 text-center text-sm text-gray-500">
        <p>VecinoSimple Staff v1.0.0</p>
        <p className="mt-1">Modo offline habilitado</p>
      </div>
      
      {/* Logout confirmation modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">¿Cerrar sesión?</h3>
            <p className="text-gray-600 mb-6">
              {stats.pendientesSync > 0 
                ? `Tenés ${stats.pendientesSync} registros sin sincronizar. Si cerrás sesión, se perderán.`
                : 'Todos tus datos están sincronizados.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-gray-300 font-medium hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
