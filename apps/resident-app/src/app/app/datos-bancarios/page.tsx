'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface DatosBancarios {
  consorcioNombre: string;
  cbu: string;
  aliasCbu: string;
  banco: string;
  titularCuenta: string;
  cuitConsorcio?: string;
  instrucciones?: string;
}

export default function DatosBancariosPage() {
  const [datos, setDatos] = useState<DatosBancarios | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/mi-portal/datos-bancarios`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setDatos(data);
        }
      } catch (error) {
        console.error('Error fetching datos bancarios:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDatos();
  }, []);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!datos) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">No se pudieron cargar los datos bancarios</p>
        <Link href="/app/expensas" className="text-green-600 font-medium">
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
          href="/app/expensas"
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Datos Bancarios</h1>
          <p className="text-sm text-gray-500">Para depositar tus expensas</p>
        </div>
      </div>

      {/* Consorcio */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
        <p className="text-green-100 text-sm">Consorcio</p>
        <p className="text-xl font-bold">{datos.consorcioNombre}</p>
        {datos.cuitConsorcio && (
          <p className="text-green-100 text-sm mt-1">CUIT: {datos.cuitConsorcio}</p>
        )}
      </div>

      {/* CBU */}
      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm text-gray-500">CBU</p>
            <p className="text-lg font-mono font-semibold text-gray-800 break-all">
              {datos.cbu}
            </p>
          </div>
          <button
            onClick={() => handleCopy(datos.cbu, 'cbu')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors min-h-[44px]"
            aria-label="Copiar CBU"
          >
            {copied === 'cbu' ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>

        {datos.aliasCbu && (
          <div className="flex justify-between items-start pt-4 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-500">Alias</p>
              <p className="text-lg font-semibold text-gray-800">{datos.aliasCbu}</p>
            </div>
            <button
              onClick={() => handleCopy(datos.aliasCbu, 'alias')}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors min-h-[44px]"
              aria-label="Copiar alias"
            >
              {copied === 'alias' ? '✓ Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h2 className="font-semibold text-gray-800 mb-4">Información de la cuenta</h2>
        
        <div className="space-y-3">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Banco</span>
            <span className="font-medium text-gray-800">{datos.banco}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Titular</span>
            <span className="font-medium text-gray-800">{datos.titularCuenta}</span>
          </div>
        </div>
      </div>

      {/* Instrucciones */}
      {datos.instrucciones && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-2">📝 Instrucciones</p>
          <p className="text-sm text-blue-700 whitespace-pre-line">
            {datos.instrucciones}
          </p>
        </div>
      )}

      {/* Importante */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm font-medium text-yellow-800 mb-2">⚠️ Importante</p>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Indicá tu <strong>número de unidad</strong> en la descripción de la transferencia</li>
          <li>• Guardá el comprobante de pago</li>
          <li>• El pago se registra dentro de las 48-72hs hábiles</li>
        </ul>
      </div>

      {/* Acciones */}
      <div className="flex gap-3">
        <Link
          href="/app/pagos/nuevo"
          className="flex-1 bg-green-600 text-white rounded-xl p-4 text-center font-medium hover:bg-green-700 transition-colors min-h-[44px]"
        >
          Pagar con Mercado Pago
        </Link>
      </div>

      <Link
        href="/app/pagos/informar"
        className="block bg-white rounded-xl p-4 shadow text-center text-green-600 font-medium hover:bg-green-50 transition-colors min-h-[44px]"
      >
        Ya hice una transferencia → Informar pago
      </Link>
    </div>
  );
}
