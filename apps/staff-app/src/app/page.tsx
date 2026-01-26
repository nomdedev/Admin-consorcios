import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-700 mb-2">
            VecinoSimple
          </h1>
          <p className="text-gray-600 text-lg">App para Encargados</p>
        </header>

        {/* Hero Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Gestión del edificio
          </h2>
          <p className="text-gray-600 mb-6">
            Registrá eventos en la bitácora, recepcioná paquetes y realizá 
            rondas de vigilancia. Todo funciona sin conexión.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors min-h-[44px]"
          >
            Iniciar Sesión
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon="📋"
            title="Bitácora"
            description="Registrá ingresos, egresos y novedades del edificio"
          />
          <FeatureCard
            icon="📦"
            title="Paquetes"
            description="Recepcioná y entregá paquetes de los vecinos"
          />
          <FeatureCard
            icon="🔒"
            title="Rondas"
            description="Registrá tus rondas de vigilancia con checkpoints"
          />
        </div>

        {/* Offline Notice */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
          <p className="text-yellow-800 text-sm">
            <span className="font-medium">Funciona sin conexión:</span> Los 
            datos se guardan localmente y se sincronizan cuando vuelvas a tener 
            internet.
          </p>
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
