import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// Input - Componente Accesible (WCAG 2.1 AA)
// =============================================================================

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * Label del input (opcional - si se usa un Label externo, puede omitirse)
   * Si se omite, asegurarse de asociar un label externo con htmlFor o usar aria-label
   */
  label?: string;
  /**
   * Texto de ayuda debajo del input
   */
  hint?: string;
  /**
   * Mensaje de error
   */
  error?: string;
  /**
   * Oculta visualmente el label pero lo mantiene para screen readers
   */
  hideLabel?: boolean;
  /**
   * Icono a mostrar a la izquierda del input
   */
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, label, hint, error, hideLabel, icon, id, ...props },
    ref
  ) => {
    // Generar ID único siempre (hooks deben llamarse incondicionalmente)
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;

    return (
      <div className="w-full">
        {/* Label - solo se muestra si se proporciona */}
        {label && (
          <label
            className={cn(
              "mb-2 block text-base font-medium text-neutral-900",
              hideLabel && "sr-only"
            )}
            htmlFor={inputId}
          >
            {label}
            {props.required && (
              <span aria-hidden="true" className="ml-1 text-status-grave">
                *
              </span>
            )}
          </label>
        )}

        {/* Input Container - con soporte para icono */}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              {icon}
            </div>
          )}
          <input
            aria-describedby={
              [hintId, errorId].filter(Boolean).join(" ") || undefined
            }
            aria-invalid={error ? "true" : undefined}
            className={cn(
              // Base
              "w-full rounded-input border bg-white py-3",
              icon ? "pl-10 pr-4" : "px-4",
              "text-base text-neutral-900 placeholder:text-neutral-500",
              // Tamaño táctil mínimo
              "min-h-touch",
              // Border
              error
                ? "border-status-grave focus:border-status-grave focus:ring-status-grave"
                : "border-neutral-300 focus:border-brand-500 focus:ring-brand-500",
              // Focus
              "focus:outline-none focus:ring-2 focus:ring-offset-0",
              // Disabled
              "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500",
              className
            )}
            id={inputId}
            ref={ref}
            type={type}
            {...props}
          />
        </div>

        {/* Hint */}
        {hint && !error && (
          <p className="mt-2 text-sm text-neutral-600" id={hintId}>
            {hint}
          </p>
        )}

        {/* Error */}
        {error && (
          <p
            className="mt-2 text-sm font-medium text-status-grave"
            id={errorId}
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
