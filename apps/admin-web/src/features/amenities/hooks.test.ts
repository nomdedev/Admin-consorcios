/**
 * Tests para hooks de Amenities
 */

import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { createWrapper } from '@/test/test-utils';

import {
  useAmenities,
  useAmenity,
  useDisponibilidad,
  useCreateReserva,
  amenitiesKeys,
  reservasKeys,
} from './hooks';

describe('Amenities Hooks', () => {
  describe('useAmenities', () => {
    it('debe cargar lista de amenities de un consorcio', async () => {
      const { result } = renderHook(
        () => useAmenities('consorcio-1'),
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
        () => useAmenities(undefined),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('debe retornar amenities activos', async () => {
      const { result } = renderHook(
        () => useAmenities('consorcio-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const amenities = result.current.data?.data || [];
      expect(amenities.every(a => a.activo === true)).toBe(true);
    });
  });

  describe('useAmenity', () => {
    it('debe cargar detalle de un amenity', async () => {
      const { result } = renderHook(
        () => useAmenity('amenity-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBe('amenity-1');
      expect(result.current.data?.nombre).toBeDefined();
    });

    it('no debe hacer fetch si id está vacío', () => {
      const { result } = renderHook(
        () => useAmenity(''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });

    it('debe incluir configuración de reservas', async () => {
      const { result } = renderHook(
        () => useAmenity('amenity-1'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveProperty('requiereAprobacion');
      expect(result.current.data).toHaveProperty('costoReserva');
    });
  });

  describe('useDisponibilidad', () => {
    it('debe cargar horarios disponibles', async () => {
      const { result } = renderHook(
        () => useDisponibilidad('amenity-1', '2024-02-01'),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.horariosDisponibles).toBeInstanceOf(Array);
    });

    it('no debe hacer fetch sin fecha', () => {
      const { result } = renderHook(
        () => useDisponibilidad('amenity-1', ''),
        { wrapper: createWrapper() }
      );

      expect(result.current.fetchStatus).toBe('idle');
    });
  });

  describe('useCreateReserva', () => {
    it('debe crear una reserva exitosamente', async () => {
      const { result } = renderHook(
        () => useCreateReserva(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        amenityId: 'amenity-1',
        fechaInicio: '2024-02-15T18:00:00.000Z',
        fechaFin: '2024-02-15T22:00:00.000Z',
        motivo: 'Cumpleaños',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeDefined();
      expect(result.current.data?.id).toBeDefined();
    });

    it('debe retornar datos de la reserva creada', async () => {
      const { result } = renderHook(
        () => useCreateReserva(),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        amenityId: 'amenity-1',
        fechaInicio: '2024-02-15T18:00:00.000Z',
        fechaFin: '2024-02-15T22:00:00.000Z',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.amenityId).toBe('amenity-1');
      expect(result.current.data?.createdAt).toBeDefined();
    });
  });

  describe('amenitiesKeys', () => {
    it('debe generar keys correctas para la lista', () => {
      const key = amenitiesKeys.list('consorcio-1');
      expect(key).toContain('amenities');
      expect(key).toContain('list');
      expect(key).toContain('consorcio-1');
    });

    it('debe generar keys correctas para detalle', () => {
      const key = amenitiesKeys.detail('amenity-1');
      expect(key).toContain('detail');
      expect(key).toContain('amenity-1');
    });

    it('debe generar keys correctas para disponibilidad', () => {
      const key = amenitiesKeys.disponibilidad('amenity-1', '2024-02-01');
      expect(key).toContain('disponibilidad');
      expect(key).toContain('amenity-1');
      expect(key).toContain('2024-02-01');
    });
  });

  describe('reservasKeys', () => {
    it('debe generar keys correctas para la lista', () => {
      const key = reservasKeys.list();
      expect(key).toContain('reservas');
      expect(key).toContain('list');
    });

    it('debe generar keys correctas para filtros', () => {
      const key = reservasKeys.list({ amenityId: 'amenity-1' });
      expect(key.length).toBeGreaterThan(2);
    });
  });
});
