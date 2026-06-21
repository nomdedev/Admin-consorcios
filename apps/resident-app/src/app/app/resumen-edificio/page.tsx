'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatPeriodo } from '@/lib/utils';

interface ResumenEdificio {
  totalUnidades: number;
  unidadesAlDia: number;
  unidadesConDeuda: number;
  porcentajeCobranza: number;
  montoTotalDeuda: number;
  montoTotalCobrado: number;
  periodoActual: string;
  fechaActualizacion: string;
}

export default function ResumenEdificioPage() {
  const [resumen, setResumen] = useState<ResumenEdificio | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResumen = async () => {
      try {
        const data = await apiClient.get<ResumenEdificio>('/mi-portal/resumen-edificio');
        setResumen(data);
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
          <div className="bg-white rounded-xl p-6 animate-pulse" key={i}>
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!resumen) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No se pudo cargar el resumen</p>
        <Link className="text-green-600 font-medium" href="/app/expensas">
          ← Volver a expensas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          aria-label="Volver"
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          href="/app/gastos-edificio"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Resumen del Edificio</h1>
          <p className="text-sm text-gray-500">
            Período: {formatPeriodo(resumen.periodoActual)}
          </p>
        </div>
      </div>

      {/* Porcentaje de cobranza */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm">Cobranza del período</p>
        <div className="flex items-end gap-2">
          <p className="text-4xl font-bold">{resumen.porcentajeCobranza}%</p>
        </div>
        <div className="mt-4 bg-blue-400/30 rounded-full h-3 overflow-hidden">
          <div
            className="bg-white h-full rounded-full transition-all duration-500"
            style={{ width: `${resumen.porcentajeCobranza}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-sm text-gray-500">Unidades al día</p>
          <p className="text-2xl font-bold text-green-600">
            {resumen.unidadesAlDia}
            <span className="text-sm text-gray-400 font-normal">
              /{resumen.totalUnidades}
            </span>
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow">
          <p className="text-sm text-gray-500">Con deuda</p>
          <p className="text-2xl font-bold text-red-600">
            {resumen.unidadesConDeuda}
            <span className="text-sm text-gray-400 font-normal">
              /{resumen.totalUnidades}
            </span>
          </p>
        </div>
      </div>

      {/* Montos */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold text-gray-800 mb-4">Movimientos del período</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Total cobrado</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(resumen.montoTotalCobrado)}
            </span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-100">
            <span className="text-gray-600">Deuda pendiente</span>
            <span className="font-semibold text-red-600">
              {formatCurrency(resumen.montoTotalDeuda)}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-gray-50 rounded-xl p-4">
        <p className="text-xs text-gray-500 text-center">
          Última actualización: {new Date(resumen.fechaActualizacion).toLocaleString('es-AR')}
        </p>
        <p className="text-xs text-gray-400 text-center mt-1">
          Los datos de morosidad son anónimos y no identifican a ningún vecino
        </p>
      </div>

      {/* Links */}
      <div className="space-y-3">
        <Link
          className="block bg-white rounded-xl p-4 shadow text-center text-green-600 font-medium hover:bg-green-50 transition-colors min-h-[44px]"
          href="/app/gastos-edificio"
        >
          📊 Ver detalle de gastos
        </Link>

        <Link
          className="block bg-gray-100 rounded-xl p-4 text-center text-gray-600 hover:bg-gray-200 transition-colors min-h-[44px]"
          href="/app/expensas"
        >
          ← Volver a mis expensas
        </Link>
      </div>
    </div>
  );
}
