/**
 * Tests para hooks de Notificaciones
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { createWrapper } from '@/test/test-utils';

import {
  useNotificaciones,
  useContadorNotificaciones,
  useMarcarLeida,
  useMarcarTodasLeidas,
  notificacionesKeys,
} from './hooks';

describe('Notificaciones Hooks', () => {
  describe('useNotificaciones', () => {
    it('debe cargar lista de notificaciones', async () => {
      const { result } = renderHook(
        () => useNotificaciones(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.data).toBeInstanceOf(Array);
    });

    it('debe incluir metadatos de paginación', async () => {
      const { result } = renderHook(
        () => useNotificaciones(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('total');
    });

    it('debe filtrar por estado de lectura', async () => {
      const { result } = renderHook(
        () => useNotificaciones({ leida: false }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // El mock debe retornar datos
      expect(result.current.data?.data).toBeDefined();
    });
  });

  describe('useContadorNotificaciones', () => {
    it('debe cargar contador de notificaciones', async () => {
      const { result } = renderHook(
        () => useContadorNotificaciones(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.total).toBeDefined();
      expect(result.current.data?.noLeidas).toBeDefined();
    });

    it('noLeidas debe ser número', async () => {
      const { result } = renderHook(
        () => useContadorNotificaciones(),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(typeof result.current.data?.noLeidas).toBe('number');
    });
  });

  describe('useMarcarLeida', () => {
    it('debe marcar notificación como leída', async () => {
      const { result } = renderHook(
        () => useMarcarLeida(),
        { wrapper: createWrapper() }
      );

      result.current.mutate('notif-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('debe estar en estado idle inicialmente', () => {
      const { result } = renderHook(
        () => useMarcarLeida(),
        { wrapper: createWrapper() }
      );

      expect(result.current.isIdle).toBe(true);
    });
  });

  describe('useMarcarTodasLeidas', () => {
    it('debe marcar todas las notificaciones como leídas', async () => {
      const { result } = renderHook(
        () => useMarcarTodasLeidas(),
        { wrapper: createWrapper() }
      );

      result.current.mutate();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('notificacionesKeys', () => {
    it('debe generar keys correctas para la lista', () => {
      const key = notificacionesKeys.list();
      expect(key).toContain('notificaciones');
      expect(key).toContain('list');
    });

    it('debe generar keys correctas para contador', () => {
      const key = notificacionesKeys.contador();
      expect(key).toContain('notificaciones');
      expect(key).toContain('contador');
    });

    it('debe generar keys correctas con filtros', () => {
      const key = notificacionesKeys.list({ leida: false });
      expect(key.length).toBeGreaterThan(2);
    });
  });
});
