'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, type PaqueteLocal } from '@/offline/db';

export default function PaquetesPage() {
  const [paquetes, setPaquetes] = useState<PaqueteLocal[]>([]);
  const [filter, setFilter] = useState<'pendientes' | 'entregados'>('pendientes');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPaquetes = async () => {
      try {
        const all = await db.paquetes.orderBy('recibidoAt').reverse().toArray();
        
        if (filter === 'pendientes') {
          setPaquetes(all.filter((p) => !p.entregadoAt));
        } else {
          setPaquetes(all.filter((p) => !!p.entregadoAt));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadPaquetes();
  }, [filter]);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <h1 className="text-2xl font-bold text-gray-800">Paquetes</h1>
        <Link
          href="/app/paquetes/recibir"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
        >
          + Recibir
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('pendientes')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
            filter === 'pendientes'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('entregados')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
            filter === 'entregados'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Entregados
        </button>
      </div>

      {/* Lista */}
      {paquetes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500 mb-4">
            {filter === 'pendientes'
              ? 'No hay paquetes pendientes de entrega'
              : 'No hay paquetes entregados'}
          </p>
          {filter === 'pendientes' && (
            <Link
              href="/app/paquetes/recibir"
              className="text-blue-600 font-medium hover:underline"
            >
              Recibir un paquete
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paquetes.map((paquete) => (
            <div
              key={paquete.localId}
              className="bg-white rounded-xl p-4 shadow"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">📦</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">
                      {paquete.destinatarioUF}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        paquete.entregadoAt
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {paquete.entregadoAt ? 'Entregado' : 'Pendiente'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    De: {paquete.remitente}
                  </p>
                  {paquete.descripcion && (
                    <p className="text-sm text-gray-500 truncate">
                      {paquete.descripcion}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Recibido: {formatDateTime(paquete.recibidoAt)}
                  </p>
                  {paquete.entregadoAt && (
                    <p className="text-xs text-green-600">
                      Entregado a {paquete.entregadoA} -{' '}
                      {formatDateTime(paquete.entregadoAt)}
                    </p>
                  )}
                  
                  {/* Botón de entregar para paquetes pendientes */}
                  {!paquete.entregadoAt && (
                    <Link
                      href={`/app/paquetes/${paquete.localId}/entregar`}
                      className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                    >
                      ✓ Entregar
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
