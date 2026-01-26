'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mi-portal/expensas/${periodo}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setExpensa(data);
        }
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
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expensa-${periodo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPeriodo = (p: string) => {
    const [year, month] = p.split('-');
    const date = new Date(parseInt(year || '2024'), parseInt(month || '1') - 1);
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  if (!expensa) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">Expensa no encontrada</p>
        <Link href="/app/expensas" className="text-green-600 font-medium">
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
          href="/app/expensas"
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
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
            href={`/app/pagos/nuevo?periodo=${periodo}`}
            className="mt-4 inline-flex items-center px-4 py-2 bg-white text-green-600 font-medium rounded-lg hover:bg-green-50 transition-colors min-h-[44px]"
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
              label="Saldo anterior"
              value={expensa.saldoAnterior}
              isNegative
            />
          )}
          {expensa.intereses > 0 && (
            <DetalleLinea
              label="Intereses por mora"
              value={expensa.intereses}
              isNegative
            />
          )}
          {expensa.bonificacion > 0 && (
            <DetalleLinea
              label="Bonificación"
              value={-expensa.bonificacion}
              isPositive
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
              <div key={categoria.categoria} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center py-2 border-b-2 border-gray-200 mb-2">
                  <span className="font-medium text-gray-700">{categoria.categoria}</span>
                  <span className="text-gray-600">{formatCurrency(categoria.subtotal)}</span>
                </div>
                <div className="space-y-2 pl-2">
                  {categoria.gastos
                    .filter((g) => !g.esExtraordinario)
                    .map((gasto) => (
                      <div
                        key={gasto.id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-gray-800">{gasto.concepto}</p>
                          {gasto.proveedorNombre && (
                            <p className="text-xs text-gray-500">{gasto.proveedorNombre}</p>
                          )}
                          {gasto.archivoUrl && (
                            <a
                              href={gasto.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
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
              <div key={categoria.categoria} className="mb-4 last:mb-0">
                <div className="flex justify-between items-center py-2 border-b-2 border-gray-200 mb-2">
                  <span className="font-medium text-gray-700">{categoria.categoria}</span>
                  <span className="text-gray-600">{formatCurrency(categoria.subtotal)}</span>
                </div>
                <div className="space-y-2 pl-2">
                  {categoria.gastos
                    .filter((g) => g.esExtraordinario)
                    .map((gasto) => (
                      <div
                        key={gasto.id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                      >
                        <div className="flex-1">
                          <p className="text-gray-800">{gasto.concepto}</p>
                          {gasto.proveedorNombre && (
                            <p className="text-xs text-gray-500">{gasto.proveedorNombre}</p>
                          )}
                          {gasto.archivoUrl && (
                            <a
                              href={gasto.archivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-green-600 hover:underline inline-flex items-center gap-1"
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
        onClick={handleDownloadPdf}
        className="block w-full bg-white rounded-xl p-4 shadow text-center text-green-600 font-medium hover:bg-green-50 transition-colors min-h-[44px]"
      >
        📄 Descargar PDF de expensa
      </button>

      {/* Link a datos bancarios */}
      <Link
        href="/app/datos-bancarios"
        className="block bg-gray-50 rounded-xl p-4 text-center text-gray-600 hover:bg-gray-100 transition-colors min-h-[44px]"
      >
        💳 Ver datos para depositar
      </Link>
    </div>
  );
}

function DetalleLinea({
  label,
  value,
  isNegative,
  isPositive,
}: {
  label: string;
  value: number;
  isNegative?: boolean;
  isPositive?: boolean;
}) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-600">{label}</span>
      <span
        className={`font-medium ${
          isNegative
            ? 'text-red-600'
            : isPositive
            ? 'text-green-600'
            : 'text-gray-800'
        }`}
      >
        {isPositive ? '-' : ''}
        {formatCurrency(value)}
      </span>
    </div>
  );
}
