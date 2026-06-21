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
  Input,
  StatCard,
} from "@vecinosimple/ui";
import { Plus, AlertCircle, RefreshCw, Search, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTickets, useTicketStats } from "@/features/tickets";
import { useConsorcios } from "@/features/consorcios";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";
import type { EstadoTicket, PrioridadTicket } from "@/lib/types";

const estadoColors: Record<EstadoTicket, "default" | "warning" | "success" | "info" | "error"> = {
  ABIERTO: "error",
  EN_PROGRESO: "warning",
  ESPERANDO_RESPUESTA: "info",
  RESUELTO: "success",
  CERRADO: "default",
};

const estadoLabels: Record<EstadoTicket, string> = {
  ABIERTO: "Abierto",
  EN_PROGRESO: "En progreso",
  ESPERANDO_RESPUESTA: "Esperando respuesta",
  RESUELTO: "Resuelto",
  CERRADO: "Cerrado",
};

const prioridadColors: Record<PrioridadTicket, "default" | "warning" | "error" | "info"> = {
  BAJA: "default",
  MEDIA: "info",
  ALTA: "warning",
  URGENTE: "error",
};

export default function TicketsPage() {
  const router = useRouter();
  const [consorcioId, setConsorcioId] = useState<string>("");
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoTicket | "">("");
  const [prioridadFiltro, setPrioridadFiltro] = useState<PrioridadTicket | "">("");
  const [search, setSearch] = useState("");
  
  const debouncedSearch = useDebouncedValue(search, 300);
  
  // Fetch consorcios
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data ?? [];
  
  // Fetch tickets
  const { data, isLoading, isError, refetch } = useTickets(
    consorcioId || undefined,
    {
      estado: estadoFiltro || undefined,
      prioridad: prioridadFiltro || undefined,
      limit: 50,
    }
  );
  
  // Fetch stats
  const { data: stats } = useTicketStats(consorcioId || undefined);
  
  const tickets = data?.data ?? [];

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Tickets</h1>
          <p className="text-neutral-600">
            Gestiona los reclamos y solicitudes de mantenimiento
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
            onClick={() => router.push(`/tickets/nuevo${consorcioId ? `?consorcio=${consorcioId}` : ""}`)}
            disabled={!consorcioId}
          >
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Ticket
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <AlertBanner title="Error al cargar tickets" variant="error">
          No se pudieron cargar los tickets. Verifica tu conexión y reintenta.
        </AlertBanner>
      )}

      {/* Stats */}
      {consorcioId && stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.total}
            icon={<AlertCircle className="h-6 w-6" />}
            description="Tickets totales"
          />
          <StatCard
            title="Abiertos"
            value={stats.abiertos}
            icon={<Clock className="h-6 w-6" />}
            description="Pendientes de atención"
          />
          <StatCard
            title="En Progreso"
            value={stats.enProgreso}
            icon={<RefreshCw className="h-6 w-6" />}
            description="En proceso"
          />
          <StatCard
            title="Resueltos"
            value={stats.resueltos}
            icon={<CheckCircle2 className="h-6 w-6" />}
            description="Este mes"
          />
        </div>
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
            
            <div className="w-40">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Estado
              </label>
              <Select value={estadoFiltro} onValueChange={(v) => setEstadoFiltro(v as EstadoTicket | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="ABIERTO">Abierto</SelectItem>
                  <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                  <SelectItem value="ESPERANDO_RESPUESTA">Esperando</SelectItem>
                  <SelectItem value="RESUELTO">Resuelto</SelectItem>
                  <SelectItem value="CERRADO">Cerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-40">
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Prioridad
              </label>
              <Select value={prioridadFiltro} onValueChange={(v) => setPrioridadFiltro(v as PrioridadTicket | "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="BAJA">Baja</SelectItem>
                  <SelectItem value="MEDIA">Media</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Input
                icon={<Search className="h-5 w-5 text-neutral-400" />}
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de tickets */}
      {!consorcioId ? (
        <EmptyState
          description="Selecciona un consorcio para ver sus tickets"
          icon={<AlertCircle className="h-8 w-8" />}
          title="Selecciona un consorcio"
        />
      ) : isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-200" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          action={{
            label: "Crear Ticket",
            onClick: () => router.push(`/tickets/nuevo?consorcio=${consorcioId}`),
          }}
          description="No hay tickets para este consorcio"
          icon={<AlertCircle className="h-8 w-8" />}
          title="Sin tickets"
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Card
              key={ticket.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/tickets/${ticket.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-neutral-900 truncate">
                        {ticket.titulo}
                      </h3>
                      <Badge variant={estadoColors[ticket.estado]}>
                        {estadoLabels[ticket.estado]}
                      </Badge>
                      <Badge variant={prioridadColors[ticket.prioridad]}>
                        {ticket.prioridad}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 truncate">
                      {ticket.descripcion}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500">
                      {ticket.ubicacion && (
                        <span>📍 {ticket.ubicacion}</span>
                      )}
                      <span>Creado: {formatDate(ticket.createdAt)}</span>
                      {ticket.asignado && (
                        <span>Asignado: {ticket.asignado.nombre} {ticket.asignado.apellido}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {ticket._count?.comentarios ? (
                      <span className="text-sm text-neutral-500">
                        💬 {ticket._count.comentarios}
                      </span>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
