'use client';

import Link from 'next/link';
import { useState } from 'react';

import { apiClient } from '@/lib/api-client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await apiClient.post('/auth/magic-link', { email });
      setEmailSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el enlace');
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            ¡Revisá tu correo!
          </h1>
          <p className="text-gray-600 mb-6">
            Te enviamos un enlace mágico a <strong>{email}</strong>. 
            Hacé clic en el enlace para ingresar.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            El enlace expira en 15 minutos.
          </p>
          <button
            className="text-green-600 hover:text-green-700 font-medium"
            onClick={() => setEmailSent(false)}
          >
            ¿No recibiste el correo? Intentar de nuevo
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link className="text-3xl font-bold text-green-700" href="/">
            VecinoSimple
          </Link>
          <p className="text-gray-600 mt-2">Ingresá a tu cuenta</p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              className="block text-sm font-medium text-gray-700 mb-2"
              htmlFor="email"
            >
              Correo electrónico
            </label>
            <input
              required
              autoComplete="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent min-h-[44px]"
              id="email"
              placeholder="tu@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <button
            className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Enviando...' : 'Continuar con email'}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">o</span>
          </div>
        </div>

        {/* Help text */}
        <div className="text-center text-sm text-gray-600">
          <p>
            ¿Primera vez?{' '}
            <Link className="text-green-600 hover:underline font-medium" href="/registro">
              Registrate con tu código de invitación
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
