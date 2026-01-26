'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, type RondaLocal } from '@/offline/db';

export default function RondasPage() {
  const [rondas, setRondas] = useState<RondaLocal[]>([]);
  const [rondaActiva, setRondaActiva] = useState<RondaLocal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadRondas = async () => {
      try {
        const all = await db.rondas.orderBy('inicioAt').reverse().toArray();
        
        // Buscar ronda activa (sin finAt)
        const activa = all.find((r) => !r.finAt);
        setRondaActiva(activa || null);
        
        // Mostrar las últimas 20 rondas completadas
        setRondas(all.filter((r) => !!r.finAt).slice(0, 20));
      } finally {
        setIsLoading(false);
      }
    };

    loadRondas();
  }, []);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (inicio: Date, fin: Date) => {
    const diff = new Date(fin).getTime() - new Date(inicio).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Rondas</h1>
        {!rondaActiva && (
          <Link
            href="/app/rondas/nueva"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
          >
            + Iniciar
          </Link>
        )}
      </div>

      {/* Ronda activa */}
      {rondaActiva && (
        <Link
          href={`/app/rondas/${rondaActiva.localId}`}
          className="block bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">🔒</span>
            <div>
              <p className="text-purple-100 text-sm">Ronda en curso</p>
              <p className="text-lg font-semibold">
                {rondaActiva.checkpoints.length} checkpoint(s)
              </p>
            </div>
          </div>
          <p className="text-purple-100 text-sm">
            Iniciada: {formatDateTime(rondaActiva.inicioAt)}
          </p>
          <p className="mt-4 text-white font-medium">
            Tocar para continuar →
          </p>
        </Link>
      )}

      {/* Historial */}
      <div>
        <h2 className="font-semibold text-gray-800 mb-4">Historial de rondas</h2>
        
        {rondas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-gray-500 mb-4">No hay rondas registradas</p>
            {!rondaActiva && (
              <Link
                href="/app/rondas/nueva"
                className="text-blue-600 font-medium hover:underline"
              >
                Iniciar primera ronda
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {rondas.map((ronda) => (
              <Link
                key={ronda.localId}
                href={`/app/rondas/${ronda.localId}`}
                className="block bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-800">
                      {formatDateTime(ronda.inicioAt)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {ronda.checkpoints.length} checkpoint(s) •{' '}
                      {ronda.finAt && formatDuration(ronda.inicioAt, ronda.finAt)}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      ronda.syncStatus === 'synced'
                        ? 'badge-synced'
                        : ronda.syncStatus === 'error'
                        ? 'badge-error'
                        : 'badge-pending'
                    }`}
                  >
                    {ronda.syncStatus === 'synced'
                      ? '✓'
                      : ronda.syncStatus === 'error'
                      ? '!'
                      : '↻'}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
