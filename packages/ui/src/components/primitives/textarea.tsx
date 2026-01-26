import * as React from "react";

import { cn } from "../../lib/utils";

// =============================================================================
// Textarea - Componente Accesible (WCAG 2.1 AA)
// =============================================================================

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Label del textarea (opcional - si se usa un Label externo, puede omitirse)
   * Si se omite, asegurarse de asociar un label externo con htmlFor o usar aria-label
   */
  label?: string;
  /**
   * Texto de ayuda debajo del textarea
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
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { className, label, hint, error, hideLabel, id, ...props },
    ref
  ) => {
    // Generar ID único siempre (hooks deben llamarse incondicionalmente)
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;

    return (
      <div className="w-full">
        {/* Label - solo se muestra si se proporciona */}
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              "block text-sm font-medium text-neutral-700 mb-1.5",
              hideLabel && "sr-only"
            )}
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Textarea */}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            // Base styles
            "flex min-h-[80px] w-full rounded-md border bg-white px-3 py-2",
            "text-base text-neutral-900 placeholder:text-neutral-400",
            // Focus styles - accesibles
            "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2",
            // Border states
            error
              ? "border-red-500 focus:ring-red-500"
              : "border-neutral-300 focus:border-brand-500",
            // Disabled
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-neutral-100",
            // Touch target mínimo (WCAG)
            "min-h-touch",
            // Resize vertical por defecto
            "resize-y",
            className
          )}
          aria-describedby={
            [hintId, errorId].filter(Boolean).join(" ") || undefined
          }
          aria-invalid={error ? "true" : undefined}
          {...props}
        />

        {/* Hint text */}
        {hint && !error && (
          <p id={hintId} className="mt-1.5 text-sm text-neutral-500">
            {hint}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            className="mt-1.5 text-sm text-red-600 flex items-center gap-1"
            role="alert"
          >
            <svg
              className="h-4 w-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export { Textarea };
