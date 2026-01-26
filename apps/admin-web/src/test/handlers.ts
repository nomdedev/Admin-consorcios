/**
 * MSW Handlers para testing de hooks
 * Mock de API endpoints
 */

import { http, HttpResponse, delay } from 'msw';

// URL base que coincide con api-client.ts
const API_URL = 'http://localhost:3001';

// =============================================================================
// MOCK DATA
// =============================================================================

const mockExpensas = [
  {
    id: 'expensa-1',
    consorcioId: 'consorcio-1',
    periodo: '2024-01',
    totalGastosOrdinarios: 100000,
    totalGastosExtraordinarios: 0,
    totalIngresos: 0,
    fondoReserva: 5000,
    fechaVencimiento: '2024-01-10T00:00:00.000Z',
    estado: 'PUBLICADA',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'expensa-2',
    consorcioId: 'consorcio-1',
    periodo: '2024-02',
    totalGastosOrdinarios: 105000,
    totalGastosExtraordinarios: 20000,
    totalIngresos: 0,
    fondoReserva: 5000,
    fechaVencimiento: '2024-02-10T00:00:00.000Z',
    estado: 'BORRADOR',
    createdAt: '2024-02-01T00:00:00.000Z',
  },
];

const mockPagos = [
  {
    id: 'pago-1',
    usuarioId: 'user-1',
    monto: 15000,
    metodoPago: 'MERCADO_PAGO',
    estado: 'APROBADO',
    concepto: 'Expensas Enero 2024',
    periodosAbonados: ['2024-01'],
    fechaPago: '2024-01-15T00:00:00.000Z',
    createdAt: '2024-01-15T00:00:00.000Z',
    usuario: {
      id: 'user-1',
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@example.com',
    },
  },
  {
    id: 'pago-2',
    usuarioId: 'user-2',
    monto: 18000,
    metodoPago: 'TRANSFERENCIA',
    estado: 'PENDIENTE',
    concepto: 'Expensas Febrero 2024',
    periodosAbonados: ['2024-02'],
    createdAt: '2024-02-05T00:00:00.000Z',
    usuario: {
      id: 'user-2',
      nombre: 'María',
      apellido: 'García',
      email: 'maria@example.com',
    },
  },
];

const mockNotificaciones = [
  {
    id: 'notif-1',
    usuarioId: 'user-1',
    titulo: 'Pago confirmado',
    mensaje: 'Tu pago de $15.000 fue confirmado',
    tipo: 'pago',
    leida: false,
    createdAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'notif-2',
    usuarioId: 'user-1',
    titulo: 'Nueva expensa disponible',
    mensaje: 'La expensa de Febrero 2024 ya está disponible',
    tipo: 'expensa',
    leida: true,
    createdAt: '2024-02-01T08:00:00.000Z',
  },
];

const mockGastos = [
  {
    id: 'gasto-1',
    consorcioId: 'consorcio-1',
    concepto: 'Luz espacios comunes',
    descripcion: 'Factura de electricidad',
    monto: 25000,
    esExtraordinario: false,
    esProrrateable: true,
    fechaGasto: '2024-01-05T00:00:00.000Z',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
  {
    id: 'gasto-2',
    consorcioId: 'consorcio-1',
    concepto: 'Reparación ascensor',
    descripcion: 'Mantenimiento preventivo',
    monto: 45000,
    esExtraordinario: true,
    esProrrateable: true,
    fechaGasto: '2024-01-10T00:00:00.000Z',
    createdAt: '2024-01-10T00:00:00.000Z',
  },
];

const mockAmenities = [
  {
    id: 'amenity-1',
    consorcioId: 'consorcio-1',
    nombre: 'SUM',
    descripcion: 'Salón de usos múltiples',
    capacidad: 50,
    requiereAprobacion: false,
    costoReserva: 5000,
    activo: true,
  },
  {
    id: 'amenity-2',
    consorcioId: 'consorcio-1',
    nombre: 'Parrilla',
    descripcion: 'Parrilla en terraza',
    capacidad: 15,
    requiereAprobacion: true,
    costoReserva: 3000,
    activo: true,
  },
];

// =============================================================================
// HANDLERS
// =============================================================================

export const handlers = [
  // =========== EXPENSAS ===========
  http.get(`${API_URL}/expensas`, async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const consorcioId = url.searchParams.get('consorcioId');
    const estado = url.searchParams.get('estado');
    
    let data = mockExpensas;
    if (consorcioId) {
      data = data.filter(e => e.consorcioId === consorcioId);
    }
    if (estado) {
      data = data.filter(e => e.estado === estado);
    }
    
    return HttpResponse.json({
      data,
      total: data.length,
      page: 1,
      limit: 10,
    });
  }),

  http.get(`${API_URL}/expensas/:id`, async ({ params }) => {
    await delay(50);
    const expensa = mockExpensas.find(e => e.id === params.id);
    if (!expensa) {
      return HttpResponse.json({ message: 'Expensa no encontrada' }, { status: 404 });
    }
    return HttpResponse.json(expensa);
  }),

  http.post(`${API_URL}/expensas`, async ({ request }) => {
    await delay(50);
    const body = await request.json() as Record<string, unknown>;
    const newExpensa = {
      id: `expensa-${Date.now()}`,
      ...body,
      totalGastosOrdinarios: 0,
      totalGastosExtraordinarios: 0,
      totalIngresos: 0,
      fondoReserva: 0,
      estado: 'BORRADOR',
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(newExpensa, { status: 201 });
  }),

  http.post(`${API_URL}/expensas/:id/liquidar`, async ({ params }) => {
    await delay(50);
    const expensa = mockExpensas.find(e => e.id === params.id);
    if (!expensa) {
      return HttpResponse.json({ message: 'Expensa no encontrada' }, { status: 404 });
    }
    return HttpResponse.json({ ...expensa, estado: 'LIQUIDADA' });
  }),

  // =========== PAGOS ===========
  http.get(`${API_URL}/pagos`, async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado');
    
    let data = mockPagos;
    if (estado) {
      data = data.filter(p => p.estado === estado);
    }
    
    return HttpResponse.json({
      data,
      total: data.length,
      page: 1,
      limit: 10,
      sumaPagina: data.reduce((sum, p) => sum + p.monto, 0),
      sumaTotal: mockPagos.reduce((sum, p) => sum + p.monto, 0),
    });
  }),

  // =========== STATS DE PAGOS ===========
  // IMPORTANTE: Este handler DEBE ir antes de /pagos/:id para que no matchee como :id
  http.get(`${API_URL}/pagos/stats`, async () => {
    await delay(50);
    return HttpResponse.json({
      totalRecaudado: 500000,
      totalPendiente: 150000,
      cantidadAprobados: 25,
      cantidadPendientes: 8,
      cantidadRechazados: 2,
      recaudadoMesActual: 180000,
      recaudadoMesAnterior: 165000,
    });
  }),

  // IMPORTANTE: Este handler DEBE ir antes de /pagos/:id para que no matchee como :id
  http.get(`${API_URL}/pagos/cuenta-corriente/:unidadId`, async () => {
    await delay(50);
    return HttpResponse.json({
      unidadFuncionalId: 'uf-1',
      codigoUnidad: '1A',
      saldoActual: -15000,
      expensasPendientes: [
        {
          periodo: '2024-02',
          montoOriginal: 15000,
          intereses: 0,
          totalAPagar: 15000,
        },
      ],
      totalAdeudado: 15000,
      ultimosMovimientos: [],
    });
  }),

  http.get(`${API_URL}/pagos/:id`, async ({ params }) => {
    await delay(50);
    const pago = mockPagos.find(p => p.id === params.id);
    if (!pago) {
      return HttpResponse.json({ message: 'Pago no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(pago);
  }),

  http.post(`${API_URL}/pagos/iniciar`, async ({ request }) => {
    await delay(50);
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      pagoId: `pago-${Date.now()}`,
      estado: 'PENDIENTE',
      monto: 15000,
      urlPago: 'https://mercadopago.com/checkout/test',
      preferenceId: 'pref-123',
    });
  }),

  // POST /pagos/manual - Para useRegistrarPagoManual
  http.post(`${API_URL}/pagos/manual`, async ({ request }) => {
    await delay(50);
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: `pago-${Date.now()}`,
      ...body,
      estado: 'APROBADO',
      createdAt: new Date().toISOString(),
    });
  }),

  // =========== NOTIFICACIONES ===========
  http.get(`${API_URL}/notificaciones`, async () => {
    await delay(50);
    return HttpResponse.json({
      data: mockNotificaciones,
      total: mockNotificaciones.length,
      page: 1,
      limit: 20,
    });
  }),

  http.get(`${API_URL}/notificaciones/contador`, async () => {
    await delay(50);
    const noLeidas = mockNotificaciones.filter(n => !n.leida).length;
    return HttpResponse.json({
      total: mockNotificaciones.length,
      noLeidas,
    });
  }),

  http.patch(`${API_URL}/notificaciones/:id/leer`, async ({ params }) => {
    await delay(50);
    const notif = mockNotificaciones.find(n => n.id === params.id);
    if (!notif) {
      return HttpResponse.json({ message: 'Notificación no encontrada' }, { status: 404 });
    }
    return HttpResponse.json({ ...notif, leida: true });
  }),

  http.patch(`${API_URL}/notificaciones/leer-todas`, async () => {
    await delay(50);
    return HttpResponse.json({ leidas: mockNotificaciones.length });
  }),

  // =========== GASTOS ===========
  http.get(`${API_URL}/gastos`, async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const consorcioId = url.searchParams.get('consorcioId');
    
    let data = mockGastos;
    if (consorcioId) {
      data = data.filter(g => g.consorcioId === consorcioId);
    }
    
    return HttpResponse.json({
      data,
      total: data.length,
      page: 1,
      limit: 10,
    });
  }),

  http.post(`${API_URL}/gastos`, async ({ request }) => {
    await delay(50);
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: `gasto-${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // =========== AMENITIES ===========
  http.get(`${API_URL}/amenities`, async ({ request }) => {
    await delay(50);
    const url = new URL(request.url);
    const consorcioId = url.searchParams.get('consorcioId');
    
    let data = mockAmenities;
    if (consorcioId) {
      data = data.filter(a => a.consorcioId === consorcioId);
    }
    
    return HttpResponse.json({
      data,
      total: data.length,
    });
  }),

  // GET /amenities/disponibilidad?amenityId=X&fecha=Y - Para useDisponibilidad
  // IMPORTANTE: Este handler DEBE ir antes de /amenities/:id para que no matchee como :id
  http.get(`${API_URL}/amenities/disponibilidad`, async () => {
    await delay(50);
    return HttpResponse.json({
      horariosDisponibles: [
        { inicio: '10:00', fin: '14:00' },
        { inicio: '18:00', fin: '22:00' },
      ],
    });
  }),

  http.get(`${API_URL}/amenities/:id/disponibilidad`, async () => {
    await delay(50);
    return HttpResponse.json({
      horariosDisponibles: [
        { inicio: '10:00', fin: '14:00' },
        { inicio: '18:00', fin: '22:00' },
      ],
    });
  }),

  http.get(`${API_URL}/amenities/:id`, async ({ params }) => {
    await delay(50);
    const amenity = mockAmenities.find(a => a.id === params.id);
    if (!amenity) {
      return HttpResponse.json({ message: 'Amenity no encontrado' }, { status: 404 });
    }
    return HttpResponse.json(amenity);
  }),

  http.post(`${API_URL}/amenities/:id/reservar`, async ({ request }) => {
    await delay(50);
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: `reserva-${Date.now()}`,
      ...body,
      aprobada: true,
      createdAt: new Date().toISOString(),
    }, { status: 201 });
  }),

  // POST /amenities/reservas - Para useCreateReserva
  http.post(`${API_URL}/amenities/reservas`, async ({ request }) => {
    await delay(50);
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      id: `reserva-${Date.now()}`,
      amenityId: body.amenityId || 'amenity-1',
      usuarioId: 'user-1',
      fechaInicio: body.fechaInicio || new Date().toISOString(),
      fechaFin: body.fechaFin || new Date().toISOString(),
      motivo: body.motivo,
      aprobada: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { status: 201 });
  }),
];

// Handlers que fallan (para tests de error handling)
export const errorHandlers = [
  http.get(`${API_URL}/expensas`, async () => {
    await delay(50);
    return HttpResponse.json(
      { message: 'Error interno del servidor' },
      { status: 500 }
    );
  }),

  http.post(`${API_URL}/pagos/iniciar`, async () => {
    await delay(50);
    return HttpResponse.json(
      { message: 'Fondos insuficientes' },
      { status: 400 }
    );
  }),
];
