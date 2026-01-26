'use client'

import { useState } from 'react'
import {
  Settings,
  Building2,
  Bell,
  CreditCard,
  Shield,
  Users,
  Palette,
  Globe,
  Mail,
  MessageCircle,
  Clock,
  Save,
  Check,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'

// Tabs de configuración
const tabs = [
  { id: 'general', label: 'General', icon: Building2 },
  { id: 'notificaciones', label: 'Notificaciones', icon: Bell },
  { id: 'pagos', label: 'Pagos', icon: CreditCard },
  { id: 'seguridad', label: 'Seguridad', icon: Shield },
  { id: 'equipo', label: 'Equipo', icon: Users },
  { id: 'apariencia', label: 'Apariencia', icon: Palette },
] as const

type TabId = typeof tabs[number]['id']

export default function ConfiguracionPage() {
  const [activeTab, setActiveTab] = useState<TabId>('general')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Estados del formulario (simulados)
  const [config, setConfig] = useState({
    // General
    nombreConsorcio: 'Edificio San Martín 1234',
    direccion: 'Av. San Martín 1234, CABA',
    cuit: '30-12345678-9',
    email: 'admin@edificiosanmartin.com',
    telefono: '11-1234-5678',
    
    // Notificaciones
    emailExpensas: true,
    emailReclamos: true,
    emailComunicados: true,
    emailAsambleas: true,
    whatsappEmergencias: true,
    whatsappRecordatorios: false,
    pushActivo: true,
    
    // Pagos
    diaVencimiento: 10,
    diasGracia: 5,
    tasaInteres: 3,
    mercadoPagoActivo: true,
    transferenciaActiva: true,
    
    // Seguridad
    twoFactorRequired: false,
    sessionTimeout: 30,
    passwordMinLength: 8,
    
    // Apariencia
    tema: 'auto',
    colorPrimario: '#4CAF50',
  })

  const handleSave = async () => {
    setSaving(true)
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateConfig = (key: string, value: unknown) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Settings className="h-7 w-7 text-primary-600" />
            Configuración
          </h1>
          <p className="text-gray-500 mt-1">
            Administrá las preferencias del consorcio
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className={cn(
            'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300'
          )}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Guardando...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Guardado
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Guardar cambios
            </>
          )}
        </button>
      </div>

      {/* Layout con tabs */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar de tabs */}
        <div className="lg:w-64 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                  )}
                >
                  <Icon className={cn(
                    'h-5 w-5',
                    activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
                  )} />
                  <span className="font-medium">{tab.label}</span>
                  <ChevronRight className={cn(
                    'h-4 w-4 ml-auto transition-transform',
                    activeTab === tab.id ? 'text-primary-600' : 'text-gray-300'
                  )} />
                </button>
              )
            })}
          </nav>
        </div>

        {/* Contenido del tab */}
        <div className="flex-1">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            {/* General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Información del Consorcio
                  </h2>
                  
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del edificio
                      </label>
                      <input
                        type="text"
                        value={config.nombreConsorcio}
                        onChange={(e) => updateConfig('nombreConsorcio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CUIT
                      </label>
                      <input
                        type="text"
                        value={config.cuit}
                        onChange={(e) => updateConfig('cuit', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Dirección
                      </label>
                      <input
                        type="text"
                        value={config.direccion}
                        onChange={(e) => updateConfig('direccion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email de contacto
                      </label>
                      <input
                        type="email"
                        value={config.email}
                        onChange={(e) => updateConfig('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono
                      </label>
                      <input
                        type="tel"
                        value={config.telefono}
                        onChange={(e) => updateConfig('telefono', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notificaciones */}
            {activeTab === 'notificaciones' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Notificaciones por Email
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Elegí qué notificaciones enviar por email a los vecinos
                  </p>

                  <div className="space-y-3">
                    {[
                      { key: 'emailExpensas', label: 'Nueva expensa disponible', desc: 'Cuando se publica una nueva liquidación' },
                      { key: 'emailReclamos', label: 'Actualizaciones de reclamos', desc: 'Cambios de estado en tickets' },
                      { key: 'emailComunicados', label: 'Comunicados importantes', desc: 'Nuevos anuncios del consorcio' },
                      { key: 'emailAsambleas', label: 'Convocatorias a asambleas', desc: 'Recordatorios de próximas reuniones' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={config[item.key as keyof typeof config] as boolean}
                          onChange={(e) => updateConfig(item.key, e.target.checked)}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <div>
                          <span className="font-medium text-gray-900 flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            {item.label}
                          </span>
                          <p className="text-sm text-gray-500">{item.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <hr />

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Notificaciones por WhatsApp
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    WhatsApp se usa para comunicaciones urgentes
                  </p>

                  <div className="space-y-3">
                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.whatsappEmergencias}
                        onChange={(e) => updateConfig('whatsappEmergencias', e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          Alertas de emergencia
                        </span>
                        <p className="text-sm text-gray-500">Cortes de servicio, evacuaciones, etc.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.whatsappRecordatorios}
                        onChange={(e) => updateConfig('whatsappRecordatorios', e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          Recordatorios de pago
                        </span>
                        <p className="text-sm text-gray-500">48hs antes del vencimiento</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Pagos */}
            {activeTab === 'pagos' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Vencimientos y Mora
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Día de vencimiento
                      </label>
                      <select
                        value={config.diaVencimiento}
                        onChange={(e) => updateConfig('diaVencimiento', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                          <option key={dia} value={dia}>{dia}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">De cada mes</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Días de gracia
                      </label>
                      <select
                        value={config.diasGracia}
                        onChange={(e) => updateConfig('diasGracia', Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {[0, 3, 5, 7, 10, 15].map(dias => (
                          <option key={dias} value={dias}>{dias} días</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Sin interés</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tasa de interés
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={config.tasaInteres}
                          onChange={(e) => updateConfig('tasaInteres', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Mensual por mora</p>
                    </div>
                  </div>
                </div>

                <hr />

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Métodos de Pago Habilitados
                  </h2>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">💳</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Mercado Pago</span>
                          <p className="text-sm text-gray-500">Tarjetas, efectivo, transferencia</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.mercadoPagoActivo}
                        onChange={(e) => updateConfig('mercadoPagoActivo', e.target.checked)}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </label>

                    <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">🏦</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Transferencia Bancaria</span>
                          <p className="text-sm text-gray-500">CBU / Alias del consorcio</p>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={config.transferenciaActiva}
                        onChange={(e) => updateConfig('transferenciaActiva', e.target.checked)}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </label>
                  </div>

                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                      <p className="text-sm text-yellow-800">
                        <strong>Importante:</strong> El dinero de los pagos va directamente al CBU del consorcio. 
                        VecinoSimple solo cobra una comisión del 2% sobre pagos con Mercado Pago.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Seguridad */}
            {activeTab === 'seguridad' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Autenticación
                  </h2>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.twoFactorRequired}
                        onChange={(e) => updateConfig('twoFactorRequired', e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <div>
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-primary-600" />
                          Requerir 2FA para administradores
                        </span>
                        <p className="text-sm text-gray-500">
                          Todos los usuarios con rol de administrador deberán activar 
                          verificación en dos pasos
                        </p>
                      </div>
                    </label>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Timeout de sesión (minutos)
                      </label>
                      <select
                        value={config.sessionTimeout}
                        onChange={(e) => updateConfig('sessionTimeout', Number(e.target.value))}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={60}>1 hora</option>
                        <option value={120}>2 horas</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Tiempo de inactividad antes de cerrar sesión
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Longitud mínima de contraseña
                      </label>
                      <select
                        value={config.passwordMinLength}
                        onChange={(e) => updateConfig('passwordMinLength', Number(e.target.value))}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value={6}>6 caracteres</option>
                        <option value={8}>8 caracteres</option>
                        <option value={10}>10 caracteres</option>
                        <option value={12}>12 caracteres</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr />

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    🔒 Seguridad de VecinoSimple
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Encriptación AES-256 para datos sensibles (DNI, CBU)</li>
                    <li>• Row Level Security en base de datos</li>
                    <li>• Auditoría inmutable de operaciones financieras</li>
                    <li>• Magic Links para login sin contraseña</li>
                    <li>• Rate limiting para prevenir ataques</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Equipo */}
            {activeTab === 'equipo' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-2">
                    Miembros del Equipo
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Administrá los usuarios con acceso a este consorcio
                  </p>

                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                    {[
                      { nombre: 'María García', email: 'maria@admin.com', rol: 'ADMINISTRADOR', avatar: '👩‍💼' },
                      { nombre: 'Juan Pérez', email: 'juan@admin.com', rol: 'ADMIN_STAFF', avatar: '👨‍💻' },
                      { nombre: 'Carlos López', email: 'carlos@edificio.com', rol: 'ENCARGADO', avatar: '👷' },
                    ].map((user, i) => (
                      <div key={i} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{user.avatar}</span>
                          <div>
                            <p className="font-medium text-gray-900">{user.nombre}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          user.rol === 'ADMINISTRADOR' ? 'bg-purple-100 text-purple-700' :
                          user.rol === 'ADMIN_STAFF' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {user.rol}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button className="mt-4 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Invitar nuevo miembro
                  </button>
                </div>
              </div>
            )}

            {/* Apariencia */}
            {activeTab === 'apariencia' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Tema de la Aplicación
                  </h2>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { id: 'claro', label: 'Claro', icon: '☀️' },
                      { id: 'oscuro', label: 'Oscuro', icon: '🌙' },
                      { id: 'auto', label: 'Automático', icon: '🌓' },
                    ].map((tema) => (
                      <label
                        key={tema.id}
                        className={cn(
                          'p-4 border-2 rounded-lg cursor-pointer text-center transition-colors',
                          config.tema === tema.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                      >
                        <input
                          type="radio"
                          name="tema"
                          value={tema.id}
                          checked={config.tema === tema.id}
                          onChange={(e) => updateConfig('tema', e.target.value)}
                          className="sr-only"
                        />
                        <span className="text-2xl block mb-2">{tema.icon}</span>
                        <span className="font-medium text-gray-900">{tema.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <hr />

                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Color Principal
                  </h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Este color se usará en botones y elementos destacados
                  </p>

                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={config.colorPrimario}
                      onChange={(e) => updateConfig('colorPrimario', e.target.value)}
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={config.colorPrimario}
                      onChange={(e) => updateConfig('colorPrimario', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg w-32 font-mono"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />

                    {/* Presets */}
                    <div className="flex gap-2">
                      {['#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#607D8B'].map((color) => (
                        <button
                          key={color}
                          onClick={() => updateConfig('colorPrimario', color)}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                            config.colorPrimario === color ? 'border-gray-900' : 'border-transparent'
                          )}
                          style={{ backgroundColor: color }}
                          aria-label={`Seleccionar color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-600" />
                    Accesibilidad
                  </h3>
                  <p className="text-sm text-gray-600">
                    VecinoSimple cumple con WCAG 2.1 nivel AA para garantizar que todos 
                    los usuarios, incluyendo adultos mayores, puedan usar la plataforma 
                    sin dificultad.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
