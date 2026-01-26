export const dynamic = 'force-dynamic';

import { Button } from '@vecinosimple/ui';
import { Wrench, RefreshCw, AlertTriangle, Phone } from 'lucide-react';

export default function Maintenance() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <div className="mx-auto h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center">
            <Wrench className="h-10 w-10 text-orange-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Mantenimiento
          </h1>
          <h2 className="mt-2 text-lg font-semibold text-gray-700">
            Sistema en mantenimiento programado
          </h2>
          <p className="mt-2 text-gray-600">
            El equipo técnico está realizando actualizaciones importantes.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-orange-800 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Información importante:</span>
          </div>
          <ul className="text-xs text-orange-700 space-y-1 text-left">
            <li>• El sistema volverá automáticamente</li>
            <li>• Los datos están seguros</li>
            <li>• No se perderá información</li>
            <li>• Se notificará cuando esté listo</li>
          </ul>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2 text-red-800 mb-2">
            <Phone className="h-4 w-4" />
            <span className="text-sm font-medium">Emergencias:</span>
          </div>
          <p className="text-xs text-red-700">
            Si hay una emergencia en el edificio, contacta directamente a emergencias locales.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Verificar si ya está disponible
          </Button>
        </div>

        <div className="text-sm text-gray-500 space-y-2">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="font-medium text-slate-700">Próximas actualizaciones:</p>
            <ul className="text-xs text-slate-600 mt-1 space-y-1 text-left">
              <li>• Mejoras en sincronización offline</li>
              <li>• Nuevas funciones de seguridad</li>
              <li>• Optimización de rendimiento</li>
              <li>• Corrección de bugs reportados</li>
            </ul>
          </div>
        </div>

        <div className="text-xs text-gray-400 border-t pt-4">
          <p>Para soporte técnico urgente: soporte@vecinosimple.com</p>
        </div>
      </div>
    </div>
  );
}