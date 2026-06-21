"use client";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  AlertBanner,
  Spinner,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@vecinosimple/ui";
import { ArrowLeft, FileText, DollarSign, Calendar, CheckCircle, Lock, Send } from "lucide-react";
import Link from "next/link";
import { use } from "react";
import { useState } from "react";

import { useExpensa, useDetallesExpensa, useLiquidarExpensa, usePublicarExpensa, useCerrarExpensa } from "@/features/expensas";

import type { EstadoExpensa } from "@/lib/types";

const estadoColors: Record<EstadoExpensa, "default" | "warning" | "success" | "info"> = {
  BORRADOR: "default",
  LIQUIDADA: "warning",
  PUBLICADA: "success",
  CERRADA: "info",
};

const estadoLabels: Record<EstadoExpensa, string> = {
  BORRADOR: "Borrador",
  LIQUIDADA: "Liquidada",
  PUBLICADA: "Publicada",
  CERRADA: "Cerrada",
};

export default function ExpensaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [confirmAction, setConfirmAction] = useState<"liquidar" | "publicar" | "cerrar" | null>(null);
  
  const { data: expensa, isLoading, isError } = useExpensa(id);
  const { data: detalles, isLoading: loadingDetalles } = useDetallesExpensa(id);
  
  const liquidar = useLiquidarExpensa();
  const publicar = usePublicarExpensa();
  const cerrar = useCerrarExpensa();

  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(Number(value));

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatPeriodo = (periodo: string) => {
    const parts = periodo.split("-");
    const year = parts[0] || "";
    const month = parts[1] || "01";
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const monthIndex = parseInt(month, 10) - 1;
    return `${months[monthIndex] || "Desconocido"} ${year}`;
  };

  const handleAction = async () => {
    if (!confirmAction) return;
    try {
      switch (confirmAction) {
        case "liquidar":
          await liquidar.mutateAsync({ id, data: {} });
          break;
        case "publicar":
          await publicar.mutateAsync(id);
          break;
        case "cerrar":
          await cerrar.mutateAsync(id);
          break;
      }
      setConfirmAction(null);
    } catch {
      // Error manejado por el hook
    }
  };

  const isActionPending = liquidar.isPending || publicar.isPending || cerrar.isPending;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !expensa) {
    return (
      <div className="space-y-6">
        <Link href="/expensas">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <AlertBanner title="Error" variant="error">
          No se pudo cargar la expensa. Verifica que existe y reintenta.
        </AlertBanner>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/expensas">
            <Button size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">
                Expensa {formatPeriodo(expensa.periodo)}
              </h1>
              <Badge variant={estadoColors[expensa.estado]}>
                {estadoLabels[expensa.estado]}
              </Badge>
            </div>
            <p className="text-neutral-600">Período: {expensa.periodo}</p>
          </div>
        </div>

        {/* Acciones según estado */}
        <div className="flex gap-2">
          {expensa.estado === "BORRADOR" && (
            <Button onClick={() => setConfirmAction("liquidar")}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Liquidar
            </Button>
          )}
          {expensa.estado === "LIQUIDADA" && (
            <Button onClick={() => setConfirmAction("publicar")}>
              <Send className="h-4 w-4 mr-2" />
              Publicar
            </Button>
          )}
          {expensa.estado === "PUBLICADA" && (
            <Button variant="secondary" onClick={() => setConfirmAction("cerrar")}>
              <Lock className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          )}
        </div>
      </div>

      {/* Resumen financiero */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-brand-100">
                <DollarSign className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total Ordinario</p>
                <p className="text-xl font-bold">
                  {formatCurrency(expensa.totalGastosOrdinarios)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <DollarSign className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Total Extraordinario</p>
                <p className="text-xl font-bold">
                  {formatCurrency(expensa.totalGastosExtraordinarios)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Fondo Reserva</p>
                <p className="text-xl font-bold">
                  {formatCurrency(expensa.fondoReserva)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-600">Vencimiento</p>
                <p className="text-xl font-bold">
                  {formatDate(expensa.fechaVencimiento)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Observaciones */}
      {expensa.observaciones && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-neutral-700">{expensa.observaciones}</p>
          </CardContent>
        </Card>
      )}

      {/* Detalles por unidad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles por Unidad
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingDetalles ? (
            <div className="p-8 flex justify-center">
              <Spinner />
            </div>
          ) : !detalles || detalles.length === 0 ? (
            <div className="p-8 text-center text-neutral-500">
              No hay detalles aún. Liquida la expensa para generar el prorrateo.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Unidad
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                      Ordinario
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                      Extraordinario
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                      Saldo Ant.
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                      Intereses
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((detalle) => (
                    <tr className="border-b border-neutral-100" key={detalle.id}>
                      <td className="px-4 py-3 font-medium">
                        {detalle.unidadFuncional?.codigo ?? detalle.unidadFuncionalId}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(detalle.montoOrdinario)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {formatCurrency(detalle.montoExtraordinario)}
                      </td>
                      <td className="px-4 py-3 text-right text-red-600">
                        {Number(detalle.saldoAnterior) > 0
                          ? formatCurrency(detalle.saldoAnterior)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right text-amber-600">
                        {Number(detalle.intereses) > 0
                          ? formatCurrency(detalle.intereses)
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatCurrency(detalle.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-100 font-bold">
                    <td className="px-4 py-3">TOTAL</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(detalles.reduce((sum, d) => sum + Number(d.montoOrdinario), 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(detalles.reduce((sum, d) => sum + Number(d.montoExtraordinario), 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(detalles.reduce((sum, d) => sum + Number(d.saldoAnterior), 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(detalles.reduce((sum, d) => sum + Number(d.intereses), 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(detalles.reduce((sum, d) => sum + Number(d.total), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmación */}
      <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "liquidar" && "¿Liquidar expensa?"}
              {confirmAction === "publicar" && "¿Publicar expensa?"}
              {confirmAction === "cerrar" && "¿Cerrar expensa?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "liquidar" && 
                "Se calculará el prorrateo para todas las unidades funcionales según su coeficiente."}
              {confirmAction === "publicar" && 
                "La expensa será visible para todos los vecinos y podrán realizar pagos."}
              {confirmAction === "cerrar" && 
                "La expensa se cerrará de forma permanente y no podrá modificarse. Se creará un snapshot inmutable para auditoría."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>
              Cancelar
            </Button>
            <Button
              disabled={isActionPending}
              variant={confirmAction === "cerrar" ? "danger" : "primary"}
              onClick={handleAction}
            >
              {isActionPending ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Procesando...
                </>
              ) : (
                <>
                  {confirmAction === "liquidar" && "Liquidar"}
                  {confirmAction === "publicar" && "Publicar"}
                  {confirmAction === "cerrar" && "Cerrar definitivamente"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
