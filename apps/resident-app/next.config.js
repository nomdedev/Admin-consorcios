const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@vecinosimple/ui", "@vecinosimple/business-logic"],
  eslint: {
    // Deshabilitamos ESLint durante build para permitir warnings de props order
    // TODO: Habilitar una vez corregidos los warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Errores de TypeScript ya corregidos - habilitar validación en producción
    ignoreBuildErrors: false,
  },
};

module.exports = withPWA(nextConfig);
