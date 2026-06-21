'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { formatCurrency, formatDate } from '@/lib/utils';

interface ResumenData {
  saldoActual: number;
  proximaExpensa: {
    periodo: string;
    total: number;
    vencimiento: string;
  } | null;
  ultimoPago: {
    monto: number;
    fecha: string;
  } | null;
  ticketsPendientes: number;
  comunicadosNuevos: number;
}

export default function AppHomePage() {
  const [resumen, setResumen] = useState<ResumenData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mi-cuenta/resumen`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setResumen(data);
        }
      } catch (error) {
        console.error('Error fetching resumen:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResumen();
  }, []);



  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            className="bg-white rounded-xl p-6 animate-pulse"
            key={i}
          >
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saldo Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-green-100 text-sm font-medium mb-1">Tu saldo</p>
        <p className="text-3xl font-bold mb-4">
          {resumen ? formatCurrency(resumen.saldoActual) : '$0'}
        </p>
        {resumen?.saldoActual && resumen.saldoActual > 0 && (
          <Link
            className="inline-flex items-center px-4 py-2 bg-white text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors min-h-[44px]"
            href="/app/pagos/nuevo"
          >
            Pagar ahora
          </Link>
        )}
        {resumen?.saldoActual === 0 && (
          <p className="text-green-100">✓ Estás al día</p>
        )}
      </div>

      {/* Próxima Expensa */}
      {resumen?.proximaExpensa && (
        <div className="bg-white rounded-xl p-6 shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-gray-500 text-sm">Próxima expensa</p>
              <p className="text-xl font-bold text-gray-800">
                {formatCurrency(resumen.proximaExpensa.total)}
              </p>
            </div>
            <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
              Vence {formatDate(resumen.proximaExpensa.vencimiento)}
            </span>
          </div>
          <Link
            className="text-green-600 text-sm font-medium hover:underline"
            href={`/app/expensas/${resumen.proximaExpensa.periodo}`}
          >
            Ver detalle →
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <QuickAction
          count={null}
          href="/app/expensas"
          icon="📋"
          label="Ver expensas"
        />
        <QuickAction
          count={null}
          href="/app/pagos"
          icon="💳"
          label="Mis pagos"
        />
        <QuickAction
          count={resumen?.ticketsPendientes || null}
          href="/app/tickets"
          icon="🔧"
          label="Reclamos"
        />
        <QuickAction
          count={resumen?.comunicadosNuevos || null}
          href="/app/comunicados"
          icon="📢"
          label="Novedades"
        />
      </div>

      {/* Último Pago */}
      {resumen?.ultimoPago && (
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-gray-500 text-xs mb-1">Último pago</p>
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-800">
              {formatCurrency(resumen.ultimoPago.monto)}
            </span>
            <span className="text-gray-500 text-sm">
              {formatDate(resumen.ultimoPago.fecha)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  label,
  count,
}: {
  href: string;
  icon: string;
  label: string;
  count: number | null;
}) {
  return (
    <Link
      className="bg-white rounded-xl p-4 shadow flex items-center gap-3 hover:bg-gray-50 transition-colors min-h-[60px] relative"
      href={href}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
      {count !== null && count > 0 && (
        <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
