// =============================================================================
// Staff App - Sync Manager (Background Synchronization)
// =============================================================================

import {
  getPendingSync,
  markAsSynced,
} from './db';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const IS_DEBUG = process.env.NODE_ENV === 'development';

// Logger condicional para evitar logs en producción
const syncLogger = {
  log: (...args: unknown[]) => {
    if (IS_DEBUG) {
      // eslint-disable-next-line no-console -- Debug logging is allowed in development
      console.log('[SyncManager]', ...args);
    }
  },
  error: (...args: unknown[]) => console.error('[SyncManager]', ...args),
};

interface SyncResult {
  success: number;
  failed: number;
  errors: string[];
}

/**
 * Clase singleton para manejar la sincronización en segundo plano
 */
class SyncManager {
  private static instance: SyncManager;
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Escuchar cambios de conexión
    if (globalThis.window !== undefined) {
      globalThis.window.addEventListener('online', () => this.onOnline());
      globalThis.window.addEventListener('offline', () => this.onOffline());
      
      // Iniciar sync automático si estamos online
      if (navigator.onLine) {
        this.startAutoSync();
      }
    }
  }

  static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  private onOnline() {
    syncLogger.log('Conexión detectada, iniciando sincronización...');
    this.startAutoSync();
    this.syncAll();
  }

  private onOffline() {
    syncLogger.log('Sin conexión, deteniendo sincronización...');
    this.stopAutoSync();
  }

  private startAutoSync() {
    if (this.syncInterval) return;
    
    // Sincronizar cada 30 segundos si hay conexión
    this.syncInterval = setInterval(() => {
      if (navigator.onLine && !this.isSyncing) {
        this.syncAll();
      }
    }, 30000);
  }

  private stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  /**
   * Obtiene el token de autenticación
   * ✅ Usa la variable global expuesta por AuthContext
   */
  private getToken(): string | null {
    if (globalThis.window === undefined) return null;
    return (globalThis as any).__STAFF_ACCESS_TOKEN__ ?? null;
  }

  private getDeviceId(): string {
    if (globalThis.window === undefined) {
      return 'server';
    }

    const storage = globalThis.localStorage;
    if (!storage) return 'unknown';

    const key = 'vs-device-id';
    const existing = storage.getItem(key);
    if (existing) return existing;

    const id = globalThis.crypto?.randomUUID?.() ?? `device-${Date.now()}`;
    storage.setItem(key, id);
    return id;
  }

  private buildSyncMetadata() {
    return {
      clientTimestamp: new Date().toISOString(),
      deviceId: this.getDeviceId(),
    };
  }

  /**
   * Sincroniza todos los registros pendientes
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing || !navigator.onLine) {
      return { success: 0, failed: 0, errors: [] };
    }

    this.isSyncing = true;
    const result: SyncResult = { success: 0, failed: 0, errors: [] };

    try {
      const pending = await getPendingSync();
      syncLogger.log('Pendientes:', {
        bitacora: pending.bitacora.length,
        paquetes: pending.paquetes.length,
        rondas: pending.rondas.length,
      });

      // Sincronizar bitácora
      for (const entry of pending.bitacora) {
        try {
          await this.syncBitacoraEntry(entry);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Bitácora ${entry.localId}: ${error}`);
        }
      }

      // Sincronizar paquetes
      for (const paquete of pending.paquetes) {
        try {
          await this.syncPaquete(paquete);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Paquete ${paquete.localId}: ${error}`);
        }
      }

      // Sincronizar rondas
      for (const ronda of pending.rondas) {
        try {
          await this.syncRonda(ronda);
          result.success++;
        } catch (error) {
          result.failed++;
          result.errors.push(`Ronda ${ronda.localId}: ${error}`);
        }
      }

      syncLogger.log('Resultado:', result);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  /**
   * Sincroniza una entrada de bitácora
   */
  private async syncBitacoraEntry(entry: {
    localId: string;
    tipo: string;
    descripcion: string;
    timestamp: Date;
  }) {
    const token = this.getToken();
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${API_URL}/bitacora`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Client-Id': this.getDeviceId(),
      },
      body: JSON.stringify({ ...entry, ...this.buildSyncMetadata() }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Conflicto de sincronización (bitácora)');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const serverData = await response.json();
    await markAsSynced('bitacora', entry.localId, serverData);
  }

  /**
   * Sincroniza un paquete
   */
  private async syncPaquete(paquete: {
    localId: string;
    destinatarioUF: string;
    remitente: string;
    recibidoAt: Date;
  }) {
    const token = this.getToken();
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${API_URL}/paquetes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Client-Id': this.getDeviceId(),
      },
      body: JSON.stringify({ ...paquete, ...this.buildSyncMetadata() }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Conflicto de sincronización (paquete)');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const serverData = await response.json();
    await markAsSynced('paquetes', paquete.localId, serverData);
  }

  /**
   * Sincroniza una ronda
   */
  private async syncRonda(ronda: {
    localId: string;
    inicioAt: Date;
    finAt?: Date;
    checkpoints: unknown[];
  }) {
    const token = this.getToken();
    if (!token) throw new Error('No auth token');

    const response = await fetch(`${API_URL}/rondas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Client-Id': this.getDeviceId(),
      },
      body: JSON.stringify({ ...ronda, ...this.buildSyncMetadata() }),
    });

    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Conflicto de sincronización (ronda)');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const serverData = await response.json();
    await markAsSynced('rondas', ronda.localId, serverData);
  }

  /**
   * Fuerza la sincronización manual
   */
  async forceSync(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return { success: 0, failed: 0, errors: ['Sin conexión'] };
    }
    return this.syncAll();
  }
}

// Exportar singleton
export const syncManager = SyncManager.getInstance();

// Exportar función para inicializar desde componentes
export function initializeSyncManager() {
  return SyncManager.getInstance();
}
