"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { ArrowLeft, Receipt, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useConsorcios } from "@/features/consorcios";
import { useCreateGasto, useCategoriasGasto } from "@/features/gastos";

// Schema de validación
const gastoSchema = z.object({
  consorcioId: z.string().min(1, "Selecciona un consorcio"),
  concepto: z.string()
    .min(3, "El concepto debe tener al menos 3 caracteres")
    .max(200, "El concepto no puede superar 200 caracteres"),
  descripcion: z.string().max(500).optional(),
  monto: z.number()
    .positive("El monto debe ser mayor a 0")
    .max(100000000, "El monto no puede superar $100.000.000"),
  categoriaId: z.string().optional(),
  esExtraordinario: z.boolean().default(false),
  esProrrateable: z.boolean().default(true),
  tipoComprobante: z.string().optional(),
  numeroComprobante: z.string().optional(),
  caeAfip: z.string().optional(),
  fechaComprobante: z.string().optional(),
  archivoUrl: z.string().url().optional().or(z.literal("")),
  fechaGasto: z.string().min(1, "La fecha es obligatoria"),
});

type GastoFormData = z.infer<typeof gastoSchema>;

export default function NuevoGastoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consorcioIdParam = searchParams.get("consorcio") ?? "";
  
  const createGasto = useCreateGasto();
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const { data: categorias } = useCategoriasGasto();
  
  const consorcios = consorciosData?.data ?? [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GastoFormData>({
    resolver: zodResolver(gastoSchema),
    defaultValues: {
      consorcioId: consorcioIdParam,
      esExtraordinario: false,
      esProrrateable: true,
      fechaGasto: new Date().toISOString().split("T")[0],
    },
  });

  const onSubmit = async (data: GastoFormData) => {
    try {
      await createGasto.mutateAsync({
        consorcioId: data.consorcioId,
        concepto: data.concepto,
        descripcion: data.descripcion || undefined,
        monto: data.monto,
        categoriaId: data.categoriaId || undefined,
        esExtraordinario: data.esExtraordinario,
        esProrrateable: data.esProrrateable,
        tipoComprobante: data.tipoComprobante || undefined,
        numeroComprobante: data.numeroComprobante || undefined,
        caeAfip: data.caeAfip || undefined,
        fechaComprobante: data.fechaComprobante || undefined,
        archivoUrl: data.archivoUrl || undefined,
        fechaGasto: data.fechaGasto,
      });
      
      router.push("/gastos");
    } catch {
      // Error manejado por el hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/gastos">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nuevo Gasto</h1>
          <p className="text-neutral-600">Registra un gasto del consorcio</p>
        </div>
      </div>

      {/* Error banner */}
      {createGasto.isError && (
        <AlertBanner title="Error al crear gasto" variant="error">
          {createGasto.error?.message || "Ocurrió un error inesperado"}
        </AlertBanner>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Datos básicos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Datos del Gasto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="block text-sm font-medium text-neutral-700 mb-1">
                  Consorcio *
                </p>
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
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="concepto">
                  Concepto *
                </label>
                <Input
                  id="concepto"
                  {...register("concepto")}
                  error={errors.concepto?.message}
                  placeholder="Ej: Servicio de limpieza mensual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="descripcion">
                  Descripción
                </label>
                <Textarea
                  id="descripcion"
                  {...register("descripcion")}
                  placeholder="Detalles adicionales del gasto..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="monto">
                    Monto *
                  </label>
                  <Input
                    id="monto"
                    step="0.01"
                    type="number"
                    {...register("monto", { valueAsNumber: true })}
                    error={errors.monto?.message}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="fecha-gasto">
                    Fecha del gasto *
                  </label>
                  <Input
                    id="fecha-gasto"
                    type="date"
                    {...register("fechaGasto")}
                    error={errors.fechaGasto?.message}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="block text-sm font-medium text-neutral-700 mb-1">
                    Categoría
                  </p>
                  <Select
                    value={watch("categoriaId") ?? ""}
                    onValueChange={(v) => setValue("categoriaId", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin categoría</SelectItem>
                      {categorias?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("esExtraordinario")}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">Extraordinario</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("esProrrateable")}
                      className="rounded border-neutral-300"
                    />
                    <span className="text-sm">Prorrateable</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comprobante */}
          <Card>
            <CardHeader>
              <CardTitle>Comprobante</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="block text-sm font-medium text-neutral-700 mb-1">
                  Tipo de comprobante
                </p>
                <Select
                  value={watch("tipoComprobante") ?? ""}
                  onValueChange={(v) => setValue("tipoComprobante", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin comprobante</SelectItem>
                    <SelectItem value="factura_a">Factura A</SelectItem>
                    <SelectItem value="factura_b">Factura B</SelectItem>
                    <SelectItem value="factura_c">Factura C</SelectItem>
                    <SelectItem value="ticket">Ticket</SelectItem>
                    <SelectItem value="recibo">Recibo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="numero-comprobante">
                    Número de comprobante
                  </label>
                  <Input
                    id="numero-comprobante"
                    {...register("numeroComprobante")}
                    placeholder="Ej: 0001-00001234"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="cae-afip">
                    CAE AFIP
                  </label>
                  <Input
                    id="cae-afip"
                    {...register("caeAfip")}
                    placeholder="Código de autorización"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="fecha-comprobante">
                  Fecha del comprobante
                </label>
                <Input
                  id="fecha-comprobante"
                  type="date"
                  {...register("fechaComprobante")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="archivo-url">
                  URL del archivo adjunto
                </label>
                <Input
                  id="archivo-url"
                  {...register("archivoUrl")}
                  error={errors.archivoUrl?.message}
                  placeholder="https://..."
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Pega la URL del comprobante escaneado o foto
                </p>
              </div>

              <div className="pt-4 border-t border-neutral-200">
                <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800">
                  <strong>Transparencia:</strong> Para cumplir con la ley de propiedad horizontal,
                  se recomienda adjuntar el comprobante de cada gasto.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/gastos">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button disabled={isSubmitting || createGasto.isPending} type="submit">
            {isSubmitting || createGasto.isPending ? (
              <>
                <Spinner className="mr-2" size="sm" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar Gasto
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
