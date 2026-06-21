import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api-client';

// =============================================================================
// TYPES
// =============================================================================

export type MetodoPago =
  | 'MERCADO_PAGO'
  | 'TRANSFERENCIA'
  | 'EFECTIVO'
  | 'DEBITO_AUTOMATICO'
  | 'SIRO';

export type EstadoPago =
  | 'PENDIENTE'
  | 'PROCESANDO'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'REEMBOLSADO';

export interface Pago {
  id: string;
  usuarioId: string;
  monto: number;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  mercadoPagoId?: string;
  transferenciaRef?: string;
  concepto: string;
  periodosAbonados: string[];
  comprobanteUrl?: string;
  fechaPago?: string;
  createdAt: string;
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };
  unidadFuncional?: {
    id: string;
    codigo: string;
    consorcio?: {
      id: string;
      nombre: string;
    };
  };
}

export interface PagoListResponse {
  data: Pago[];
  total: number;
  page: number;
  limit: number;
  sumaPagina: number;
  sumaTotal: number;
}

export interface FilterPagosDto {
  consorcioId?: string;
  usuarioId?: string;
  unidadFuncionalId?: string;
  estado?: EstadoPago;
  metodoPago?: MetodoPago;
  periodo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  montoMin?: number;
  montoMax?: number;
  page?: number;
  limit?: number;
}

export interface IniciarPagoDto {
  unidadFuncionalId: string;
  periodosAbonados: string[];
  metodoPago: MetodoPago;
  montoPersonalizado?: number;
  comentario?: string;
}

export interface RegistrarPagoManualDto {
  unidadFuncionalId: string;
  monto: number;
  metodoPago: 'EFECTIVO' | 'TRANSFERENCIA';
  periodosAbonados: string[];
  transferenciaRef?: string;
  fechaPago: string;
  concepto?: string;
}

export interface IniciarPagoResponse {
  pagoId: string;
  estado: EstadoPago;
  monto: number;
  urlPago?: string;
  preferenceId?: string;
  datosTransferencia?: {
    cbu: string;
    alias: string;
    titular: string;
    banco: string;
    concepto: string;
  };
}

export interface CuentaCorrienteResponse {
  unidadFuncionalId: string;
  codigoUnidad: string;
  saldoActual: number;
  expensasPendientes: Array<{
    periodo: string;
    montoOriginal: number;
    intereses: number;
    totalAPagar: number;
  }>;
  totalAdeudado: number;
  ultimosMovimientos: Array<{
    id: string;
    fecha: string;
    concepto: string;
    monto: number;
    saldoResultante: number;
  }>;
}

export interface ActualizarEstadoPagoDto {
  estado: EstadoPago;
  motivo: string;
}

export interface ReembolsarPagoDto {
  motivo: string;
  montoReembolso?: number;
}

// =============================================================================
// QUERY KEYS
// =============================================================================

export const pagosKeys = {
  all: ['pagos'] as const,
  lists: () => [...pagosKeys.all, 'list'] as const,
  list: (filters: FilterPagosDto) => [...pagosKeys.lists(), filters] as const,
  details: () => [...pagosKeys.all, 'detail'] as const,
  detail: (id: string) => [...pagosKeys.details(), id] as const,
  cuentaCorriente: (unidadFuncionalId: string) =>
    [...pagosKeys.all, 'cuenta-corriente', unidadFuncionalId] as const,
  stats: (consorcioId?: string) =>
    [...pagosKeys.all, 'stats', consorcioId] as const,
};

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Listar pagos con filtros y paginación
 */
export function usePagos(filters: FilterPagosDto = {}) {
  return useQuery({
    queryKey: pagosKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
      const response = await apiClient.get<PagoListResponse>(
        `/pagos?${params.toString()}`
      );
      return response;
    },
  });
}

/**
 * Obtener detalle de un pago
 */
export function usePago(id: string) {
  return useQuery({
    queryKey: pagosKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<Pago>(`/pagos/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Obtener cuenta corriente de una unidad funcional
 */
export function useCuentaCorriente(unidadFuncionalId: string) {
  return useQuery({
    queryKey: pagosKeys.cuentaCorriente(unidadFuncionalId),
    queryFn: async () => {
      const response = await apiClient.get<CuentaCorrienteResponse>(
        `/pagos/cuenta-corriente/${unidadFuncionalId}`
      );
      return response;
    },
    enabled: !!unidadFuncionalId,
  });
}

/**
 * Estadísticas de pagos
 */
export function usePagosStats(consorcioId?: string) {
  return useQuery({
    queryKey: pagosKeys.stats(consorcioId),
    queryFn: async () => {
      const params = consorcioId ? `?consorcioId=${consorcioId}` : '';
      const response = await apiClient.get<{
        totalRecaudado: number;
        totalPendiente: number;
        cantidadAprobados: number;
        cantidadPendientes: number;
        cantidadRechazados: number;
        recaudadoMesActual: number;
        recaudadoMesAnterior: number;
      }>(`/pagos/stats${params}`);
      return response;
    },
  });
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Iniciar un pago (genera link de pago o datos para transferencia)
 */
export function useIniciarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: IniciarPagoDto) => {
      const response = await apiClient.post<IniciarPagoResponse>(
        '/pagos/iniciar',
        data
      );
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pagosKeys.lists() });
    },
  });
}

/**
 * Registrar pago manual (efectivo/transferencia)
 */
export function useRegistrarPagoManual() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegistrarPagoManualDto) => {
      const response = await apiClient.post<Pago>('/pagos/manual', data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pagosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: pagosKeys.cuentaCorriente(variables.unidadFuncionalId),
      });
    },
  });
}

/**
 * Actualizar estado de un pago (solo admin)
 */
export function useActualizarEstadoPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ActualizarEstadoPagoDto;
    }) => {
      const response = await apiClient.patch<Pago>(`/pagos/${id}/estado`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pagosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: pagosKeys.lists() });
    },
  });
}

/**
 * Reembolsar un pago
 */
export function useReembolsarPago() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ReembolsarPagoDto }) => {
      const response = await apiClient.post<Pago>(`/pagos/${id}/reembolsar`, data);
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: pagosKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: pagosKeys.lists() });
    },
  });
}

/**
 * Generar comprobante de pago
 */
export function useGenerarComprobante() {
  return useMutation({
    mutationFn: async (pagoId: string) => {
      const response = await apiClient.post<{ url: string }>(
        `/pagos/${pagoId}/comprobante`
      );
      return response;
    },
  });
}
