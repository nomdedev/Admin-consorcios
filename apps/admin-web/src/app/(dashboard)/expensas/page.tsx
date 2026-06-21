"use client";

import {
  Button,
  Card,
  CardContent,
  Badge,
  EmptyState,
  AlertBanner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vecinosimple/ui";
import { Plus, FileText, RefreshCw, Calendar, DollarSign, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConsorcios } from "@/features/consorcios";
import { useExpensas } from "@/features/expensas";

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

export default function ExpensasPage() {
  const router = useRouter();
  const [consorcioId, setConsorcioId] = useState<string>("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoExpensa | "">("");
  
  // Fetch consorcios
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data ?? [];
  
  // Fetch expensas
  const { data, isLoading, isError, refetch } = useExpensas(
    consorcioId || undefined,
    {
      estado: estadoFiltro || undefined,
      limit: 50,
    }
  );
  
  const expensas = data?.data ?? [];

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Expensas</h1>
          <p className="text-neutral-600">
            Gestiona las liquidaciones de expensas ({data?.total ?? 0} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            disabled={isLoading} 
            variant="secondary"
            onClick={() => refetch()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button 
            disabled={!consorcioId}
            onClick={() => router.push(`/expensas/nueva${consorcioId ? `?consorcio=${consorcioId}` : ""}`)}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nueva Expensa
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <AlertBanner title="Error al cargar expensas" variant="error">
          No se pudieron cargar las expensas. Verifica tu conexión y reintenta.
        </AlertBanner>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <p className="block text-sm font-medium text-neutral-700 mb-1">
                Consorcio
              </p>
              <Select value={consorcioId} onValueChange={setConsorcioId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar consorcio..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los consorcios</SelectItem>
                  {consorcios.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-48">
              <p className="block text-sm font-medium text-neutral-700 mb-1">
                Estado
              </p>
              <Select value={estadoFiltro} onValueChange={(v) => setEstadoFiltro(v as EstadoExpensa | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="BORRADOR">Borrador</SelectItem>
                  <SelectItem value="LIQUIDADA">Liquidada</SelectItem>
                  <SelectItem value="PUBLICADA">Publicada</SelectItem>
                  <SelectItem value="CERRADA">Cerrada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de expensas */}
      {!consorcioId ? (
        <EmptyState
          description="Selecciona un consorcio para ver sus expensas"
          icon={<FileText className="h-8 w-8" />}
          title="Selecciona un consorcio"
        />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="h-48 animate-pulse rounded-lg bg-neutral-200" key={i} />
          ))}
        </div>
      ) : expensas.length === 0 ? (
        <EmptyState
          action={{
            label: "Crear Expensa",
            onClick: () => router.push(`/expensas/nueva?consorcio=${consorcioId}`),
          }}
          description="No hay expensas para este consorcio"
          icon={<FileText className="h-8 w-8" />}
          title="Sin expensas"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {expensas.map((expensa) => (
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              key={expensa.id}
              onClick={() => router.push(`/expensas/${expensa.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">
                      {formatPeriodo(expensa.periodo)}
                    </h3>
                    <p className="text-sm text-neutral-500">
                      Período {expensa.periodo}
                    </p>
                  </div>
                  <Badge variant={estadoColors[expensa.estado]}>
                    {estadoLabels[expensa.estado]}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
                      Total Ordinario
                    </span>
                    <span className="font-medium">
                      {formatCurrency(expensa.totalGastosOrdinarios)}
                    </span>
                  </div>
                  
                  {Number(expensa.totalGastosExtraordinarios) > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-neutral-600">Extraordinario</span>
                      <span className="font-medium text-amber-600">
                        {formatCurrency(expensa.totalGastosExtraordinarios)}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm pt-2 border-t border-neutral-100">
                    <span className="text-neutral-600 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Vencimiento
                    </span>
                    <span className="font-medium">
                      {formatDate(expensa.fechaVencimiento)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-neutral-100 flex justify-between items-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/expensas/${expensa.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver detalle
                  </Button>
                  
                  {expensa.estado === "BORRADOR" && (
                    <Badge variant="warning">Pendiente de liquidar</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
