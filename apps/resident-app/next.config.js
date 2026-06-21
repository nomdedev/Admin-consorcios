const { withSentryConfig } = require('@sentry/nextjs');
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
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
