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
import { Plus, Megaphone, RefreshCw, Eye, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useComunicados } from "@/features/comunicados";
import { useConsorcios } from "@/features/consorcios";

export default function ComunicadosPage() {
  const router = useRouter();
  const [consorcioId, setConsorcioId] = useState<string>("");
  
  // Fetch consorcios
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data ?? [];
  
  // Fetch comunicados
  const { data, isLoading, isError, refetch } = useComunicados(
    consorcioId || undefined,
    { limit: 50 }
  );
  
  const comunicados = data?.data ?? [];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const isActive = (comunicado: { publicarDesde: string; publicarHasta?: string | null }) => {
    const now = new Date();
    const desde = new Date(comunicado.publicarDesde);
    const hasta = comunicado.publicarHasta ? new Date(comunicado.publicarHasta) : null;
    return now >= desde && (!hasta || now <= hasta);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Comunicados</h1>
          <p className="text-neutral-600">
            Gestiona las novedades y comunicados del edificio
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button 
            onClick={() => router.push(`/comunicados/nuevo${consorcioId ? `?consorcio=${consorcioId}` : ""}`)}
            disabled={!consorcioId}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Comunicado
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <AlertBanner title="Error al cargar comunicados" variant="error">
          No se pudieron cargar los comunicados. Verifica tu conexión y reintenta.
        </AlertBanner>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Consorcio
              </label>
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de comunicados */}
      {!consorcioId ? (
        <EmptyState
          description="Selecciona un consorcio para ver sus comunicados"
          icon={<Megaphone className="h-8 w-8" />}
          title="Selecciona un consorcio"
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-neutral-200" />
          ))}
        </div>
      ) : comunicados.length === 0 ? (
        <EmptyState
          action={{
            label: "Crear Comunicado",
            onClick: () => router.push(`/comunicados/nuevo?consorcio=${consorcioId}`),
          }}
          description="No hay comunicados para este consorcio"
          icon={<Megaphone className="h-8 w-8" />}
          title="Sin comunicados"
        />
      ) : (
        <div className="space-y-4">
          {comunicados.map((comunicado) => {
            const activo = isActive(comunicado);
            return (
              <Card
                key={comunicado.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  comunicado.importante ? "border-l-4 border-l-red-500" : ""
                }`}
                onClick={() => router.push(`/comunicados/${comunicado.id}`)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-neutral-900">
                          {comunicado.titulo}
                        </h3>
                        {comunicado.importante && (
                          <Badge variant="error">Importante</Badge>
                        )}
                        <Badge variant={activo ? "success" : "default"}>
                          {activo ? "Activo" : "Programado"}
                        </Badge>
                      </div>
                      
                      <p className="text-neutral-600 line-clamp-2 mb-3">
                        {comunicado.contenido}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        <span>
                          📅 Desde: {formatDate(comunicado.publicarDesde)}
                        </span>
                        {comunicado.publicarHasta && (
                          <span>
                            📅 Hasta: {formatDate(comunicado.publicarHasta)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      {comunicado.enviarEmail && (
                        <span title="Se enviará por email">✉️</span>
                      )}
                      {comunicado.enviarWhatsapp && (
                        <span title="Se enviará por WhatsApp">📱</span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/comunicados/${comunicado.id}`);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
