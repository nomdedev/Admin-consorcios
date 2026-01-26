import { Button } from '@vecinosimple/ui';
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <div className="mx-auto h-24 w-24 bg-blue-100 rounded-full flex items-center justify-center">
            <Home className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="mt-6 text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Página no encontrada
          </h2>
          <p className="mt-2 text-gray-600">
            La página que buscas no existe en VecinoSimple.
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/app">
              <Home className="mr-2 h-4 w-4" />
              Ir a mi panel
            </Link>
          </Button>
          <Button variant="secondary" asChild className="w-full">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
        <p className="text-sm text-gray-500">
          Si crees que esto es un error, contacta a tu administrador.
        </p>
      </div>
    </div>
  );
}