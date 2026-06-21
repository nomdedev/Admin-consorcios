"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  AlertBanner,
  Spinner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@vecinosimple/ui";
import { ArrowLeft, AlertCircle, Save } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCreateTicket } from "@/features/tickets";
import { useConsorcios } from "@/features/consorcios";
import type { PrioridadTicket } from "@/lib/types";

// Schema de validación
const ticketSchema = z.object({
  consorcioId: z.string().min(1, "Selecciona un consorcio"),
  titulo: z.string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(100, "El título no puede superar 100 caracteres"),
  descripcion: z.string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(2000, "La descripción no puede superar 2000 caracteres"),
  ubicacion: z.string().max(100).optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export default function NuevoTicketForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consorcioIdParam = searchParams.get("consorcio") ?? "";
  
  const createTicket = useCreateTicket();
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      consorcioId: consorcioIdParam,
      prioridad: "MEDIA",
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    try {
      await createTicket.mutateAsync({
        consorcioId: data.consorcioId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        ubicacion: data.ubicacion || undefined,
        prioridad: data.prioridad as PrioridadTicket,
      });
      
      router.push("/tickets");
    } catch {
      // Error manejado por el hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nuevo Ticket</h1>
          <p className="text-neutral-600">Registra un reclamo o solicitud de mantenimiento</p>
        </div>
      </div>

      {/* Error banner */}
      {createTicket.isError && (
        <AlertBanner title="Error al crear ticket" variant="error">
          {createTicket.error?.message || "Ocurrió un error inesperado"}
        </AlertBanner>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Datos del Ticket
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Consorcio *
                </label>
                <Select 
                  value={watch("consorcioId")} 
                  onValueChange={(v) => setValue("consorcioId", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar consorcio..." />
                  </SelectTrigger>
                  <SelectContent>
                    {consorcios.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.consorcioId && (
                  <p className="text-sm text-red-500 mt-1">{errors.consorcioId.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Prioridad *
                </label>
                <Select 
                  value={watch("prioridad")} 
                  onValueChange={(v) => setValue("prioridad", v as PrioridadTicket)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar prioridad..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BAJA">🟢 Baja</SelectItem>
                    <SelectItem value="MEDIA">🔵 Media</SelectItem>
                    <SelectItem value="ALTA">🟠 Alta</SelectItem>
                    <SelectItem value="URGENTE">🔴 Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Título *
              </label>
              <Input
                {...register("titulo")}
                placeholder="Ej: Pérdida de agua en el hall"
                error={errors.titulo?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Descripción *
              </label>
              <Textarea
                {...register("descripcion")}
                placeholder="Describe el problema con el mayor detalle posible..."
                rows={5}
              />
              {errors.descripcion && (
                <p className="text-sm text-red-500 mt-1">{errors.descripcion.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Ubicación
              </label>
              <Input
                {...register("ubicacion")}
                placeholder="Ej: Piso 3, hall principal"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Indica dónde se encuentra el problema para facilitar su resolución
              </p>
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
                <strong>Prioridades:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Baja:</strong> Mejoras estéticas, sugerencias</li>
                  <li><strong>Media:</strong> Problemas menores que no afectan la habitabilidad</li>
                  <li><strong>Alta:</strong> Problemas que afectan el uso normal de espacios comunes</li>
                  <li><strong>Urgente:</strong> Emergencias (cortes de servicios, seguridad)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/tickets">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || createTicket.isPending}>
            {isSubmitting || createTicket.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Ticket
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
