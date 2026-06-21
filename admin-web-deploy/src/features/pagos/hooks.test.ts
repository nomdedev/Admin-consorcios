/**
 * Tests para hooks de Pagos
 */

import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/test-utils';
import {
  usePagos,
  usePago,
  useCuentaCorriente,
  usePagosStats,
  useIniciarPago,
  useRegistrarPagoManual,
  pagosKeys,
} from './hooks';

describe('Pagos Hooks', () => {
  describe('usePagos', () => {
    it('debe cargar la lista de pagos', async () => {
      const { result } = renderHook(() => usePagos(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.data).toBeInstanceOf(Array);
      expect(result.current.data?.data.length).toBeGreaterThan(0);
    });

    it('debe filtrar pagos por estado', async () => {
      const { result } = renderHook(
        () => usePagos({ estado: 'APROBADO' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data.every(p => p.estado === 'APROBADO')).toBe(true);
    });

    it('debe incluir sumas en la respuesta', async () => {
      const { result } = renderHook(() => usePagos(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('sumaPagina');
      expect(result.current.data).toHaveProperty('sumaTotal');
      expect(typeof result.current.data?.sumaPagina).toBe('number');
    });
  });

  describe('usePago', () => {
    it('debe cargar detalle de un pago', async () => {
      const { result } = renderHook(() => usePago('pago-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe('pago-1');
      expect(result.current.data?.monto).toBeDefined();
    });

    it('no debe hacer fetch si id está vacío', () => {
      const { result } = renderHook(() => usePago(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('debe incluir datos del usuario', async () => {
      const { result } = renderHook(() => usePago('pago-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.usuario).toBeDefined();
      expect(result.current.data?.usuario?.nombre).toBeDefined();
    });
  });

  describe('useCuentaCorriente', () => {
    it('debe cargar cuenta corriente de una unidad', async () => {
      const { result } = renderHook(() => useCuentaCorriente('uf-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.saldoActual).toBeDefined();
      expect(result.current.data?.expensasPendientes).toBeInstanceOf(Array);
    });

    it('debe incluir total adeudado', async () => {
      const { result } = renderHook(() => useCuentaCorriente('uf-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(typeof result.current.data?.totalAdeudado).toBe('number');
    });
  });

  describe('usePagosStats', () => {
    it('debe cargar estadísticas de pagos', async () => {
      const { result } = renderHook(() => usePagosStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.totalRecaudado).toBeDefined();
      expect(result.current.data?.cantidadAprobados).toBeDefined();
    });

    it('debe incluir comparación mensual', async () => {
      const { result } = renderHook(() => usePagosStats(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('recaudadoMesActual');
      expect(result.current.data).toHaveProperty('recaudadoMesAnterior');
    });
  });

  describe('useIniciarPago', () => {
    it('debe iniciar un pago exitosamente', async () => {
      const { result } = renderHook(() => useIniciarPago(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        unidadFuncionalId: 'uf-1',
        periodosAbonados: ['2024-02'],
        metodoPago: 'MERCADO_PAGO',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.pagoId).toBeDefined();
      expect(result.current.data?.urlPago).toBeDefined();
    });

    it('debe retornar estado PENDIENTE', async () => {
      const { result } = renderHook(() => useIniciarPago(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        unidadFuncionalId: 'uf-1',
        periodosAbonados: ['2024-02'],
        metodoPago: 'MERCADO_PAGO',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.estado).toBe('PENDIENTE');
    });
  });

  describe('useRegistrarPagoManual', () => {
    it('debe registrar pago manual exitosamente', async () => {
      const { result } = renderHook(() => useRegistrarPagoManual(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        unidadFuncionalId: 'uf-1',
        monto: 15000,
        metodoPago: 'EFECTIVO',
        periodosAbonados: ['2024-02'],
        fechaPago: '2024-02-15',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.estado).toBe('APROBADO');
    });
  });

  describe('pagosKeys', () => {
    it('debe generar keys correctas para la lista', () => {
      const key = pagosKeys.list({ estado: 'APROBADO' });
      expect(key).toContain('pagos');
      expect(key).toContain('list');
    });

    it('debe generar keys correctas para detalle', () => {
      const key = pagosKeys.detail('pago-1');
      expect(key).toContain('pago-1');
    });

    it('debe generar keys correctas para cuenta corriente', () => {
      const key = pagosKeys.cuentaCorriente('uf-1');
      expect(key).toContain('cuenta-corriente');
      expect(key).toContain('uf-1');
    });
  });
});
