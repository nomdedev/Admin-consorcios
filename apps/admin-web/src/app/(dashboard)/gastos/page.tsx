"use client";

import {
  Button,
  Input,
  Card,
  CardContent,
  Badge,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Spinner,
  AlertBanner,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@vecinosimple/ui";
import { Plus, Search, Receipt, Trash2, RefreshCw, Filter, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConsorcios } from "@/features/consorcios";
import { useGastos, useDeleteGasto, useCategoriasGasto } from "@/features/gastos";

export default function GastosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [consorcioId, setConsorcioId] = useState<string>("");
  const [categoriaId, setCategoriaId] = useState<string>("");
  const [soloExtraordinarios, setSoloExtraordinarios] = useState(false);

  // Fetch consorcios para el selector
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data ?? [];
  
  // Fetch categorías
  const { data: categorias } = useCategoriasGasto();
  
  // Fetch gastos
  const { data, isLoading, isError, refetch } = useGastos(
    consorcioId || undefined,
    {
      categoriaId: categoriaId || undefined,
      esExtraordinario: soloExtraordinarios || undefined,
      limit: 50,
    }
  );
  
  const deleteGasto = useDeleteGasto();
  const gastos = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteGasto.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // Error manejado por el hook
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Gastos</h1>
          <p className="text-neutral-600">
            Gestiona los gastos de tus consorcios ({data?.total ?? 0} total)
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
          <Button onClick={() => router.push("/gastos/nuevo")}>
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Gasto
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <AlertBanner title="Error al cargar gastos" variant="error">
          No se pudieron cargar los gastos. Verifica tu conexión y reintenta.
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
            
            <div className="flex-1">
              <p className="block text-sm font-medium text-neutral-700 mb-1">
                Categoría
              </p>
              <Select value={categoriaId} onValueChange={setCategoriaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  {categorias?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Input
                icon={<Search className="h-5 w-5 text-neutral-400" />}
                placeholder="Buscar por concepto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Button
              variant={soloExtraordinarios ? "primary" : "secondary"}
              onClick={() => setSoloExtraordinarios(!soloExtraordinarios)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Extraordinarios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de gastos */}
      {!consorcioId ? (
        <EmptyState
          description="Selecciona un consorcio para ver sus gastos"
          icon={<Receipt className="h-8 w-8" />}
          title="Selecciona un consorcio"
        />
      ) : isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div className="h-20 animate-pulse rounded-lg bg-neutral-200" key={i} />
          ))}
        </div>
      ) : gastos.length === 0 ? (
        <EmptyState
          action={{
            label: "Agregar Gasto",
            onClick: () => router.push(`/gastos/nuevo?consorcio=${consorcioId}`),
          }}
          description="No hay gastos registrados para este consorcio"
          icon={<Receipt className="h-8 w-8" />}
          title="Sin gastos"
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Concepto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Categoría
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                      Monto
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Comprobante
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gastos.map((gasto) => (
                    <tr
                      className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                      key={gasto.id}
                      onClick={() => router.push(`/gastos/${gasto.id}`)}
                    >
                      <td className="px-4 py-3 text-neutral-600">
                        {formatDate(gasto.fechaGasto)}
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{gasto.concepto}</p>
                          {gasto.descripcion && (
                            <p className="text-sm text-neutral-500 truncate max-w-xs">
                              {gasto.descripcion}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {gasto.categoria?.nombre || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(Number(gasto.monto))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={gasto.esExtraordinario ? "warning" : "default"}>
                          {gasto.esExtraordinario ? "Extra" : "Ordinario"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {gasto.archivoUrl ? (
                          <a
                            className="text-brand-600 hover:text-brand-700"
                            href={gasto.archivoUrl}
                            rel="noopener noreferrer"
                            target="_blank"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="h-5 w-5 inline" />
                          </a>
                        ) : (
                          <span className="text-neutral-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(gasto.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar gasto?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El gasto será eliminado permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
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
