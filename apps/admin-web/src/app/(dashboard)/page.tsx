"use client";

import { StatCard, AlertBanner, Card, CardHeader, CardTitle, CardContent, Button } from "@vecinosimple/ui";
import { Building2, Users, CreditCard, AlertTriangle, RefreshCw } from "lucide-react";
import { useConsorcios, useDashboardStats } from "@/features/consorcios";
import Link from "next/link";

export default function DashboardPage() {
  // Fetch consorcios desde la API
  const { data, isLoading: consorciosLoading, isError, refetch } = useConsorcios({ limit: 10 });
  
  // Fetch estadísticas del dashboard
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useDashboardStats();

  const consorcios = data?.data ?? [];
  const isLoading = consorciosLoading || statsLoading;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value);

  // Estadísticas desde el endpoint real
  const estadisticas = {
    totalConsorcios: stats?.totalConsorcios ?? 0,
    totalUnidades: stats?.totalUnidades ?? 0,
    recaudacionMes: stats?.recaudacionMes ?? 0,
    morosidad: stats?.porcentajeMorosidad ?? 0,
  };

  const handleRefresh = () => {
    refetch();
    refetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-neutral-600">Resumen de tu administración</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <AlertBanner
          title="Error al cargar datos"
          variant="error"
        >
          No se pudieron cargar los datos. Verifica tu conexión y reintenta.
        </AlertBanner>
      )}

      {/* Alerta de ejemplo */}
      {estadisticas.morosidad > 10 && (
        <AlertBanner
          dismissible
          title="Morosidad elevada"
          variant="warning"
        >
          El {estadisticas.morosidad}% de las unidades tiene deudas pendientes.
          Considera enviar recordatorios de pago.
        </AlertBanner>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <div className="h-32 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-32 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-32 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-32 animate-pulse rounded-lg bg-neutral-200" />
          </>
        ) : (
          <>
            <StatCard
              description="Activos"
              icon={<Building2 className="h-6 w-6" />}
              title="Consorcios"
              value={estadisticas.totalConsorcios}
            />
            <StatCard
              description="Total administradas"
              icon={<Users className="h-6 w-6" />}
              title="Unidades"
              value={estadisticas.totalUnidades}
            />
            <StatCard
              description="Este mes"
              icon={<CreditCard className="h-6 w-6" />}
              title="Recaudación"
              value={estadisticas.recaudacionMes > 0 ? formatCurrency(estadisticas.recaudacionMes) : "—"}
            />
            <StatCard
              description="Unidades con deuda"
              icon={<AlertTriangle className="h-6 w-6" />}
              title="Morosidad"
              value={estadisticas.morosidad > 0 ? `${estadisticas.morosidad}%` : "—"}
            />
          </>
        )}
      </div>

      {/* Consorcios */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Consorcios</CardTitle>
          <Link href="/consorcios">
            <Button variant="secondary" size="sm">
              Ver todos
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-12 w-full animate-pulse rounded bg-neutral-200" />
              <div className="h-12 w-full animate-pulse rounded bg-neutral-200" />
              <div className="h-12 w-full animate-pulse rounded bg-neutral-200" />
            </div>
          ) : consorcios.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              <Building2 className="h-12 w-12 mx-auto mb-3 text-neutral-300" />
              <p>No hay consorcios registrados</p>
              <Link href="/consorcios/nuevo">
                <Button className="mt-4">Crear primer consorcio</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-neutral-600">
                      Dirección
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Unidades
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-neutral-600">
                      Localidad
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consorcios.map((consorcio) => (
                    <tr
                      className="border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer"
                      key={consorcio.id}
                      onClick={() => {
                        window.location.href = `/consorcios/${consorcio.id}`;
                      }}
                    >
                      <td className="px-4 py-3 font-medium">{consorcio.nombre}</td>
                      <td className="px-4 py-3 text-neutral-600">
                        {consorcio.direccion}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {consorcio._count?.unidadesFuncionales ?? 0}
                      </td>
                      <td className="px-4 py-3 text-center text-neutral-600">
                        {consorcio.localidad}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
