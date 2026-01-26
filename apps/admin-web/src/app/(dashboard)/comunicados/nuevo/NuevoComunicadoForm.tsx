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
import { ArrowLeft, Megaphone, Save, Mail, MessageSquare } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCreateComunicado } from "@/features/comunicados";
import { useConsorcios } from "@/features/consorcios";

// Schema de validación
const comunicadoSchema = z.object({
  consorcioId: z.string().min(1, "Selecciona un consorcio"),
  titulo: z.string()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(150, "El título no puede superar 150 caracteres"),
  contenido: z.string()
    .min(10, "El contenido debe tener al menos 10 caracteres")
    .max(5000, "El contenido no puede superar 5000 caracteres"),
  importante: z.boolean().default(false),
  publicarDesde: z.string().min(1, "La fecha de inicio es obligatoria"),
  publicarHasta: z.string().optional(),
  enviarEmail: z.boolean().default(false),
  enviarWhatsapp: z.boolean().default(false),
});

type ComunicadoFormData = z.infer<typeof comunicadoSchema>;

export default function NuevoComunicadoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consorcioIdParam = searchParams.get("consorcio") ?? "";
  
  const createComunicado = useCreateComunicado();
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data ?? [];

  // Fecha actual para default
  const now = new Date();
  const nowStr = now.toISOString().slice(0, 16); // "YYYY-MM-DDTHH:mm"

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComunicadoFormData>({
    resolver: zodResolver(comunicadoSchema),
    defaultValues: {
      consorcioId: consorcioIdParam,
      importante: false,
      publicarDesde: nowStr,
      enviarEmail: false,
      enviarWhatsapp: false,
    },
  });

  const onSubmit = async (data: ComunicadoFormData) => {
    try {
      await createComunicado.mutateAsync({
        consorcioId: data.consorcioId,
        titulo: data.titulo,
        contenido: data.contenido,
        importante: data.importante,
        publicarDesde: data.publicarDesde,
        publicarHasta: data.publicarHasta || undefined,
        enviarEmail: data.enviarEmail,
        enviarWhatsapp: data.enviarWhatsapp,
      });
      
      router.push("/comunicados");
    } catch {
      // Error manejado por el hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/comunicados">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nuevo Comunicado</h1>
          <p className="text-neutral-600">Publica una novedad para los vecinos</p>
        </div>
      </div>

      {/* Error banner */}
      {createComunicado.isError && (
        <AlertBanner title="Error al crear comunicado" variant="error">
          {createComunicado.error?.message || "Ocurrió un error inesperado"}
        </AlertBanner>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Contenido del Comunicado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                    Título *
                  </label>
                  <Input
                    {...register("titulo")}
                    placeholder="Ej: Corte programado de agua"
                    error={errors.titulo?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Contenido *
                  </label>
                  <Textarea
                    {...register("contenido")}
                    placeholder="Escribe el mensaje para los vecinos..."
                    rows={8}
                  />
                  {errors.contenido && (
                    <p className="text-sm text-red-500 mt-1">{errors.contenido.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("importante")}
                      className="rounded border-neutral-300 text-red-600"
                    />
                    <span className="text-sm font-medium text-red-700">
                      Marcar como importante
                    </span>
                  </label>
                  <p className="text-xs text-neutral-500 mt-1 ml-6">
                    Los comunicados importantes se destacan visualmente
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Programación y notificaciones */}
          <div className="space-y-6">
            {/* Programación */}
            <Card>
              <CardHeader>
                <CardTitle>Programación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Publicar desde *
                  </label>
                  <Input
                    type="datetime-local"
                    {...register("publicarDesde")}
                    error={errors.publicarDesde?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Publicar hasta (opcional)
                  </label>
                  <Input
                    type="datetime-local"
                    {...register("publicarHasta")}
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Deja vacío para mantener visible indefinidamente
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notificaciones */}
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      {...register("enviarEmail")}
                      className="rounded border-neutral-300"
                    />
                    <Mail className="h-5 w-5 text-neutral-500" />
                    <div>
                      <p className="text-sm font-medium">Enviar por Email</p>
                      <p className="text-xs text-neutral-500">
                        A todos los vecinos con email registrado
                      </p>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-neutral-50">
                    <input
                      type="checkbox"
                      {...register("enviarWhatsapp")}
                      className="rounded border-neutral-300"
                    />
                    <MessageSquare className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Enviar por WhatsApp</p>
                      <p className="text-xs text-neutral-500">
                        A todos los vecinos con teléfono registrado
                      </p>
                    </div>
                  </label>
                </div>

                <div className="pt-4 border-t border-neutral-200">
                  <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
                    <strong>Nota:</strong> Las notificaciones se enviarán al momento de publicar 
                    el comunicado según la fecha programada.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/comunicados">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting || createComunicado.isPending}>
            {isSubmitting || createComunicado.isPending ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Comunicado
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
