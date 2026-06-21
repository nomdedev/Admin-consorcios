import { http, HttpResponse, delay } from 'msw';

const API_URL = 'http://localhost:3001';

const mockExpensas = [
  {
    id: 'expensa-enero',
    periodo: '2024-01',
    total: 16500,
    estadoPago: 'PENDIENTE',
    fechaVencimiento: '2024-01-10T00:00:00.000Z',
    fechaSegundoVencimiento: '2024-01-20T00:00:00.000Z',
    montoOrdinario: 15000,
    montoExtraordinario: 2000,
    saldoAnterior: 0,
    intereses: 0,
    bonificacion: 500,
    montoPagado: 0,
    saldoPendiente: 16500,
  },
  {
    id: 'expensa-febrero',
    periodo: '2024-02',
    total: 18000,
    estadoPago: 'PAGADO',
    fechaVencimiento: '2024-02-10T00:00:00.000Z',
    montoOrdinario: 16000,
    montoExtraordinario: 2000,
    saldoAnterior: 0,
    intereses: 0,
    bonificacion: 0,
    montoPagado: 18000,
    saldoPendiente: 0,
  },
];

const mockDetalle = {
  id: 'expensa-enero',
  periodo: '2024-01',
  fechaVencimiento: '2024-01-10T00:00:00.000Z',
  fechaSegundoVencimiento: '2024-01-20T00:00:00.000Z',
  estado: 'PUBLICADA',
  estadoPago: 'PENDIENTE',
  montoOrdinario: 15000,
  montoExtraordinario: 2000,
  saldoAnterior: 0,
  intereses: 0,
  bonificacion: 500,
  total: 16500,
  montoPagado: 0,
  saldoPendiente: 16500,
  gastosPorCategoria: [
    {
      categoria: 'Servicios',
      subtotal: 15000,
      gastos: [
        {
          id: 'gasto-1',
          concepto: 'Luz espacios comunes',
          monto: 15000,
          esExtraordinario: false,
          fechaGasto: '2024-01-05T00:00:00.000Z',
        },
      ],
    },
    {
      categoria: 'Mantenimiento',
      subtotal: 2000,
      gastos: [
        {
          id: 'gasto-2',
          concepto: 'Ascensor',
          monto: 2000,
          esExtraordinario: true,
          fechaGasto: '2024-01-08T00:00:00.000Z',
        },
      ],
    },
  ],
  totalOrdinarios: 15000,
  totalExtraordinarios: 2000,
};

export const handlers = [
  http.get(`${API_URL}/mi-portal/expensas`, async () => {
    await delay(50);
    const data = mockExpensas;
    return HttpResponse.json({
      data,
      total: data.length,
      saldoActual: 16500,
    });
  }),
  http.get(`${API_URL}/mi-portal/expensas/:periodo`, async ({ params }) => {
    await delay(50);
    if (params.periodo === '2024-01') {
      return HttpResponse.json(mockDetalle);
    }

    return HttpResponse.json({ message: 'Expensa no encontrada' }, { status: 404 });
  }),
];
