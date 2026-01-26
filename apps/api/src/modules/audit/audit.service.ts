import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

export interface AuditLogEntry {
  usuarioId?: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  entidad: string;
  entidadId: string;
  datosAnteriores?: unknown;
  datosNuevos?: unknown;
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una entrada de auditoría en la base de datos.
   * Este registro es INMUTABLE - nunca debe modificarse ni eliminarse.
   * Es esencial para cumplimiento legal y trazabilidad financiera.
   */
  async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          usuarioId: entry.usuarioId,
          accion: entry.accion,
          entidad: entry.entidad,
          entidadId: entry.entidadId,
          datosAnteriores: entry.datosAnteriores
            ? (this.sanitizeForJson(entry.datosAnteriores) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          datosNuevos: entry.datosNuevos
            ? (this.sanitizeForJson(entry.datosNuevos) as Prisma.InputJsonValue)
            : Prisma.JsonNull,
          ip: entry.ip,
          userAgent: entry.userAgent,
        },
      });

      this.logger.debug(
        `Audit: ${entry.accion} ${entry.entidad}#${entry.entidadId} by ${entry.usuarioId || 'SYSTEM'}`,
      );
    } catch (error) {
      // CRÍTICO: Los errores de auditoría no deben interrumpir el flujo
      // pero deben ser loggeados para análisis posterior
      const err = error as Error;
      this.logger.error(
        `Error al registrar auditoría: ${err.message}`,
        err.stack,
      );
    }
  }

  /**
   * Obtiene el historial de auditoría para una entidad específica
   */
  async getHistorial(entidad: string, entidadId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entidad,
        entidadId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Obtiene auditorías por usuario (para investigaciones)
   */
  async getByUsuario(
    usuarioId: string,
    opciones?: {
      desde?: Date;
      hasta?: Date;
      entidad?: string;
      limit?: number;
    },
  ) {
    const { desde, hasta, entidad, limit = 100 } = opciones || {};

    return this.prisma.auditLog.findMany({
      where: {
        usuarioId,
        ...(entidad && { entidad }),
        ...(desde && hasta && {
          timestamp: {
            gte: desde,
            lte: hasta,
          },
        }),
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Sanitiza datos para almacenar en JSON (remueve campos sensibles)
   */
  private sanitizeForJson(data: unknown): unknown {
    if (data === null || data === undefined) {
      return data;
    }

    // Si es un objeto, procesar recursivamente
    if (typeof data === 'object') {
      // Convertir Dates a ISO strings
      if (data instanceof Date) {
        return data.toISOString();
      }

      // Convertir Decimals a números
      if (typeof (data as any).toNumber === 'function') {
        return (data as any).toNumber();
      }

      // Si es un array, procesar cada elemento
      if (Array.isArray(data)) {
        return data.map(item => this.sanitizeForJson(item));
      }

      // Procesar objeto
      const sanitized: Record<string, unknown> = {};
      const camposSensibles = [
        'passwordHash',
        'magicLinkToken',
        'refreshToken',
        'twoFactorSecret',
        'cbu',
        'dni',
      ];

      for (const [key, value] of Object.entries(data)) {
        // Omitir campos sensibles
        if (camposSensibles.includes(key)) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeForJson(value);
        }
      }

      return sanitized;
    }

    return data;
  }
}
