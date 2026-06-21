'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { apiClient } from '@/lib/api-client';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string | null;
  preferenciasModo: string;
  preferenciasTema: string;
  preferenciasTexto: number;
  unidadFuncional?: {
    codigo: string;
    tipo: string;
    consorcio: {
      nombre: string;
      direccion: string;
    };
  };
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiClient.get<User>('/auth/me');
        setUser(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/login');
  };

  const handleCambiarModo = async (modo: 'completo' | 'simplificado') => {
    try {
      await apiClient.patch('/usuarios/preferencias', { preferenciasModo: modo });
      setUser((prev) => prev ? { ...prev, preferenciasModo: modo } : null);
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl p-6 animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mb-4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>

      {/* Info Card */}
      <div className="bg-white rounded-xl p-6 shadow">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl font-bold text-green-700">
            {user.nombre[0]}{user.apellido[0]}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              {user.nombre} {user.apellido}
            </h2>
            <p className="text-gray-500">{user.email}</p>
          </div>
        </div>

        {user.unidadFuncional && (
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500 mb-1">Mi unidad</p>
            <p className="font-medium text-gray-800">
              {user.unidadFuncional.codigo} • {user.unidadFuncional.tipo}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {user.unidadFuncional.consorcio.nombre}
            </p>
            <p className="text-xs text-gray-500">
              {user.unidadFuncional.consorcio.direccion}
            </p>
          </div>
        )}
      </div>

      {/* Modo de visualización */}
      <div className="bg-white rounded-xl p-6 shadow">
        <h3 className="font-semibold text-gray-800 mb-4">
          Modo de visualización
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Elegí cómo preferís ver la información
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            className={`p-4 rounded-lg text-left transition-colors border-2 ${
              user.preferenciasModo === 'simplificado'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleCambiarModo('simplificado')}
          >
            <span className="text-2xl mb-2 block">👀</span>
            <span className="font-medium text-gray-800 block">Simplificado</span>
            <span className="text-xs text-gray-500">
              Solo lo esencial, letra grande
            </span>
          </button>
          <button
            className={`p-4 rounded-lg text-left transition-colors border-2 ${
              user.preferenciasModo === 'completo'
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handleCambiarModo('completo')}
          >
            <span className="text-2xl mb-2 block">📊</span>
            <span className="font-medium text-gray-800 block">Completo</span>
            <span className="text-xs text-gray-500">
              Toda la información y detalles
            </span>
          </button>
        </div>
      </div>

      {/* Opciones */}
      <div className="bg-white rounded-xl shadow divide-y">
        <Link
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[56px]"
          href="/app/perfil/datos"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">👤</span>
            <span className="text-gray-800">Mis datos</span>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
        <Link
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[56px]"
          href="/app/perfil/notificaciones"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔔</span>
            <span className="text-gray-800">Notificaciones</span>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
        <Link
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[56px]"
          href="/app/perfil/seguridad"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">🔒</span>
            <span className="text-gray-800">Seguridad</span>
          </div>
          <span className="text-gray-400">→</span>
        </Link>
        <a
          className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors min-h-[56px]"
          href="mailto:soporte@vecinosimple.com"
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">❓</span>
            <span className="text-gray-800">Ayuda</span>
          </div>
          <span className="text-gray-400">→</span>
        </a>
      </div>

      {/* Cerrar sesión */}
      <button
        className="w-full py-4 bg-white text-red-600 font-medium rounded-xl shadow hover:bg-red-50 transition-colors min-h-[56px]"
        onClick={handleLogout}
      >
        Cerrar sesión
      </button>

      {/* Versión */}
      <p className="text-center text-xs text-gray-400">
        VecinoSimple v1.0.0
      </p>
    </div>
  );
}
