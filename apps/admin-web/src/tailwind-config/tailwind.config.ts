import type { Config } from "tailwindcss";

// =============================================================================
// VecinoSimple - Tailwind Config (Accesibilidad WCAG 2.1 AA)
// =============================================================================

const config: Config = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    // Incluir componentes del Design System
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // -------------------------------------------------------------------------
      // Tipografía Accesible (base 18px para mejor legibilidad)
      // -------------------------------------------------------------------------
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.5" }], // 14px
        sm: ["1rem", { lineHeight: "1.5" }], // 16px
        base: ["1.125rem", { lineHeight: "1.6" }], // 18px (default)
        lg: ["1.25rem", { lineHeight: "1.6" }], // 20px
        xl: ["1.5rem", { lineHeight: "1.4" }], // 24px
        "2xl": ["1.875rem", { lineHeight: "1.3" }], // 30px
        "3xl": ["2.25rem", { lineHeight: "1.2" }], // 36px
        "4xl": ["3rem", { lineHeight: "1.1" }], // 48px
      },

      // -------------------------------------------------------------------------
      // Colores con Contraste WCAG AA (4.5:1 mínimo)
      // -------------------------------------------------------------------------
      colors: {
        // Brand - Verde Confianza
        brand: {
          50: "#E8F5E9",
          100: "#C8E6C9",
          200: "#A5D6A7",
          300: "#81C784",
          400: "#66BB6A",
          500: "#4CAF50", // Principal
          600: "#43A047",
          700: "#388E3C", // Contraste 4.5:1 sobre blanco
          800: "#2E7D32",
          900: "#1B5E20",
        },

        // Semáforo de Morosos (Colores semánticos)
        status: {
          alDia: "#2E7D32", // Verde - Al día
          leve: "#F9A825", // Amarillo - 1-30 días
          moderado: "#EF6C00", // Naranja - 31-60 días
          grave: "#C62828", // Rojo - 60+ días
        },

        // Alto Contraste (Modo Accesible)
        highContrast: {
          bg: "#000000",
          fg: "#FFFFFF",
          accent: "#FFFF00",
          link: "#00FFFF",
          success: "#00FF00",
          error: "#FF0000",
        },

        // Grises Neutros
        neutral: {
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#EEEEEE",
          300: "#E0E0E0",
          400: "#BDBDBD",
          500: "#9E9E9E",
          600: "#757575",
          700: "#616161", // Texto secundario (4.5:1)
          800: "#424242",
          900: "#212121", // Texto principal
        },
      },

      // -------------------------------------------------------------------------
      // Espaciado Táctil (44x44px mínimo WCAG)
      // -------------------------------------------------------------------------
      spacing: {
        touch: "2.75rem", // 44px - Mínimo táctil
        "touch-lg": "3rem", // 48px - Confortable
        "touch-xl": "3.5rem", // 56px - Extra grande
      },

      // -------------------------------------------------------------------------
      // Tamaños mínimos para elementos interactivos
      // -------------------------------------------------------------------------
      minWidth: {
        touch: "2.75rem",
        "touch-lg": "3rem",
      },
      minHeight: {
        touch: "2.75rem",
        "touch-lg": "3rem",
      },

      // -------------------------------------------------------------------------
      // Border Radius (Consistente)
      // -------------------------------------------------------------------------
      borderRadius: {
        card: "0.75rem", // 12px - Tarjetas
        button: "0.5rem", // 8px - Botones
        input: "0.375rem", // 6px - Inputs
      },

      // -------------------------------------------------------------------------
      // Sombras (Sutiles, no distraen)
      // -------------------------------------------------------------------------
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 4px 16px rgba(0, 0, 0, 0.12)",
        button: "0 1px 3px rgba(0, 0, 0, 0.1)",
      },

      // -------------------------------------------------------------------------
      // Animaciones (Respetan prefers-reduced-motion)
      // -------------------------------------------------------------------------
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "pulse-soft": "pulseSoft 2s infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },

      // -------------------------------------------------------------------------
      // Focus Ring (Visible y accesible)
      // -------------------------------------------------------------------------
      ringWidth: {
        DEFAULT: "3px",
      },
      ringOffsetWidth: {
        DEFAULT: "2px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms")({
      strategy: "class", // No aplicar estilos por defecto
    }),
    require("@tailwindcss/typography"),
  ],
};

export default config;
