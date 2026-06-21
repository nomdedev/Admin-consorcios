/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vecinosimple/ui", "@vecinosimple/business-logic"],
  // TODO: Habilitar typedRoutes cuando todas las rutas estén tipadas
  // experimental: {
  //   typedRoutes: true,
  // },
  eslint: {
    // Warning: Los errores de ESLint se ignoran durante el build
    // TODO: Corregir errores de import/order y jsx-a11y para re-habilitar
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Errores de TypeScript ya corregidos - habilitar validación en producción
    ignoreBuildErrors: false,
  },
};

module.exports = nextConfig;
