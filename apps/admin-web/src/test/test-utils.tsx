/**
 * Test utilities para hooks y componentes
 * Incluye wrapper de React Query y helpers
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import React from 'react';

import type { RenderOptions, RenderResult } from '@testing-library/react';
import type { ReactNode } from 'react';

/**
 * Crear un QueryClient para testing
 * - Sin retries para tests más rápidos
 * - Sin refetch automático
 * - GC inmediato
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperProps {
  children: ReactNode;
}

/**
 * Wrapper que incluye providers necesarios para testing
 */
export function createWrapper() {
  const queryClient = createTestQueryClient();
  
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

/**
 * Render customizado con providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): RenderResult & { queryClient: QueryClient } {
  const queryClient = createTestQueryClient();
  
  function AllProviders({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: AllProviders, ...options }),
    queryClient,
  };
}

/**
 * Helper para esperar a que las queries se resuelvan
 */
export async function waitForQuery(ms = 50) {
  await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Factory de datos de prueba
 */
export const testDataFactory = {
  consorcio: (overrides = {}) => ({
    id: 'consorcio-1',
    nombre: 'Edificio Test',
    direccion: 'Av. Test 123',
    localidad: 'Buenos Aires',
    provincia: 'Buenos Aires',
    diaVencimiento: 10,
    activo: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }),

  unidadFuncional: (overrides = {}) => ({
    id: 'uf-1',
    consorcioId: 'consorcio-1',
    codigo: '1A',
    piso: '1',
    numero: 'A',
    tipo: 'DEPARTAMENTO',
    coeficiente: 5.5,
    activo: true,
    ...overrides,
  }),

  expensa: (overrides = {}) => ({
    id: 'expensa-1',
    consorcioId: 'consorcio-1',
    periodo: '2024-01',
    totalGastosOrdinarios: 100000,
    totalGastosExtraordinarios: 0,
    totalIngresos: 0,
    fondoReserva: 5000,
    fechaVencimiento: '2024-01-10T00:00:00.000Z',
    estado: 'BORRADOR' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }),

  pago: (overrides = {}) => ({
    id: 'pago-1',
    usuarioId: 'user-1',
    monto: 15000,
    metodoPago: 'MERCADO_PAGO' as const,
    estado: 'APROBADO' as const,
    concepto: 'Expensas Enero 2024',
    periodosAbonados: ['2024-01'],
    createdAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  }),

  usuario: (overrides = {}) => ({
    id: 'user-1',
    email: 'test@example.com',
    nombre: 'Juan',
    apellido: 'Pérez',
    estado: 'ACTIVO' as const,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  }),

  notificacion: (overrides = {}) => ({
    id: 'notif-1',
    usuarioId: 'user-1',
    titulo: 'Notificación de prueba',
    mensaje: 'Contenido de la notificación',
    tipo: 'pago',
    leida: false,
    createdAt: '2024-01-15T00:00:00.000Z',
    ...overrides,
  }),

  gasto: (overrides = {}) => ({
    id: 'gasto-1',
    consorcioId: 'consorcio-1',
    concepto: 'Luz espacios comunes',
    monto: 25000,
    esExtraordinario: false,
    esProrrateable: true,
    fechaGasto: '2024-01-05T00:00:00.000Z',
    createdAt: '2024-01-05T00:00:00.000Z',
    ...overrides,
  }),

  amenity: (overrides = {}) => ({
    id: 'amenity-1',
    consorcioId: 'consorcio-1',
    nombre: 'SUM',
    descripcion: 'Salón de usos múltiples',
    capacidad: 50,
    requiereAprobacion: false,
    costoReserva: 5000,
    activo: true,
    ...overrides,
  }),

  reserva: (overrides = {}) => ({
    id: 'reserva-1',
    amenityId: 'amenity-1',
    usuarioId: 'user-1',
    fechaInicio: '2024-02-01T18:00:00.000Z',
    fechaFin: '2024-02-01T22:00:00.000Z',
    motivo: 'Cumpleaños',
    aprobada: true,
    createdAt: '2024-01-20T00:00:00.000Z',
    ...overrides,
  }),
};

/**
 * Helper para generar arrays de datos
 */
export function generateList<T>(
  factory: (overrides?: Partial<T>) => T,
  count: number,
  overridesFn?: (index: number) => Partial<T>
): T[] {
  return Array.from({ length: count }, (_, index) => 
    factory(overridesFn ? overridesFn(index) : { id: `item-${index + 1}` } as unknown as Partial<T>)
  );
}
