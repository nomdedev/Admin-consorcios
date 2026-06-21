'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body className="min-h-screen bg-neutral-50 text-neutral-900">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Ocurrio un error</h1>
          <p className="text-sm text-neutral-600">
            Se registro el problema. Intenta nuevamente o contacta soporte.
          </p>
          <button
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            type="button"
            onClick={reset}
          >
            Reintentar
          </button>
        </main>
      </body>
    </html>
  );
}
