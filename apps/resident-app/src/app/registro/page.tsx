'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState<'codigo' | 'datos'>('codigo');
  const [codigo, setCodigo] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    dni: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitacionInfo, setInvitacionInfo] = useState<{
    consorcio: string;
    unidad: string;
    rol: string;
  } | null>(null);

  const handleVerificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/claiming/verificar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: codigo.toUpperCase() }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Código inválido');
      }

      const data = await response.json();
      setInvitacionInfo({
        consorcio: data.consorcio.nombre,
        unidad: data.unidadFuncional.codigo,
        rol: data.rolAsignado,
      });
      setStep('datos');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al verificar código');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/claiming/reclamar`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            codigo: codigo.toUpperCase(),
            ...formData,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al registrar');
      }

      router.push('/login?registro=exitoso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-green-700">
            VecinoSimple
          </Link>
          <p className="text-gray-600 mt-2">Registrate como vecino</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'codigo'
                ? 'bg-green-600 text-white'
                : 'bg-green-100 text-green-600'
            }`}
          >
            1
          </div>
          <div className="w-12 h-1 bg-gray-200 mx-2" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step === 'datos'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            2
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 'codigo' ? (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">📬</div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Ingresá tu código de invitación
              </h2>
              <p className="text-gray-600 text-sm">
                El código está en tu boleta de expensas o lo recibiste del 
                administrador de tu edificio.
              </p>
            </div>

            <form onSubmit={handleVerificarCodigo} className="space-y-6">
              <div>
                <label
                  htmlFor="codigo"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Código de invitación
                </label>
                <input
                  id="codigo"
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="ABC12345"
                  required
                  maxLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px] text-center text-xl font-mono tracking-widest uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || codigo.length < 8}
                className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                {isLoading ? 'Verificando...' : 'Verificar código'}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* Info de invitación */}
            {invitacionInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">
                  {invitacionInfo.consorcio}
                </p>
                <p className="text-green-600 text-sm">
                  Unidad: {invitacionInfo.unidad} • {invitacionInfo.rol}
                </p>
              </div>
            )}

            <form onSubmit={handleRegistro} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="nombre"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nombre
                  </label>
                  <input
                    id="nombre"
                    type="text"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="apellido"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Apellido
                  </label>
                  <input
                    id="apellido"
                    type="text"
                    value={formData.apellido}
                    onChange={(e) =>
                      setFormData({ ...formData, apellido: e.target.value })
                    }
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="telefono"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Teléfono (opcional)
                </label>
                <input
                  id="telefono"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                  placeholder="11 1234-5678"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
                />
              </div>

              <div>
                <label
                  htmlFor="dni"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  DNI (últimos 4 dígitos)
                </label>
                <input
                  id="dni"
                  type="text"
                  value={formData.dni}
                  onChange={(e) =>
                    setFormData({ ...formData, dni: e.target.value })
                  }
                  maxLength={4}
                  placeholder="1234"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Para verificar tu identidad
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('codigo')}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {isLoading ? 'Registrando...' : 'Registrarme'}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-6">
          <p>
            ¿Ya tenés cuenta?{' '}
            <Link href="/login" className="text-green-600 hover:underline font-medium">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
