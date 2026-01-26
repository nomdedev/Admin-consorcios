import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        {/* Logo placeholder */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-3xl text-white">
          VS
        </div>

        <h1 className="mb-4 text-4xl font-bold text-neutral-900">
          VecinoSimple
        </h1>

        <p className="mb-8 text-lg text-neutral-600">
          Portal de Administración de Consorcios
        </p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex min-h-touch items-center justify-center rounded-button bg-brand-600 px-8 font-semibold text-white transition-colors hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            href="/login"
          >
            Iniciar Sesión
          </Link>

          <Link
            className="inline-flex min-h-touch items-center justify-center rounded-button border-2 border-neutral-300 bg-white px-8 font-semibold text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            href="/docs"
          >
            Documentación
          </Link>
        </div>

        {/* Status */}
        <div className="mt-12 rounded-lg bg-brand-50 p-4 text-sm text-brand-800">
          <p>
            <strong>🚧 En desarrollo</strong> — Fase 0: Setup inicial completado
          </p>
        </div>
      </div>
    </main>
  );
}
