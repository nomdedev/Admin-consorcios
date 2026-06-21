import { Button } from '@vecinosimple/ui';
import { FileX, ArrowLeft, Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-md w-full space-y-8 text-center px-4">
        <div>
          <div className="mx-auto h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center">
            <FileX className="h-10 w-10 text-slate-600" />
          </div>
          <h1 className="mt-6 text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Página no encontrada
          </h2>
          <p className="mt-2 text-gray-600">
            La página solicitada no existe en el sistema de encargados.
          </p>
        </div>
        <div className="space-y-3">
          <Button asChild className="w-full" size="lg">
            <Link href="/app">
              <Home className="mr-2 h-4 w-4" />
              Panel principal
            </Link>
          </Button>
          <Button asChild className="w-full" variant="secondary">
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al login
            </Link>
          </Button>
        </div>
        <div className="text-sm text-gray-500 bg-slate-50 p-4 rounded-lg">
          <p className="font-medium">¿Es un enlace roto?</p>
          <p>Reporta este error al equipo técnico.</p>
        </div>
      </div>
    </div>
  );
}