import { Button } from '@vecinosimple/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Página no encontrada
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            La página que buscas no existe o ha sido movida.
          </p>
        </div>
        <div className="space-y-4">
          <Button asChild className="w-full">
            <Link href="/">
              Volver al inicio
            </Link>
          </Button>
          <Button variant="secondary" asChild className="w-full">
            <Link href="/consorcios">
              Ver consorcios
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}