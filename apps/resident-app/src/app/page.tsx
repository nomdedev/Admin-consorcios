import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-green-700 mb-2">
            VecinoSimple
          </h1>
          <p className="text-gray-600 text-lg">
            Tu edificio, más simple
          </p>
        </header>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Bienvenido a tu comunidad
          </h2>
          <p className="text-gray-600 mb-6">
            Accedé a tus expensas, realizá pagos y mantené contacto con tu 
            administración desde cualquier lugar.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors min-h-[44px]"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="📋"
            title="Expensas"
            description="Consultá el detalle de tus expensas mensuales y tu cuenta corriente"
          />
          <FeatureCard
            icon="💳"
            title="Pagos"
            description="Pagá tus expensas online de forma rápida y segura"
          />
          <FeatureCard
            icon="📢"
            title="Comunicados"
            description="Enterate de las novedades y avisos importantes de tu edificio"
          />
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>© 2024 VecinoSimple. Todos los derechos reservados.</p>
        </footer>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow p-6 text-center">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}
