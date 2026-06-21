const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vecinosimple/ui", "@vecinosimple/business-logic"],
  // NOTE: Habilitar typedRoutes cuando todas las rutas estén tipadas
  // experimental: {
  //   typedRoutes: true,
  // },
  // NOTE: TypeScript valida correctamente durante el build
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withSentryConfig(
  nextConfig,
  { silent: true },
  { hideSourceMaps: true }
);
