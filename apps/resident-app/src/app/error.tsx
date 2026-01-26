'use client';

import { Button } from '@vecinosimple/ui';
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Log the error
    console.error('Resident App error:', error);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-md w-full space-y-6 text-center px-4">
        <div className="flex justify-center">
          <div className="relative">
            <AlertTriangle className="h-20 w-20 text-red-500" />
            {!isOnline && (
              <div className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1">
                <WifiOff className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-5xl font-bold text-gray-900">¡Oops!</h1>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Algo salió mal
          </h2>
          <p className="mt-2 text-gray-600">
            Ha ocurrido un error inesperado en la aplicación.
          </p>

          {!isOnline && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-yellow-800">
                <WifiOff className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Sin conexión a internet
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1">
                Revisa tu conexión y vuelve a intentar.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button onClick={reset} className="w-full" size="lg" disabled={!isOnline}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Intentar nuevamente
          </Button>

          <Button variant="secondary" asChild className="w-full">
            <a href="/app">
              Ir a mi panel
            </a>
          </Button>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p>Si el problema persiste:</p>
          <p>• Cierra y vuelve a abrir la app</p>
          <p>• Borra el caché del navegador</p>
          <p>• Contacta al administrador del edificio</p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Detalles técnicos (desarrollo)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}