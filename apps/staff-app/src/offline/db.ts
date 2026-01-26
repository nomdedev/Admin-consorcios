// =============================================================================
// Staff App - Base de datos offline con Dexie.js (IndexedDB)
// =============================================================================

import Dexie, { type Table } from "dexie";

// -----------------------------------------------------------------------------
// Tipos locales para sincronización
// -----------------------------------------------------------------------------

export interface BitacoraLocal {
  localId: string; // UUID generado offline
  consorcioId: string;
  tipo: string;
  descripcion: string;
  ubicacion?: string;
  visitanteNombre?: string;
  visitanteDni?: string;
  visitanteDestino?: string;
  fotoBlob?: Blob;
  timestamp: Date;
  syncStatus: "pending" | "synced" | "error";
  syncError?: string;
  serverData?: unknown;
}

export interface PaqueteLocal {
  localId: string;
  consorcioId: string;
  destinatarioUF: string;
  remitente: string;
  descripcion?: string;
  fotoBlob?: Blob;
  recibidoAt: Date;
  entregadoAt?: Date;
  entregadoA?: string;
  firmaDni?: string;
  syncStatus: "pending" | "synced" | "error";
  syncError?: string;
  serverData?: unknown;
}

export interface RondaLocal {
  localId: string;
  consorcioId: string;
  inicioAt: Date;
  finAt?: Date;
  checkpoints: {
    ubicacion: string;
    timestamp: Date;
    notas?: string;
  }[];
  syncStatus: "pending" | "synced" | "error";
  syncError?: string;
}

// -----------------------------------------------------------------------------
// Definición de la base de datos
// -----------------------------------------------------------------------------

class VecinoSimpleStaffDB extends Dexie {
  bitacora!: Table<BitacoraLocal, string>;
  paquetes!: Table<PaqueteLocal, string>;
  rondas!: Table<RondaLocal, string>;

  constructor() {
    super("vecinosimple-staff");

    this.version(1).stores({
      bitacora: "localId, consorcioId, syncStatus, timestamp",
      paquetes: "localId, consorcioId, syncStatus, destinatarioUF, recibidoAt",
      rondas: "localId, consorcioId, syncStatus, inicioAt",
    });
  }
}

// Singleton de la base de datos
export const db = new VecinoSimpleStaffDB();

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Genera un UUID v4 para identificadores locales
 */
export function generateLocalId(): string {
  return crypto.randomUUID();
}

/**
 * Obtiene todos los registros pendientes de sincronización
 */
export async function getPendingSync() {
  const [bitacora, paquetes, rondas] = await Promise.all([
    db.bitacora.where("syncStatus").equals("pending").toArray(),
    db.paquetes.where("syncStatus").equals("pending").toArray(),
    db.rondas.where("syncStatus").equals("pending").toArray(),
  ]);

  return { bitacora, paquetes, rondas };
}

/**
 * Marca un registro como sincronizado
 */
export async function markAsSynced(
  table: "bitacora" | "paquetes" | "rondas",
  localId: string,
  serverData?: unknown
) {
  await db[table].update(localId, {
    syncStatus: "synced",
    serverData,
  });
}

/**
 * Marca un registro con error de sincronización
 */
export async function markSyncError(
  table: "bitacora" | "paquetes" | "rondas",
  localId: string,
  error: string
) {
  await db[table].update(localId, {
    syncStatus: "error",
    syncError: error,
  });
}
