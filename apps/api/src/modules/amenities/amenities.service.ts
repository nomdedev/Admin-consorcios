import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../notificaciones/dto';
import { Rol, Prisma } from '@prisma/client';
import {
  CreateAmenityDto,
  UpdateAmenityDto,
  CreateReservaDto,
  UpdateReservaDto,
  CancelarReservaDto,
  FiltrosReservaDto,
  FiltrosDisponibilidadDto,
  EstadoReserva,
  AmenityResponseDto,
  ReservaResponseDto,
  DisponibilidadResponseDto,
  MisReservasStatsDto,
} from './dto';

// ============================================================================
// ROLES CON PERMISOS DE GESTIÓN
// ============================================================================

const ROLES_GESTION: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
];

const ROLES_PUEDEN_RESERVAR: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
  Rol.PROPIETARIO,
  Rol.INQUILINO,
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sanitiza texto para prevenir XSS
 */
function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Calcula el estado de la reserva basado en fechas y aprobación
 */
function calcularEstadoReserva(
  reserva: {
    aprobada: boolean | null;
    fechaInicio: Date;
    fechaFin: Date;
    penalizacion?: { tipo: string } | null;
  }
): EstadoReserva {
  const ahora = new Date();
  
  // Si tiene penalización de no-show
  if (reserva.penalizacion?.tipo === 'no_show') {
    return EstadoReserva.NO_SHOW;
  }
  
  // Si fue rechazada
  if (reserva.aprobada === false) {
    return EstadoReserva.RECHAZADA;
  }
  
  // Si ya pasó
  if (reserva.fechaFin < ahora) {
    return reserva.aprobada === true 
      ? EstadoReserva.COMPLETADA 
      : EstadoReserva.CANCELADA;
  }
  
  // Si está aprobada y es futura
  if (reserva.aprobada === true) {
    return EstadoReserva.APROBADA;
  }
  
  // Pendiente de aprobación
  return EstadoReserva.PENDIENTE;
}

/**
 * Verifica si la reserva puede cancelarse (24h antes como mínimo)
 */
function puedeCancelarReserva(
  reserva: { aprobada: boolean | null; fechaInicio: Date },
  horasAnticipacion: number = 24
): boolean {
  // No se puede cancelar si ya fue rechazada o está pendiente rechazada
  if (reserva.aprobada === false) {
    return false;
  }
  
  const ahora = new Date();
  const limiteCancel = new Date(reserva.fechaInicio);
  limiteCancel.setHours(limiteCancel.getHours() - horasAnticipacion);
  
  return ahora < limiteCancel;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

@Injectable()
export class AmenitiesService {
  private readonly logger = new Logger(AmenitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  // ==========================================================================
  // AMENITIES CRUD
  // ==========================================================================

  /**
   * Lista amenities del consorcio
   */
  async listarAmenities(
    consorcioId: string,
    incluirInactivos: boolean = false,
  ): Promise<AmenityResponseDto[]> {
    const where: Prisma.AmenityWhereInput = {
      consorcioId,
      ...(incluirInactivos ? {} : { activo: true }),
    };

    const amenities = await this.prisma.amenity.findMany({
      where,
      orderBy: { nombre: 'asc' },
      include: {
        _count: {
          select: {
            reservas: {
              where: {
                aprobada: true,
                fechaInicio: { gte: new Date() },
              },
            },
          },
        },
      },
    });

    return amenities.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      descripcion: a.descripcion,
      capacidad: a.capacidad,
      requiereAprobacion: a.requiereAprobacion,
      anticipacionMinima: a.anticipacionMinima,
      anticipacionMaxima: a.anticipacionMaxima,
      duracionMaxima: a.duracionMaxima,
      costoReserva: a.costoReserva ? parseFloat(a.costoReserva.toString()) : null,
      activo: a.activo,
      createdAt: a.createdAt,
      proximasReservas: a._count.reservas,
    }));
  }

  /**
   * Obtiene un amenity por ID
   */
  async obtenerAmenity(
    amenityId: string,
    consorcioId: string,
  ): Promise<AmenityResponseDto> {
    const amenity = await this.prisma.amenity.findFirst({
      where: { id: amenityId, consorcioId },
      include: {
        _count: {
          select: {
            reservas: {
              where: {
                aprobada: true,
                fechaInicio: { gte: new Date() },
              },
            },
          },
        },
        reglas: {
          where: { activa: true },
          orderBy: { prioridad: 'desc' },
        },
      },
    });

    if (!amenity) {
      throw new NotFoundException('Amenity no encontrado');
    }

    return {
      id: amenity.id,
      nombre: amenity.nombre,
      descripcion: amenity.descripcion,
      capacidad: amenity.capacidad,
      requiereAprobacion: amenity.requiereAprobacion,
      anticipacionMinima: amenity.anticipacionMinima,
      anticipacionMaxima: amenity.anticipacionMaxima,
      duracionMaxima: amenity.duracionMaxima,
      costoReserva: amenity.costoReserva ? parseFloat(amenity.costoReserva.toString()) : null,
      activo: amenity.activo,
      createdAt: amenity.createdAt,
      proximasReservas: amenity._count.reservas,
    };
  }

  /**
   * Crea un nuevo amenity (solo admins)
   */
  async crearAmenity(
    dto: CreateAmenityDto,
    usuarioId: string,
  ): Promise<AmenityResponseDto> {
    // Verificar que el usuario pertenece al consorcio con rol de gestión
    await this.verificarPermisoGestion(usuarioId, dto.consorcioId);

    // Sanitizar textos
    const nombreSanitizado = sanitizeText(dto.nombre);
    const descripcionSanitizada = dto.descripcion 
      ? sanitizeText(dto.descripcion) 
      : null;

    // Validar que no exista otro con el mismo nombre
    const existente = await this.prisma.amenity.findFirst({
      where: {
        consorcioId: dto.consorcioId,
        nombre: { equals: nombreSanitizado, mode: 'insensitive' },
      },
    });

    if (existente) {
      throw new ConflictException(`Ya existe un amenity con el nombre "${nombreSanitizado}"`);
    }

    // Validar anticipación mínima <= máxima
    const anticipacionMinima = dto.anticipacionMinima ?? 24;
    const anticipacionMaxima = dto.anticipacionMaxima ?? 720;
    
    if (anticipacionMinima > anticipacionMaxima) {
      throw new BadRequestException(
        'La anticipación mínima no puede ser mayor a la máxima'
      );
    }

    const amenity = await this.prisma.amenity.create({
      data: {
        consorcioId: dto.consorcioId,
        nombre: nombreSanitizado,
        descripcion: descripcionSanitizada,
        capacidad: dto.capacidad,
        requiereAprobacion: dto.requiereAprobacion ?? false,
        anticipacionMinima,
        anticipacionMaxima,
        duracionMaxima: dto.duracionMaxima ?? 4,
        costoReserva: dto.costoReserva !== undefined 
          ? new Prisma.Decimal(dto.costoReserva) 
          : null,
      },
    });

    // Auditar creación
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Amenity',
      entidadId: amenity.id,
      datosNuevos: amenity,
    });

    this.logger.log(
      `Amenity creado: ${amenity.nombre} (${amenity.id}) en consorcio ${dto.consorcioId}`
    );

    return {
      id: amenity.id,
      nombre: amenity.nombre,
      descripcion: amenity.descripcion,
      capacidad: amenity.capacidad,
      requiereAprobacion: amenity.requiereAprobacion,
      anticipacionMinima: amenity.anticipacionMinima,
      anticipacionMaxima: amenity.anticipacionMaxima,
      duracionMaxima: amenity.duracionMaxima,
      costoReserva: amenity.costoReserva ? parseFloat(amenity.costoReserva.toString()) : null,
      activo: amenity.activo,
      createdAt: amenity.createdAt,
    };
  }

  /**
   * Actualiza un amenity (solo admins)
   */
  async actualizarAmenity(
    amenityId: string,
    dto: UpdateAmenityDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<AmenityResponseDto> {
    // Verificar permiso
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    // Verificar que existe
    const amenityActual = await this.prisma.amenity.findFirst({
      where: { id: amenityId, consorcioId },
    });

    if (!amenityActual) {
      throw new NotFoundException('Amenity no encontrado');
    }

    // Preparar datos de actualización
    const datosUpdate: Prisma.AmenityUpdateInput = {};

    if (dto.nombre !== undefined) {
      const nombreSanitizado = sanitizeText(dto.nombre);
      
      // Verificar que no exista otro con el mismo nombre
      const existente = await this.prisma.amenity.findFirst({
        where: {
          consorcioId,
          nombre: { equals: nombreSanitizado, mode: 'insensitive' },
          id: { not: amenityId },
        },
      });

      if (existente) {
        throw new ConflictException(`Ya existe un amenity con el nombre "${nombreSanitizado}"`);
      }

      datosUpdate.nombre = nombreSanitizado;
    }

    if (dto.descripcion !== undefined) {
      datosUpdate.descripcion = dto.descripcion ? sanitizeText(dto.descripcion) : null;
    }

    if (dto.capacidad !== undefined) datosUpdate.capacidad = dto.capacidad;
    if (dto.requiereAprobacion !== undefined) datosUpdate.requiereAprobacion = dto.requiereAprobacion;
    if (dto.anticipacionMinima !== undefined) datosUpdate.anticipacionMinima = dto.anticipacionMinima;
    if (dto.anticipacionMaxima !== undefined) datosUpdate.anticipacionMaxima = dto.anticipacionMaxima;
    if (dto.duracionMaxima !== undefined) datosUpdate.duracionMaxima = dto.duracionMaxima;
    if (dto.activo !== undefined) datosUpdate.activo = dto.activo;

    if (dto.costoReserva !== undefined) {
      datosUpdate.costoReserva = dto.costoReserva !== null 
        ? new Prisma.Decimal(dto.costoReserva) 
        : null;
    }

    const amenityActualizado = await this.prisma.amenity.update({
      where: { id: amenityId },
      data: datosUpdate,
    });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Amenity',
      entidadId: amenityId,
      datosAnteriores: amenityActual,
      datosNuevos: amenityActualizado,
    });

    return {
      id: amenityActualizado.id,
      nombre: amenityActualizado.nombre,
      descripcion: amenityActualizado.descripcion,
      capacidad: amenityActualizado.capacidad,
      requiereAprobacion: amenityActualizado.requiereAprobacion,
      anticipacionMinima: amenityActualizado.anticipacionMinima,
      anticipacionMaxima: amenityActualizado.anticipacionMaxima,
      duracionMaxima: amenityActualizado.duracionMaxima,
      costoReserva: amenityActualizado.costoReserva 
        ? parseFloat(amenityActualizado.costoReserva.toString()) 
        : null,
      activo: amenityActualizado.activo,
      createdAt: amenityActualizado.createdAt,
    };
  }

  /**
   * Elimina un amenity (solo si no tiene reservas futuras)
   */
  async eliminarAmenity(
    amenityId: string,
    usuarioId: string,
    consorcioId: string,
  ): Promise<void> {
    // Verificar permiso
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const amenity = await this.prisma.amenity.findFirst({
      where: { id: amenityId, consorcioId },
      include: {
        _count: {
          select: {
            reservas: {
              where: {
                fechaInicio: { gte: new Date() },
                aprobada: { not: false },
              },
            },
          },
        },
      },
    });

    if (!amenity) {
      throw new NotFoundException('Amenity no encontrado');
    }

    if (amenity._count.reservas > 0) {
      throw new BadRequestException(
        `No se puede eliminar el amenity porque tiene ${amenity._count.reservas} reservas futuras activas. ` +
        'Desactivelo en su lugar o cancele las reservas primero.'
      );
    }

    await this.prisma.amenity.delete({
      where: { id: amenityId },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'Amenity',
      entidadId: amenityId,
      datosAnteriores: amenity,
    });

    this.logger.log(`Amenity eliminado: ${amenity.nombre} (${amenityId})`);
  }

  // ==========================================================================
  // RESERVAS
  // ==========================================================================

  /**
   * Crea una nueva reserva
   */
  async crearReserva(
    dto: CreateReservaDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<ReservaResponseDto> {
    // Verificar que puede reservar
    await this.verificarPuedeReservar(usuarioId, consorcioId);

    // Obtener el amenity
    const amenity = await this.prisma.amenity.findFirst({
      where: { id: dto.amenityId, consorcioId, activo: true },
    });

    if (!amenity) {
      throw new NotFoundException('Amenity no encontrado o no disponible');
    }

    const fechaInicio = new Date(dto.fechaInicio);
    const fechaFin = new Date(dto.fechaFin);
    const ahora = new Date();

    // Validaciones de fecha
    if (fechaFin <= fechaInicio) {
      throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio');
    }

    // Verificar anticipación mínima
    const horasHastaReserva = (fechaInicio.getTime() - ahora.getTime()) / (1000 * 60 * 60);
    if (horasHastaReserva < amenity.anticipacionMinima) {
      throw new BadRequestException(
        `Debe reservar con al menos ${amenity.anticipacionMinima} horas de anticipación`
      );
    }

    // Verificar anticipación máxima
    if (horasHastaReserva > amenity.anticipacionMaxima) {
      throw new BadRequestException(
        `No puede reservar con más de ${amenity.anticipacionMaxima} horas de anticipación`
      );
    }

    // Verificar duración máxima
    const duracionHoras = (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60);
    if (duracionHoras > amenity.duracionMaxima) {
      throw new BadRequestException(
        `La duración máxima de la reserva es ${amenity.duracionMaxima} horas`
      );
    }

    // Verificar penalización activa
    await this.verificarPenalizacionActiva(usuarioId, consorcioId);

    // Verificar reglas de límite de reservas
    await this.verificarLimitesReserva(usuarioId, amenity.id, consorcioId, fechaInicio);

    // Verificar conflictos de horario
    await this.verificarConflictoHorario(dto.amenityId, fechaInicio, fechaFin);

    // Verificar deuda (regla de negocio: morosos no pueden reservar)
    await this.verificarDeudaUsuario(usuarioId, consorcioId);

    // Crear reserva
    const reserva = await this.prisma.reservaAmenity.create({
      data: {
        amenityId: dto.amenityId,
        usuarioId,
        fechaInicio,
        fechaFin,
        motivo: dto.motivo ? sanitizeText(dto.motivo) : null,
        aprobada: amenity.requiereAprobacion ? null : true, // Auto-aprobar si no requiere
      },
      include: {
        amenity: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'ReservaAmenity',
      entidadId: reserva.id,
      datosNuevos: reserva,
    });

    this.logger.log(
      `Reserva creada: ${reserva.id} para ${amenity.nombre} el ${fechaInicio.toISOString()}`
    );

    return {
      id: reserva.id,
      amenityId: reserva.amenityId,
      usuarioId: reserva.usuarioId,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      motivo: reserva.motivo,
      aprobada: reserva.aprobada,
      createdAt: reserva.createdAt,
      amenity: reserva.amenity,
      usuario: reserva.usuario,
      estadoCalculado: calcularEstadoReserva(reserva as any),
      puedeCancelarse: puedeCancelarReserva(reserva),
    };
  }

  /**
   * Lista reservas del consorcio (admin) o del usuario
   */
  async listarReservas(
    consorcioId: string,
    usuarioId: string,
    esAdmin: boolean,
    filtros: FiltrosReservaDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ReservaResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.ReservaAmenityWhereInput = {
      amenity: { consorcioId },
    };

    // Si no es admin, solo puede ver sus propias reservas
    if (!esAdmin || filtros.soloMias) {
      where.usuarioId = usuarioId;
    }

    // Filtrar por amenity
    if (filtros.amenityId) {
      where.amenityId = filtros.amenityId;
    }

    // Filtrar por fechas
    if (filtros.fechaDesde) {
      where.fechaInicio = { gte: new Date(filtros.fechaDesde) };
    }
    if (filtros.fechaHasta) {
      where.fechaFin = { 
        ...(where.fechaFin as any || {}),
        lte: new Date(filtros.fechaHasta + 'T23:59:59.999Z'),
      };
    }

    // Filtrar por estado
    if (filtros.estado) {
      if (filtros.estado === 'pendiente') {
        where.aprobada = null;
      } else if (filtros.estado === 'aprobada') {
        where.aprobada = true;
      } else if (filtros.estado === 'rechazada') {
        where.aprobada = false;
      }
    }

    const [reservas, total] = await Promise.all([
      this.prisma.reservaAmenity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fechaInicio: 'asc' },
        include: {
          amenity: { select: { id: true, nombre: true } },
          usuario: { select: { id: true, nombre: true, apellido: true } },
          penalizacion: { select: { tipo: true } },
        },
      }),
      this.prisma.reservaAmenity.count({ where }),
    ]);

    return {
      data: reservas.map((r) => ({
        id: r.id,
        amenityId: r.amenityId,
        usuarioId: r.usuarioId,
        fechaInicio: r.fechaInicio,
        fechaFin: r.fechaFin,
        motivo: r.motivo,
        aprobada: r.aprobada,
        createdAt: r.createdAt,
        amenity: r.amenity,
        usuario: esAdmin ? r.usuario : undefined, // Solo admin ve el usuario
        estadoCalculado: calcularEstadoReserva(r),
        puedeCancelarse: puedeCancelarReserva(r),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene detalle de una reserva
   */
  async obtenerReserva(
    reservaId: string,
    usuarioId: string,
    esAdmin: boolean,
    consorcioId: string,
  ): Promise<ReservaResponseDto> {
    const reserva = await this.prisma.reservaAmenity.findFirst({
      where: {
        id: reservaId,
        amenity: { consorcioId },
        ...(esAdmin ? {} : { usuarioId }),
      },
      include: {
        amenity: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true, apellido: true } },
        penalizacion: true,
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    return {
      id: reserva.id,
      amenityId: reserva.amenityId,
      usuarioId: reserva.usuarioId,
      fechaInicio: reserva.fechaInicio,
      fechaFin: reserva.fechaFin,
      motivo: reserva.motivo,
      aprobada: reserva.aprobada,
      createdAt: reserva.createdAt,
      amenity: reserva.amenity,
      usuario: esAdmin ? reserva.usuario : undefined,
      estadoCalculado: calcularEstadoReserva(reserva),
      puedeCancelarse: puedeCancelarReserva(reserva),
    };
  }

  /**
   * Aprueba o rechaza una reserva (solo admin)
   */
  async gestionarAprobacion(
    reservaId: string,
    dto: UpdateReservaDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<ReservaResponseDto> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const reserva = await this.prisma.reservaAmenity.findFirst({
      where: { id: reservaId, amenity: { consorcioId } },
      include: {
        amenity: true,
        usuario: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Solo se pueden aprobar/rechazar reservas pendientes
    if (reserva.aprobada !== null) {
      throw new BadRequestException(
        `La reserva ya fue ${reserva.aprobada ? 'aprobada' : 'rechazada'}`
      );
    }

    // Verificar que la reserva es futura
    if (reserva.fechaInicio < new Date()) {
      throw new BadRequestException('No se puede gestionar una reserva pasada');
    }

    const reservaActualizada = await this.prisma.reservaAmenity.update({
      where: { id: reservaId },
      data: { aprobada: dto.aprobada },
      include: {
        amenity: { select: { id: true, nombre: true } },
        usuario: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'ReservaAmenity',
      entidadId: reservaId,
      datosAnteriores: { aprobada: null },
      datosNuevos: { aprobada: dto.aprobada, motivoRechazo: dto.motivoRechazo },
    });

    // Enviar notificación al usuario
    const estadoTexto = dto.aprobada ? 'aprobada' : 'rechazada';
    await this.notificacionesService.crearNotificacion({
      usuarioId: reservaActualizada.usuarioId,
      titulo: `Reserva ${estadoTexto}`,
      mensaje: dto.aprobada
        ? `Tu reserva de ${reservaActualizada.amenity.nombre} fue aprobada.`
        : `Tu reserva de ${reservaActualizada.amenity.nombre} fue rechazada. ${dto.motivoRechazo ? `Motivo: ${dto.motivoRechazo}` : ''}`,
      tipo: TipoNotificacion.SISTEMA,
      referenciaId: reservaId,
      referenciaTipo: 'ReservaAmenity',
    });

    return {
      id: reservaActualizada.id,
      amenityId: reservaActualizada.amenityId,
      usuarioId: reservaActualizada.usuarioId,
      fechaInicio: reservaActualizada.fechaInicio,
      fechaFin: reservaActualizada.fechaFin,
      motivo: reservaActualizada.motivo,
      aprobada: reservaActualizada.aprobada,
      createdAt: reservaActualizada.createdAt,
      amenity: reservaActualizada.amenity,
      usuario: reservaActualizada.usuario,
      estadoCalculado: calcularEstadoReserva(reservaActualizada as any),
      puedeCancelarse: puedeCancelarReserva(reservaActualizada),
    };
  }

  /**
   * Cancela una reserva
   */
  async cancelarReserva(
    reservaId: string,
    dto: CancelarReservaDto,
    usuarioId: string,
    esAdmin: boolean,
    consorcioId: string,
  ): Promise<void> {
    const reserva = await this.prisma.reservaAmenity.findFirst({
      where: {
        id: reservaId,
        amenity: { consorcioId },
        ...(esAdmin ? {} : { usuarioId }),
      },
      include: {
        amenity: { include: { reglas: { where: { activa: true, tipoRegla: 'penalizacion' } } } },
      },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verificar si puede cancelar (salvo admin que puede siempre)
    if (!esAdmin && !puedeCancelarReserva(reserva)) {
      throw new BadRequestException(
        'No puede cancelar la reserva con menos de 24 horas de anticipación. ' +
        'Contacte al administrador.'
      );
    }

    // Verificar si aplica penalización por cancelación tardía
    let penalizacion = null;
    if (!esAdmin) {
      const horasHastaReserva = 
        (reserva.fechaInicio.getTime() - Date.now()) / (1000 * 60 * 60);
      
      // Buscar regla de penalización aplicable
      for (const regla of reserva.amenity.reglas) {
        const config = regla.configuracion as any;
        if (config.horasAnticipacion && horasHastaReserva < config.horasAnticipacion) {
          // Crear penalización
          penalizacion = await this.prisma.penalizacionReserva.create({
            data: {
              usuarioId,
              reservaId,
              tipo: 'multa',
              motivo: dto.motivo || 'Cancelación tardía',
              montoMulta: config.montoMulta ? new Prisma.Decimal(config.montoMulta) : null,
              diasBloqueo: config.bloquearDias || null,
              fechaFinBloqueo: config.bloquearDias 
                ? new Date(Date.now() + config.bloquearDias * 24 * 60 * 60 * 1000)
                : null,
            },
          });
          break;
        }
      }
    }

    // Marcar como rechazada (= cancelada)
    await this.prisma.reservaAmenity.update({
      where: { id: reservaId },
      data: { aprobada: false },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'ReservaAmenity',
      entidadId: reservaId,
      datosAnteriores: { aprobada: reserva.aprobada },
      datosNuevos: { 
        aprobada: false, 
        canceladaPor: esAdmin ? 'admin' : 'usuario',
        motivo: dto.motivo,
        penalizacionId: penalizacion?.id,
      },
    });

    this.logger.log(`Reserva ${reservaId} cancelada por ${esAdmin ? 'admin' : 'usuario'}`);
  }

  // ==========================================================================
  // DISPONIBILIDAD
  // ==========================================================================

  /**
   * Consulta disponibilidad de amenities para una fecha
   */
  async consultarDisponibilidad(
    consorcioId: string,
    filtros: FiltrosDisponibilidadDto,
  ): Promise<DisponibilidadResponseDto[]> {
    const fecha = new Date(filtros.fecha);
    const fechaInicioDia = new Date(fecha.setHours(0, 0, 0, 0));
    const fechaFinDia = new Date(fecha.setHours(23, 59, 59, 999));

    // Obtener amenities
    const whereAmenity: Prisma.AmenityWhereInput = {
      consorcioId,
      activo: true,
    };
    if (filtros.amenityId) {
      whereAmenity.id = filtros.amenityId;
    }

    const amenities = await this.prisma.amenity.findMany({
      where: whereAmenity,
      include: {
        reservas: {
          where: {
            fechaInicio: { lte: fechaFinDia },
            fechaFin: { gte: fechaInicioDia },
            aprobada: { not: false }, // Pendientes y aprobadas ocupan slot
          },
        },
      },
    });

    return amenities.map((amenity) => {
      // Generar slots de hora en hora
      const slotsDisponibles: string[] = [];
      const reservasDelDia = amenity.reservas.map((r) => ({
        inicio: r.fechaInicio.toTimeString().slice(0, 5),
        fin: r.fechaFin.toTimeString().slice(0, 5),
        aprobada: r.aprobada,
      }));

      // Horario típico: 8:00 a 22:00
      for (let hora = 8; hora < 22; hora++) {
        const slot = `${hora.toString().padStart(2, '0')}:00`;
        const slotOcupado = reservasDelDia.some((r) => {
          const horaSlot = hora;
          const horaInicio = parseInt(r.inicio.split(':')[0] || '0', 10);
          const horaFin = parseInt(r.fin.split(':')[0] || '0', 10);
          return horaSlot >= horaInicio && horaSlot < horaFin;
        });
        
        if (!slotOcupado) {
          slotsDisponibles.push(slot);
        }
      }

      return {
        amenityId: amenity.id,
        nombreAmenity: amenity.nombre,
        fecha: filtros.fecha,
        slotsDisponibles,
        reservasExistentes: reservasDelDia,
      };
    });
  }

  // ==========================================================================
  // ESTADÍSTICAS DEL USUARIO
  // ==========================================================================

  /**
   * Obtiene estadísticas de reservas del usuario
   */
  async obtenerMisStats(
    usuarioId: string,
    consorcioId: string,
  ): Promise<MisReservasStatsDto> {
    const ahora = new Date();

    const [
      totalReservas,
      pendientes,
      proximasAprobadas,
      rechazadas,
      penalizacionActiva,
    ] = await Promise.all([
      this.prisma.reservaAmenity.count({
        where: { usuarioId, amenity: { consorcioId } },
      }),
      this.prisma.reservaAmenity.count({
        where: { usuarioId, amenity: { consorcioId }, aprobada: null },
      }),
      this.prisma.reservaAmenity.count({
        where: {
          usuarioId,
          amenity: { consorcioId },
          aprobada: true,
          fechaInicio: { gte: ahora },
        },
      }),
      this.prisma.reservaAmenity.count({
        where: { usuarioId, amenity: { consorcioId }, aprobada: false },
      }),
      this.prisma.penalizacionReserva.findFirst({
        where: {
          usuarioId,
          fechaFinBloqueo: { gte: ahora },
        },
      }),
    ]);

    return {
      totalReservas,
      pendientes,
      proximasAprobadas,
      rechazadas,
      tienePenalizacionActiva: !!penalizacionActiva,
      fechaFinPenalizacion: penalizacionActiva?.fechaFinBloqueo || null,
    };
  }

  // ==========================================================================
  // VERIFICACIONES PRIVADAS
  // ==========================================================================

  /**
   * Verifica que el usuario tiene permiso de gestión en el consorcio
   */
  private async verificarPermisoGestion(
    usuarioId: string,
    consorcioId: string,
  ): Promise<void> {
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        activo: true,
        rol: { in: ROLES_GESTION },
      },
    });

    if (!vinculo) {
      throw new ForbiddenException('No tiene permiso de gestión de amenities');
    }
  }

  /**
   * Verifica que el usuario puede hacer reservas
   */
  private async verificarPuedeReservar(
    usuarioId: string,
    consorcioId: string,
  ): Promise<void> {
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        activo: true,
        rol: { in: ROLES_PUEDEN_RESERVAR },
      },
    });

    if (!vinculo) {
      throw new ForbiddenException('No tiene permiso para realizar reservas');
    }
  }

  /**
   * Verifica que el usuario no tiene penalización activa
   */
  private async verificarPenalizacionActiva(
    usuarioId: string,
    consorcioId: string,
  ): Promise<void> {
    const penalizacion = await this.prisma.penalizacionReserva.findFirst({
      where: {
        usuarioId,
        fechaFinBloqueo: { gte: new Date() },
        reserva: { amenity: { consorcioId } },
      },
    });

    if (penalizacion) {
      const fechaFin = penalizacion.fechaFinBloqueo!.toLocaleDateString('es-AR');
      throw new ForbiddenException(
        `Tiene una penalización activa hasta el ${fechaFin}. ` +
        `Motivo: ${penalizacion.motivo}`
      );
    }
  }

  /**
   * Verifica límites de reserva según reglas configuradas
   */
  private async verificarLimitesReserva(
    usuarioId: string,
    amenityId: string,
    consorcioId: string,
    fechaReserva: Date,
  ): Promise<void> {
    // Obtener reglas de límite
    const reglas = await this.prisma.reglaReservaAmenity.findMany({
      where: {
        amenityId,
        consorcioId,
        tipoRegla: 'limite_periodo',
        activa: true,
      },
      orderBy: { prioridad: 'desc' },
    });

    for (const regla of reglas) {
      const config = regla.configuracion as any;
      
      // Verificar si aplica a este día de la semana
      if (config.diasSemana && config.diasSemana.length > 0) {
        const diaSemana = fechaReserva.getDay();
        if (!config.diasSemana.includes(diaSemana)) {
          continue; // Esta regla no aplica a este día
        }
      }

      // Calcular período
      let fechaInicioPeriodo: Date;
      const ahora = new Date();
      
      switch (config.periodo) {
        case 'semana':
          fechaInicioPeriodo = new Date(ahora);
          fechaInicioPeriodo.setDate(ahora.getDate() - ahora.getDay());
          break;
        case 'mes':
          fechaInicioPeriodo = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
          break;
        default:
          continue;
      }

      // Contar reservas en el período
      const reservasEnPeriodo = await this.prisma.reservaAmenity.count({
        where: {
          usuarioId,
          amenityId,
          aprobada: { not: false },
          fechaInicio: { gte: fechaInicioPeriodo },
        },
      });

      if (reservasEnPeriodo >= config.maxReservas) {
        throw new BadRequestException(
          `Ha alcanzado el límite de ${config.maxReservas} reservas por ${config.periodo} ` +
          `para este amenity. ${regla.descripcion || ''}`
        );
      }
    }
  }

  /**
   * Verifica que no hay conflicto de horario
   */
  private async verificarConflictoHorario(
    amenityId: string,
    fechaInicio: Date,
    fechaFin: Date,
    reservaIdExcluir?: string,
  ): Promise<void> {
    const conflicto = await this.prisma.reservaAmenity.findFirst({
      where: {
        amenityId,
        aprobada: { not: false }, // Pendientes y aprobadas cuentan
        id: reservaIdExcluir ? { not: reservaIdExcluir } : undefined,
        OR: [
          // La nueva reserva empieza durante una existente
          {
            fechaInicio: { lte: fechaInicio },
            fechaFin: { gt: fechaInicio },
          },
          // La nueva reserva termina durante una existente
          {
            fechaInicio: { lt: fechaFin },
            fechaFin: { gte: fechaFin },
          },
          // La nueva reserva contiene a una existente
          {
            fechaInicio: { gte: fechaInicio },
            fechaFin: { lte: fechaFin },
          },
        ],
      },
    });

    if (conflicto) {
      const inicio = conflicto.fechaInicio.toLocaleString('es-AR');
      const fin = conflicto.fechaFin.toLocaleString('es-AR');
      throw new ConflictException(
        `Ya existe una reserva en ese horario (${inicio} - ${fin})`
      );
    }
  }

  /**
   * Verifica que el usuario no tiene deuda excesiva (2+ expensas)
   */
  private async verificarDeudaUsuario(
    usuarioId: string,
    consorcioId: string,
  ): Promise<void> {
    // Buscar UF del usuario en este consorcio
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        unidadFuncionalId: { not: null },
      },
      select: { unidadFuncionalId: true },
    });

    if (!vinculo?.unidadFuncionalId) {
      return; // No tiene UF asociada (puede ser admin sin UF)
    }

    // Calcular saldo de la UF (simplificado: último movimiento)
    const ultimoMovimiento = await this.prisma.movimientoCuentaCorriente.findFirst({
      where: { unidadFuncionalId: vinculo.unidadFuncionalId },
      orderBy: { fecha: 'desc' },
    });

    if (ultimoMovimiento && parseFloat(ultimoMovimiento.saldoResultante.toString()) > 0) {
      // Verificar si la deuda es mayor a 2 expensas (aproximado)
      const ultimaExpensa = await this.prisma.expensa.findFirst({
        where: { consorcioId, estado: 'PUBLICADA' },
        orderBy: { periodo: 'desc' },
      });

      if (ultimaExpensa) {
        const promedioExpensa = parseFloat(ultimaExpensa.totalGastosOrdinarios.toString()) / 10; // Aprox por UF
        const deuda = parseFloat(ultimoMovimiento.saldoResultante.toString());
        
        if (deuda > promedioExpensa * 2) {
          throw new ForbiddenException(
            'No puede realizar reservas mientras tenga deuda pendiente de más de 2 expensas. ' +
            'Por favor regularice su situación.'
          );
        }
      }
    }
  }
}
