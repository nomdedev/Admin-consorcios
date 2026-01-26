'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatCurrency, formatDate, formatPeriodo } from '@/lib/utils';

interface Gasto {
  id: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  esExtraordinario: boolean;
  fechaGasto: string;
  categoria: string;
  tipoComprobante?: string;
  numeroComprobante?: string;
  archivoUrl?: string;
  proveedorNombre?: string;
}

interface GastosResponse {
  data: Gasto[];
  total: number;
  totalMonto: number;
}

interface Categoria {
  id: string;
  nombre: string;
}

export default function GastosEdificioPage() {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [totalMonto, setTotalMonto] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoriaId: '',
    esExtraordinario: '',
    periodo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  });

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mi-portal/gastos-edificio/categorias`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setCategorias(data);
        }
      } catch (error) {
        console.error('Error fetching categorias:', error);
      }
    };

    fetchCategorias();
  }, []);

  useEffect(() => {
    const fetchGastos = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('accessToken');
        const params = new URLSearchParams();
        
        if (filters.periodo) params.append('periodo', filters.periodo);
        if (filters.categoriaId) params.append('categoriaId', filters.categoriaId);
        if (filters.esExtraordinario) {
          params.append('esExtraordinario', filters.esExtraordinario);
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mi-portal/gastos-edificio?${params}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data: GastosResponse = await response.json();
          setGastos(data.data);
          setTotalMonto(data.totalMonto);
        }
      } catch (error) {
        console.error('Error fetching gastos:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGastos();
  }, [filters]);



  // Generar opciones de período (últimos 12 meses)
  const periodoOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/expensas"
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          aria-label="Volver a expensas"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Gastos del Edificio
          </h1>
          <p className="text-sm text-gray-500">
            Transparencia en cada peso invertido
          </p>
        </div>
      </div>

      {/* Resumen */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">Total en {formatPeriodo(filters.periodo)}</p>
        <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalMonto)}</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filters.periodo}
          onChange={(e) => setFilters((f) => ({ ...f, periodo: e.target.value }))}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white min-h-[44px]"
          aria-label="Filtrar por período"
        >
          {periodoOptions.map((p) => (
            <option key={p} value={p}>
              {formatPeriodo(p)}
            </option>
          ))}
        </select>

        <select
          value={filters.categoriaId}
          onChange={(e) => setFilters((f) => ({ ...f, categoriaId: e.target.value }))}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white min-h-[44px]"
          aria-label="Filtrar por categoría"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.nombre}
            </option>
          ))}
        </select>

        <select
          value={filters.esExtraordinario}
          onChange={(e) =>
            setFilters((f) => ({ ...f, esExtraordinario: e.target.value }))
          }
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white min-h-[44px]"
          aria-label="Filtrar por tipo"
        >
          <option value="">Todos los tipos</option>
          <option value="false">Ordinarios</option>
          <option value="true">Extraordinarios</option>
        </select>
      </div>

      {/* Lista de gastos */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : gastos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay gastos para mostrar con estos filtros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {gastos.map((gasto) => (
            <div key={gasto.id} className="bg-white rounded-xl p-4 shadow">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{gasto.concepto}</p>
                  {gasto.descripcion && (
                    <p className="text-sm text-gray-600 mt-1">{gasto.descripcion}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">{formatCurrency(gasto.monto)}</p>
                  {gasto.esExtraordinario && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                      Extraordinario
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                <span className="bg-gray-100 px-2 py-1 rounded">{gasto.categoria}</span>
                <span>{formatDate(gasto.fechaGasto)}</span>
                {gasto.proveedorNombre && (
                  <span>• {gasto.proveedorNombre}</span>
                )}
              </div>

              {/* Comprobante */}
              {gasto.archivoUrl && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <a
                    href={gasto.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-green-600 hover:text-green-700 hover:underline min-h-[44px] py-2"
                  >
                    📄 Ver comprobante
                    {gasto.tipoComprobante && (
                      <span className="text-gray-400">
                        ({gasto.tipoComprobante}
                        {gasto.numeroComprobante && ` N° ${gasto.numeroComprobante}`})
                      </span>
                    )}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Link a resumen de edificio */}
      <Link
        href="/app/resumen-edificio"
        className="block bg-gray-50 rounded-xl p-4 text-center text-gray-600 hover:bg-gray-100 transition-colors min-h-[44px]"
      >
        📊 Ver resumen general del edificio
      </Link>
    </div>
  );
}
