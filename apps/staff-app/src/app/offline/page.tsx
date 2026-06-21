export const dynamic = 'force-dynamic';

import { Button } from '@vecinosimple/ui';
import { WifiOff, RefreshCw, Database, Clock } from 'lucide-react';

export default function Offline() {
  const handleRetry = () => {
    globalThis.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <div className="mx-auto h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center">
            <WifiOff className="h-10 w-10 text-slate-600" />
          </div>
          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Sin conexión
          </h1>
          <h2 className="mt-2 text-lg font-semibold text-gray-700">
            Modo offline activado
          </h2>
          <p className="mt-2 text-gray-600">
            Continúa trabajando. Los datos se sincronizarán cuando recuperes la conexión.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2 text-slate-800 mb-3">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Funciones disponibles:</span>
          </div>
          <ul className="text-xs text-slate-700 space-y-1 text-left">
            <li>• Registrar bitácora de seguridad</li>
            <li>• Gestionar recepción de paquetes</li>
            <li>• Ver rondas de vigilancia</li>
            <li>• Acceder a datos guardados localmente</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-center space-x-2 text-blue-800">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">
              Sincronización pendiente: 3 registros
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <Button className="w-full" size="lg" onClick={handleRetry}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Verificar conexión
          </Button>

          <Button asChild className="w-full" variant="secondary">
            <a href="/app">
              Continuar trabajando
            </a>
          </Button>
        </div>

        <div className="text-sm text-gray-500 bg-slate-50 p-3 rounded-lg">
          <p className="font-medium">Modo offline-first:</p>
          <p className="text-xs mt-1">
            Esta aplicación está diseñada para funcionar sin conexión.
            Todos los cambios se guardan localmente y se sincronizan automáticamente.
          </p>
        </div>
      </div>
    </div>
  );
}