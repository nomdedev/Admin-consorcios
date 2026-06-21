'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { db, generateLocalId, type PaqueteLocal } from '@/offline/db';

const REMITENTES_COMUNES = [
  'Mercado Libre',
  'Amazon',
  'Correo Argentino',
  'OCA',
  'Andreani',
  'DHL',
  'FedEx',
  'Particular',
  'Otro',
];

export default function RecibirPaquetePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    destinatarioUF: '',
    remitente: '',
    descripcion: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const consorcioId = localStorage.getItem('consorcioId') || 'default';
      
      const paquete: PaqueteLocal = {
        localId: generateLocalId(),
        consorcioId,
        destinatarioUF: formData.destinatarioUF.toUpperCase(),
        remitente: formData.remitente,
        descripcion: formData.descripcion || undefined,
        recibidoAt: new Date(),
        syncStatus: 'pending',
      };

      await db.paquetes.add(paquete);

      // Intentar sincronizar inmediatamente si hay conexión
      if (navigator.onLine) {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/paquetes`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(paquete),
            }
          );

          if (response.ok) {
            const serverData = await response.json();
            await db.paquetes.update(paquete.localId, {
              syncStatus: 'synced',
              serverData,
            });
          }
        } catch {
          // Si falla, queda pendiente - se reintentará con el sync manager
        }
      }

      router.push('/app/paquetes');
    } catch (error) {
      console.error('Error creating paquete:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          href="/app/paquetes"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Recibir paquete</h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Destinatario */}
        <div className="bg-white rounded-xl p-6 shadow">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">
              Unidad funcional destinataria
            </span>
            <input
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px] text-lg font-mono uppercase"
              placeholder="Ej: 4A, PB-B, Cochera 15"
              type="text"
              value={formData.destinatarioUF}
              onChange={(e) =>
                setFormData({ ...formData, destinatarioUF: e.target.value })
              }
            />
          </label>
        </div>

        {/* Remitente */}
        <div className="bg-white rounded-xl p-6 shadow">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            Remitente
          </span>
          <div className="flex flex-wrap gap-2 mb-4">
            {REMITENTES_COMUNES.map((remitente) => (
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] ${
                  formData.remitente === remitente
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                key={remitente}
                type="button"
                onClick={() => setFormData({ ...formData, remitente })}
              >
                {remitente}
              </button>
            ))}
          </div>
          {formData.remitente === 'Otro' && (
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              placeholder="Ingresá el nombre del remitente"
              type="text"
              value={formData.remitente === 'Otro' ? '' : formData.remitente}
              onChange={(e) =>
                setFormData({ ...formData, remitente: e.target.value })
              }
            />
          )}
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-xl p-6 shadow">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">
              Descripción (opcional)
            </span>
            <input
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
              placeholder="Ej: Caja grande, sobre, etc."
              type="text"
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
            />
          </label>
        </div>

        {/* Submit */}
        <button
          className="w-full py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
          disabled={isLoading || !formData.destinatarioUF || !formData.remitente}
          type="submit"
        >
          {isLoading ? 'Registrando...' : 'Registrar paquete'}
        </button>

        <p className="text-center text-xs text-gray-500">
          Se guardará localmente y se sincronizará cuando haya conexión
        </p>
      </form>
    </div>
  );
}
