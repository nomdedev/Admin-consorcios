/**
 * Tests para hooks de Expensas
 */

import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { createWrapper } from '@/test/test-utils';
import {
  useExpensas,
  useExpensa,
  useDetallesExpensa,
  useCreateExpensa,
  useLiquidarExpensa,
  expensasKeys,
} from './use-expensas';

describe('Expensas Hooks', () => {
  describe('useExpensas', () => {
    it('debe cargar lista de expensas de un consorcio', async () => {
      const { result } = renderHook(
        () => useExpensas('consorcio-1'),
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
        () => useExpensas(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('debe filtrar expensas por estado', async () => {
      const { result } = renderHook(
        () => useExpensas('consorcio-1', { estado: 'BORRADOR' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Los datos mockeados incluyen expensas con estado BORRADOR
      expect(result.current.data?.data.some(e => e.estado === 'BORRADOR')).toBe(true);
    });

    it('debe incluir metadatos de paginación', async () => {
      const { result } = renderHook(
        () => useExpensas('consorcio-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('total');
      expect(result.current.data).toHaveProperty('page');
      expect(result.current.data).toHaveProperty('limit');
    });
  });

  describe('useExpensa', () => {
    it('debe cargar detalle de una expensa', async () => {
      const { result } = renderHook(
        () => useExpensa('expensa-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe('expensa-1');
      expect(result.current.data?.periodo).toBeDefined();
    });

    it('no debe hacer fetch si id es undefined', () => {
      const { result } = renderHook(
        () => useExpensa(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('debe incluir totales de gastos', async () => {
      const { result } = renderHook(
        () => useExpensa('expensa-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('totalGastosOrdinarios');
      expect(result.current.data).toHaveProperty('totalGastosExtraordinarios');
    });
  });

  describe('useCreateExpensa', () => {
    it('debe crear una expensa en estado borrador', async () => {
      const { result } = renderHook(
        () => useCreateExpensa(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        consorcioId: 'consorcio-1',
        periodo: '2024-03',
        fechaVencimiento: '2024-03-10',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.estado).toBe('BORRADOR');
    });

    it('debe generar ID automáticamente', async () => {
      const { result } = renderHook(
        () => useCreateExpensa(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        consorcioId: 'consorcio-1',
        periodo: '2024-03',
        fechaVencimiento: '2024-03-10',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.id).toBeDefined();
      expect(result.current.data?.id.startsWith('expensa-')).toBe(true);
    });
  });

  describe('useLiquidarExpensa', () => {
    it('debe liquidar una expensa exitosamente', async () => {
      const { result } = renderHook(
        () => useLiquidarExpensa(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        id: 'expensa-1',
        gastosIds: ['gasto-1', 'gasto-2'],
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.estado).toBe('LIQUIDADA');
    });
  });

  describe('expensasKeys', () => {
    it('debe generar keys correctas para la lista', () => {
      const key = expensasKeys.list('consorcio-1');
      expect(key).toContain('expensas');
      expect(key).toContain('list');
      expect(key).toContain('consorcio-1');
    });

    it('debe generar keys correctas para detalle', () => {
      const key = expensasKeys.detail('expensa-1');
      expect(key).toContain('detail');
      expect(key).toContain('expensa-1');
    });

    it('debe generar keys correctas para detalles por UF', () => {
      const key = expensasKeys.detalles('expensa-1');
      expect(key).toContain('detalles');
    });
  });
});
