export const dynamic = 'force-dynamic';

import { Button } from '@vecinosimple/ui';
import { WifiOff, RefreshCw, Clock } from 'lucide-react';

export default function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
            <WifiOff className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Sin conexión
          </h1>
          <h2 className="mt-2 text-lg font-semibold text-gray-700">
            Modo sin conexión activado
          </h2>
          <p className="mt-2 text-gray-600">
            No tienes conexión a internet, pero puedes continuar usando algunas funciones.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-blue-800 mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Funciones disponibles offline:</span>
          </div>
          <ul className="text-xs text-blue-700 space-y-1 text-left">
            <li>• Ver expensas anteriores</li>
            <li>• Ver información del edificio</li>
            <li>• Acceder a documentos guardados</li>
            <li>• Ver estado de pagos</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full" size="lg">
            <RefreshCw className="mr-2 h-4 w-4" />
            Verificar conexión
          </Button>

          <Button variant="secondary" asChild className="w-full">
            <a href="/app">
              Continuar offline
            </a>
          </Button>
        </div>

        <p className="text-sm text-gray-500">
          Los cambios se sincronizarán automáticamente cuando recuperes la conexión.
        </p>
      </div>
    </div>
  );
}