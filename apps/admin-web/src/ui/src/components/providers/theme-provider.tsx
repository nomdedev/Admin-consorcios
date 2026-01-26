"use client";

import * as React from "react";
import { useUIStore, useEffectiveTheme, getTextSizePixels } from "../../stores/ui.store";
import { cn } from "../../lib/utils";

// =============================================================================
// ThemeProvider - Aplica tema y configuraciones de accesibilidad
// =============================================================================

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "claro" | "oscuro" | "auto";
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = "auto",
}) => {
  const tema = useEffectiveTheme();
  const { tamanoTexto } = useUIStore();

  // Aplicar tema al document
  React.useEffect(() => {
    const root = document.documentElement;
    
    // Quitar clases previas
    root.classList.remove("light", "dark");
    
    // Agregar clase del tema actual
    root.classList.add(tema === "oscuro" ? "dark" : "light");
    
    // Actualizar meta theme-color
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        "content",
        tema === "oscuro" ? "#1a1a1a" : "#ffffff"
      );
    }
  }, [tema]);

  // Aplicar tamaño de texto base
  React.useEffect(() => {
    const root = document.documentElement;
    const size = getTextSizePixels(tamanoTexto);
    root.style.fontSize = `${size}px`;
  }, [tamanoTexto]);

  return <>{children}</>;
};

// =============================================================================
// Selector de Modo (Simplificado vs Completo)
// =============================================================================

interface ModeSelectorProps {
  className?: string;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ className }) => {
  const { modo, setModo } = useUIStore();

  return (
    <div className={cn("flex rounded-lg border border-neutral-200 p-1", className)}>
      <button
        onClick={() => setModo("simplificado")}
        className={cn(
          "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
          "min-h-touch",
          modo === "simplificado"
            ? "bg-brand-600 text-white"
            : "text-neutral-600 hover:bg-neutral-100"
        )}
        aria-pressed={modo === "simplificado"}
      >
        Modo Simple
      </button>
      <button
        onClick={() => setModo("completo")}
        className={cn(
          "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors",
          "min-h-touch",
          modo === "completo"
            ? "bg-brand-600 text-white"
            : "text-neutral-600 hover:bg-neutral-100"
        )}
        aria-pressed={modo === "completo"}
      >
        Modo Completo
      </button>
    </div>
  );
};

// =============================================================================
// Panel de Configuración de Accesibilidad
// =============================================================================

interface AccessibilitySettingsProps {
  className?: string;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  className,
}) => {
  const { tema, tamanoTexto, setTema, setTamanoTexto } = useUIStore();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Tema */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tema visual
        </label>
        <div className="flex rounded-lg border border-neutral-200 p-1">
          {[
            { value: "claro", label: "Claro" },
            { value: "oscuro", label: "Oscuro" },
            { value: "auto", label: "Automático" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTema(option.value as typeof tema)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "min-h-touch",
                tema === option.value
                  ? "bg-brand-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
              aria-pressed={tema === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tamaño de texto */}
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">
          Tamaño del texto
        </label>
        <div className="flex rounded-lg border border-neutral-200 p-1">
          {[
            { value: "normal", label: "Normal" },
            { value: "grande", label: "Grande" },
            { value: "extra-grande", label: "Extra grande" },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTamanoTexto(option.value as typeof tamanoTexto)}
              className={cn(
                "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "min-h-touch",
                tamanoTexto === option.value
                  ? "bg-brand-600 text-white"
                  : "text-neutral-600 hover:bg-neutral-100"
              )}
              aria-pressed={tamanoTexto === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          {tamanoTexto === "normal" && "Tamaño estándar de 18px"}
          {tamanoTexto === "grande" && "Tamaño aumentado de 20px"}
          {tamanoTexto === "extra-grande" && "Tamaño extra grande de 24px"}
        </p>
      </div>
    </div>
  );
};

ThemeProvider.displayName = "ThemeProvider";
ModeSelector.displayName = "ModeSelector";
AccessibilitySettings.displayName = "AccessibilitySettings";
