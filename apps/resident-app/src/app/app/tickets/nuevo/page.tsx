'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const PRIORIDADES = [
  { value: 'BAJA', label: 'Baja', icon: '🟢', description: 'No urgente' },
  { value: 'MEDIA', label: 'Media', icon: '🟡', description: 'Normal' },
  { value: 'ALTA', label: 'Alta', icon: '🟠', description: 'Importante' },
  { value: 'URGENTE', label: 'Urgente', icon: '🔴', description: 'Requiere atención inmediata' },
];

const UBICACIONES_COMUNES = [
  'Hall de entrada',
  'Ascensor',
  'Escaleras',
  'Terraza',
  'Garage',
  'SUM',
  'Pasillo de mi piso',
  'Mi unidad',
  'Otro',
];

export default function NuevoTicketPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    titulo: '',
    descripcion: '',
    ubicacion: '',
    prioridad: 'MEDIA',
  });
  const [fotos, setFotos] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Primero creamos el ticket
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/mi-cuenta/tickets`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al crear el reclamo');
      }

      const ticket = await response.json();

      // Si hay fotos, las subimos
      if (fotos.length > 0) {
        for (const foto of fotos) {
          const formDataFoto = new FormData();
          formDataFoto.append('file', foto);
          
          await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticket.id}/archivos`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: formDataFoto,
            }
          );
        }
      }

      router.push(`/app/tickets/${ticket.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el reclamo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + fotos.length > 5) {
      setError('Máximo 5 fotos permitidas');
      return;
    }
    setFotos((prev) => [...prev, ...files]);
  };

  const removeFoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/tickets"
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
        >
          ←
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Nuevo Reclamo</h1>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Título */}
        <div className="bg-white rounded-xl p-6 shadow">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">
              ¿Qué problema tenés?
            </span>
            <input
              type="text"
              value={formData.titulo}
              onChange={(e) =>
                setFormData({ ...formData, titulo: e.target.value })
              }
              placeholder="Ej: Pérdida de agua en el pasillo"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
            />
          </label>
        </div>

        {/* Descripción */}
        <div className="bg-white rounded-xl p-6 shadow">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-2 block">
              Contanos más detalles
            </span>
            <textarea
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
              placeholder="Describí el problema con más detalle..."
              rows={4}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </label>
        </div>

        {/* Ubicación */}
        <div className="bg-white rounded-xl p-6 shadow">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            ¿Dónde está el problema?
          </span>
          <div className="flex flex-wrap gap-2">
            {UBICACIONES_COMUNES.map((ubicacion) => (
              <button
                key={ubicacion}
                type="button"
                onClick={() => setFormData({ ...formData, ubicacion })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] ${
                  formData.ubicacion === ubicacion
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {ubicacion}
              </button>
            ))}
          </div>
        </div>

        {/* Prioridad */}
        <div className="bg-white rounded-xl p-6 shadow">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            ¿Qué tan urgente es?
          </span>
          <div className="grid grid-cols-2 gap-3">
            {PRIORIDADES.map((prioridad) => (
              <button
                key={prioridad.value}
                type="button"
                onClick={() =>
                  setFormData({ ...formData, prioridad: prioridad.value })
                }
                className={`p-4 rounded-lg text-left transition-colors border-2 min-h-[70px] ${
                  formData.prioridad === prioridad.value
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{prioridad.icon}</span>
                  <span className="font-medium text-gray-800">
                    {prioridad.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{prioridad.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Fotos */}
        <div className="bg-white rounded-xl p-6 shadow">
          <span className="text-sm font-medium text-gray-700 mb-3 block">
            Fotos del problema (opcional)
          </span>
          
          <div className="flex flex-wrap gap-3 mb-4">
            {fotos.map((foto, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(foto)}
                  alt={`Foto ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeFoto(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          {fotos.length < 5 && (
            <label className="flex items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition-colors">
              <div className="text-center">
                <span className="text-2xl">📷</span>
                <p className="text-xs text-gray-500 mt-1">Agregar foto</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
                multiple
              />
            </label>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-4 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[56px]"
        >
          {isLoading ? 'Enviando...' : 'Enviar reclamo'}
        </button>
      </form>
    </div>
  );
}
