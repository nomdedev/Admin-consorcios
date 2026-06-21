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
import { ArrowLeft, FileText, Save } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useConsorcios } from "@/features/consorcios";
import { useCreateExpensa } from "@/features/expensas";

// Schema de validación
const expensaSchema = z.object({
  consorcioId: z.string().min(1, "Selecciona un consorcio"),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)"),
  fechaVencimiento: z.string().min(1, "La fecha de vencimiento es obligatoria"),
  fechaSegundoVencimiento: z.string().optional(),
  recargoSegundoVencimiento: z.number().min(0).max(100).optional(),
  observaciones: z.string().max(500).optional(),
});

type ExpensaFormData = z.infer<typeof expensaSchema>;

export default function NuevaExpensaForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consorcioIdParam = searchParams.get("consorcio") ?? "";
  
  const createExpensa = useCreateExpensa();
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data ?? [];

  // Calcular periodo actual
  const now = new Date();
  const currentPeriodo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  // Calcular fecha de vencimiento por defecto (día 10 del mes)
  const defaultVencimiento = new Date(now.getFullYear(), now.getMonth(), 10);
  const defaultVencimientoStr = defaultVencimiento.toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ExpensaFormData>({
    resolver: zodResolver(expensaSchema),
    defaultValues: {
      consorcioId: consorcioIdParam,
      periodo: currentPeriodo,
      fechaVencimiento: defaultVencimientoStr,
      recargoSegundoVencimiento: 10,
    },
  });

  const onSubmit = async (data: ExpensaFormData) => {
    try {
      await createExpensa.mutateAsync({
        consorcioId: data.consorcioId,
        periodo: data.periodo,
        fechaVencimiento: data.fechaVencimiento,
        fechaSegundoVencimiento: data.fechaSegundoVencimiento || undefined,
        recargoSegundoVencimiento: data.recargoSegundoVencimiento,
        observaciones: data.observaciones || undefined,
      });
      
      router.push("/expensas");
    } catch {
      // Error manejado por el hook
    }
  };

  // Generar opciones de periodos (6 meses atrás y 3 adelante)
  const periodos: string[] = [];
  for (let i = -6; i <= 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    periodos.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

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
      <div className="flex items-center gap-4">
        <Link href="/expensas">
          <Button size="sm" variant="ghost">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nueva Expensa</h1>
          <p className="text-neutral-600">Crea una nueva liquidación de expensas</p>
        </div>
      </div>

      {/* Error banner */}
      {createExpensa.isError && (
        <AlertBanner title="Error al crear expensa" variant="error">
          {createExpensa.error?.message || "Ocurrió un error inesperado"}
        </AlertBanner>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Datos de la Expensa
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
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
                <p className="block text-sm font-medium text-neutral-700 mb-1">
                  Período *
                </p>
                <Select
                  value={watch("periodo")}
                  onValueChange={(v) => setValue("periodo", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período..." />
                  </SelectTrigger>
                  <SelectContent>
                    {periodos.map((p) => (
                      <SelectItem key={p} value={p}>
                        {formatPeriodo(p)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.periodo && (
                  <p className="text-sm text-red-500 mt-1">{errors.periodo.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="fecha-vencimiento">
                  Fecha 1er Vencimiento *
                </label>
                <Input
                  id="fecha-vencimiento"
                  type="date"
                  {...register("fechaVencimiento")}
                  error={errors.fechaVencimiento?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="fecha-segundo-vencimiento">
                  Fecha 2do Vencimiento
                </label>
                <Input
                  id="fecha-segundo-vencimiento"
                  type="date"
                  {...register("fechaSegundoVencimiento")}
                />
              </div>
            </div>

            <div className="w-48">
              <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="recargo-segundo-vencimiento">
                Recargo 2do Vencimiento (%)
              </label>
              <Input
                id="recargo-segundo-vencimiento"
                step="0.01"
                type="number"
                {...register("recargoSegundoVencimiento", { valueAsNumber: true })}
                placeholder="10"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1" htmlFor="observaciones">
                Observaciones
              </label>
              <Textarea
                id="observaciones"
                {...register("observaciones")}
                placeholder="Notas adicionales para esta liquidación..."
                rows={3}
              />
            </div>

            <div className="pt-4 border-t border-neutral-200">
              <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800">
                <strong>Nota:</strong> La expensa se creará en estado BORRADOR. 
                Deberás agregar los gastos y luego liquidarla para calcular el prorrateo 
                por unidad funcional.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 mt-6">
          <Link href="/expensas">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button disabled={isSubmitting || createExpensa.isPending} type="submit">
            {isSubmitting || createExpensa.isPending ? (
              <>
                <Spinner className="mr-2" size="sm" />
                Creando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Crear Expensa
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
