"use client";

import * as React from "react";

import { cn } from "../../lib/utils";
import { Badge } from "../primitives/badge";

// =============================================================================
// MorosoIndicator - Indicador visual de estado de morosidad
// Semáforo: Verde (al día), Amarillo (1-30 días), Naranja (31-60), Rojo (60+)
// =============================================================================

export interface MorosoIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  diasMora: number;
  montoAdeudado?: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const getEstadoMorosidad = (dias: number) => {
  if (dias <= 0) {
    return {
      color: "bg-status-alDia",
      textColor: "text-green-800",
      bgColor: "bg-green-100",
      label: "Al día",
      variant: "success" as const,
    };
  }
  if (dias <= 30) {
    return {
      color: "bg-status-leve",
      textColor: "text-yellow-800",
      bgColor: "bg-yellow-100",
      label: "1-30 días",
      variant: "warning" as const,
    };
  }
  if (dias <= 60) {
    return {
      color: "bg-status-moderado",
      textColor: "text-orange-800",
      bgColor: "bg-orange-100",
      label: "31-60 días",
      variant: "warning" as const,
    };
  }
  return {
    color: "bg-status-grave",
    textColor: "text-red-800",
    bgColor: "bg-red-100",
    label: "Más de 60 días",
    variant: "error" as const,
  };
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const MorosoIndicator = React.forwardRef<HTMLDivElement, MorosoIndicatorProps>(
  ({ className, diasMora, montoAdeudado, showLabel = true, size = "md", ...props }, ref) => {
    const estado = getEstadoMorosidad(diasMora);
    
    const sizeClasses = {
      sm: "h-2 w-2",
      md: "h-3 w-3",
      lg: "h-4 w-4",
    };

    return (
      <div
        className={cn("flex items-center gap-2", className)}
        ref={ref}
        {...props}
      >
        {/* Círculo indicador */}
        <span
          aria-hidden="true"
          className={cn(
            "rounded-full shrink-0",
            estado.color,
            sizeClasses[size]
          )}
        />
        
        {showLabel && (
          <Badge variant={estado.variant}>
            {estado.label}
            {montoAdeudado !== undefined && montoAdeudado > 0 && (
              <span className="ml-1 font-semibold">
                {formatCurrency(montoAdeudado)}
              </span>
            )}
          </Badge>
        )}
        
        {/* Texto accesible para lectores de pantalla */}
        <span className="sr-only">
          Estado de pago: {estado.label}
          {diasMora > 0 && `, ${diasMora} días de mora`}
          {montoAdeudado !== undefined && montoAdeudado > 0 && `, deuda de ${formatCurrency(montoAdeudado)}`}
        </span>
      </div>
    );
  }
);

MorosoIndicator.displayName = "MorosoIndicator";
