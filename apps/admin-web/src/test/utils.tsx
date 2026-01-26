// Test utilities for React Query and rendering
import React, { ReactElement } from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Crear un QueryClient para tests (sin retries, sin cache)
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Wrapper con todos los providers necesarios
interface TestProvidersProps {
  children: React.ReactNode
  queryClient?: QueryClient
}

function TestProviders({ children, queryClient }: TestProvidersProps) {
  const client = queryClient ?? createTestQueryClient()
  
  return (
    <QueryClientProvider client={client}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render que incluye providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
}

function customRender(
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult {
  const { queryClient, ...renderOptions } = options ?? {}
  
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders queryClient={queryClient}>
        {children}
      </TestProviders>
    ),
    ...renderOptions,
  })
}

// Re-exportar todo de testing-library
export * from '@testing-library/react'
export { userEvent } from '@testing-library/user-event'

// Exportar el render customizado como default
export { customRender as render, createTestQueryClient }

// Helper para esperar a que TanStack Query termine
export async function waitForQueryToSettle() {
  // Pequeña espera para que los microtasks se completen
  await new Promise((resolve) => setTimeout(resolve, 0))
}

// Helper para crear datos mock de usuario
export function createMockUser(overrides = {}) {
  return {
    id: 'test-user-id',
    email: 'test@test.com',
    nombre: 'Test',
    apellido: 'User',
    estado: 'ACTIVO',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// Helper para crear datos mock de consorcio
export function createMockConsorcio(overrides = {}) {
  return {
    id: 'test-consorcio-id',
    nombre: 'Edificio Test',
    direccion: 'Calle Falsa 123',
    localidad: 'CABA',
    provincia: 'Buenos Aires',
    activo: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// Helper para crear datos mock de expensa
export function createMockExpensa(overrides = {}) {
  return {
    id: 'test-expensa-id',
    consorcioId: 'test-consorcio-id',
    periodo: '2026-01',
    totalGastosOrdinarios: 100000,
    totalGastosExtraordinarios: 0,
    estado: 'BORRADOR',
    fechaVencimiento: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// Helper para crear datos mock de pago
export function createMockPago(overrides = {}) {
  return {
    id: 'test-pago-id',
    usuarioId: 'test-user-id',
    monto: 5000,
    metodoPago: 'MERCADO_PAGO',
    estado: 'PENDIENTE',
    concepto: 'Expensa Enero 2026',
    periodosAbonados: ['2026-01'],
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// Helper para crear datos mock de ticket
export function createMockTicket(overrides = {}) {
  return {
    id: 'test-ticket-id',
    consorcioId: 'test-consorcio-id',
    creadorId: 'test-user-id',
    titulo: 'Test Ticket',
    descripcion: 'Descripción del ticket',
    estado: 'ABIERTO',
    prioridad: 'MEDIA',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// Helper para crear datos mock de UF
export function createMockUnidadFuncional(overrides = {}) {
  return {
    id: 'test-uf-id',
    consorcioId: 'test-consorcio-id',
    codigo: '1A',
    piso: '1',
    numero: 'A',
    tipo: 'DEPARTAMENTO',
    coeficiente: 5.5,
    activo: true,
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}
