"use client";

import { Package, User, Clock, Check, Camera } from "lucide-react";
import * as React from "react";

import { cn } from "../../lib/utils";
import { Badge } from "../primitives/badge";
import { Button } from "../primitives/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../primitives/card";

// =============================================================================
// PaqueteCard - Tarjeta de paquete recibido (Staff App)
// =============================================================================

export interface PaqueteData {
  id: string;
  localId?: string; // Para registros offline
  destinatarioUF: string; // Código de unidad funcional
  destinatarioNombre?: string;
  remitente: string;
  descripcion?: string;
  fotoUrl?: string;
  recibidoAt: Date;
  entregadoAt?: Date;
  entregadoA?: string;
  syncStatus?: "pending" | "synced" | "error";
}

export interface PaqueteCardProps {
  paquete: PaqueteData;
  onEntregar?: (paquete: PaqueteData) => void;
  onTomarFoto?: (paquete: PaqueteData) => void;
  showOfflineStatus?: boolean;
  className?: string;
}

const formatDateTime = (date: Date): string => {
  return new Date(date).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getSyncStatusBadge = (status?: PaqueteData["syncStatus"]) => {
  if (!status) return null;
  
  const config = {
    pending: { variant: "warning" as const, label: "Pendiente de sync" },
    synced: { variant: "success" as const, label: "Sincronizado" },
    error: { variant: "error" as const, label: "Error de sync" },
  };
  
  return config[status];
};

export const PaqueteCard: React.FC<PaqueteCardProps> = ({
  paquete,
  onEntregar,
  onTomarFoto,
  showOfflineStatus = false,
  className,
}) => {
  const entregado = !!paquete.entregadoAt;
  const syncBadge = showOfflineStatus ? getSyncStatusBadge(paquete.syncStatus) : null;

  return (
    <Card className={cn("w-full", entregado && "opacity-75", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <Package aria-hidden="true" className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {paquete.destinatarioUF}
              </CardTitle>
              {paquete.destinatarioNombre && (
                <p className="text-sm text-neutral-600">
                  {paquete.destinatarioNombre}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <Badge variant={entregado ? "success" : "warning"}>
              {entregado ? (
                <>
                  <Check aria-hidden="true" className="mr-1 h-4 w-4" />
                  Entregado
                </>
              ) : (
                <>
                  <Clock aria-hidden="true" className="mr-1 h-4 w-4" />
                  Pendiente
                </>
              )}
            </Badge>
            {syncBadge && (
              <Badge className="text-xs" variant={syncBadge.variant}>
                {syncBadge.label}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Remitente */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">De:</span>
          <span className="font-medium">{paquete.remitente}</span>
        </div>

        {/* Descripción */}
        {paquete.descripcion && (
          <p className="text-sm text-neutral-600">{paquete.descripcion}</p>
        )}

        {/* Foto del paquete */}
        {paquete.fotoUrl && (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`Foto del paquete para ${paquete.destinatarioUF}`}
              className="h-full w-full object-cover"
              src={paquete.fotoUrl}
            />
          </div>
        )}

        {/* Timestamps */}
        <div className="space-y-1 text-sm text-neutral-500">
          <div className="flex items-center gap-2">
            <Clock aria-hidden="true" className="h-4 w-4" />
            <span>Recibido: {formatDateTime(paquete.recibidoAt)}</span>
          </div>
          
          {entregado && paquete.entregadoAt && (
            <div className="flex items-center gap-2">
              <Check aria-hidden="true" className="h-4 w-4 text-status-alDia" />
              <span>
                Entregado: {formatDateTime(paquete.entregadoAt)}
                {paquete.entregadoA && ` a ${paquete.entregadoA}`}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      {!entregado && (
        <CardFooter className="flex gap-2">
          {onTomarFoto && !paquete.fotoUrl && (
            <Button
              aria-label="Tomar foto del paquete"
              className="flex-1"
              variant="secondary"
              onClick={() => onTomarFoto(paquete)}
            >
              <Camera aria-hidden="true" className="mr-2 h-5 w-5" />
              Foto
            </Button>
          )}
          {onEntregar && (
            <Button
              aria-label={`Registrar entrega de paquete para ${paquete.destinatarioUF}`}
              className="flex-1"
              onClick={() => onEntregar(paquete)}
            >
              <User aria-hidden="true" className="mr-2 h-5 w-5" />
              Entregar
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

PaqueteCard.displayName = "PaqueteCard";
