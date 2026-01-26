"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "../primitives/button";

// =============================================================================
// SimpleLayout - Layout simplificado para auth, onboarding, etc.
// =============================================================================

export interface SimpleLayoutProps {
  children: React.ReactNode;
  logo?: React.ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg";
}

export const SimpleLayout: React.FC<SimpleLayoutProps> = ({
  children,
  logo,
  title,
  subtitle,
  backHref,
  onBack,
  footer,
  maxWidth = "md",
}) => {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Header simple */}
      <header className="flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4">
        <div className="flex items-center gap-3">
          {(backHref || onBack) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              aria-label="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {logo || (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
              VS
            </div>
          )}
          <span className="font-semibold text-lg">VecinoSimple</span>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <div className={cn("w-full", maxWidthClasses[maxWidth])}>
          {/* Título y subtítulo */}
          {(title || subtitle) && (
            <div className="mb-8 text-center">
              {title && (
                <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-2 text-base text-neutral-600">{subtitle}</p>
              )}
            </div>
          )}

          {/* Contenido principal */}
          <div className="rounded-card border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="border-t border-neutral-200 p-4 text-center text-sm text-neutral-500">
          {footer}
        </footer>
      )}
    </div>
  );
};

SimpleLayout.displayName = "SimpleLayout";
