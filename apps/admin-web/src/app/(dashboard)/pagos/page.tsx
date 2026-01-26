'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Spinner,
} from 'ui';
import {
  usePagos,
  usePagosStats,
  type FilterPagosDto,
  type MetodoPago,
  type EstadoPago,
  type Pago,
} from '@/features/pagos';
import { useConsorcios } from '@/features/consorcios';
import { formatCurrency, formatDate, formatPeriodo } from '@/lib/utils';

// Helpers para badges - variantes del Badge de ./ui: default, success, warning, error, info
const estadoBadge: Record<
  EstadoPago,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }
> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  PROCESANDO: { label: 'Procesando', variant: 'info' },
  APROBADO: { label: 'Aprobado', variant: 'success' },
  RECHAZADO: { label: 'Rechazado', variant: 'error' },
  REEMBOLSADO: { label: 'Reembolsado', variant: 'info' },
};

const metodoPagoLabels: Record<MetodoPago, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  TRANSFERENCIA: 'Transferencia',
  EFECTIVO: 'Efectivo',
  DEBITO_AUTOMATICO: 'Débito Automático',
  SIRO: 'SIRO',
};

// Componente de fila de pago
function PagoRow({ pago }: { pago: Pago }) {
  const estadoInfo = estadoBadge[pago.estado];

  return (
    <tr className="border-b hover:bg-muted/50 transition-colors">
      <td className="p-4">
        <div className="font-medium">
          {pago.usuario?.nombre} {pago.usuario?.apellido}
        </div>
        <div className="text-sm text-muted-foreground">{pago.usuario?.email}</div>
      </td>
      <td className="p-4">
        {pago.unidadFuncional && (
          <div>
            <span className="font-medium">{pago.unidadFuncional.codigo}</span>
            {pago.unidadFuncional.consorcio && (
              <div className="text-sm text-muted-foreground">
                {pago.unidadFuncional.consorcio.nombre}
              </div>
            )}
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex flex-wrap gap-1">
          {pago.periodosAbonados.slice(0, 3).map((p) => (
            <Badge key={p} variant="default" className="text-xs">
              {formatPeriodo(p)}
            </Badge>
          ))}
          {pago.periodosAbonados.length > 3 && (
            <Badge variant="default" className="text-xs">
              +{pago.periodosAbonados.length - 3}
            </Badge>
          )}
        </div>
      </td>
      <td className="p-4">
        <span className="font-mono font-medium">{formatCurrency(pago.monto)}</span>
      </td>
      <td className="p-4">
        <span className="text-sm">{metodoPagoLabels[pago.metodoPago]}</span>
      </td>
      <td className="p-4">
        <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {pago.fechaPago ? formatDate(pago.fechaPago) : formatDate(pago.createdAt)}
      </td>
      <td className="p-4">
        <Link href={`/pagos/${pago.id}`}>
          <Button variant="ghost" size="sm">
            Ver
          </Button>
        </Link>
      </td>
    </tr>
  );
}

export default function PagosPage() {
  // Filtros
  const [consorcioFilter, setConsorcioFilter] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('');
  const [metodoFilter, setMetodoFilter] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [page, setPage] = useState(1);

  // Construir filtros
  const filters: FilterPagosDto = useMemo(
    () => ({
      consorcioId: consorcioFilter || undefined,
      estado: (estadoFilter as EstadoPago) || undefined,
      metodoPago: (metodoFilter as MetodoPago) || undefined,
      periodo: periodoFilter || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
      page,
      limit: 20,
    }),
    [consorcioFilter, estadoFilter, metodoFilter, periodoFilter, fechaDesde, fechaHasta, page]
  );

  // Queries
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data || [];
  const { data: pagosData, isLoading, error } = usePagos(filters);
  const { data: stats, isLoading: loadingStats } = usePagosStats(consorcioFilter || undefined);

  const pagos = pagosData?.data || [];
  const total = pagosData?.total || 0;
  const sumaPagina = pagosData?.sumaPagina || 0;
  const sumaTotal = pagosData?.sumaTotal || 0;
  const totalPages = Math.ceil(total / 20);

  // Generar opciones de periodos (últimos 12 meses)
  const periodosOptions = useMemo(() => {
    const options: string[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      options.push(periodo);
    }
    return options;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagos</h1>
          <p className="text-muted-foreground">
            Historial y gestión de pagos de expensas
          </p>
        </div>
        <Link href="/pagos/nuevo">
          <Button>Registrar Pago Manual</Button>
        </Link>
      </div>

      {/* Stats */}
      {loadingStats ? (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Spinner size="sm" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recaudado este mes</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                {formatCurrency(stats.recaudadoMesActual)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Mes anterior: {formatCurrency(stats.recaudadoMesAnterior)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total recaudado</CardDescription>
              <CardTitle className="text-2xl">
                {formatCurrency(stats.totalRecaudado)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.cantidadAprobados} pagos aprobados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pendiente de cobro</CardDescription>
              <CardTitle className="text-2xl text-yellow-600">
                {formatCurrency(stats.totalPendiente)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {stats.cantidadPendientes} pagos pendientes
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Rechazados</CardDescription>
              <CardTitle className="text-2xl text-red-600">
                {stats.cantidadRechazados}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">pagos rechazados</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Consorcio */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Consorcio</label>
              <select
                value={consorcioFilter}
                onChange={(e) => {
                  setConsorcioFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Todos</option>
                {consorcios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Estado</label>
              <select
                value={estadoFilter}
                onChange={(e) => {
                  setEstadoFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Todos</option>
                {Object.entries(estadoBadge).map(([value, { label }]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Método de pago */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Método</label>
              <select
                value={metodoFilter}
                onChange={(e) => {
                  setMetodoFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Todos</option>
                {Object.entries(metodoPagoLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Período */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Período</label>
              <select
                value={periodoFilter}
                onChange={(e) => {
                  setPeriodoFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Todos</option>
                {periodosOptions.map((p) => (
                  <option key={p} value={p}>
                    {formatPeriodo(p)}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha desde */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Desde</label>
              <Input
                type="date"
                value={fechaDesde}
                onChange={(e) => {
                  setFechaDesde(e.target.value);
                  setPage(1);
                }}
              />
            </div>

            {/* Fecha hasta */}
            <div className="space-y-1">
              <label className="text-sm font-medium">Hasta</label>
              <Input
                type="date"
                value={fechaHasta}
                onChange={(e) => {
                  setFechaHasta(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Botón limpiar */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setConsorcioFilter('');
                setEstadoFilter('');
                setMetodoFilter('');
                setPeriodoFilter('');
                setFechaDesde('');
                setFechaHasta('');
                setPage(1);
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de pagos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lista de Pagos</CardTitle>
            <CardDescription>
              {total} pagos encontrados · Total: {formatCurrency(sumaTotal)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              Error al cargar pagos: {error.message}
            </div>
          ) : pagos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron pagos con los filtros seleccionados
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium">Usuario</th>
                      <th className="text-left p-4 font-medium">Unidad</th>
                      <th className="text-left p-4 font-medium">Períodos</th>
                      <th className="text-left p-4 font-medium">Monto</th>
                      <th className="text-left p-4 font-medium">Método</th>
                      <th className="text-left p-4 font-medium">Estado</th>
                      <th className="text-left p-4 font-medium">Fecha</th>
                      <th className="text-left p-4 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.map((pago) => (
                      <PagoRow key={pago.id} pago={pago} />
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t bg-muted/30">
                      <td colSpan={3} className="p-4 font-medium">
                        Subtotal página
                      </td>
                      <td className="p-4 font-mono font-bold">
                        {formatCurrency(sumaPagina)}
                      </td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
