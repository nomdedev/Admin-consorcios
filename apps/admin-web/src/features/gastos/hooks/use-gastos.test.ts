/**
 * Tests para hooks de Gastos
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { createWrapper } from '@/test/test-utils';

import {
  useGastos,
  useGasto,
  useCreateGasto,
  gastosKeys,
} from './use-gastos';

describe('Gastos Hooks', () => {
  describe('useGastos', () => {
    it('debe cargar lista de gastos de un consorcio', async () => {
      const { result } = renderHook(
        () => useGastos('consorcio-1'),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.data).toBeInstanceOf(Array);
    });

    it('no debe hacer fetch si consorcioId es undefined', () => {
      const { result } = renderHook(
        () => useGastos(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('debe incluir metadatos de paginación', async () => {
      const { result } = renderHook(
        () => useGastos('consorcio-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('total');
      expect(result.current.data).toHaveProperty('page');
    });

    it('debe filtrar por fechas', async () => {
      const { result } = renderHook(
        () => useGastos('consorcio-1', { fechaDesde: '2024-01-01' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toBeDefined();
    });
  });

  describe('useGasto', () => {
    it('no debe hacer fetch si id es undefined', () => {
      const { result } = renderHook(
        () => useGasto(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreateGasto', () => {
    it('debe crear un gasto exitosamente', async () => {
      const { result } = renderHook(
        () => useCreateGasto(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        consorcioId: 'consorcio-1',
        concepto: 'Agua',
        monto: 15000,
        fechaGasto: '2024-02-01',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBeDefined();
    });

    it('debe estar en estado idle inicialmente', () => {
      const { result } = renderHook(
        () => useCreateGasto(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('gastosKeys', () => {
    it('debe generar keys correctas para la lista', () => {
      const key = gastosKeys.list('consorcio-1');
      expect(key).toContain('gastos');
      expect(key).toContain('list');
      expect(key).toContain('consorcio-1');
    });

    it('debe generar keys correctas para detalle', () => {
      const key = gastosKeys.detail('gasto-1');
      expect(key).toContain('detail');
      expect(key).toContain('gasto-1');
    });

    it('debe generar keys correctas para categorías', () => {
      const key = gastosKeys.categorias;
      expect(key).toContain('categorias-gasto');
    });
  });
});
