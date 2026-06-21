'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { formatDate } from '@/lib/utils';

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  ubicacion: string | null;
  prioridad: string;
  estado: string;
  createdAt: string;
  updatedAt: string;
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'abiertos'>('abiertos');

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const data = await apiClient.get<Ticket[]>('/mi-cuenta/tickets');
        setTickets(data);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);



  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'ABIERTO':
        return (
          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
            Abierto
          </span>
        );
      case 'EN_PROGRESO':
        return (
          <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
            En progreso
          </span>
        );
      case 'ESPERANDO_RESPUESTA':
        return (
          <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded">
            Esperando respuesta
          </span>
        );
      case 'RESUELTO':
        return (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
            Resuelto
          </span>
        );
      case 'CERRADO':
        return (
          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
            Cerrado
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
            {estado}
          </span>
        );
    }
  };

  const getPrioridadIcon = (prioridad: string) => {
    switch (prioridad) {
      case 'URGENTE':
        return '🔴';
      case 'ALTA':
        return '🟠';
      case 'MEDIA':
        return '🟡';
      default:
        return '🟢';
    }
  };

  const filteredTickets = filter === 'abiertos'
    ? tickets.filter((t) => !['RESUELTO', 'CERRADO'].includes(t.estado))
    : tickets;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div className="bg-white rounded-xl p-4 animate-pulse" key={i}>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
            <div className="h-3 bg-gray-200 rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mis Reclamos</h1>
        <Link
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px] flex items-center"
          href="/app/tickets/nuevo"
        >
          + Nuevo
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
            filter === 'abiertos'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setFilter('abiertos')}
        >
          Abiertos
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
            filter === 'todos'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setFilter('todos')}
        >
          Todos
        </button>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-gray-500 mb-4">
            {filter === 'abiertos'
              ? 'No tenés reclamos abiertos'
              : 'No tenés reclamos'}
          </p>
          <Link
            className="text-green-600 font-medium hover:underline"
            href="/app/tickets/nuevo"
          >
            Crear nuevo reclamo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <Link
              className="block bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow"
              href={`/app/tickets/${ticket.id}`}
              key={ticket.id}
            >
              <div className="flex items-start gap-3">
                <span className="text-xl">{getPrioridadIcon(ticket.prioridad)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <p className="font-semibold text-gray-800 truncate">
                      {ticket.titulo}
                    </p>
                    {getEstadoBadge(ticket.estado)}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {ticket.descripcion}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    {ticket.ubicacion && (
                      <span>📍 {ticket.ubicacion}</span>
                    )}
                    <span>Creado {formatDate(ticket.createdAt)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
