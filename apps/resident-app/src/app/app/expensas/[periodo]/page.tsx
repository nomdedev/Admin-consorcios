'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatPeriodo, formatDate } from '@/lib/utils';

interface ExpensaDetalle {
  id: string;
  periodo: string;
  fechaVencimiento: string;
  fechaSegundoVencimiento?: string;
  estado: string;
  estadoPago: string;
  montoOrdinario: number;
  montoExtraordinario: number;
  saldoAnterior: number;
  intereses: number;
  bonificacion: number;
  total: number;
  montoPagado: number;
  saldoPendiente: number;
  gastosPorCategoria: {
    categoria: string;
    gastos: {
      id: string;
      concepto: string;
      descripcion?: string;
      monto: number;
      esExtraordinario: boolean;
      tipoComprobante?: string;
      numeroComprobante?: string;
      archivoUrl?: string;
      proveedorNombre?: string;
      fechaGasto: string;
    }[];
    subtotal: number;
  }[];
  totalOrdinarios: number;
  totalExtraordinarios: number;
}

export default function ExpensaDetallePage() {
  const params = useParams();
  const periodo = params.periodo as string;
  const [expensa, setExpensa] = useState<ExpensaDetalle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExpensa = async () => {
      try {
        const data = await apiClient.get<ExpensaDetalle>(`/mi-portal/expensas/${periodo}`);
        setExpensa(data);
      } catch (error) {
        console.error('Error fetching expensa:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpensa();
  }, [periodo]);

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mi-portal/expensas/${periodo}/pdf`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = globalThis.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expensa-${periodo}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        globalThis.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4" />
          <div className="h-10 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    );
  }

  if (!expensa) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Expensa no encontrada</p>
        <Link className="text-green-600 font-medium" href="/app/expensas">
          ← Volver a expensas
        </Link>
      </div>
    );
  }

  const gastosOrdinarios = expensa.gastosPorCategoria.filter(
    (cat) => cat.gastos.some((g) => !g.esExtraordinario)
  );
  const gastosExtraordinarios = expensa.gastosPorCategoria.filter(
    (cat) => cat.gastos.some((g) => g.esExtraordinario)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          href="/app/expensas"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 capitalize">
          {formatPeriodo(expensa.periodo)}
        </h1>
      </div>

      {/* Resumen */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <p className="text-green-100 text-sm mb-1">Total a pagar</p>
        <p className="text-3xl font-bold mb-2">{formatCurrency(expensa.total)}</p>
        <p className="text-green-100 text-sm">
          Vencimiento: {formatDate(expensa.fechaVencimiento)}
        </p>
        {expensa.fechaSegundoVencimiento && (
          <p className="text-green-100 text-xs mt-1">
            2do vencimiento: {formatDate(expensa.fechaSegundoVencimiento)}
          </p>
        )}
        
        {expensa.estadoPago === 'PARCIAL' && (
          <div className="mt-2 p-2 bg-white/20 rounded">
            <p className="text-sm">Pagado: {formatCurrency(expensa.montoPagado)}</p>
            <p className="text-sm font-semibold">Pendiente: {formatCurrency(expensa.saldoPendiente)}</p>
          </div>
        )}
        
        {expensa.estadoPago !== 'PAGADO' && (
          <Link
            className="mt-4 inline-flex items-center px-4 py-2 bg-white text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors min-h-[44px]"
            href={`/app/pagos/nuevo?periodo=${periodo}`}
          >
            Pagar ahora
          </Link>
        )}
        
        {expensa.estadoPago === 'PAGADO' && (
          <div className="mt-3 inline-flex items-center px-3 py-1 bg-green-400/30 rounded-full">
            <span className="text-sm">✓ Pagado</span>
          </div>
        )}
      </div>

      {/* Desglose */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold text-gray-800 mb-4">Desglose</h2>
        
        <div className="space-y-3">
          <DetalleLinea
            label="Expensas ordinarias"
            value={expensa.montoOrdinario}
          />
          {expensa.montoExtraordinario > 0 && (
            <DetalleLinea
              label="Expensas extraordinarias"
              value={expensa.montoExtraordinario}
            />
          )}
          {expensa.saldoAnterior > 0 && (
            <DetalleLinea
              isNegative
              label="Saldo anterior"
              value={expensa.saldoAnterior}
            />
          )}
          {expensa.intereses > 0 && (
            <DetalleLinea
              isNegative
              label="Intereses por mora"
              value={expensa.intereses}
            />
          )}
          {expensa.bonificacion > 0 && (
            <DetalleLinea
              isPositive
              label="Bonificación"
              value={-expensa.bonificacion}
            />
          )}
          
          <div className="border-t pt-3 mt-3">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="text-xl font-bold text-gray-800">
                {formatCurrency(expensa.total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gastos Ordinarios por Categoría */}
      {gastosOrdinarios.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold text-gray-800 mb-4">
            Gastos Ordinarios
          </h2>
          {expensa.gastosPorCategoria
            .filter((cat) => cat.gastos.some((g) => !g.esExtraordinario))
            .map((categoria) => (
              <div className="mb-4 last:mb-0" key={categoria.categoria}>
                <div className="flex justify-between items-center py-2 border-b-2 border-gray-200 mb-2">
                  <span className="font-medium text-gray-700">{categoria.categoria}</span>
                  <span className="text-gray-600">{formatCurrency(categoria.subtotal)}</span>
                </div>
                <div className="space-y-2 pl-2">
                  {categoria.gastos
                    .filter((g) => !g.esExtraordinario)
                    .map((gasto) => (
                      <div
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        key={gasto.id}
                      >
                        <div className="flex-1">
                          <p className="text-gray-800">{gasto.concepto}</p>
                          {gasto.proveedorNombre && (
                            <p className="text-xs text-gray-500">{gasto.proveedorNombre}</p>
                          )}
                          {gasto.archivoUrl && (
                            <a
                              className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
                              href={gasto.archivoUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              📄 Ver factura
                            </a>
                          )}
                        </div>
                        <span className="text-gray-700">{formatCurrency(gasto.monto)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Gastos Extraordinarios por Categoría */}
      {gastosExtraordinarios.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow">
          <h2 className="font-semibold text-gray-800 mb-4">
            Gastos Extraordinarios
          </h2>
          {expensa.gastosPorCategoria
            .filter((cat) => cat.gastos.some((g) => g.esExtraordinario))
            .map((categoria) => (
              <div className="mb-4 last:mb-0" key={categoria.categoria}>
                <div className="flex justify-between items-center py-2 border-b-2 border-gray-200 mb-2">
                  <span className="font-medium text-gray-700">{categoria.categoria}</span>
                  <span className="text-gray-600">{formatCurrency(categoria.subtotal)}</span>
                </div>
                <div className="space-y-2 pl-2">
                  {categoria.gastos
                    .filter((g) => g.esExtraordinario)
                    .map((gasto) => (
                      <div
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        key={gasto.id}
                      >
                        <div className="flex-1">
                          <p className="text-gray-800">{gasto.concepto}</p>
                          {gasto.proveedorNombre && (
                            <p className="text-xs text-gray-500">{gasto.proveedorNombre}</p>
                          )}
                          {gasto.archivoUrl && (
                            <a
                              className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
                              href={gasto.archivoUrl}
                              rel="noopener noreferrer"
                              target="_blank"
                            >
                              📄 Ver factura
                            </a>
                          )}
                        </div>
                        <span className="text-gray-700">{formatCurrency(gasto.monto)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Descargar PDF */}
      <button
        className="block w-full bg-white rounded-xl p-4 shadow text-center text-green-600 font-medium hover:bg-green-50 transition-colors min-h-[44px]"
        onClick={handleDownloadPdf}
      >
        📄 Descargar PDF de expensa
      </button>

      {/* Link a datos bancarios */}
      <Link
        className="block bg-gray-50 rounded-xl p-4 text-center text-gray-600 hover:bg-gray-100 transition-colors min-h-[44px]"
        href="/app/datos-bancarios"
      >
        💳 Ver datos para depositar
      </Link>
    </div>
  );
}

function getValueColorClass(isNegative?: boolean, isPositive?: boolean): string {
  if (isNegative) return 'text-red-600';
  if (isPositive) return 'text-green-600';
  return 'text-gray-800';
}

function DetalleLinea({
  label,
  value,
  isNegative,
  isPositive,
}: Readonly<{
  label: string;
  value: number;
  isNegative?: boolean;
  isPositive?: boolean;
}>) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span
        className={`font-medium ${getValueColorClass(isNegative, isPositive)}`}
      >
        {isPositive ? '-' : ''}
        {formatCurrency(Math.abs(value))}
      </span>
    </div>
  );
}
