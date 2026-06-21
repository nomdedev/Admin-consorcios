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
} from "@vecinosimple/ui";
import { Plus, Search, Building2, MoreVertical, Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useConsorcios, useDeleteConsorcio } from "@/features/consorcios";
import { useDebouncedValue } from "@/lib/hooks/use-debounce";

export default function ConsorciosPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Debounce la búsqueda para no hacer muchas requests
  const debouncedSearch = useDebouncedValue(search, 300);
  
  // Fetch consorcios desde la API
  const { data, isLoading, isError, refetch } = useConsorcios({
    busqueda: debouncedSearch || undefined,
    limit: 50,
  });
  
  // Mutation para eliminar
  const deleteConsorcio = useDeleteConsorcio();
  
  const consorcios = data?.data ?? [];

  const handleDelete = async () => {
    if (!deleteId) return;
    
    try {
      await deleteConsorcio.mutateAsync(deleteId);
      setDeleteId(null);
    } catch {
      // El error se maneja en el hook
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Consorcios</h1>
          <p className="text-neutral-600">
            Administra los edificios de tu cartera ({data?.total ?? 0} total)
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
          <Button onClick={() => router.push("/consorcios/nuevo")}>
            <Plus className="mr-2 h-5 w-5" />
            Nuevo Consorcio
          </Button>
        </div>
      </div>

      {/* Error state */}
      {isError && (
        <AlertBanner
          title="Error al cargar consorcios"
          variant="error"
        >
          No se pudieron cargar los consorcios. Verifica tu conexión y reintenta.
        </AlertBanner>
      )}

      {/* Búsqueda */}
      <div className="max-w-md">
        <Input
          icon={<Search className="h-5 w-5 text-neutral-400" />}
          placeholder="Buscar por nombre, dirección o localidad..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Lista de consorcios */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div className="h-48 animate-pulse rounded-lg bg-neutral-200" key={i} />
          ))}
        </div>
      ) : consorcios.length === 0 ? (
        <EmptyState
          action={
            !search
              ? {
                  label: "Agregar Consorcio",
                  onClick: () => router.push("/consorcios/nuevo"),
                }
              : undefined
          }
          description={
            search
              ? "No encontramos consorcios que coincidan con tu búsqueda"
              : "Comienza agregando tu primer consorcio"
          }
          icon={<Building2 className="h-8 w-8" />}
          title={search ? "Sin resultados" : "No hay consorcios"}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consorcios.map((consorcio) => (
            <Card
              className="cursor-pointer transition-shadow hover:shadow-md"
              key={consorcio.id}
              onClick={() => router.push(`/consorcios/${consorcio.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100">
                      <Building2 className="h-6 w-6 text-brand-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-neutral-900">
                        {consorcio.nombre}
                      </h3>
                      <p className="text-sm text-neutral-600">
                        {consorcio.direccion}
                      </p>
                    </div>
                  </div>
                  
                  {/* Menú de acciones */}
                  <div className="relative">
                    <Button
                      className="h-8 w-8 p-0"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(consorcio.id);
                      }}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-neutral-600">
                  <span>{consorcio.localidad}</span>
                  <span>•</span>
                  <span>{consorcio._count?.unidadesFuncionales ?? 0} unidades</span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Badge variant={consorcio.activo ? "success" : "default"}>
                    {consorcio.activo ? "Activo" : "Inactivo"}
                  </Badge>
                  <span className="text-sm text-neutral-500">
                    {consorcio._count?.usuariosConsorcio ?? 0} usuarios
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar consorcio?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El consorcio será desactivado
              pero sus datos históricos se conservarán.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              disabled={deleteConsorcio.isPending}
              variant="danger"
              onClick={handleDelete}
            >
              {deleteConsorcio.isPending ? (
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
