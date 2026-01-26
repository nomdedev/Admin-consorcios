'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { db, type BitacoraLocal } from '@/offline/db';

type FilterType = 'todos' | 'ingreso_visita' | 'ronda' | 'incidente' | 'novedad';

export default function BitacoraPage() {
  const [entries, setEntries] = useState<BitacoraLocal[]>([]);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      try {
        let query = db.bitacora.orderBy('timestamp').reverse();
        
        if (filter !== 'todos') {
          const all = await query.toArray();
          setEntries(all.filter((e) => e.tipo === filter));
        } else {
          setEntries(await query.limit(50).toArray());
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [filter]);

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case 'ingreso_visita':
        return { label: 'Visita', icon: '👤', color: 'bg-blue-100 text-blue-700' };
      case 'ronda':
        return { label: 'Ronda', icon: '🔒', color: 'bg-purple-100 text-purple-700' };
      case 'incidente':
        return { label: 'Incidente', icon: '⚠️', color: 'bg-red-100 text-red-700' };
      case 'novedad':
        return { label: 'Novedad', icon: '📝', color: 'bg-green-100 text-green-700' };
      default:
        return { label: tipo, icon: '📋', color: 'bg-gray-100 text-gray-700' };
    }
  };

  const filters: { value: FilterType; label: string }[] = [
    { value: 'todos', label: 'Todos' },
    { value: 'ingreso_visita', label: 'Visitas' },
    { value: 'incidente', label: 'Incidentes' },
    { value: 'novedad', label: 'Novedades' },
  ];

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
        <h1 className="text-2xl font-bold text-gray-800">Bitácora</h1>
        <Link
          href="/app/bitacora/nuevo"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors min-h-[44px] flex items-center"
        >
          + Nueva
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap min-h-[44px] ${
              filter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {entries.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-gray-500 mb-4">No hay entradas en la bitácora</p>
          <Link
            href="/app/bitacora/nuevo"
            className="text-blue-600 font-medium hover:underline"
          >
            Crear primera entrada
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => {
            const tipoInfo = getTipoLabel(entry.tipo);
            return (
              <Link
                key={entry.localId}
                href={`/app/bitacora/${entry.localId}`}
                className="block bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tipoInfo.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded ${tipoInfo.color}`}
                      >
                        {tipoInfo.label}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          entry.syncStatus === 'synced'
                            ? 'badge-synced'
                            : entry.syncStatus === 'error'
                            ? 'badge-error'
                            : 'badge-pending'
                        }`}
                      >
                        {entry.syncStatus === 'synced'
                          ? 'Sincronizado'
                          : entry.syncStatus === 'error'
                          ? 'Error'
                          : 'Pendiente'}
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium truncate">
                      {entry.descripcion}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>📅 {formatDateTime(entry.timestamp)}</span>
                      {entry.ubicacion && <span>📍 {entry.ubicacion}</span>}
                    </div>
                    {entry.visitanteNombre && (
                      <p className="text-sm text-gray-600 mt-1">
                        👤 {entry.visitanteNombre}
                        {entry.visitanteDestino && ` → ${entry.visitanteDestino}`}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
