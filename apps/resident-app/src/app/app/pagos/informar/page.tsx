'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function InformarPagoPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    monto: '',
    fechaTransferencia: new Date().toISOString().split('T')[0],
    comprobante: '',
    comentario: '',
  });
  const [comprobante, setComprobante] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('accessToken');
      
      // Subir comprobante si existe
      let comprobanteUrl = '';
      if (comprobante) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', comprobante);
        uploadFormData.append('folder', 'comprobantes');
        
        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/storage/upload`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: uploadFormData,
          }
        );
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          comprobanteUrl = uploadData.url;
        }
      }

      // Informar pago
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/pagos/informar-transferencia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            monto: parseFloat(formData.monto),
            fechaTransferencia: formData.fechaTransferencia,
            comprobanteUrl,
            comentario: formData.comentario,
          }),
        }
      );

      if (response.ok) {
        router.push('/app/pagos?informado=true');
      } else {
        alert('Error al informar el pago. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no puede superar los 5MB');
        return;
      }
      setComprobante(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/app/datos-bancarios"
          className="text-gray-500 hover:text-gray-700 p-2 -ml-2"
          aria-label="Volver"
        >
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Informar Pago</h1>
          <p className="text-sm text-gray-500">Notificanos tu transferencia</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          Si ya realizaste una transferencia bancaria, completá este formulario
          para que podamos acreditar tu pago más rápidamente.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Monto */}
        <div>
          <label
            htmlFor="monto"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Monto transferido *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              value={formData.monto}
              onChange={(e) =>
                setFormData((f) => ({ ...f, monto: e.target.value }))
              }
              required
              className="w-full pl-8 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[44px]"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Fecha */}
        <div>
          <label
            htmlFor="fecha"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Fecha de transferencia *
          </label>
          <input
            id="fecha"
            type="date"
            value={formData.fechaTransferencia}
            onChange={(e) =>
              setFormData((f) => ({ ...f, fechaTransferencia: e.target.value }))
            }
            required
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[44px]"
          />
        </div>

        {/* Comprobante */}
        <div>
          <label
            htmlFor="comprobante"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Comprobante (opcional)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
            <input
              id="comprobante"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="comprobante"
              className="cursor-pointer block text-center"
            >
              {comprobante ? (
                <div className="text-green-600">
                  <p className="font-medium">📄 {comprobante.name}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click para cambiar
                  </p>
                </div>
              ) : (
                <div className="text-gray-500">
                  <p className="text-3xl mb-2">📤</p>
                  <p className="font-medium">Subir comprobante</p>
                  <p className="text-xs mt-1">PNG, JPG o PDF (máx. 5MB)</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Comentario */}
        <div>
          <label
            htmlFor="comentario"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Comentario (opcional)
          </label>
          <textarea
            id="comentario"
            value={formData.comentario}
            onChange={(e) =>
              setFormData((f) => ({ ...f, comentario: e.target.value }))
            }
            rows={3}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Ej: Transferencia desde Banco Galicia, períodos enero y febrero"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !formData.monto}
          className="w-full bg-green-600 text-white rounded-xl py-4 font-medium hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[44px]"
        >
          {isSubmitting ? 'Enviando...' : 'Informar Pago'}
        </button>
      </form>

      {/* Nota */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-700">
          <strong>Nota:</strong> El pago será verificado por la administración.
          Recibirás una notificación cuando sea acreditado.
        </p>
      </div>
    </div>
  );
}
