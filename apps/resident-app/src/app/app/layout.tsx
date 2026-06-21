'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { apiClient, ApiError } from '@/lib/api-client';

interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  unidadFuncional?: {
    codigo: string;
    consorcio: {
      nombre: string;
    };
  };
}

export default function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          router.push('/login');
          return;
        }

        const data = await apiClient.get<User>('/auth/me');
        setUser(data);
      } catch (error) {
        // Si es un error de autenticación (401), limpiamos el token
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem('accessToken');
        }
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!user) return null;

  const navigation = [
    { href: '/app', label: 'Inicio', icon: '🏠' },
    { href: '/app/expensas', label: 'Expensas', icon: '📋' },
    { href: '/app/pagos', label: 'Pagos', icon: '💳' },
    { href: '/app/tickets', label: 'Reclamos', icon: '🔧' },
    { href: '/app/comunicados', label: 'Novedades', icon: '📢' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-green-700">
              VecinoSimple
            </h1>
            {user.unidadFuncional && (
              <p className="text-xs text-gray-500">
                {user.unidadFuncional.codigo} • {user.unidadFuncional.consorcio.nombre}
              </p>
            )}
          </div>
          <Link
            className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-medium"
            href="/app/perfil"
          >
            {user.nombre[0]}{user.apellido[0]}
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/app' && pathname.startsWith(item.href));
              return (
                <Link
                  className={`flex flex-col items-center py-2 px-3 min-w-[64px] min-h-[44px] ${
                    isActive
                      ? 'text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  href={item.href}
                  key={item.href}
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
