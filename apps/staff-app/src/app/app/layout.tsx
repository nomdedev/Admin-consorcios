'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { db, getPendingSync } from '@/offline/db';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  consorcio: {
    nombre: string;
    direccion: string;
  };
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        // Intentar obtener datos del usuario (puede fallar si offline)
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );

          if (response.ok) {
            const data = await response.json();
            setUser(data);
            // Guardar en localStorage para uso offline
            localStorage.setItem('cachedUser', JSON.stringify(data));
          }
        } catch {
          // Si falla, usar datos cacheados
          const cached = localStorage.getItem('cachedUser');
          if (cached) {
            setUser(JSON.parse(cached));
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Contar registros pendientes de sincronización
  useEffect(() => {
    const updatePendingCount = async () => {
      const pending = await getPendingSync();
      const total =
        pending.bitacora.length +
        pending.paquetes.length +
        pending.rondas.length;
      setPendingCount(total);
    };

    updatePendingCount();
    const interval = setInterval(updatePendingCount, 5000);
    return () => clearInterval(interval);
  }, []);

  const navigation = [
    { href: '/app', label: 'Inicio', icon: '🏠' },
    { href: '/app/bitacora', label: 'Bitácora', icon: '📋' },
    { href: '/app/paquetes', label: 'Paquetes', icon: '📦' },
    { href: '/app/rondas', label: 'Rondas', icon: '🔒' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">VecinoSimple Staff</h1>
            {user?.consorcio && (
              <p className="text-xs text-blue-100">
                {user.consorcio.nombre}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                {pendingCount} pendientes
              </span>
            )}
            <Link
              href="/app/perfil"
              className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium"
            >
              {user ? `${user.nombre[0]}${user.apellido[0]}` : '?'}
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">{children}</main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/app' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center py-2 px-3 min-w-[64px] min-h-[44px] ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="text-xl mb-1">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
