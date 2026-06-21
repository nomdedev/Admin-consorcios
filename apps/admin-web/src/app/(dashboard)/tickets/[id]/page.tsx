"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  AlertBanner,
  Spinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Avatar,
} from "@vecinosimple/ui";
import { ArrowLeft, Send, Clock, User, MapPin, MessageSquare, Check } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  useTicket,
  useComentariosTicket,
  useAddComentarioTicket,
  useCambiarEstadoTicket,
} from "@/features/tickets";

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

// Schema para nuevo comentario
const comentarioSchema = z.object({
  contenido: z.string().min(1, "El comentario no puede estar vacío").max(1000),
  esInterno: z.boolean().default(false),
});

type ComentarioFormData = z.infer<typeof comentarioSchema>;

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const _router = useRouter();
  const [nuevoEstado, setNuevoEstado] = useState<EstadoTicket | "">("");
  
  const { data: ticket, isLoading, isError } = useTicket(id);
  const { data: comentarios, isLoading: loadingComentarios } = useComentariosTicket(id);
  
  const addComentario = useAddComentarioTicket();
  const cambiarEstado = useCambiarEstadoTicket();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ComentarioFormData>({
    resolver: zodResolver(comentarioSchema),
    defaultValues: {
      esInterno: false,
    },
  });

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const onSubmitComentario = async (data: ComentarioFormData) => {
    try {
      await addComentario.mutateAsync({
        ticketId: id,
        data: {
          contenido: data.contenido,
          esInterno: data.esInterno,
        },
      });
      reset();
    } catch {
      // Error manejado por el hook
    }
  };

  const handleCambiarEstado = async () => {
    if (!nuevoEstado) return;
    try {
      await cambiarEstado.mutateAsync({ ticketId: id, estado: nuevoEstado });
      setNuevoEstado("");
    } catch {
      // Error manejado por el hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="space-y-6">
        <Link href="/tickets">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <AlertBanner title="Error" variant="error">
          No se pudo cargar el ticket. Verifica que existe y reintenta.
        </AlertBanner>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Link href="/tickets">
            <Button size="sm" variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-neutral-900">
                {ticket.titulo}
              </h1>
              <Badge variant={estadoColors[ticket.estado]}>
                {estadoLabels[ticket.estado]}
              </Badge>
              <Badge variant={prioridadColors[ticket.prioridad]}>
                {ticket.prioridad}
              </Badge>
            </div>
            <p className="text-neutral-600 mt-1">
              Creado el {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>

        {/* Cambiar estado */}
        {ticket.estado !== "CERRADO" && (
          <div className="flex items-center gap-2">
            <Select value={nuevoEstado} onValueChange={(v) => setNuevoEstado(v as EstadoTicket)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Cambiar estado..." />
              </SelectTrigger>
              <SelectContent>
                {ticket.estado !== "EN_PROGRESO" && (
                  <SelectItem value="EN_PROGRESO">En progreso</SelectItem>
                )}
                {ticket.estado !== "ESPERANDO_RESPUESTA" && (
                  <SelectItem value="ESPERANDO_RESPUESTA">Esperando respuesta</SelectItem>
                )}
                {ticket.estado !== "RESUELTO" && (
                  <SelectItem value="RESUELTO">Resuelto</SelectItem>
                )}
                <SelectItem value="CERRADO">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              disabled={!nuevoEstado || cambiarEstado.isPending} 
              size="sm"
              onClick={handleCambiarEstado}
            >
              {cambiarEstado.isPending ? <Spinner size="sm" /> : <Check className="h-4 w-4" />}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contenido principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Descripción */}
          <Card>
            <CardHeader>
              <CardTitle>Descripción</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-neutral-700">{ticket.descripcion}</p>
            </CardContent>
          </Card>

          {/* Comentarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentarios ({comentarios?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingComentarios ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : !comentarios || comentarios.length === 0 ? (
                <p className="text-neutral-500 text-center py-4">
                  No hay comentarios aún
                </p>
              ) : (
                <div className="space-y-4">
                  {comentarios.map((comentario) => (
                    <div 
                      className={`p-4 rounded-lg ${
                        comentario.esInterno 
                          ? "bg-amber-50 border border-amber-200" 
                          : "bg-neutral-50"
                      }`} 
                      key={comentario.id}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                          <span className="text-xs">
                            {comentario.usuario?.nombre?.charAt(0) ?? "U"}
                          </span>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">
                              {comentario.usuario?.nombre} {comentario.usuario?.apellido}
                            </span>
                            {comentario.esInterno && (
                              <Badge variant="warning">Interno</Badge>
                            )}
                            <span className="text-xs text-neutral-500">
                              {formatDate(comentario.createdAt)}
                            </span>
                          </div>
                          <p className="text-neutral-700 whitespace-pre-wrap">
                            {comentario.contenido}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario nuevo comentario */}
              {ticket.estado !== "CERRADO" && (
                <form className="pt-4 border-t border-neutral-200" onSubmit={handleSubmit(onSubmitComentario)}>
                  <Textarea
                    {...register("contenido")}
                    placeholder="Escribe un comentario..."
                    rows={3}
                  />
                  {errors.contenido && (
                    <p className="text-sm text-red-500 mt-1">{errors.contenido.message}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        {...register("esInterno")}
                        className="rounded border-neutral-300"
                      />
                      <span className="text-amber-700">Comentario interno (solo admins)</span>
                    </label>
                    <Button disabled={addComentario.isPending} type="submit">
                      {addComentario.isPending ? (
                        <Spinner className="mr-2" size="sm" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      Enviar
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Info del ticket */}
          <Card>
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-neutral-500" />
                <div>
                  <p className="text-xs text-neutral-500">Creado</p>
                  <p className="text-sm">{formatDate(ticket.createdAt)}</p>
                </div>
              </div>

              {ticket.ubicacion && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-neutral-500" />
                  <div>
                    <p className="text-xs text-neutral-500">Ubicación</p>
                    <p className="text-sm">{ticket.ubicacion}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-neutral-500" />
                <div>
                  <p className="text-xs text-neutral-500">Creado por</p>
                  <p className="text-sm">
                    {ticket.creador?.nombre} {ticket.creador?.apellido}
                  </p>
                </div>
              </div>

              {ticket.asignado && (
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-brand-500" />
                  <div>
                    <p className="text-xs text-neutral-500">Asignado a</p>
                    <p className="text-sm font-medium">
                      {ticket.asignado.nombre} {ticket.asignado.apellido}
                    </p>
                  </div>
                </div>
              )}

              {ticket.fechaResolucion && (
                <div className="flex items-center gap-3">
                  <Check className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-neutral-500">Resuelto</p>
                    <p className="text-sm">{formatDate(ticket.fechaResolucion)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Archivos adjuntos */}
          {ticket.archivos && ticket.archivos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Archivos adjuntos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ticket.archivos.map((archivo) => (
                    <a
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-50 text-sm text-brand-600"
                      href={archivo.url}
                      key={archivo.id}
                      rel="noopener noreferrer"
                      target="_blank"
                    >
                      📎 {archivo.nombre}
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
