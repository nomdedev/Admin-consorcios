import { Inter } from "next/font/google";

import { Providers } from "./providers";

import type { Metadata } from "next";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "VecinoSimple | Admin",
    template: "%s | VecinoSimple Admin",
  },
  description: "Portal de administración de consorcios",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html className={inter.variable} lang="es">
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
