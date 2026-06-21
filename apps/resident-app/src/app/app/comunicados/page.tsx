'use client';

import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface Comunicado {
  id: string;
  titulo: string;
  contenido: string;
  importante: boolean;
  publicarDesde: string;
  createdAt: string;
}

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchComunicados = async () => {
      try {
        const data = await apiClient.get<Comunicado[]>('/mi-cuenta/comunicados');
        setComunicados(data);
      } catch (error) {
        console.error('Error fetching comunicados:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComunicados();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div className="bg-white rounded-xl p-4 animate-pulse" key={i}>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-16 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Novedades</h1>

      {comunicados.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-5xl mb-4">📢</div>
          <p className="text-gray-500">No hay novedades por el momento</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comunicados.map((comunicado) => (
            <article
              className={`bg-white rounded-xl p-6 shadow ${
                comunicado.importante
                  ? 'border-l-4 border-yellow-500'
                  : ''
              }`}
              key={comunicado.id}
            >
              <div className="flex items-start gap-3 mb-3">
                {comunicado.importante && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
                    Importante
                  </span>
                )}
              </div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">
                {comunicado.titulo}
              </h2>
              <div 
                className="text-gray-600 text-sm prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: comunicado.contenido }}
              />
              <p className="text-xs text-gray-400 mt-4">
                Publicado el {formatDate(comunicado.publicarDesde)}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
