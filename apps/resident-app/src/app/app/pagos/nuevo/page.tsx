'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency, formatPeriodo } from '@/lib/utils';

interface ExpensaPendiente {
  periodo: string;
  total: number;
  fechaVencimiento: string;
}

export default function NuevoPagoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const periodoParam = searchParams.get('periodo');
  
  const [expensasPendientes, setExpensasPendientes] = useState<ExpensaPendiente[]>([]);
  const [periodosSeleccionados, setPeriodosSeleccionados] = useState<string[]>(
    periodoParam ? [periodoParam] : []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpensasPendientes = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mi-cuenta/expensas?estado=PENDIENTE`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setExpensasPendientes(data);
        }
      } catch (error) {
        console.error('Error fetching expensas:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpensasPendientes();
  }, []);



  const togglePeriodo = (periodo: string) => {
    setPeriodosSeleccionados((prev) =>
      prev.includes(periodo)
        ? prev.filter((p) => p !== periodo)
        : [...prev, periodo]
    );
  };

  const totalAPagar = expensasPendientes
    .filter((e) => periodosSeleccionados.includes(e.periodo))
    .reduce((sum, e) => sum + e.total, 0);

  const handlePagarConMercadoPago = async () => {
    if (periodosSeleccionados.length === 0) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pagos/crear-preferencia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            periodosAbonados: periodosSeleccionados,
            monto: totalAPagar,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear el pago');
      }

      const data = await response.json();
      // Redirigir a Mercado Pago
      window.location.href = data.init_point;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/pagos"
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nuevo Pago</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {expensasPendientes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow">
          <div className="text-5xl mb-4">🎉</div>
          <p className="text-gray-800 font-medium mb-2">
            ¡No tenés expensas pendientes!
          </p>
          <p className="text-gray-500 text-sm">Estás al día con tus pagos</p>
        </div>
      ) : (
        <>
          {/* Selección de períodos */}
          <div className="bg-white rounded-xl p-6 shadow">
            <h2 className="font-semibold text-gray-800 mb-4">
              Seleccioná qué querés pagar
            </h2>
            <div className="space-y-3">
              {expensasPendientes.map((expensa) => (
                <label
                  key={expensa.periodo}
                  className={`flex items-center justify-between p-4 rounded-lg border-2 cursor-pointer transition-colors min-h-[60px] ${
                    periodosSeleccionados.includes(expensa.periodo)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={periodosSeleccionados.includes(expensa.periodo)}
                      onChange={() => togglePeriodo(expensa.periodo)}
                      className="w-5 h-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <div>
                      <p className="font-medium text-gray-800 capitalize">
                        {formatPeriodo(expensa.periodo)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-800">
                    {formatCurrency(expensa.total)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Total y botón de pago */}
          <div className="bg-white rounded-xl p-6 shadow sticky bottom-20">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">Total a pagar</span>
              <span className="text-2xl font-bold text-gray-800">
                {formatCurrency(totalAPagar)}
              </span>
            </div>
            
            <button
              onClick={handlePagarConMercadoPago}
              disabled={periodosSeleccionados.length === 0 || isProcessing}
              className="w-full py-4 bg-[#009ee3] text-white font-medium rounded-lg hover:bg-[#007eb5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px] flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                'Procesando...'
              ) : (
                <>
                  <MercadoPagoIcon />
                  Pagar con Mercado Pago
                </>
              )}
            </button>
            
            <p className="text-center text-xs text-gray-500 mt-3">
              Pago seguro procesado por Mercado Pago
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function MercadoPagoIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" fill="white" />
      <path
        d="M7 12c0-2.76 2.24-5 5-5s5 2.24 5 5-2.24 5-5 5-5-2.24-5-5z"
        fill="#009ee3"
      />
    </svg>
  );
}
