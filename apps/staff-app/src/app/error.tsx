'use client';

import { Button } from '@vecinosimple/ui';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Database, Server } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Log the error for debugging
    console.error('Staff App error:', error);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    reset();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100">
      <div className="max-w-lg w-full space-y-6 text-center px-4">
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
          <h1 className="text-5xl font-bold text-gray-900">Error</h1>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Error en el sistema
          </h2>
          <p className="mt-2 text-gray-600">
            Ha ocurrido un error técnico en la aplicación de encargados.
          </p>
        </div>

        {/* Status indicators */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-lg border-2 ${isOnline ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center justify-center space-x-2">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${isOnline ? 'text-green-800' : 'text-red-800'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-lg border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center justify-center space-x-2">
              <Server className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Sistema
              </span>
            </div>
          </div>
        </div>

        {!isOnline && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-yellow-800">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm font-medium">
                Modo sin conexión disponible
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Algunas funciones pueden estar limitadas.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full" size="lg" disabled={!isOnline}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reintentar ({retryCount}/3)
          </Button>

          <Button variant="secondary" asChild className="w-full">
            <a href="/app">
              Panel principal
            </a>
          </Button>
        </div>

        <div className="text-sm text-gray-500 space-y-2">
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="font-medium text-slate-700">Solución de problemas:</p>
            <ul className="text-xs text-slate-600 mt-1 space-y-1 text-left">
              <li>• Verificar conexión a internet</li>
              <li>• Limpiar caché del navegador</li>
              <li>• Cerrar y reabrir la aplicación</li>
              <li>• Contactar al soporte técnico</li>
            </ul>
          </div>
        </div>

        {retryCount >= 3 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              Si el problema persiste después de varios intentos,
              contacta al equipo de desarrollo.
            </p>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
              Detalles técnicos (desarrollo)
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}