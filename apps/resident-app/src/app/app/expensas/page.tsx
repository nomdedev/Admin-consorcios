'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatPeriodo, formatDate } from '@/lib/utils';

interface Expensa {
  id: string;
  periodo: string;
  total: number;
  estadoPago: 'PAGADO' | 'PARCIAL' | 'PENDIENTE' | 'VENCIDO';
  fechaVencimiento: string;
  fechaSegundoVencimiento?: string;
  montoOrdinario: number;
  montoExtraordinario: number;
  saldoAnterior: number;
  intereses: number;
  bonificacion: number;
  montoPagado: number;
  saldoPendiente: number;
}

interface ExpensasResponse {
  data: Expensa[];
  total: number;
  saldoActual: number;
}

export default function ExpensasPage() {
  const [expensas, setExpensas] = useState<Expensa[]>([]);
  const [saldoActual, setSaldoActual] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'todas' | 'pendientes'>('todas');
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());

  useEffect(() => {
    const fetchExpensas = async () => {
      try {
        const data = await apiClient.get<ExpensasResponse>('/mi-portal/expensas', {
          anio: year,
          limit: '12',
        });
        setExpensas(data.data);
        setSaldoActual(data.saldoActual);
      } catch (error) {
        console.error('Error fetching expensas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpensas();
  }, [year]);

  const filteredExpensas = filter === 'pendientes'
    ? expensas.filter((e) => e.estadoPago !== 'PAGADO')
    : expensas;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'PAGADO':
        return (
          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-1 rounded">
            Pagado
          </span>
        );
      case 'PARCIAL':
        return (
          <span className="bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-1 rounded">
            Parcial
          </span>
        );
      case 'VENCIDO':
        return (
          <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-1 rounded">
            Vencido
          </span>
        );
      default:
        return (
          <span className="bg-orange-100 text-orange-700 text-xs font-medium px-2 py-1 rounded">
            Pendiente
          </span>
        );
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
        <h1 className="text-2xl font-bold text-gray-800">Mis Expensas</h1>
        <Link
          className="text-green-600 text-sm font-medium hover:underline"
          href="/app/gastos-edificio"
        >
          Ver gastos del edificio →
        </Link>
      </div>

      {/* Saldo actual */}
      <div className={`p-4 rounded-xl ${saldoActual > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
        <p className="text-sm text-gray-600">Saldo actual</p>
        <p className={`text-2xl font-bold ${saldoActual > 0 ? 'text-red-600' : 'text-green-600'}`}>
          {formatCurrency(saldoActual)}
        </p>
        {saldoActual > 0 && (
          <Link
            className="inline-block mt-2 text-sm text-red-600 font-medium hover:underline"
            href="/app/pagos/nuevo"
          >
            Pagar ahora →
          </Link>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <select
          aria-label="Filtrar por año"
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white min-h-[44px]"
          value={year}
          onChange={(e) => setYear(e.target.value)}
        >
          {[...Array(5)].map((_, i) => {
            const y = new Date().getFullYear() - i;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </select>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
            filter === 'todas'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setFilter('todas')}
        >
          Todas
        </button>
        <button
          className={`px-4 py-2 rounded-lg font-medium transition-colors min-h-[44px] ${
            filter === 'pendientes'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
          onClick={() => setFilter('pendientes')}
        >
          Pendientes
        </button>
      </div>

      {/* Lista de expensas */}
      {filteredExpensas.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay expensas para mostrar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExpensas.map((expensa) => (
            <Link
              className="block bg-white rounded-xl p-4 shadow hover:shadow-md transition-shadow"
              href={`/app/expensas/${expensa.periodo}`}
              key={expensa.id}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-800 capitalize">
                    {formatPeriodo(expensa.periodo)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Vence: {formatDate(expensa.fechaVencimiento)}
                  </p>
                </div>
                {getEstadoBadge(expensa.estadoPago)}
              </div>

              <div className="flex justify-between items-end">
                <div className="text-sm text-gray-600">
                  <p>Ordinarias: {formatCurrency(expensa.montoOrdinario)}</p>
                  {expensa.montoExtraordinario > 0 && (
                    <p>Extraordinarias: {formatCurrency(expensa.montoExtraordinario)}</p>
                  )}
                  {expensa.saldoAnterior > 0 && (
                    <p className="text-red-600">
                      Saldo anterior: {formatCurrency(expensa.saldoAnterior)}
                    </p>
                  )}
                  {expensa.bonificacion > 0 && (
                    <p className="text-green-600">
                      Bonificación: -{formatCurrency(expensa.bonificacion)}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-gray-800">
                    {formatCurrency(expensa.total)}
                  </p>
                  {expensa.montoPagado > 0 && expensa.saldoPendiente > 0 && (
                    <p className="text-xs text-orange-600">
                      Resta: {formatCurrency(expensa.saldoPendiente)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
