import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// Spinner - Indicador de carga accesible
// =============================================================================

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-4 w-4",
      md: "h-6 w-6",
      lg: "h-10 w-10",
    };

    return (
      <div
        aria-label="Cargando"
        className={cn("inline-flex", className)}
        ref={ref}
        role="status"
        {...props}
      >
        <svg
          aria-hidden="true"
          className={cn("animate-spin text-brand-600", sizeClasses[size])}
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
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            fill="currentColor"
          />
        </svg>
        <span className="sr-only">Cargando...</span>
      </div>
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner };
