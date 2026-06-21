'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { db, generateLocalId, type BitacoraLocal } from '@/offline/db';

const TIPOS = [
  { value: 'ingreso_visita', label: 'Ingreso de visita', icon: '👤' },
  { value: 'novedad', label: 'Novedad', icon: '📝' },
  { value: 'incidente', label: 'Incidente', icon: '⚠️' },
];

const UBICACIONES = [
  'Hall de entrada',
  'Recepción',
  'Garage',
  'Terraza',
  'SUM',
  'Escaleras',
  'Ascensor',
  'Otro',
];

export default function NuevaEntradaBitacoraPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tipo: 'novedad',
    descripcion: '',
    ubicacion: '',
    visitanteNombre: '',
    visitanteDni: '',
    visitanteDestino: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const consorcioId = localStorage.getItem('consorcioId') || 'default';
      
      const entry: BitacoraLocal = {
        localId: generateLocalId(),
        consorcioId,
        tipo: formData.tipo,
        descripcion: formData.descripcion,
        ubicacion: formData.ubicacion || undefined,
        visitanteNombre: formData.visitanteNombre || undefined,
        visitanteDni: formData.visitanteDni || undefined,
        visitanteDestino: formData.visitanteDestino || undefined,
        timestamp: new Date(),
        syncStatus: 'pending',
      };

      await db.bitacora.add(entry);

      // Intentar sincronizar inmediatamente si hay conexión
      if (navigator.onLine) {
        try {
          const token = localStorage.getItem('accessToken');
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/bitacora`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(entry),
            }
          );

          if (response.ok) {
            const serverData = await response.json();
            await db.bitacora.update(entry.localId, {
              syncStatus: 'synced',
              serverData,
            });
          }
        } catch {
          // Si falla, queda pendiente - se reintentará con el sync manager
        }
      }

      router.push('/app/bitacora');
    } catch (error) {
      console.error('Error creating entry:', error);
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
          href="/app/bitacora"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nueva entrada</h1>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Tipo */}
        <div className="bg-white rounded-xl p-6 shadow">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            Tipo de registro
          </span>
          <div className="grid grid-cols-3 gap-3">
            {TIPOS.map((tipo) => (
              <button
                className={`p-4 rounded-lg text-center transition-colors border-2 min-h-[80px] ${
                  formData.tipo === tipo.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                key={tipo.value}
                type="button"
                onClick={() => setFormData({ ...formData, tipo: tipo.value })}
              >
                <span className="text-2xl block mb-1">{tipo.icon}</span>
                <span className="text-xs font-medium text-gray-700">
                  {tipo.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Campos de visita */}
        {formData.tipo === 'ingreso_visita' && (
          <div className="bg-white rounded-xl p-6 shadow space-y-4">
            <h3 className="font-medium text-gray-800">Datos del visitante</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="visitanteNombre">
                Nombre completo
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                id="visitanteNombre"
                placeholder="Juan Pérez"
                type="text"
                value={formData.visitanteNombre}
                onChange={(e) =>
                  setFormData({ ...formData, visitanteNombre: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="visitanteDni">
                DNI (opcional)
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                id="visitanteDni"
                maxLength={8}
                placeholder="12345678"
                type="text"
                value={formData.visitanteDni}
                onChange={(e) =>
                  setFormData({ ...formData, visitanteDni: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="visitanteDestino">
                Destino
              </label>
              <input
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[44px]"
                id="visitanteDestino"
                placeholder="Ej: 4A, Administración"
                type="text"
                value={formData.visitanteDestino}
                onChange={(e) =>
                  setFormData({ ...formData, visitanteDestino: e.target.value })
                }
              />
            </div>
          </div>
        )}

        {/* Descripción */}
        <div className="bg-white rounded-xl p-6 shadow">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">
              Descripción
            </span>
            <textarea
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Detallá lo que sucedió..."
              rows={4}
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
            />
          </label>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-xl p-6 shadow">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            Ubicación (opcional)
          </span>
          <div className="flex flex-wrap gap-2">
            {UBICACIONES.map((ubicacion) => (
              <button
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] ${
                  formData.ubicacion === ubicacion
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                key={ubicacion}
                type="button"
                onClick={() => setFormData({ ...formData, ubicacion })}
              >
                {ubicacion}
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          className="w-full py-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
          disabled={isLoading || !formData.descripcion}
          type="submit"
        >
          {isLoading ? 'Guardando...' : 'Guardar entrada'}
        </button>

        <p className="text-center text-xs text-gray-500">
          Se guardará localmente y se sincronizará cuando haya conexión
        </p>
      </form>
    </div>
  );
}
