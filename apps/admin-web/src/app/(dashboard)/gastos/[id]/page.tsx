"use client";

import { use, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  AlertBanner,
  Spinner,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@vecinosimple/ui";
import { ArrowLeft, Receipt, Save, Trash2, FileText, Calendar, DollarSign } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useGasto, useUpdateGasto, useDeleteGasto, useCategoriasGasto } from "@/features/gastos";

// Schema de validación
const gastoSchema = z.object({
  concepto: z.string()
    .min(3, "El concepto debe tener al menos 3 caracteres")
    .max(200, "El concepto no puede superar 200 caracteres"),
  descripcion: z.string().max(500).optional(),
  monto: z.number()
    .positive("El monto debe ser mayor a 0")
    .max(100000000, "El monto no puede superar $100.000.000"),
  categoriaId: z.string().optional(),
  esExtraordinario: z.boolean(),
  esProrrateable: z.boolean(),
  tipoComprobante: z.string().optional(),
  numeroComprobante: z.string().optional(),
  caeAfip: z.string().optional(),
  fechaComprobante: z.string().optional(),
  archivoUrl: z.string().url().optional().or(z.literal("")),
  fechaGasto: z.string().min(1, "La fecha es obligatoria"),
});

type GastoFormData = z.infer<typeof gastoSchema>;

export default function GastoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const { data: gasto, isLoading, isError } = useGasto(id);
  const { data: categorias } = useCategoriasGasto();
  const updateGasto = useUpdateGasto();
  const deleteGasto = useDeleteGasto();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<GastoFormData>({
    resolver: zodResolver(gastoSchema),
  });

  // Cuando carga el gasto, actualizar el form
  if (gasto && !isDirty && !isEditing) {
    reset({
      concepto: gasto.concepto,
      descripcion: gasto.descripcion ?? "",
      monto: Number(gasto.monto),
      categoriaId: gasto.categoriaId ?? "",
      esExtraordinario: gasto.esExtraordinario,
      esProrrateable: gasto.esProrrateable,
      tipoComprobante: gasto.tipoComprobante ?? "",
      numeroComprobante: gasto.numeroComprobante ?? "",
      caeAfip: gasto.caeAfip ?? "",
      fechaComprobante: gasto.fechaComprobante?.split("T")[0] ?? "",
      archivoUrl: gasto.archivoUrl ?? "",
      fechaGasto: gasto.fechaGasto.split("T")[0],
    });
  }

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

  const onSubmit = async (data: GastoFormData) => {
    try {
      await updateGasto.mutateAsync({
        id,
        data: {
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
        },
      });
      setIsEditing(false);
    } catch {
      // Error manejado por el hook
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGasto.mutateAsync(id);
      router.push("/gastos");
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

  if (isError || !gasto) {
    return (
      <div className="space-y-6">
        <Link href="/gastos">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
        <AlertBanner title="Error" variant="error">
          No se pudo cargar el gasto. Verifica que existe y reintenta.
        </AlertBanner>
      </div>
    );
  }

  // La expensa está cerrada o publicada, no se puede editar
  const isLocked = gasto.expensa?.estado === "CERRADA" || gasto.expensa?.estado === "PUBLICADA";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/gastos">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-neutral-900">
                {gasto.concepto}
              </h1>
              <Badge variant={gasto.esExtraordinario ? "warning" : "default"}>
                {gasto.esExtraordinario ? "Extraordinario" : "Ordinario"}
              </Badge>
            </div>
            <p className="text-neutral-600">{formatDate(gasto.fechaGasto)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {!isLocked && !isEditing && (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Editar
              </Button>
              <Button variant="danger" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>
            </>
          )}
          {isEditing && (
            <>
              <Button variant="secondary" onClick={() => { setIsEditing(false); reset(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={updateGasto.isPending}>
                {updateGasto.isPending ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Aviso de bloqueo */}
      {isLocked && (
        <AlertBanner title="Gasto bloqueado" variant="info">
          Este gasto pertenece a una expensa {gasto.expensa?.estado.toLowerCase()} y no puede modificarse.
        </AlertBanner>
      )}

      {/* Contenido */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos del gasto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Datos del Gasto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Concepto *
                  </label>
                  <Input
                    {...register("concepto")}
                    error={errors.concepto?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Descripción
                  </label>
                  <Textarea {...register("descripcion")} rows={3} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Monto *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      {...register("monto", { valueAsNumber: true })}
                      error={errors.monto?.message}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Fecha *
                    </label>
                    <Input
                      type="date"
                      {...register("fechaGasto")}
                      error={errors.fechaGasto?.message}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Categoría
                    </label>
                    <Select 
                      value={watch("categoriaId") ?? ""} 
                      onValueChange={(v) => setValue("categoriaId", v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin categoría" />
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
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-brand-50 rounded-lg">
                  <DollarSign className="h-6 w-6 text-brand-600" />
                  <div>
                    <p className="text-sm text-neutral-600">Monto</p>
                    <p className="text-2xl font-bold text-brand-700">
                      {formatCurrency(gasto.monto)}
                    </p>
                  </div>
                </div>

                {gasto.descripcion && (
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Descripción</p>
                    <p className="text-neutral-700">{gasto.descripcion}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Categoría</p>
                    <p className="text-neutral-700">{gasto.categoria?.nombre ?? "Sin categoría"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 mb-1">Prorrateable</p>
                    <p className="text-neutral-700">{gasto.esProrrateable ? "Sí" : "No"}</p>
                  </div>
                </div>

                {gasto.expensa && (
                  <div className="pt-4 border-t border-neutral-200">
                    <p className="text-sm text-neutral-500 mb-1">Asignado a expensa</p>
                    <Link 
                      href={`/expensas/${gasto.expensa.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {gasto.expensa.periodo}
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comprobante */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Comprobante
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Tipo de comprobante
                  </label>
                  <Select 
                    value={watch("tipoComprobante") ?? ""} 
                    onValueChange={(v) => setValue("tipoComprobante", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin comprobante" />
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
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Número
                    </label>
                    <Input {...register("numeroComprobante")} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      CAE AFIP
                    </label>
                    <Input {...register("caeAfip")} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Fecha del comprobante
                  </label>
                  <Input type="date" {...register("fechaComprobante")} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    URL del archivo
                  </label>
                  <Input {...register("archivoUrl")} placeholder="https://..." />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {gasto.tipoComprobante ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">Tipo</p>
                        <p className="text-neutral-700 capitalize">
                          {gasto.tipoComprobante.replace("_", " ")}
                        </p>
                      </div>
                      {gasto.numeroComprobante && (
                        <div>
                          <p className="text-sm text-neutral-500 mb-1">Número</p>
                          <p className="text-neutral-700">{gasto.numeroComprobante}</p>
                        </div>
                      )}
                    </div>

                    {gasto.caeAfip && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">CAE AFIP</p>
                        <p className="text-neutral-700 font-mono">{gasto.caeAfip}</p>
                      </div>
                    )}

                    {gasto.fechaComprobante && (
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">Fecha comprobante</p>
                        <p className="text-neutral-700">{formatDate(gasto.fechaComprobante)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-neutral-500 text-center py-4">
                    Sin información de comprobante
                  </p>
                )}

                {gasto.archivoUrl && (
                  <div className="pt-4 border-t border-neutral-200">
                    <a
                      href={gasto.archivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-700 rounded-lg hover:bg-brand-100 transition-colors"
                    >
                      <FileText className="h-4 w-4" />
                      Ver comprobante adjunto
                    </a>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de eliminación */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar gasto?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El gasto "{gasto.concepto}" será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              disabled={deleteGasto.isPending}
              variant="danger"
              onClick={handleDelete}
            >
              {deleteGasto.isPending ? (
                <>
                  <Spinner className="mr-2" size="sm" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
