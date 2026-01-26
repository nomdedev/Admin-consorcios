"use client";

import * as React from "react";
import { Receipt, AlertCircle, CheckCircle, Clock } from "lucide-react";

import { cn } from "../../lib/utils";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../primitives/card";
import { Button } from "../primitives/button";
import { Badge } from "../primitives/badge";

// =============================================================================
// ExpensaCard - Tarjeta de expensa para vecinos
// Modo Simplificado: Solo monto y botón pagar
// Modo Completo: Desglose detallado
// =============================================================================

export interface ExpensaData {
  id: string;
  periodo: string; // "2024-01"
  periodoLabel?: string; // "Enero 2024"
  montoOrdinario: number;
  montoExtraordinario?: number;
  saldoAnterior?: number;
  intereses?: number;
  bonificacion?: number;
  total: number;
  fechaVencimiento: Date;
  estado: "pendiente" | "pagada" | "vencida" | "parcial";
}

export interface ExpensaCardProps {
  expensa: ExpensaData;
  modo?: "simplificado" | "completo";
  onPagar?: (expensa: ExpensaData) => void;
  onVerDetalle?: (expensa: ExpensaData) => void;
  className?: string;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatPeriodo = (periodo: string): string => {
  const parts = periodo.split("-");
  const year = parts[0] || "";
  const month = parts[1] || "01";
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  const monthIndex = parseInt(month, 10) - 1;
  return `${meses[monthIndex] || "Desconocido"} ${year}`;
};

const getEstadoBadge = (estado: ExpensaData["estado"]) => {
  const config = {
    pendiente: { variant: "warning" as const, label: "Pendiente", icon: Clock },
    pagada: { variant: "success" as const, label: "Pagada", icon: CheckCircle },
    vencida: { variant: "error" as const, label: "Vencida", icon: AlertCircle },
    parcial: { variant: "info" as const, label: "Pago parcial", icon: Clock },
  };
  return config[estado];
};

// Versión Simplificada (Abuela-Proof)
const ExpensaCardSimple: React.FC<ExpensaCardProps> = ({
  expensa,
  onPagar,
  className,
}) => {
  const estadoConfig = getEstadoBadge(expensa.estado);
  const EstadoIcon = estadoConfig.icon;
  const esPagable = expensa.estado !== "pagada";

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {expensa.periodoLabel || formatPeriodo(expensa.periodo)}
          </CardTitle>
          <Badge variant={estadoConfig.variant}>
            <EstadoIcon className="mr-1 h-4 w-4" aria-hidden="true" />
            {estadoConfig.label}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="py-4">
        <div className="text-center">
          <p className="text-sm text-neutral-600">Total a pagar</p>
          <p 
            className={cn(
              "text-4xl font-bold",
              expensa.estado === "vencida" ? "text-status-grave" : "text-neutral-900"
            )}
          >
            {formatCurrency(expensa.total)}
          </p>
        </div>
      </CardContent>

      {esPagable && (
        <CardFooter>
          <Button
            onClick={() => onPagar?.(expensa)}
            className="w-full"
            size="lg"
            aria-label={`Pagar expensa de ${formatPeriodo(expensa.periodo)} por ${formatCurrency(expensa.total)}`}
          >
            <Receipt className="mr-2 h-5 w-5" aria-hidden="true" />
            Pagar Expensa
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Versión Completa (con desglose)
const ExpensaCardCompleta: React.FC<ExpensaCardProps> = ({
  expensa,
  onPagar,
  onVerDetalle,
  className,
}) => {
  const estadoConfig = getEstadoBadge(expensa.estado);
  const EstadoIcon = estadoConfig.icon;
  const esPagable = expensa.estado !== "pagada";

  const detalles = [
    { label: "Expensas ordinarias", value: expensa.montoOrdinario },
    ...(expensa.montoExtraordinario ? [{ label: "Expensas extraordinarias", value: expensa.montoExtraordinario }] : []),
    ...(expensa.saldoAnterior && expensa.saldoAnterior !== 0 ? [{ label: "Saldo anterior", value: expensa.saldoAnterior }] : []),
    ...(expensa.intereses && expensa.intereses > 0 ? [{ label: "Intereses por mora", value: expensa.intereses, isNegative: true }] : []),
    ...(expensa.bonificacion && expensa.bonificacion > 0 ? [{ label: "Bonificación", value: -expensa.bonificacion, isPositive: true }] : []),
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {expensa.periodoLabel || formatPeriodo(expensa.periodo)}
          </CardTitle>
          <Badge variant={estadoConfig.variant}>
            <EstadoIcon className="mr-1 h-4 w-4" aria-hidden="true" />
            {estadoConfig.label}
          </Badge>
        </div>
        <p className="text-sm text-neutral-500">
          Vence: {new Date(expensa.fechaVencimiento).toLocaleDateString("es-AR")}
        </p>
      </CardHeader>

      <CardContent>
        {/* Desglose */}
        <div className="space-y-2 border-b border-neutral-200 pb-4 mb-4">
          {detalles.map((item, idx) => (
            <div key={idx} className="flex justify-between text-base">
              <span className="text-neutral-600">{item.label}</span>
              <span className={cn(
                "font-medium",
                item.isNegative && "text-status-grave",
                item.isPositive && "text-status-alDia"
              )}>
                {formatCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-neutral-900">Total</span>
          <span 
            className={cn(
              "text-2xl font-bold",
              expensa.estado === "vencida" ? "text-status-grave" : "text-neutral-900"
            )}
          >
            {formatCurrency(expensa.total)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        {onVerDetalle && (
          <Button
            variant="secondary"
            onClick={() => onVerDetalle(expensa)}
            className="flex-1"
            aria-label={`Ver detalle de expensa de ${formatPeriodo(expensa.periodo)}`}
          >
            Ver detalle
          </Button>
        )}
        {esPagable && (
          <Button
            onClick={() => onPagar?.(expensa)}
            className="flex-1"
            aria-label={`Pagar expensa de ${formatPeriodo(expensa.periodo)} por ${formatCurrency(expensa.total)}`}
          >
            <Receipt className="mr-2 h-5 w-5" aria-hidden="true" />
            Pagar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

// Componente principal que decide qué versión mostrar
export const ExpensaCard: React.FC<ExpensaCardProps> = ({
  modo = "completo",
  ...props
}) => {
  return modo === "simplificado" ? (
    <ExpensaCardSimple {...props} />
  ) : (
    <ExpensaCardCompleta {...props} />
  );
};

ExpensaCard.displayName = "ExpensaCard";
