import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// Button - Componente Accesible (WCAG 2.1 AA)
// =============================================================================

const buttonVariants = cva(
  // Base styles - Accesibilidad garantizada
  [
    "inline-flex items-center justify-center",
    "font-semibold text-base",
    "rounded-button",
    "transition-colors duration-200",
    // Tamaño táctil mínimo 44x44px (WCAG)
    "min-h-touch min-w-touch",
    // Focus visible
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    // Disabled
    "disabled:pointer-events-none disabled:opacity-50",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-600 text-white",
          "hover:bg-brand-700",
          "focus-visible:ring-brand-500",
        ],
        secondary: [
          "bg-white text-neutral-900 border-2 border-neutral-300",
          "hover:bg-neutral-50 hover:border-neutral-400",
          "focus-visible:ring-brand-500",
        ],
        danger: [
          "bg-status-grave text-white",
          "hover:bg-red-800",
          "focus-visible:ring-red-500",
        ],
        ghost: [
          "bg-transparent text-neutral-700",
          "hover:bg-neutral-100",
          "focus-visible:ring-brand-500",
        ],
        link: [
          "bg-transparent text-brand-600 underline-offset-4",
          "hover:underline",
          "focus-visible:ring-brand-500",
          "min-h-0 min-w-0 p-0", // Override min size for links
        ],
      },
      size: {
        sm: "h-10 px-4 text-sm",
        md: "h-12 px-6 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "h-12 w-12 p-0",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Si es true, el botón se renderiza como un Slot (para composición con Link, etc.)
   */
  asChild?: boolean;
  /**
   * Muestra un spinner de carga
   */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        aria-busy={loading}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading ? (
          <>
            <svg
              aria-hidden="true"
              className="mr-2 h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                fill="currentColor"
              />
            </svg>
            <span>Cargando...</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
