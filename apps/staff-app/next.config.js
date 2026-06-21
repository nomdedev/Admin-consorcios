const { withSentryConfig } = require('@sentry/nextjs');
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  // Desactivar fallback por ahora (requiere babel-loader extra)
  // NOTE: Agregar offline page cuando la app esté más avanzada
  buildExcludes: [/middleware-manifest.json$/],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vecinosimple/ui", "@vecinosimple/business-logic"],
  // NOTE: TypeScript valida correctamente durante el build
  typescript: {
    ignoreBuildErrors: false,
  },
};

module.exports = withSentryConfig(
  withPWA(nextConfig),
  { silent: true },
  { hideSourceMaps: true }
);
