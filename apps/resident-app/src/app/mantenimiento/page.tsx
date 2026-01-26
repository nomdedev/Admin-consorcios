export const dynamic = 'force-dynamic';

import { Button } from '@vecinosimple/ui';
import { Wrench, Clock, RefreshCw } from 'lucide-react';

export default function Maintenance() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <div className="mx-auto h-24 w-24 bg-orange-100 rounded-full flex items-center justify-center">
            <Wrench className="h-12 w-12 text-orange-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            En mantenimiento
          </h1>
          <h2 className="mt-2 text-lg font-semibold text-gray-700">
            VecinoSimple está siendo actualizado
          </h2>
          <p className="mt-2 text-gray-600">
            Estamos trabajando para mejorar tu experiencia. Volveremos pronto.
          </p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-orange-800 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Tiempo estimado:</span>
          </div>
          <p className="text-lg font-semibold text-orange-900">
            15-30 minutos
          </p>
          <p className="text-xs text-orange-700 mt-1">
            El sistema volverá automáticamente
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Verificar si ya está disponible
          </Button>
        </div>

        <div className="text-sm text-gray-500 space-y-2">
          <p>Durante el mantenimiento:</p>
          <p>• No podrás acceder a la aplicación</p>
          <p>• Los pagos están seguros</p>
          <p>• Te notificaremos cuando esté listo</p>
        </div>

        <div className="text-xs text-gray-400 border-t pt-4">
          <p>Si necesitas ayuda urgente, contacta a tu administrador.</p>
        </div>
      </div>
    </div>
  );
}