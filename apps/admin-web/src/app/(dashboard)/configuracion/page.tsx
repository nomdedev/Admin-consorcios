'use client'

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
import { useState } from 'react'

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

  const saveButtonContent = (() => {
    if (saving) {
      return {
        icon: (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
        ),
        text: 'Guardando...'
      }
    }

    if (saved) {
      return {
        icon: <Check className="h-4 w-4" />,
        text: 'Guardado'
      }
    }

    return {
      icon: <Save className="h-4 w-4" />,
      text: 'Guardar cambios'
    }
  })()

  const getRoleBadgeClass = (rol: string) => {
    if (rol === 'ADMINISTRADOR') {
      return 'bg-purple-100 text-purple-700'
    }
    if (rol === 'ADMIN_STAFF') {
      return 'bg-blue-100 text-blue-700'
    }
    return 'bg-gray-100 text-gray-700'
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
          className={cn(
            'px-4 py-2 rounded-lg transition-colors flex items-center gap-2',
            saved
              ? 'bg-green-600 text-white'
              : 'bg-primary-600 text-white hover:bg-primary-700 disabled:bg-primary-300'
          )}
          disabled={saving}
          onClick={handleSave}
        >
          {saveButtonContent.icon}
          {saveButtonContent.text}
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
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600'
                      : 'text-gray-700 hover:bg-gray-50 border-l-4 border-transparent'
                  )}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-nombre">
                        Nombre del edificio
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-nombre"
                        type="text"
                        value={config.nombreConsorcio}
                        onChange={(e) => updateConfig('nombreConsorcio', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-cuit">
                        CUIT
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-cuit"
                        type="text"
                        value={config.cuit}
                        onChange={(e) => updateConfig('cuit', e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-direccion">
                        Dirección
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-direccion"
                        type="text"
                        value={config.direccion}
                        onChange={(e) => updateConfig('direccion', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-email">
                        Email de contacto
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-email"
                        type="email"
                        value={config.email}
                        onChange={(e) => updateConfig('email', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-telefono">
                        Teléfono
                      </label>
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-telefono"
                        type="tel"
                        value={config.telefono}
                        onChange={(e) => updateConfig('telefono', e.target.value)}
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
                        aria-label={item.label}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                        key={item.key}
                      >
                        <input
                          checked={config[item.key as keyof typeof config] as boolean}
                          className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          type="checkbox"
                          onChange={(e) => updateConfig(item.key, e.target.checked)}
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
                    <label
                      aria-label="Alertas de emergencia"
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        checked={config.whatsappEmergencias}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        type="checkbox"
                        onChange={(e) => updateConfig('whatsappEmergencias', e.target.checked)}
                      />
                      <div>
                        <span className="font-medium text-gray-900 flex items-center gap-2">
                          <MessageCircle className="h-4 w-4 text-green-600" />
                          Alertas de emergencia
                        </span>
                        <p className="text-sm text-gray-500">Cortes de servicio, evacuaciones, etc.</p>
                      </div>
                    </label>

                    <label
                      aria-label="Recordatorios de pago"
                      className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        checked={config.whatsappRecordatorios}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        type="checkbox"
                        onChange={(e) => updateConfig('whatsappRecordatorios', e.target.checked)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-dia-vencimiento">
                        Día de vencimiento
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-dia-vencimiento"
                        value={config.diaVencimiento}
                        onChange={(e) => updateConfig('diaVencimiento', Number(e.target.value))}
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(dia => (
                          <option key={dia} value={dia}>{dia}</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">De cada mes</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-dias-gracia">
                        Días de gracia
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-dias-gracia"
                        value={config.diasGracia}
                        onChange={(e) => updateConfig('diasGracia', Number(e.target.value))}
                      >
                        {[0, 3, 5, 7, 10, 15].map(dias => (
                          <option key={dias} value={dias}>{dias} días</option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 mt-1">Sin interés</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-tasa-interes">
                        Tasa de interés
                      </label>
                      <div className="relative">
                        <input
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10"
                          id="config-tasa-interes"
                          max="10"
                          min="0"
                          step="0.5"
                          type="number"
                          value={config.tasaInteres}
                          onChange={(e) => updateConfig('tasaInteres', Number(e.target.value))}
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
                    <label
                      aria-label="Mercado Pago"
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
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
                        checked={config.mercadoPagoActivo}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        type="checkbox"
                        onChange={(e) => updateConfig('mercadoPagoActivo', e.target.checked)}
                      />
                    </label>

                    <label
                      aria-label="Transferencia Bancaria"
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
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
                        checked={config.transferenciaActiva}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        type="checkbox"
                        onChange={(e) => updateConfig('transferenciaActiva', e.target.checked)}
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
                    <label
                      aria-label="Requerir 2FA para administradores"
                      className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        checked={config.twoFactorRequired}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        type="checkbox"
                        onChange={(e) => updateConfig('twoFactorRequired', e.target.checked)}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-session-timeout">
                        Timeout de sesión (minutos)
                      </label>
                      <select
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-session-timeout"
                        value={config.sessionTimeout}
                        onChange={(e) => updateConfig('sessionTimeout', Number(e.target.value))}
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
                      <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="config-password-length">
                        Longitud mínima de contraseña
                      </label>
                      <select
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        id="config-password-length"
                        value={config.passwordMinLength}
                        onChange={(e) => updateConfig('passwordMinLength', Number(e.target.value))}
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
                    ].map((user) => (
                      <div className="flex items-center justify-between p-4" key={user.email}>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{user.avatar}</span>
                          <div>
                            <p className="font-medium text-gray-900">{user.nombre}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </div>
                        <span className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium',
                          getRoleBadgeClass(user.rol)
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
                        aria-label={tema.label}
                        className={cn(
                          'p-4 border-2 rounded-lg cursor-pointer text-center transition-colors',
                          config.tema === tema.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        )}
                        key={tema.id}
                      >
                        <input
                          checked={config.tema === tema.id}
                          className="sr-only"
                          name="tema"
                          type="radio"
                          value={tema.id}
                          onChange={(e) => updateConfig('tema', e.target.value)}
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
                      className="w-12 h-12 rounded-lg border border-gray-300 cursor-pointer"
                      id="config-color-picker"
                      type="color"
                      value={config.colorPrimario}
                      onChange={(e) => updateConfig('colorPrimario', e.target.value)}
                    />
                    <label className="sr-only" htmlFor="config-color-hex">Color primario en hexadecimal</label>
                    <input
                      className="px-3 py-2 border border-gray-300 rounded-lg w-32 font-mono"
                      id="config-color-hex"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      type="text"
                      value={config.colorPrimario}
                      onChange={(e) => updateConfig('colorPrimario', e.target.value)}
                    />

                    {/* Presets */}
                    <div className="flex gap-2">
                      {['#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#607D8B'].map((color) => (
                        <button
                          aria-label={`Seleccionar color ${color}`}
                          className={cn(
                            'w-8 h-8 rounded-full border-2 transition-transform hover:scale-110',
                            config.colorPrimario === color ? 'border-gray-900' : 'border-transparent'
                          )}
                          key={color}
                          style={{ backgroundColor: color }}
                          onClick={() => updateConfig('colorPrimario', color)}
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
