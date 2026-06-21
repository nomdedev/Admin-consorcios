import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('dexie', () => {
  return {
    default: class MockDexie {
      version() {
        return { stores: vi.fn() };
      }
    },
  };
});

vi.mock('../offline/db', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getPendingSync: vi.fn(),
    markAsSynced: vi.fn(),
  };
});

describe('Offline sync', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('navigator', { ...globalThis.navigator, onLine: false });
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('genera IDs locales con crypto.randomUUID', async () => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'uuid-123'),
    });

    const { generateLocalId } = await import('../offline/db');

    expect(generateLocalId()).toBe('uuid-123');
  });

  it('sincroniza pendientes y marca registros como synced', async () => {
    const { getPendingSync, markAsSynced } = await import('../offline/db');

    (getPendingSync as unknown as { mockResolvedValue: (value: unknown) => void })
      .mockResolvedValue({
        bitacora: [{ localId: 'b1', tipo: 'VISITA', descripcion: 'Visita', timestamp: new Date() }],
        paquetes: [{ localId: 'p1', destinatarioUF: '4B', remitente: 'Amazon', recibidoAt: new Date() }],
        rondas: [{ localId: 'r1', inicioAt: new Date(), checkpoints: [] }],
      });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'server-1' }),
    }));

    localStorage.setItem('accessToken', 'token');
    vi.stubGlobal('navigator', { ...globalThis.navigator, onLine: true });

    const { syncManager } = await import('../offline/sync-manager');
    const result = await syncManager.syncAll();

    expect(result.success).toBe(3);
    expect(result.failed).toBe(0);
    expect(markAsSynced).toHaveBeenCalledTimes(3);
  });

  it('reporta conflicto cuando el servidor responde 409', async () => {
    const { getPendingSync, markAsSynced } = await import('../offline/db');

    (getPendingSync as unknown as { mockResolvedValue: (value: unknown) => void })
      .mockResolvedValue({
        bitacora: [{ localId: 'b1', tipo: 'VISITA', descripcion: 'Visita', timestamp: new Date() }],
        paquetes: [],
        rondas: [],
      });

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({}),
    }));

    localStorage.setItem('accessToken', 'token');
    vi.stubGlobal('navigator', { ...globalThis.navigator, onLine: true });

    const { syncManager } = await import('../offline/sync-manager');
    const result = await syncManager.syncAll();

    expect(result.failed).toBe(1);
    expect(result.errors[0]).toContain('Bitácora');
    expect(markAsSynced).not.toHaveBeenCalled();
  });
});
