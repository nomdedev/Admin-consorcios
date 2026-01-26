import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Rol, Prisma, Comunicado } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateComunicadoDto,
  UpdateComunicadoDto,
  FiltroComunicadosDto,
  ComunicadoResponseDto,
  ComunicadoDetalleResponseDto,
  ListaComunicadosResponseDto,
  EstadisticasComunicadosDto,
  TipoComunicado,
  CanalNotificacion,
} from './dto';

// ============================================================================
// UTILIDADES DE SEGURIDAD
// ============================================================================

/**
 * Sanitiza texto para prevenir XSS
 * Permite Markdown básico pero elimina tags HTML peligrosos
 */
function sanitizarTexto(texto: string): string {
  if (!texto) return texto;

  return texto
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .trim();
}

/**
 * Valida que la fecha de publicación sea coherente
 */
function validarFechasPublicacion(
  publicarDesde?: string,
  publicarHasta?: string,
): void {
  if (publicarDesde && publicarHasta) {
    const desde = new Date(publicarDesde);
    const hasta = new Date(publicarHasta);

    if (hasta <= desde) {
      throw new BadRequestException(
        'La fecha de expiración debe ser posterior a la fecha de publicación',
      );
    }
  }

  // No permitir programar más de 1 año en el futuro
  if (publicarDesde) {
    const desde = new Date(publicarDesde);
    const unAnioFuturo = new Date();
    unAnioFuturo.setFullYear(unAnioFuturo.getFullYear() + 1);

    if (desde > unAnioFuturo) {
      throw new BadRequestException(
        'No se puede programar un comunicado con más de 1 año de anticipación',
      );
    }
  }

  // No permitir que expire más de 1 año en el futuro
  if (publicarHasta) {
    const hasta = new Date(publicarHasta);
    const unAnioFuturo = new Date();
    unAnioFuturo.setFullYear(unAnioFuturo.getFullYear() + 1);

    if (hasta > unAnioFuturo) {
      throw new BadRequestException(
        'La fecha de expiración no puede ser mayor a 1 año en el futuro',
      );
    }
  }
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

@Injectable()
export class ComunicadosService {
  private readonly logger = new Logger(ComunicadosService.name);

  // Roles que pueden gestionar comunicados
  private readonly rolesGestion: Rol[] = [
    Rol.SUPER_ADMIN,
    Rol.ADMINISTRADOR,
    Rol.ADMIN_STAFF,
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================================================
  // VERIFICACIÓN DE ACCESO
  // ==========================================================================

  /**
   * Verifica que el usuario tenga acceso al consorcio con rol apropiado
   */
  private async verificarAccesoConsorcio(
    usuarioId: string,
    consorcioId: string,
    requiereGestion = false,
  ): Promise<{ rol: Rol }> {
    const usuarioConsorcio = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        activo: true,
      },
    });

    if (!usuarioConsorcio) {
      throw new ForbiddenException('No tienes acceso a este consorcio');
    }

    if (requiereGestion && !this.rolesGestion.includes(usuarioConsorcio.rol)) {
      throw new ForbiddenException(
        'No tienes permisos para gestionar comunicados',
      );
    }

    // Verificar permiso específico para ADMIN_STAFF
    if (
      usuarioConsorcio.rol === Rol.ADMIN_STAFF &&
      requiereGestion &&
      !usuarioConsorcio.puedeEnviarComunicados
    ) {
      throw new ForbiddenException(
        'No tienes el permiso de enviar comunicados asignado',
      );
    }

    return { rol: usuarioConsorcio.rol };
  }

  /**
   * Verifica que el consorcio exista
   */
  private async verificarConsorcio(consorcioId: string): Promise<void> {
    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: consorcioId },
    });

    if (!consorcio || !consorcio.activo) {
      throw new NotFoundException('Consorcio no encontrado');
    }
  }

  // ==========================================================================
  // CREAR COMUNICADO
  // ==========================================================================

  async crearComunicado(
    usuarioId: string,
    consorcioId: string,
    dto: CreateComunicadoDto,
  ): Promise<ComunicadoDetalleResponseDto> {
    // Verificar acceso con permisos de gestión
    await this.verificarAccesoConsorcio(usuarioId, consorcioId, true);
    await this.verificarConsorcio(consorcioId);

    // Validar fechas
    validarFechasPublicacion(dto.publicarDesde, dto.publicarHasta);

    // Sanitizar contenido
    const tituloSanitizado = sanitizarTexto(dto.titulo);
    const contenidoSanitizado = sanitizarTexto(dto.contenido);

    // Determinar flags de notificación
    const enviarEmail =
      dto.canalNotificacion === CanalNotificacion.EMAIL ||
      dto.canalNotificacion === CanalNotificacion.AMBOS;
    const enviarWhatsapp =
      dto.canalNotificacion === CanalNotificacion.WHATSAPP ||
      dto.canalNotificacion === CanalNotificacion.AMBOS;

    // Determinar fecha de publicación (ahora o programada)
    const publicarDesde = dto.publicarDesde
      ? new Date(dto.publicarDesde)
      : new Date();

    const comunicado = await this.prisma.comunicado.create({
      data: {
        consorcioId,
        titulo: tituloSanitizado,
        contenido: contenidoSanitizado,
        importante: dto.importante ?? false,
        publicarDesde,
        publicarHasta: dto.publicarHasta
          ? new Date(dto.publicarHasta)
          : undefined,
        enviarEmail,
        enviarWhatsapp,
      },
      include: {
        consorcio: {
          select: { nombre: true },
        },
      },
    });

    // Registrar en auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Comunicado',
      entidadId: comunicado.id,
      datosNuevos: {
        titulo: comunicado.titulo,
        tipo: dto.tipo,
        importante: comunicado.importante,
        publicarDesde: comunicado.publicarDesde,
        publicarHasta: comunicado.publicarHasta,
        canales: { email: enviarEmail, whatsapp: enviarWhatsapp },
      },
    });

    this.logger.log(
      `Comunicado creado: ${comunicado.id} en consorcio ${consorcioId}`,
    );

    // TODO: Si publicarDesde es ahora y hay canales de notificación, encolar envío
    // Esto se conectará con NotificacionesModule cuando esté implementado

    return this.mapearComunicadoADetalle(comunicado);
  }

  // ==========================================================================
  // LISTAR COMUNICADOS
  // ==========================================================================

  async listarComunicados(
    usuarioId: string,
    consorcioId: string,
    filtros: FiltroComunicadosDto,
  ): Promise<ListaComunicadosResponseDto> {
    const { rol } = await this.verificarAccesoConsorcio(
      usuarioId,
      consorcioId,
      false,
    );
    await this.verificarConsorcio(consorcioId);

    const esAdmin = this.rolesGestion.includes(rol);
    const ahora = new Date();

    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 20;
    const skip = (pagina - 1) * limite;

    // Construir filtros de búsqueda
    const where: Prisma.ComunicadoWhereInput = {
      consorcioId,
    };

    // Para vecinos: solo mostrar comunicados activos (publicados y no expirados)
    if (!esAdmin) {
      where.publicarDesde = { lte: ahora };
      where.OR = [{ publicarHasta: null }, { publicarHasta: { gte: ahora } }];
    } else {
      // Para admins: aplicar filtros opcionales
      if (!filtros.incluirProgramados) {
        where.publicarDesde = { lte: ahora };
      }

      if (!filtros.incluirExpirados) {
        where.OR = [{ publicarHasta: null }, { publicarHasta: { gte: ahora } }];
      }
    }

    // Filtro por búsqueda de texto
    if (filtros.busqueda) {
      const busquedaSanitizada = sanitizarTexto(filtros.busqueda);
      where.AND = [
        {
          OR: [
            { titulo: { contains: busquedaSanitizada, mode: 'insensitive' } },
            {
              contenido: { contains: busquedaSanitizada, mode: 'insensitive' },
            },
          ],
        },
      ];
    }

    // Filtro por importancia
    if (filtros.soloImportantes) {
      where.importante = true;
    }

    // Filtro por rango de fechas
    if (filtros.fechaDesde || filtros.fechaHasta) {
      where.createdAt = {};
      if (filtros.fechaDesde) {
        where.createdAt.gte = new Date(filtros.fechaDesde);
      }
      if (filtros.fechaHasta) {
        where.createdAt.lte = new Date(filtros.fechaHasta);
      }
    }

    // Ejecutar consulta
    const [comunicados, total] = await Promise.all([
      this.prisma.comunicado.findMany({
        where,
        orderBy: [{ importante: 'desc' }, { publicarDesde: 'desc' }],
        skip,
        take: limite,
      }),
      this.prisma.comunicado.count({ where }),
    ]);

    return {
      data: comunicados.map((c: Comunicado) => this.mapearComunicadoAResponse(c)),
      total,
      pagina,
      limite,
      totalPaginas: Math.ceil(total / limite),
    };
  }

  // ==========================================================================
  // OBTENER COMUNICADO POR ID
  // ==========================================================================

  async obtenerComunicado(
    usuarioId: string,
    comunicadoId: string,
  ): Promise<ComunicadoDetalleResponseDto> {
    const comunicado = await this.prisma.comunicado.findUnique({
      where: { id: comunicadoId },
      include: {
        consorcio: {
          select: { nombre: true },
        },
      },
    });

    if (!comunicado) {
      throw new NotFoundException('Comunicado no encontrado');
    }

    const { rol } = await this.verificarAccesoConsorcio(
      usuarioId,
      comunicado.consorcioId,
      false,
    );

    const esAdmin = this.rolesGestion.includes(rol);
    const ahora = new Date();

    // Para vecinos: verificar que el comunicado esté activo
    if (!esAdmin) {
      const estaActivo =
        comunicado.publicarDesde <= ahora &&
        (!comunicado.publicarHasta || comunicado.publicarHasta >= ahora);

      if (!estaActivo) {
        throw new NotFoundException('Comunicado no encontrado');
      }
    }

    return this.mapearComunicadoADetalle(comunicado);
  }

  // ==========================================================================
  // ACTUALIZAR COMUNICADO
  // ==========================================================================

  async actualizarComunicado(
    usuarioId: string,
    comunicadoId: string,
    dto: UpdateComunicadoDto,
  ): Promise<ComunicadoDetalleResponseDto> {
    const comunicado = await this.prisma.comunicado.findUnique({
      where: { id: comunicadoId },
    });

    if (!comunicado) {
      throw new NotFoundException('Comunicado no encontrado');
    }

    // Verificar permisos de gestión
    await this.verificarAccesoConsorcio(usuarioId, comunicado.consorcioId, true);

    // Validar fechas si se actualizan
    validarFechasPublicacion(
      dto.publicarDesde ?? comunicado.publicarDesde.toISOString(),
      dto.publicarHasta ?? comunicado.publicarHasta?.toISOString(),
    );

    // Preparar datos de actualización
    const datosActualizacion: Prisma.ComunicadoUpdateInput = {};

    if (dto.titulo !== undefined) {
      datosActualizacion.titulo = sanitizarTexto(dto.titulo);
    }

    if (dto.contenido !== undefined) {
      datosActualizacion.contenido = sanitizarTexto(dto.contenido);
    }

    if (dto.importante !== undefined) {
      datosActualizacion.importante = dto.importante;
    }

    if (dto.publicarDesde !== undefined) {
      datosActualizacion.publicarDesde = new Date(dto.publicarDesde);
    }

    if (dto.publicarHasta !== undefined) {
      datosActualizacion.publicarHasta = dto.publicarHasta
        ? new Date(dto.publicarHasta)
        : null;
    }

    if (dto.canalNotificacion !== undefined) {
      datosActualizacion.enviarEmail =
        dto.canalNotificacion === CanalNotificacion.EMAIL ||
        dto.canalNotificacion === CanalNotificacion.AMBOS;
      datosActualizacion.enviarWhatsapp =
        dto.canalNotificacion === CanalNotificacion.WHATSAPP ||
        dto.canalNotificacion === CanalNotificacion.AMBOS;
    }

    const comunicadoActualizado = await this.prisma.comunicado.update({
      where: { id: comunicadoId },
      data: datosActualizacion,
      include: {
        consorcio: {
          select: { nombre: true },
        },
      },
    });

    // Registrar en auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Comunicado',
      entidadId: comunicadoId,
      datosAnteriores: {
        titulo: comunicado.titulo,
        contenido: comunicado.contenido,
        importante: comunicado.importante,
      },
      datosNuevos: {
        titulo: comunicadoActualizado.titulo,
        contenido: comunicadoActualizado.contenido,
        importante: comunicadoActualizado.importante,
      },
    });

    this.logger.log(`Comunicado actualizado: ${comunicadoId}`);

    return this.mapearComunicadoADetalle(comunicadoActualizado);
  }

  // ==========================================================================
  // ELIMINAR COMUNICADO
  // ==========================================================================

  async eliminarComunicado(
    usuarioId: string,
    comunicadoId: string,
  ): Promise<{ mensaje: string }> {
    const comunicado = await this.prisma.comunicado.findUnique({
      where: { id: comunicadoId },
    });

    if (!comunicado) {
      throw new NotFoundException('Comunicado no encontrado');
    }

    // Verificar permisos de gestión
    const { rol } = await this.verificarAccesoConsorcio(
      usuarioId,
      comunicado.consorcioId,
      true,
    );

    // ADMIN_STAFF no puede eliminar (solo crear y editar)
    if (rol === Rol.ADMIN_STAFF) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar comunicados',
      );
    }

    await this.prisma.comunicado.delete({
      where: { id: comunicadoId },
    });

    // Registrar en auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'Comunicado',
      entidadId: comunicadoId,
      datosAnteriores: {
        titulo: comunicado.titulo,
        consorcioId: comunicado.consorcioId,
      },
    });

    this.logger.log(`Comunicado eliminado: ${comunicadoId}`);

    return { mensaje: 'Comunicado eliminado exitosamente' };
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  async obtenerEstadisticas(
    usuarioId: string,
    consorcioId: string,
  ): Promise<EstadisticasComunicadosDto> {
    await this.verificarAccesoConsorcio(usuarioId, consorcioId, true);
    await this.verificarConsorcio(consorcioId);

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

    // Consultas paralelas para estadísticas
    const [total, activos, programados, importantes, esteMes] =
      await Promise.all([
        // Total de comunicados
        this.prisma.comunicado.count({
          where: { consorcioId },
        }),

        // Comunicados activos
        this.prisma.comunicado.count({
          where: {
            consorcioId,
            publicarDesde: { lte: ahora },
            OR: [{ publicarHasta: null }, { publicarHasta: { gte: ahora } }],
          },
        }),

        // Comunicados programados (futuro)
        this.prisma.comunicado.count({
          where: {
            consorcioId,
            publicarDesde: { gt: ahora },
          },
        }),

        // Comunicados importantes activos
        this.prisma.comunicado.count({
          where: {
            consorcioId,
            importante: true,
            publicarDesde: { lte: ahora },
            OR: [{ publicarHasta: null }, { publicarHasta: { gte: ahora } }],
          },
        }),

        // Creados este mes
        this.prisma.comunicado.count({
          where: {
            consorcioId,
            createdAt: { gte: inicioMes },
          },
        }),
      ]);

    // Nota: El schema actual no tiene un campo 'tipo' en Comunicado
    // Por ahora retornamos array vacío, pero si se agrega el campo
    // se puede hacer el groupBy correspondiente

    return {
      total,
      activos,
      programados,
      importantes,
      esteMes,
      porTipo: [], // Se implementará cuando se agregue el campo tipo al schema
    };
  }

  // ==========================================================================
  // OBTENER COMUNICADOS RECIENTES (Para Dashboard)
  // ==========================================================================

  async obtenerComunicadosRecientes(
    usuarioId: string,
    consorcioId: string,
    cantidad = 5,
  ): Promise<ComunicadoResponseDto[]> {
    await this.verificarAccesoConsorcio(usuarioId, consorcioId, false);
    await this.verificarConsorcio(consorcioId);

    const ahora = new Date();

    const comunicados = await this.prisma.comunicado.findMany({
      where: {
        consorcioId,
        publicarDesde: { lte: ahora },
        OR: [{ publicarHasta: null }, { publicarHasta: { gte: ahora } }],
      },
      orderBy: [{ importante: 'desc' }, { publicarDesde: 'desc' }],
      take: cantidad,
    });

    return comunicados.map((c: Comunicado) => this.mapearComunicadoAResponse(c));
  }

  // ==========================================================================
  // MAPEOS
  // ==========================================================================

  private mapearComunicadoAResponse(comunicado: Comunicado): ComunicadoResponseDto {
    const ahora = new Date();
    const publicarDesde = new Date(comunicado.publicarDesde);
    const publicarHasta = comunicado.publicarHasta
      ? new Date(comunicado.publicarHasta)
      : null;

    return {
      id: comunicado.id,
      consorcioId: comunicado.consorcioId,
      titulo: comunicado.titulo,
      contenido: comunicado.contenido,
      tipo: TipoComunicado.GENERAL, // Default hasta que se agregue al schema
      importante: comunicado.importante,
      publicarDesde: comunicado.publicarDesde,
      publicarHasta: comunicado.publicarHasta,
      enviarEmail: comunicado.enviarEmail,
      enviarWhatsapp: comunicado.enviarWhatsapp,
      estaActivo:
        publicarDesde <= ahora && (!publicarHasta || publicarHasta >= ahora),
      estaProgramado: publicarDesde > ahora,
      estaExpirado: publicarHasta !== null && publicarHasta < ahora,
      createdAt: comunicado.createdAt,
      updatedAt: comunicado.updatedAt,
    };
  }

  private mapearComunicadoADetalle(
    comunicado: Comunicado & { consorcio?: { nombre: string } },
  ): ComunicadoDetalleResponseDto {
    return {
      ...this.mapearComunicadoAResponse(comunicado),
      consorcioNombre: comunicado.consorcio?.nombre,
      estadisticas: {
        visualizaciones: 0, // TODO: Implementar tracking de visualizaciones
        notificacionesEnviadas: 0, // TODO: Conectar con NotificacionesModule
      },
    };
  }
}
