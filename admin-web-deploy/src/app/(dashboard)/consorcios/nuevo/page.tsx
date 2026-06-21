"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Spinner,
  useToast,
} from "@vecinosimple/ui";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useCreateConsorcio } from "@/features/consorcios";

// Schema de validación
const consorcioSchema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(100),
  direccion: z.string().min(5, "Mínimo 5 caracteres").max(200),
  localidad: z.string().min(2, "Mínimo 2 caracteres").max(100),
  provincia: z.string().default("Buenos Aires"),
  codigoPostal: z.string().max(10).optional(),
  cuit: z
    .string()
    .regex(/^\d{2}-\d{8}-\d{1}$/, "Formato: XX-XXXXXXXX-X")
    .optional()
    .or(z.literal("")),
  diaVencimiento: z.coerce.number().min(1).max(28).default(10),
  tasaInteresMora: z.coerce.number().min(0).max(100).default(0),
  periodoGracia: z.coerce.number().min(0).max(30).default(0),
});

type ConsorcioFormData = z.infer<typeof consorcioSchema>;

export default function NuevoConsorcioPage() {
  const router = useRouter();
  const { toastSuccess, toastError } = useToast();
  const createConsorcio = useCreateConsorcio();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ConsorcioFormData>({
    resolver: zodResolver(consorcioSchema),
    defaultValues: {
      provincia: "Buenos Aires",
      diaVencimiento: 10,
      tasaInteresMora: 0,
      periodoGracia: 0,
    },
  });

  const onSubmit = async (data: ConsorcioFormData) => {
    try {
      await createConsorcio.mutateAsync(data);
      toastSuccess("Consorcio creado", "El consorcio se ha creado correctamente");
      router.push("/consorcios");
    } catch (error) {
      toastError("Error", "No se pudo crear el consorcio");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          aria-label="Volver"
          size="sm"
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Nuevo Consorcio</h1>
          <p className="text-neutral-600">Completa los datos del edificio</p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Datos básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Edificio</CardTitle>
            <CardDescription>
              Información básica del consorcio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="nombre">Nombre del consorcio *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Edificio San Martín"
                  {...register("nombre")}
                  error={errors.nombre?.message}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  placeholder="Ej: Av. San Martín 1234"
                  {...register("direccion")}
                  error={errors.direccion?.message}
                />
              </div>

              <div>
                <Label htmlFor="localidad">Localidad *</Label>
                <Input
                  id="localidad"
                  placeholder="Ej: La Plata"
                  {...register("localidad")}
                  error={errors.localidad?.message}
                />
              </div>

              <div>
                <Label htmlFor="provincia">Provincia</Label>
                <Select
                  value={watch("provincia")}
                  onValueChange={(value) => setValue("provincia", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar provincia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buenos Aires">Buenos Aires</SelectItem>
                    <SelectItem value="CABA">CABA</SelectItem>
                    <SelectItem value="Córdoba">Córdoba</SelectItem>
                    <SelectItem value="Santa Fe">Santa Fe</SelectItem>
                    <SelectItem value="Mendoza">Mendoza</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="codigoPostal">Código Postal</Label>
                <Input
                  id="codigoPostal"
                  placeholder="Ej: 1900"
                  {...register("codigoPostal")}
                  error={errors.codigoPostal?.message}
                />
              </div>

              <div>
                <Label htmlFor="cuit">CUIT del Consorcio</Label>
                <Input
                  id="cuit"
                  placeholder="XX-XXXXXXXX-X"
                  {...register("cuit")}
                  error={errors.cuit?.message}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Configuración de expensas */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Expensas</CardTitle>
            <CardDescription>
              Parámetros para la liquidación mensual
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="diaVencimiento">Día de vencimiento</Label>
                <Input
                  id="diaVencimiento"
                  max={28}
                  min={1}
                  type="number"
                  {...register("diaVencimiento")}
                  error={errors.diaVencimiento?.message}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Día del mes (1-28)
                </p>
              </div>

              <div>
                <Label htmlFor="tasaInteresMora">Interés por mora (%)</Label>
                <Input
                  id="tasaInteresMora"
                  max={100}
                  min={0}
                  step={0.1}
                  type="number"
                  {...register("tasaInteresMora")}
                  error={errors.tasaInteresMora?.message}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Mensual
                </p>
              </div>

              <div>
                <Label htmlFor="periodoGracia">Período de gracia</Label>
                <Input
                  id="periodoGracia"
                  max={30}
                  min={0}
                  type="number"
                  {...register("periodoGracia")}
                  error={errors.periodoGracia?.message}
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Días antes de aplicar intereses
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-3">
          <Button
            disabled={createConsorcio.isPending}
            type="button"
            variant="secondary"
            onClick={() => router.back()}
          >
            Cancelar
          </Button>
          <Button disabled={createConsorcio.isPending} type="submit">
            {createConsorcio.isPending ? (
              <>
                <Spinner className="mr-2" size="sm" />
                Guardando...
              </>
            ) : (
              "Crear Consorcio"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
