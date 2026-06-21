"use client";

import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  StatCard,
  MorosoIndicator,
  AlertBanner,
  EmptyState,
  Spinner,
} from "@vecinosimple/ui";
import { ArrowLeft, Building2, Users, Plus, Edit, AlertTriangle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

import { useConsorcio, useUnidadesFuncionales, useConsorcioStats } from "@/features/consorcios";
import { formatCurrency } from "@/lib/utils";

export default function ConsorcioDetallePage() {
  const router = useRouter();
  const params = useParams();
  const consorcioId = params.id as string;

  // Fetch data
  const { data: consorcio, isLoading: loadingConsorcio, isError } = useConsorcio(consorcioId);
  const { data: unidadesData, isLoading: loadingUnidades } = useUnidadesFuncionales(consorcioId);
  const { data: stats, isLoading: loadingStats } = useConsorcioStats(consorcioId);

  const unidades = unidadesData?.data ?? [];
  const isLoading = loadingConsorcio || loadingUnidades || loadingStats;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state
  if (isError || !consorcio) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        <AlertBanner title="Error" variant="error">
          No se pudo cargar el consorcio. Puede que no exista o no tengas permisos.
        </AlertBanner>
      </div>
    );
  }

  // Stats calculadas desde el endpoint
  const estadisticas = {
    totalUnidades: stats?.totalUnidades ?? unidades.length,
    unidadesConDeuda: stats?.unidadesConDeuda ?? 0,
    totalRecaudadoMes: stats?.totalRecaudadoMes ?? 0,
    totalGastosMes: stats?.totalGastosMes ?? 0,
  };

  const porcentajeMorosidad = stats?.porcentajeMorosidad ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button
            aria-label="Volver"
            size="sm"
            variant="ghost"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-neutral-900">
                {consorcio.nombre}
              </h1>
              <Badge variant={consorcio.activo ? "success" : "default"}>
                {consorcio.activo ? "Activo" : "Inactivo"}
              </Badge>
            </div>
            <p className="text-neutral-600">
              {consorcio.direccion}, {consorcio.localidad}
            </p>
          </div>
        </div>
        <Button onClick={() => router.push(`/consorcios/${consorcioId}/editar`)}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {/* Alerta de morosidad */}
      {porcentajeMorosidad > 10 && (
        <AlertBanner title="Morosidad elevada" variant="warning">
          El {porcentajeMorosidad}% de las unidades tiene deudas pendientes.
        </AlertBanner>
      )}

      {/* Estadísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          description="Total"
          icon={<Building2 className="h-6 w-6" />}
          title="Unidades"
          value={estadisticas.totalUnidades}
        />
        <StatCard
          description={`${porcentajeMorosidad}% morosidad`}
          icon={<AlertTriangle className="h-6 w-6" />}
          title="Con deuda"
          value={estadisticas.unidadesConDeuda}
        />
        <StatCard
          description="Este mes"
          title="Recaudado"
          value={formatCurrency(estadisticas.totalRecaudadoMes)}
        />
        <StatCard
          description="Este mes"
          title="Gastos"
          value={formatCurrency(estadisticas.totalGastosMes)}
        />
      </div>

      {/* Datos del consorcio */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-neutral-600">CUIT</dt>
                <dd className="font-medium">{consorcio.cuit || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Código Postal</dt>
                <dd className="font-medium">{consorcio.codigoPostal || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Vencimiento expensas</dt>
                <dd className="font-medium">Día {consorcio.diaVencimiento}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Interés por mora</dt>
                <dd className="font-medium">{consorcio.tasaInteresMora}% mensual</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Período de gracia</dt>
                <dd className="font-medium">{consorcio.periodoGracia} días</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button
              className="justify-start"
              variant="secondary"
              onClick={() => router.push(`/consorcios/${consorcioId}/unidades/nueva`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Unidad
            </Button>
            <Button
              className="justify-start"
              variant="secondary"
              onClick={() => router.push(`/expensas/nueva?consorcio=${consorcioId}`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Expensa
            </Button>
            <Button
              className="justify-start"
              variant="secondary"
              onClick={() => router.push(`/comunicados/nuevo?consorcio=${consorcioId}`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Comunicado
            </Button>
            <Button
              className="justify-start"
              variant="secondary"
              onClick={() => router.push(`/consorcios/${consorcioId}/propietarios`)}
            >
              <Users className="mr-2 h-4 w-4" />
              Ver Propietarios
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Unidades funcionales */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Unidades Funcionales</CardTitle>
          <Button
            size="sm"
            onClick={() => router.push(`/consorcios/${consorcioId}/unidades/nueva`)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </CardHeader>
        <CardContent>
          {unidades.length === 0 ? (
            <EmptyState
              action={{
                label: "Agregar unidad",
                onClick: () => router.push(`/consorcios/${consorcioId}/unidades/nueva`),
              }}
              description="Agrega las unidades funcionales del consorcio"
              icon={<Building2 className="h-8 w-8" />}
              title="Sin unidades"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Código
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Piso
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Coef.
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Propietario
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-neutral-600">
                      Saldo
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {unidades.map((unidad) => {
                    const saldo = unidad.saldo ?? 0;
                    const diasMora = saldo < 0 ? Math.floor(Math.abs(saldo) / 1000) : 0; // Cálculo aproximado
                    const propietario = unidad.propietario;
                    return (
                      <tr
                        className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                        key={unidad.id}
                        onClick={() =>
                          router.push(`/consorcios/${consorcioId}/unidades/${unidad.id}`)
                        }
                      >
                        <td className="px-4 py-3 font-medium">{unidad.codigo}</td>
                        <td className="px-4 py-3 text-neutral-600">{unidad.piso || "-"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="default">
                            {(() => {
                              switch (unidad.tipo) {
                                case "DEPARTAMENTO": return "Depto";
                                case "COCHERA": return "Cochera";
                                case "BAULERA": return "Baulera";
                                default: return unidad.tipo;
                              }
                            })()}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">{Number(unidad.coeficiente).toFixed(2)}%</td>
                        <td className="px-4 py-3 text-neutral-600">
                          {propietario ? `${propietario.nombre} ${propietario.apellido}` : '-'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              saldo < 0
                                ? "text-status-grave font-medium"
                                : "text-neutral-600"
                            }
                          >
                            {formatCurrency(saldo)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <MorosoIndicator
                            diasMora={diasMora}
                            showLabel={false}
                            size="sm"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
