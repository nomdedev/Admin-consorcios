'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Pago {
  id: string;
  monto: number;
  metodoPago: string;
  estado: string;
  periodosAbonados: string[];
  concepto: string;
  fechaPago: string | null;
  createdAt: string;
  comprobanteUrl?: string;
}

export default function PagosPage() {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPagos = async () => {
      try {
        const data = await apiClient.get<Pago[]>('/mi-cuenta/pagos');
        setPagos(data);
      } catch (error) {
        console.error('Error fetching pagos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPagos();
  }, []);



  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'APROBADO':
        return (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
            Aprobado
          </span>
        );
      case 'PENDIENTE':
      case 'PROCESANDO':
        return (
          <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
            Procesando
          </span>
        );
      case 'RECHAZADO':
        return (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">
            Rechazado
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

  const getMetodoPagoIcon = (metodo: string) => {
    switch (metodo) {
      case 'MERCADO_PAGO':
        return '💳';
      case 'TRANSFERENCIA':
        return '🏦';
      case 'EFECTIVO':
        return '💵';
      default:
        return '💰';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div className="bg-white rounded-xl p-4 animate-pulse" key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-6 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Mis Pagos</h1>
        <Link
          className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors min-h-[44px] flex items-center"
          href="/app/pagos/nuevo"
        >
          + Nuevo pago
        </Link>
      </div>

      {pagos.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-5xl mb-4">💳</div>
          <p className="text-gray-500 mb-4">Aún no tenés pagos registrados</p>
          <Link
            className="text-green-600 font-medium hover:underline"
            href="/app/pagos/nuevo"
          >
            Realizar primer pago
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pagos.map((pago) => (
            <Link
              className="block bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow"
              href={`/app/pagos/${pago.id}`}
              key={pago.id}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getMetodoPagoIcon(pago.metodoPago)}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-800">
                      {formatCurrency(pago.monto)}
                    </p>
                    {getEstadoBadge(pago.estado)}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{pago.concepto}</p>
                  <p className="text-xs text-gray-500">
                    {pago.fechaPago
                      ? formatDate(pago.fechaPago)
                      : formatDate(pago.createdAt)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
