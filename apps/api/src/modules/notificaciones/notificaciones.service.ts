import { Injectable, Logger } from '@nestjs/common';
import { Notificacion } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PushService } from '../push/push.service';
import {
  CreateNotificacionDto,
  CreateNotificacionMasivaDto,
  FiltroNotificacionesDto,
  NotificacionResponseDto,
  ListaNotificacionesResponseDto,
  ContadorNotificacionesDto,
  TipoNotificacion,
} from './dto';

// ============================================================================
// UTILIDADES
// ============================================================================

/**
 * Calcula tiempo relativo desde una fecha
 */
function calcularTiempoRelativo(fecha: Date): string {
  const ahora = new Date();
  const diferencia = ahora.getTime() - fecha.getTime();
  const segundos = Math.floor(diferencia / 1000);
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);

  if (segundos < 60) return 'Hace un momento';
  if (minutos < 60) return `Hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
  if (horas < 24) return `Hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} semana${Math.floor(dias / 7) === 1 ? '' : 's'}`;
  return `Hace ${Math.floor(dias / 30)} mes${Math.floor(dias / 30) === 1 ? '' : 'es'}`;
}

/**
 * Sanitiza texto para prevenir XSS
 */
function sanitizarTexto(texto: string): string {
  if (!texto) return texto;

  return texto
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushService,
  ) {}

  // ==========================================================================
  // CREAR NOTIFICACIÓN (Usado por otros módulos)
  // ==========================================================================

  async crearNotificacion(
    dto: CreateNotificacionDto,
  ): Promise<NotificacionResponseDto> {
    const notificacion = await this.prisma.notificacion.create({
      data: {
        usuarioId: dto.usuarioId,
        titulo: sanitizarTexto(dto.titulo),
        mensaje: sanitizarTexto(dto.mensaje),
        tipo: dto.tipo,
        referenciaId: dto.referenciaId,
        referenciaTipo: dto.referenciaTipo,
        leida: false,
      },
    });

    this.logger.debug(
      `Notificación creada: ${notificacion.id} para usuario ${dto.usuarioId}`,
    );

    // Enviar push notification si está habilitado
    await this.enviarPushNotification(dto.usuarioId, notificacion);

    return this.mapearNotificacion(notificacion);
  }

  /**
   * Envía push notification al dispositivo del usuario
   */
  private async enviarPushNotification(
    usuarioId: string,
    notificacion: Notificacion,
  ): Promise<void> {
    if (!this.pushService.enabled) {
      return;
    }

    try {
      // Buscar tokens de dispositivos del usuario
      // TODO: Crear modelo DeviceToken en schema.prisma para guardar tokens FCM
      // Por ahora, simulamos la lógica
      const deviceTokens = await this.obtenerDeviceTokens(usuarioId);
      
      if (deviceTokens.length === 0) {
        return;
      }

      // Determinar prioridad según tipo
      const prioridad = this.determinarPrioridadPush(notificacion.tipo);

      await this.pushService.sendToDevices({
        tokens: deviceTokens,
        title: notificacion.titulo,
        body: notificacion.mensaje,
        data: {
          type: notificacion.tipo,
          notificacionId: notificacion.id,
          referenciaId: notificacion.referenciaId || '',
          referenciaTipo: notificacion.referenciaTipo || '',
        },
        priority: prioridad,
      });
    } catch (error) {
      // No fallar la operación principal si falla el push
      this.logger.warn(
        `Error enviando push notification: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }
  }

  /**
   * Obtiene los tokens de dispositivos del usuario
   * TODO: Implementar cuando se agregue DeviceToken al schema
   */
  private async obtenerDeviceTokens(usuarioId: string): Promise<string[]> {
    // Placeholder - implementar cuando exista el modelo DeviceToken
    // return this.prisma.deviceToken.findMany({
    //   where: { usuarioId, activo: true },
    //   select: { token: true },
    // }).then(tokens => tokens.map(t => t.token));
    this.logger.debug(`Buscando tokens para usuario ${usuarioId} (no implementado)`);
    return [];
  }

  /**
   * Determina la prioridad del push según el tipo de notificación
   */
  private determinarPrioridadPush(tipo: string): 'high' | 'normal' {
    const tiposAlta = ['emergencia', 'pago_rechazado', 'vencimiento_hoy'];
    return tiposAlta.includes(tipo) ? 'high' : 'normal';
  }

  // ==========================================================================
  // CREAR NOTIFICACIONES MASIVAS (Para comunicados, alertas, etc.)
  // ==========================================================================

  async crearNotificacionesMasivas(
    dto: CreateNotificacionMasivaDto,
  ): Promise<{ creadas: number }> {
    // Usar createMany para eficiencia
    const result = await this.prisma.notificacion.createMany({
      data: dto.usuarioIds.map((usuarioId) => ({
        usuarioId,
        titulo: sanitizarTexto(dto.titulo),
        mensaje: sanitizarTexto(dto.mensaje),
        tipo: dto.tipo,
        referenciaId: dto.referenciaId,
        referenciaTipo: dto.referenciaTipo,
        leida: false,
      })),
      skipDuplicates: true,
    });

    this.logger.log(
      `Notificaciones masivas creadas: ${result.count} para ${dto.usuarioIds.length} usuarios`,
    );

    return { creadas: result.count };
  }

  // ==========================================================================
  // LISTAR NOTIFICACIONES DEL USUARIO
  // ==========================================================================

  async listarNotificaciones(
    usuarioId: string,
    filtros: FiltroNotificacionesDto,
  ): Promise<ListaNotificacionesResponseDto> {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 20;
    const skip = (pagina - 1) * limite;

    // Construir filtros
    const where: {
      usuarioId: string;
      leida?: boolean;
      tipo?: string;
    } = {
      usuarioId,
    };

    if (filtros.soloNoLeidas) {
      where.leida = false;
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    const [notificaciones, total] = await Promise.all([
      this.prisma.notificacion.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limite,
      }),
      this.prisma.notificacion.count({ where }),
    ]);

    return {
      data: notificaciones.map((n: Notificacion) => this.mapearNotificacion(n)),
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  // ==========================================================================
  // MARCAR COMO LEÍDA
  // ==========================================================================

  async marcarComoLeida(
    usuarioId: string,
    notificacionId: string,
  ): Promise<NotificacionResponseDto> {
    // Verificar que la notificación pertenece al usuario
    const notificacion = await this.prisma.notificacion.findFirst({
      where: {
        id: notificacionId,
        usuarioId,
      },
    });

    if (!notificacion) {
      // Silenciosamente retornar sin error si no existe o no pertenece
      // Esto evita que un atacante pueda enumerar IDs
      this.logger.warn(
        `Intento de marcar notificación inexistente o ajena: ${notificacionId}`,
      );
      throw new Error('Notificación no encontrada');
    }

    const actualizada = await this.prisma.notificacion.update({
      where: { id: notificacionId },
      data: { leida: true },
    });

    return this.mapearNotificacion(actualizada);
  }

  // ==========================================================================
  // MARCAR MÚLTIPLES COMO LEÍDAS
  // ==========================================================================

  async marcarVariasComoLeidas(
    usuarioId: string,
    notificacionIds: string[],
  ): Promise<{ marcadas: number }> {
    // Solo marcar las que pertenecen al usuario
    const result = await this.prisma.notificacion.updateMany({
      where: {
        id: { in: notificacionIds },
        usuarioId,
        leida: false,
      },
      data: { leida: true },
    });

    this.logger.debug(
      `Marcadas ${result.count} notificaciones como leídas para usuario ${usuarioId}`,
    );

    return { marcadas: result.count };
  }

  // ==========================================================================
  // MARCAR TODAS COMO LEÍDAS
  // ==========================================================================

  async marcarTodasComoLeidas(usuarioId: string): Promise<{ marcadas: number }> {
    const result = await this.prisma.notificacion.updateMany({
      where: {
        usuarioId,
        leida: false,
      },
      data: { leida: true },
    });

    this.logger.debug(
      `Marcadas todas (${result.count}) notificaciones como leídas para usuario ${usuarioId}`,
    );

    return { marcadas: result.count };
  }

  // ==========================================================================
  // CONTADOR DE NO LEÍDAS
  // ==========================================================================

  async obtenerContadorNoLeidas(
    usuarioId: string,
  ): Promise<ContadorNotificacionesDto> {
    // Obtener conteo total de no leídas
    const noLeidas = await this.prisma.notificacion.count({
      where: {
        usuarioId,
        leida: false,
      },
    });

    // Obtener desglose por tipo (solo no leídas)
    const porTipoRaw = await this.prisma.notificacion.groupBy({
      by: ['tipo'],
      where: {
        usuarioId,
        leida: false,
      },
      _count: {
        tipo: true,
      },
    });

    const porTipo = porTipoRaw.map((item) => ({
      tipo: item.tipo as TipoNotificacion,
      cantidad: item._count.tipo,
    }));

    return {
      noLeidas,
      porTipo,
    };
  }

  // ==========================================================================
  // ELIMINAR NOTIFICACIONES ANTIGUAS (Limpieza - para cron job)
  // ==========================================================================

  async eliminarNotificacionesAntiguas(
    diasAntiguedad: number = 90,
  ): Promise<{ eliminadas: number }> {
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);

    const result = await this.prisma.notificacion.deleteMany({
      where: {
        createdAt: { lt: fechaLimite },
        leida: true, // Solo eliminar las ya leídas
      },
    });

    this.logger.log(
      `Limpieza: eliminadas ${result.count} notificaciones antiguas (>${diasAntiguedad} días)`,
    );

    return { eliminadas: result.count };
  }

  // ==========================================================================
  // ELIMINAR NOTIFICACIÓN ESPECÍFICA
  // ==========================================================================

  async eliminarNotificacion(
    usuarioId: string,
    notificacionId: string,
  ): Promise<{ eliminada: boolean }> {
    // Solo eliminar si pertenece al usuario
    const result = await this.prisma.notificacion.deleteMany({
      where: {
        id: notificacionId,
        usuarioId,
      },
    });

    return { eliminada: result.count > 0 };
  }

  // ==========================================================================
  // LIMPIAR TODAS LAS NOTIFICACIONES LEÍDAS DEL USUARIO
  // ==========================================================================

  async limpiarLeidas(usuarioId: string): Promise<{ eliminadas: number }> {
    const result = await this.prisma.notificacion.deleteMany({
      where: {
        usuarioId,
        leida: true,
      },
    });

    this.logger.debug(
      `Usuario ${usuarioId} limpió ${result.count} notificaciones leídas`,
    );

    return { eliminadas: result.count };
  }

  // ==========================================================================
  // MÉTODOS HELPER PARA OTROS MÓDULOS
  // ==========================================================================

  /**
   * Notificar sobre un nuevo pago
   */
  async notificarPago(
    usuarioId: string,
    monto: number,
    periodos: string[],
    pagoId: string,
  ): Promise<void> {
    await this.crearNotificacion({
      usuarioId,
      titulo: 'Pago registrado exitosamente',
      mensaje: `Tu pago de $${monto.toLocaleString('es-AR')} por ${periodos.join(', ')} fue procesado correctamente.`,
      tipo: TipoNotificacion.PAGO,
      referenciaId: pagoId,
      referenciaTipo: 'Pago',
    });
  }

  /**
   * Notificar sobre vencimiento próximo
   */
  async notificarVencimiento(
    usuarioId: string,
    periodo: string,
    monto: number,
    diasRestantes: number,
    expensaId: string,
  ): Promise<void> {
    await this.crearNotificacion({
      usuarioId,
      titulo: `Vencimiento en ${diasRestantes} días`,
      mensaje: `Tu expensa de ${periodo} por $${monto.toLocaleString('es-AR')} vence pronto. Evitá recargos pagando antes del vencimiento.`,
      tipo: TipoNotificacion.VENCIMIENTO,
      referenciaId: expensaId,
      referenciaTipo: 'Expensa',
    });
  }

  /**
   * Notificar sobre cambio de estado de ticket
   */
  async notificarCambioTicket(
    usuarioId: string,
    ticketTitulo: string,
    nuevoEstado: string,
    ticketId: string,
  ): Promise<void> {
    await this.crearNotificacion({
      usuarioId,
      titulo: `Actualización de tu reclamo`,
      mensaje: `Tu reclamo "${ticketTitulo}" cambió a estado: ${nuevoEstado}.`,
      tipo: TipoNotificacion.RECLAMO,
      referenciaId: ticketId,
      referenciaTipo: 'TicketMantenimiento',
    });
  }

  /**
   * Notificar sobre nuevo comunicado (masivo)
   */
  async notificarNuevoComunicado(
    usuarioIds: string[],
    comunicadoTitulo: string,
    comunicadoId: string,
  ): Promise<void> {
    await this.crearNotificacionesMasivas({
      usuarioIds,
      titulo: 'Nuevo comunicado del consorcio',
      mensaje: comunicadoTitulo,
      tipo: TipoNotificacion.COMUNICADO,
      referenciaId: comunicadoId,
      referenciaTipo: 'Comunicado',
    });
  }

  // ==========================================================================
  // MAPEO
  // ==========================================================================

  private mapearNotificacion(
    notificacion: Notificacion,
  ): NotificacionResponseDto {
    return {
      id: notificacion.id,
      titulo: notificacion.titulo,
      mensaje: notificacion.mensaje,
      tipo: notificacion.tipo as TipoNotificacion,
      referenciaId: notificacion.referenciaId ?? undefined,
      referenciaTipo: notificacion.referenciaTipo ?? undefined,
      leida: notificacion.leida,
      createdAt: notificacion.createdAt,
      tiempoRelativo: calcularTiempoRelativo(notificacion.createdAt),
    };
  }
}
