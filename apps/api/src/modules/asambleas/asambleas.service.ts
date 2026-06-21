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
import { Rol, EstadoAsamblea, TipoVoto, Prisma, TipoVinculoUF } from '@prisma/client';
import * as crypto from 'node:crypto';
import {
  CreateAsambleaDto,
  UpdateAsambleaDto,
  CreatePuntoOrdenDto,
  UpdatePuntoOrdenDto,
  RegistrarAsistenciaDto,
  EmitirVotoDto,
  FiltrosAsambleaDto,
  GenerarActaDto,
  AsambleaResponseDto,
  PuntoOrdenResponseDto,
  AsistenciaResponseDto,
  ResultadoVotacionDto,
  MiVotoDto,
} from './dto';

// ============================================================================
// ROLES CON PERMISOS
// ============================================================================

const ROLES_GESTION: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
];

const ROLES_PUEDEN_VOTAR: Rol[] = [
  Rol.PROPIETARIO, // Solo propietarios votan
];

const ROLES_PUEDEN_VER: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
  Rol.PROPIETARIO,
  Rol.AUDITOR,
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
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#x27;')
    .replaceAll('/', '&#x2F;')
    .trim();
}

/**
 * Genera hash SHA-256 para integridad de votos
 */
function generarHashVoto(
  puntoOrdenId: string,
  usuarioId: string,
  voto: TipoVoto,
  coeficiente: string,
  timestamp: Date,
): string {
  const data = `${puntoOrdenId}:${usuarioId}:${voto}:${coeficiente}:${timestamp.toISOString()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Genera hash para integridad del acta
 */
function generarHashActa(contenido: string): string {
  return crypto.createHash('sha256').update(contenido).digest('hex');
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

@Injectable()
export class AsambleasService {
  private readonly logger = new Logger(AsambleasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================================================
  // ASAMBLEAS CRUD
  // ==========================================================================

  /**
   * Lista asambleas del consorcio
   */
  async listarAsambleas(
    consorcioId: string,
    filtros: FiltrosAsambleaDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: AsambleaResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.AsambleaWhereInput = { consorcioId };

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.fechaDesde) {
      where.fecha = { gte: new Date(filtros.fechaDesde) };
    }

    if (filtros.fechaHasta) {
      const existingFecha = where.fecha as Prisma.DateTimeFilter | undefined;
      where.fecha = {
        ...existingFecha,
        lte: new Date(filtros.fechaHasta + 'T23:59:59.999Z'),
      };
    }

    const [asambleas, total] = await Promise.all([
      this.prisma.asamblea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha: 'desc' },
        include: {
          _count: {
            select: {
              puntosOrden: true,
              asistencias: { where: { presente: true } },
            },
          },
        },
      }),
      this.prisma.asamblea.count({ where }),
    ]);

    return {
      data: asambleas.map((a) => ({
        id: a.id,
        consorcioId: a.consorcioId,
        titulo: a.titulo,
        descripcion: a.descripcion,
        fecha: a.fecha,
        lugar: a.lugar,
        linkVirtual: a.linkVirtual,
        estado: a.estado,
        quorumRequerido: Number.parseFloat(a.quorumRequerido.toString()),
        actaUrl: a.actaUrl,
        createdAt: a.createdAt,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene detalle de una asamblea
   */
  async obtenerAsamblea(
    asambleaId: string,
    consorcioId: string,
    esAdmin: boolean,
  ): Promise<AsambleaResponseDto> {
    const asamblea = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
      include: {
        puntosOrden: {
          orderBy: { orden: 'asc' },
          include: {
            votos: true,
          },
        },
        asistencias: {
          include: {
            // No hay relación directa con Usuario en AsistenciaAsamblea según schema
          },
        },
      },
    });

    if (!asamblea) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    // Calcular quórum actual
    const quorumInfo = await this.calcularQuorum(asamblea.id, consorcioId);

    // Mapear puntos con resultados de votación
    const puntosConResultados: PuntoOrdenResponseDto[] = asamblea.puntosOrden.map((p) => {
      let resultadoVotacion = undefined;
      
      if (p.requiereVotacion && p.votos.length > 0) {
        const aFavor = p.votos
          .filter((v) => v.voto === TipoVoto.A_FAVOR)
          .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
        const enContra = p.votos
          .filter((v) => v.voto === TipoVoto.EN_CONTRA)
          .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
        const abstenciones = p.votos
          .filter((v) => v.voto === TipoVoto.ABSTENCION)
          .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
        const totalCoeficiente = aFavor + enContra + abstenciones;
        const porcentajeAFavor = totalCoeficiente > 0 ? (aFavor / totalCoeficiente) * 100 : 0;
        const mayoriaReq = p.mayoriaRequerida ? Number.parseFloat(p.mayoriaRequerida.toString()) : 50.01;

        resultadoVotacion = {
          aFavor,
          enContra,
          abstenciones,
          totalCoeficiente,
          porcentajeAFavor,
          aprobado: asamblea.estado === EstadoAsamblea.FINALIZADA 
            ? porcentajeAFavor >= mayoriaReq 
            : null,
        };
      }

      return {
        id: p.id,
        orden: p.orden,
        titulo: p.titulo,
        descripcion: p.descripcion,
        requiereVotacion: p.requiereVotacion,
        mayoriaRequerida: p.mayoriaRequerida ? Number.parseFloat(p.mayoriaRequerida.toString()) : null,
        resultadoVotacion,
      };
    });

    return {
      id: asamblea.id,
      consorcioId: asamblea.consorcioId,
      titulo: asamblea.titulo,
      descripcion: asamblea.descripcion,
      fecha: asamblea.fecha,
      lugar: asamblea.lugar,
      linkVirtual: asamblea.linkVirtual,
      estado: asamblea.estado,
      quorumRequerido: Number.parseFloat(asamblea.quorumRequerido.toString()),
      actaUrl: asamblea.actaUrl,
      createdAt: asamblea.createdAt,
      puntosOrden: puntosConResultados,
      quorum: quorumInfo,
    };
  }

  /**
   * Crea una nueva asamblea
   */
  async crearAsamblea(
    dto: CreateAsambleaDto,
    usuarioId: string,
  ): Promise<AsambleaResponseDto> {
    await this.verificarPermisoGestion(usuarioId, dto.consorcioId);

    const fecha = new Date(dto.fecha);
    const ahora = new Date();

    // Validar que la fecha sea futura
    if (fecha <= ahora) {
      throw new BadRequestException('La fecha de la asamblea debe ser futura');
    }

    // Validar que no haya otra asamblea el mismo día
    const inicioDia = new Date(fecha);
    inicioDia.setHours(0, 0, 0, 0);
    const finDia = new Date(fecha);
    finDia.setHours(23, 59, 59, 999);

    const asambleaExistente = await this.prisma.asamblea.findFirst({
      where: {
        consorcioId: dto.consorcioId,
        fecha: { gte: inicioDia, lte: finDia },
        estado: { not: EstadoAsamblea.CANCELADA },
      },
    });

    if (asambleaExistente) {
      throw new ConflictException('Ya existe una asamblea programada para ese día');
    }

    const asamblea = await this.prisma.asamblea.create({
      data: {
        consorcioId: dto.consorcioId,
        titulo: sanitizeText(dto.titulo),
        descripcion: dto.descripcion ? sanitizeText(dto.descripcion) : null,
        fecha,
        lugar: dto.lugar ? sanitizeText(dto.lugar) : null,
        linkVirtual: dto.linkVirtual || null,
        quorumRequerido: new Prisma.Decimal(dto.quorumRequerido),
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Asamblea',
      entidadId: asamblea.id,
      datosNuevos: asamblea,
    });

    this.logger.log(`Asamblea creada: ${asamblea.titulo} (${asamblea.id})`);

    return {
      id: asamblea.id,
      consorcioId: asamblea.consorcioId,
      titulo: asamblea.titulo,
      descripcion: asamblea.descripcion,
      fecha: asamblea.fecha,
      lugar: asamblea.lugar,
      linkVirtual: asamblea.linkVirtual,
      estado: asamblea.estado,
      quorumRequerido: Number.parseFloat(asamblea.quorumRequerido.toString()),
      actaUrl: asamblea.actaUrl,
      createdAt: asamblea.createdAt,
    };
  }

  /**
   * Actualiza una asamblea
   */
  async actualizarAsamblea(
    asambleaId: string,
    dto: UpdateAsambleaDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<AsambleaResponseDto> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const asambleaActual = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
    });

    if (!asambleaActual) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    // Solo se pueden editar asambleas PROGRAMADAS
    if (asambleaActual.estado !== EstadoAsamblea.PROGRAMADA) {
      throw new BadRequestException(
        `No se puede editar una asamblea en estado ${asambleaActual.estado}`
      );
    }

    const datosUpdate: Prisma.AsambleaUpdateInput = {};

    if (dto.titulo !== undefined) datosUpdate.titulo = sanitizeText(dto.titulo);
    if (dto.descripcion !== undefined) {
      datosUpdate.descripcion = dto.descripcion ? sanitizeText(dto.descripcion) : null;
    }
    if (dto.fecha !== undefined) {
      const fecha = new Date(dto.fecha);
      if (fecha <= new Date()) {
        throw new BadRequestException('La fecha debe ser futura');
      }
      datosUpdate.fecha = fecha;
    }
    if (dto.lugar !== undefined) datosUpdate.lugar = dto.lugar ? sanitizeText(dto.lugar) : null;
    if (dto.linkVirtual !== undefined) datosUpdate.linkVirtual = dto.linkVirtual || null;
    if (dto.quorumRequerido !== undefined) {
      datosUpdate.quorumRequerido = new Prisma.Decimal(dto.quorumRequerido);
    }

    const asambleaActualizada = await this.prisma.asamblea.update({
      where: { id: asambleaId },
      data: datosUpdate,
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Asamblea',
      entidadId: asambleaId,
      datosAnteriores: asambleaActual,
      datosNuevos: asambleaActualizada,
    });

    return {
      id: asambleaActualizada.id,
      consorcioId: asambleaActualizada.consorcioId,
      titulo: asambleaActualizada.titulo,
      descripcion: asambleaActualizada.descripcion,
      fecha: asambleaActualizada.fecha,
      lugar: asambleaActualizada.lugar,
      linkVirtual: asambleaActualizada.linkVirtual,
      estado: asambleaActualizada.estado,
      quorumRequerido: Number.parseFloat(asambleaActualizada.quorumRequerido.toString()),
      actaUrl: asambleaActualizada.actaUrl,
      createdAt: asambleaActualizada.createdAt,
    };
  }

  /**
   * Cambia el estado de una asamblea
   */
  async cambiarEstado(
    asambleaId: string,
    nuevoEstado: EstadoAsamblea,
    usuarioId: string,
    consorcioId: string,
  ): Promise<AsambleaResponseDto> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const asamblea = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
    });

    if (!asamblea) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    // Validar transiciones de estado permitidas
    const transicionesPermitidas: Record<EstadoAsamblea, EstadoAsamblea[]> = {
      [EstadoAsamblea.PROGRAMADA]: [EstadoAsamblea.EN_CURSO, EstadoAsamblea.CANCELADA],
      [EstadoAsamblea.EN_CURSO]: [EstadoAsamblea.FINALIZADA, EstadoAsamblea.CANCELADA],
      [EstadoAsamblea.FINALIZADA]: [], // No se puede cambiar
      [EstadoAsamblea.CANCELADA]: [], // No se puede cambiar
    };

    if (!transicionesPermitidas[asamblea.estado].includes(nuevoEstado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${asamblea.estado} a ${nuevoEstado}`
      );
    }

    // Si se inicia, verificar quórum
    if (nuevoEstado === EstadoAsamblea.EN_CURSO) {
      const quorum = await this.calcularQuorum(asambleaId, consorcioId);
      if (!quorum.alcanzado) {
        throw new BadRequestException(
          `No se alcanzó el quórum requerido. ` +
          `Actual: ${quorum.actual.toFixed(2)}%, Requerido: ${quorum.requerido}%`
        );
      }
    }

    await this.prisma.asamblea.update({
      where: { id: asambleaId },
      data: { estado: nuevoEstado },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Asamblea',
      entidadId: asambleaId,
      datosAnteriores: { estado: asamblea.estado },
      datosNuevos: { estado: nuevoEstado },
    });

    this.logger.log(`Asamblea ${asambleaId} cambió de ${asamblea.estado} a ${nuevoEstado}`);

    return this.obtenerAsamblea(asambleaId, consorcioId, true);
  }

  // ==========================================================================
  // PUNTOS DEL ORDEN DEL DÍA
  // ==========================================================================

  /**
   * Agrega un punto al orden del día
   */
  async agregarPuntoOrden(
    asambleaId: string,
    dto: CreatePuntoOrdenDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<PuntoOrdenResponseDto> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const asamblea = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
    });

    if (!asamblea) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    if (asamblea.estado !== EstadoAsamblea.PROGRAMADA) {
      throw new BadRequestException('Solo se pueden agregar puntos a asambleas programadas');
    }

    // Verificar si ya existe ese orden
    const existeOrden = await this.prisma.puntoOrdenDia.findFirst({
      where: { asambleaId, orden: dto.orden },
    });

    if (existeOrden) {
      throw new ConflictException(`Ya existe un punto con orden ${dto.orden}`);
    }

    const punto = await this.prisma.puntoOrdenDia.create({
      data: {
        asambleaId,
        orden: dto.orden,
        titulo: sanitizeText(dto.titulo),
        descripcion: dto.descripcion ? sanitizeText(dto.descripcion) : null,
        requiereVotacion: dto.requiereVotacion ?? false,
        mayoriaRequerida: dto.mayoriaRequerida === undefined 
          ? null
          : new Prisma.Decimal(dto.mayoriaRequerida),
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'PuntoOrdenDia',
      entidadId: punto.id,
      datosNuevos: punto,
    });

    return {
      id: punto.id,
      orden: punto.orden,
      titulo: punto.titulo,
      descripcion: punto.descripcion,
      requiereVotacion: punto.requiereVotacion,
      mayoriaRequerida: punto.mayoriaRequerida 
        ? Number.parseFloat(punto.mayoriaRequerida.toString()) 
        : null,
    };
  }

  /**
   * Actualiza un punto del orden del día
   */
  async actualizarPuntoOrden(
    puntoId: string,
    dto: UpdatePuntoOrdenDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<PuntoOrdenResponseDto> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const punto = await this.prisma.puntoOrdenDia.findFirst({
      where: { id: puntoId },
      include: { asamblea: true },
    });

    if (!punto || punto.asamblea.consorcioId !== consorcioId) {
      throw new NotFoundException('Punto no encontrado');
    }

    if (punto.asamblea.estado !== EstadoAsamblea.PROGRAMADA) {
      throw new BadRequestException('Solo se pueden editar puntos de asambleas programadas');
    }

    const datosUpdate: Prisma.PuntoOrdenDiaUpdateInput = {};

    if (dto.orden !== undefined) datosUpdate.orden = dto.orden;
    if (dto.titulo !== undefined) datosUpdate.titulo = sanitizeText(dto.titulo);
    if (dto.descripcion !== undefined) {
      datosUpdate.descripcion = dto.descripcion ? sanitizeText(dto.descripcion) : null;
    }
    if (dto.requiereVotacion !== undefined) datosUpdate.requiereVotacion = dto.requiereVotacion;
    if (dto.mayoriaRequerida !== undefined) {
      datosUpdate.mayoriaRequerida = dto.mayoriaRequerida === null 
        ? null
        : new Prisma.Decimal(dto.mayoriaRequerida);
    }

    const puntoActualizado = await this.prisma.puntoOrdenDia.update({
      where: { id: puntoId },
      data: datosUpdate,
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'PuntoOrdenDia',
      entidadId: puntoId,
      datosAnteriores: punto,
      datosNuevos: puntoActualizado,
    });

    return {
      id: puntoActualizado.id,
      orden: puntoActualizado.orden,
      titulo: puntoActualizado.titulo,
      descripcion: puntoActualizado.descripcion,
      requiereVotacion: puntoActualizado.requiereVotacion,
      mayoriaRequerida: puntoActualizado.mayoriaRequerida 
        ? Number.parseFloat(puntoActualizado.mayoriaRequerida.toString()) 
        : null,
    };
  }

  /**
   * Elimina un punto del orden del día
   */
  async eliminarPuntoOrden(
    puntoId: string,
    usuarioId: string,
    consorcioId: string,
  ): Promise<void> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const punto = await this.prisma.puntoOrdenDia.findFirst({
      where: { id: puntoId },
      include: { asamblea: true },
    });

    if (!punto || punto.asamblea.consorcioId !== consorcioId) {
      throw new NotFoundException('Punto no encontrado');
    }

    if (punto.asamblea.estado !== EstadoAsamblea.PROGRAMADA) {
      throw new BadRequestException('Solo se pueden eliminar puntos de asambleas programadas');
    }

    await this.prisma.puntoOrdenDia.delete({
      where: { id: puntoId },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'PuntoOrdenDia',
      entidadId: puntoId,
      datosAnteriores: punto,
    });
  }

  // ==========================================================================
  // ASISTENCIA
  // ==========================================================================

  /**
   * Registra asistencia de un usuario
   */
  async registrarAsistencia(
    asambleaId: string,
    dto: RegistrarAsistenciaDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<AsistenciaResponseDto> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const asamblea = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
    });

    if (!asamblea) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    // Solo se puede registrar asistencia en asambleas PROGRAMADAS o EN_CURSO
    const estadosPermitidos: EstadoAsamblea[] = [EstadoAsamblea.PROGRAMADA, EstadoAsamblea.EN_CURSO];
    if (!estadosPermitidos.includes(asamblea.estado)) {
      throw new BadRequestException(
        'Solo se puede registrar asistencia en asambleas programadas o en curso'
      );
    }

    // Verificar que el usuario es propietario del consorcio
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId: dto.usuarioId,
        consorcioId,
        rol: Rol.PROPIETARIO,
        tipoVinculo: TipoVinculoUF.TITULAR_VOTANTE, // Solo titulares votan
        activo: true,
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true } },
        unidadFuncional: { select: { coeficiente: true } },
      },
    });

    if (!vinculo) {
      throw new BadRequestException(
        'El usuario no es propietario titular votante del consorcio'
      );
    }

    // Upsert de asistencia
    const asistencia = await this.prisma.asistenciaAsamblea.upsert({
      where: {
        asambleaId_usuarioId: {
          asambleaId,
          usuarioId: dto.usuarioId,
        },
      },
      create: {
        asambleaId,
        usuarioId: dto.usuarioId,
        presente: dto.presente,
        representadoPor: dto.representadoPor ? sanitizeText(dto.representadoPor) : null,
        poderUrl: dto.poderUrl || null,
        horaRegistro: dto.presente ? new Date() : null,
      },
      update: {
        presente: dto.presente,
        representadoPor: dto.representadoPor ? sanitizeText(dto.representadoPor) : null,
        poderUrl: dto.poderUrl || null,
        horaRegistro: dto.presente ? new Date() : null,
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'AsistenciaAsamblea',
      entidadId: asistencia.id,
      datosNuevos: asistencia,
    });

    return {
      usuarioId: asistencia.usuarioId,
      presente: asistencia.presente,
      representadoPor: asistencia.representadoPor,
      horaRegistro: asistencia.horaRegistro,
      usuario: vinculo.usuario,
      coeficiente: vinculo.unidadFuncional 
        ? Number.parseFloat(vinculo.unidadFuncional.coeficiente.toString()) 
        : 0,
    };
  }

  /**
   * Lista asistencia de una asamblea
   */
  async listarAsistencia(
    asambleaId: string,
    consorcioId: string,
  ): Promise<AsistenciaResponseDto[]> {
    const asamblea = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
    });

    if (!asamblea) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    // Obtener todos los propietarios titulares del consorcio
    const propietarios = await this.prisma.usuarioConsorcio.findMany({
      where: {
        consorcioId,
        rol: Rol.PROPIETARIO,
        tipoVinculo: TipoVinculoUF.TITULAR_VOTANTE,
        activo: true,
      },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true } },
        unidadFuncional: { select: { coeficiente: true } },
      },
    });

    // Obtener asistencias registradas
    const asistencias = await this.prisma.asistenciaAsamblea.findMany({
      where: { asambleaId },
    });

    const asistenciasMap = new Map(asistencias.map((a) => [a.usuarioId, a]));

    return propietarios.map((p) => {
      const asistencia = asistenciasMap.get(p.usuarioId);
      return {
        usuarioId: p.usuarioId,
        presente: asistencia?.presente ?? false,
        representadoPor: asistencia?.representadoPor ?? null,
        horaRegistro: asistencia?.horaRegistro ?? null,
        usuario: p.usuario,
        coeficiente: p.unidadFuncional 
          ? Number.parseFloat(p.unidadFuncional.coeficiente.toString()) 
          : 0,
      };
    });
  }

  // ==========================================================================
  // VOTACIÓN
  // ==========================================================================

  /**
   * Emite un voto
   */
  async emitirVoto(
    puntoOrdenId: string,
    dto: EmitirVotoDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<MiVotoDto> {
    // Verificar que el usuario puede votar
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        rol: Rol.PROPIETARIO,
        tipoVinculo: TipoVinculoUF.TITULAR_VOTANTE,
        activo: true,
      },
      include: {
        unidadFuncional: { select: { coeficiente: true } },
      },
    });

    if (!vinculo || !vinculo.unidadFuncional) {
      throw new ForbiddenException('Solo propietarios titulares pueden votar');
    }

    // Verificar el punto y la asamblea
    const punto = await this.prisma.puntoOrdenDia.findFirst({
      where: { id: puntoOrdenId },
      include: { asamblea: true },
    });

    if (!punto || punto.asamblea.consorcioId !== consorcioId) {
      throw new NotFoundException('Punto de votación no encontrado');
    }

    // Verificar que la asamblea está EN_CURSO
    if (punto.asamblea.estado !== EstadoAsamblea.EN_CURSO) {
      throw new BadRequestException('Solo se puede votar durante la asamblea en curso');
    }

    // Verificar que el punto requiere votación
    if (!punto.requiereVotacion) {
      throw new BadRequestException('Este punto no requiere votación');
    }

    // Verificar que el usuario está presente
    const asistencia = await this.prisma.asistenciaAsamblea.findFirst({
      where: {
        asambleaId: punto.asambleaId,
        usuarioId,
        presente: true,
      },
    });

    if (!asistencia) {
      throw new ForbiddenException(
        'Debe estar registrado como presente para votar'
      );
    }

    // Verificar si ya votó
    const votoExistente = await this.prisma.votoAsamblea.findFirst({
      where: { puntoOrdenId, usuarioId },
    });

    if (votoExistente) {
      throw new ConflictException('Ya ha emitido su voto para este punto');
    }

    // Calcular coeficiente de voto
    const coeficiente = vinculo.unidadFuncional.coeficiente;
    const timestamp = new Date();

    // Generar hash de integridad
    const hashVoto = generarHashVoto(
      puntoOrdenId,
      usuarioId,
      dto.voto,
      coeficiente.toString(),
      timestamp,
    );

    // Crear el voto
    const voto = await this.prisma.votoAsamblea.create({
      data: {
        puntoOrdenId,
        usuarioId,
        voto: dto.voto,
        coeficienteVoto: coeficiente,
        timestampVoto: timestamp,
        hashVoto,
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'VotoAsamblea',
      entidadId: voto.id,
      datosNuevos: {
        puntoOrdenId,
        voto: dto.voto,
        coeficienteVoto: coeficiente.toString(),
        hashVoto,
      },
    });

    this.logger.log(
      `Voto emitido: Usuario ${usuarioId} votó ${dto.voto} en punto ${puntoOrdenId}`
    );

    return {
      puntoOrdenId: voto.puntoOrdenId,
      voto: voto.voto,
      timestampVoto: voto.timestampVoto,
    };
  }

  /**
   * Obtiene resultado de votación de un punto
   */
  async obtenerResultadoVotacion(
    puntoOrdenId: string,
    consorcioId: string,
    esAdmin: boolean,
  ): Promise<ResultadoVotacionDto> {
    const punto = await this.prisma.puntoOrdenDia.findFirst({
      where: { id: puntoOrdenId },
      include: {
        asamblea: true,
        votos: {
          include: {
            usuario: { select: { id: true, nombre: true, apellido: true } },
          },
        },
      },
    });

    if (!punto || punto.asamblea.consorcioId !== consorcioId) {
      throw new NotFoundException('Punto de votación no encontrado');
    }

    const aFavor = punto.votos
      .filter((v) => v.voto === TipoVoto.A_FAVOR)
      .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
    const enContra = punto.votos
      .filter((v) => v.voto === TipoVoto.EN_CONTRA)
      .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
    const abstenciones = punto.votos
      .filter((v) => v.voto === TipoVoto.ABSTENCION)
      .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);

    const totalCoeficiente = aFavor + enContra + abstenciones;
    const porcentajeAFavor = totalCoeficiente > 0 ? (aFavor / totalCoeficiente) * 100 : 0;
    const mayoriaRequerida = punto.mayoriaRequerida 
      ? Number.parseFloat(punto.mayoriaRequerida.toString()) 
      : 50.01;

    // Solo se determina aprobado cuando la asamblea finaliza
    const aprobado = punto.asamblea.estado === EstadoAsamblea.FINALIZADA
      ? porcentajeAFavor >= mayoriaRequerida
      : null;

    const resultado: ResultadoVotacionDto = {
      puntoOrdenId: punto.id,
      titulo: punto.titulo,
      aFavor,
      enContra,
      abstenciones,
      totalVotos: punto.votos.length,
      totalCoeficiente,
      porcentajeAFavor,
      mayoriaRequerida,
      aprobado,
    };

    // Solo admin ve el detalle de votos
    if (esAdmin) {
      resultado.votos = punto.votos.map((v) => ({
        usuarioId: v.usuarioId,
        nombre: `${v.usuario.nombre} ${v.usuario.apellido}`,
        voto: v.voto,
        coeficiente: Number.parseFloat(v.coeficienteVoto.toString()),
      }));
    }

    return resultado;
  }

  /**
   * Obtiene el voto del usuario actual
   */
  async obtenerMiVoto(
    puntoOrdenId: string,
    usuarioId: string,
    consorcioId: string,
  ): Promise<MiVotoDto | null> {
    const punto = await this.prisma.puntoOrdenDia.findFirst({
      where: { id: puntoOrdenId },
      include: { asamblea: true },
    });

    if (!punto || punto.asamblea.consorcioId !== consorcioId) {
      throw new NotFoundException('Punto de votación no encontrado');
    }

    const voto = await this.prisma.votoAsamblea.findFirst({
      where: { puntoOrdenId, usuarioId },
    });

    if (!voto) {
      return null;
    }

    return {
      puntoOrdenId: voto.puntoOrdenId,
      voto: voto.voto,
      timestampVoto: voto.timestampVoto,
    };
  }

  // ==========================================================================
  // QUÓRUM
  // ==========================================================================

  /**
   * Calcula el quórum actual de una asamblea
   */
  async calcularQuorum(
    asambleaId: string,
    consorcioId: string,
  ): Promise<{
    requerido: number;
    actual: number;
    alcanzado: boolean;
    presentes: number;
    totalPropietarios: number;
  }> {
    const asamblea = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
    });

    if (!asamblea) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    // Obtener total de coeficientes de propietarios titulares
    const propietarios = await this.prisma.usuarioConsorcio.findMany({
      where: {
        consorcioId,
        rol: Rol.PROPIETARIO,
        tipoVinculo: TipoVinculoUF.TITULAR_VOTANTE,
        activo: true,
      },
      include: {
        unidadFuncional: { select: { coeficiente: true } },
      },
    });

    const totalCoeficientes = propietarios.reduce(
      (sum, p) => sum + (p.unidadFuncional ? Number.parseFloat(p.unidadFuncional.coeficiente.toString()) : 0),
      0,
    );

    // Obtener presentes
    const asistencias = await this.prisma.asistenciaAsamblea.findMany({
      where: { asambleaId, presente: true },
    });

    const usuariosPresentes = new Set(asistencias.map((a) => a.usuarioId));

    const coeficientePresente = propietarios
      .filter((p) => usuariosPresentes.has(p.usuarioId))
      .reduce(
        (sum, p) => sum + (p.unidadFuncional ? Number.parseFloat(p.unidadFuncional.coeficiente.toString()) : 0),
        0,
      );

    const porcentajePresente = totalCoeficientes > 0 
      ? (coeficientePresente / totalCoeficientes) * 100 
      : 0;

    const requerido = Number.parseFloat(asamblea.quorumRequerido.toString());

    return {
      requerido,
      actual: porcentajePresente,
      alcanzado: porcentajePresente >= requerido,
      presentes: asistencias.length,
      totalPropietarios: propietarios.length,
    };
  }

  // ==========================================================================
  // ACTA
  // ==========================================================================

  /**
   * Genera el acta de la asamblea
   */
  async generarActa(
    asambleaId: string,
    dto: GenerarActaDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<{ actaUrl: string; actaHash: string }> {
    await this.verificarPermisoGestion(usuarioId, consorcioId);

    const asamblea = await this.prisma.asamblea.findFirst({
      where: { id: asambleaId, consorcioId },
      include: {
        puntosOrden: {
          orderBy: { orden: 'asc' },
          include: {
            votos: {
              include: {
                usuario: { select: { nombre: true, apellido: true } },
              },
            },
          },
        },
        asistencias: true,
        consorcio: { select: { nombre: true, direccion: true } },
      },
    });

    if (!asamblea) {
      throw new NotFoundException('Asamblea no encontrada');
    }

    if (asamblea.estado !== EstadoAsamblea.FINALIZADA) {
      throw new BadRequestException('Solo se puede generar acta de asambleas finalizadas');
    }

    if (asamblea.actaUrl) {
      // Ya existe acta, retornarla
      return {
        actaUrl: asamblea.actaUrl,
        actaHash: asamblea.actaHash || '',
      };
    }

    // Generar contenido del acta (texto estructurado)
    const contenidoActa = this.generarContenidoActa(asamblea, dto.observaciones);
    const hashActa = generarHashActa(contenidoActa);

    // NOTE [Fase 2]: Implementar almacenamiento en S3 y generación de PDF real
    // Por ahora, simulamos la URL
    const actaUrl = `https://cdn.vecinosimple.com/actas/${asamblea.id}/acta-${hashActa.slice(0, 8)}.pdf`;

    await this.prisma.asamblea.update({
      where: { id: asambleaId },
      data: {
        actaUrl,
        actaHash: hashActa,
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'ActaAsamblea',
      entidadId: asambleaId,
      datosNuevos: { actaUrl, actaHash: hashActa },
    });

    this.logger.log(`Acta generada para asamblea ${asambleaId}, hash: ${hashActa}`);

    return { actaUrl, actaHash: hashActa };
  }

  /**
   * Genera el contenido del acta (privado)
   */
  private generarContenidoActa(
    asamblea: {
      consorcio: { nombre: string; direccion: string };
      fecha: Date;
      lugar: string | null;
      titulo: string;
      descripcion: string | null;
      asistencias: Array<{ presente: boolean }>;
      puntosOrden: Array<{
        orden: number;
        titulo: string;
        descripcion: string | null;
        requiereVotacion: boolean;
        mayoriaRequerida: Prisma.Decimal | null;
        votos: Array<{ voto: TipoVoto; coeficienteVoto: Prisma.Decimal }>;
      }>;
    },
    observaciones?: string,
  ): string {
    const lineas: string[] = [
      'ACTA DE ASAMBLEA',
      '================',
      '',
      `Consorcio: ${asamblea.consorcio.nombre}`,
      `Dirección: ${asamblea.consorcio.direccion}`,
      `Fecha: ${asamblea.fecha.toLocaleDateString('es-AR')}`,
      `Hora: ${asamblea.fecha.toLocaleTimeString('es-AR')}`,
      `Lugar: ${asamblea.lugar || 'Virtual'}`,
      '',
      `Título: ${asamblea.titulo}`,
    ];

    if (asamblea.descripcion) {
      lineas.push(`Descripción: ${asamblea.descripcion}`);
    }

    const totalPresentes = asamblea.asistencias.filter((a) => a.presente).length;
    lineas.push(
      '',
      'ASISTENCIA',
      '----------',
      `Total presentes: ${totalPresentes}`,
      '',
      'ORDEN DEL DÍA',
      '-------------',
    );

    for (const punto of asamblea.puntosOrden) {
      lineas.push('', `${punto.orden}. ${punto.titulo}`);
      if (punto.descripcion) {
        lineas.push(`   ${punto.descripcion}`);
      }

      if (punto.requiereVotacion && punto.votos.length > 0) {
        const votacionLineas = this.generarLineasVotacion(punto.votos, punto.mayoriaRequerida);
        lineas.push(...votacionLineas);
      }
    }

    if (observaciones) {
      lineas.push('', 'OBSERVACIONES', '-------------', observaciones);
    }

    lineas.push(
      '',
      '---',
      'Acta generada automáticamente por VecinoSimple',
      `Fecha de generación: ${new Date().toISOString()}`,
    );

    return lineas.join('\n');
  }

  /**
   * Genera las líneas de votación para el acta (reduce complejidad)
   */
  private generarLineasVotacion(
    votos: Array<{ voto: TipoVoto; coeficienteVoto: Prisma.Decimal }>,
    mayoriaRequerida: Prisma.Decimal | null,
  ): string[] {
    const aFavor = votos
      .filter((v) => v.voto === TipoVoto.A_FAVOR)
      .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
    const enContra = votos
      .filter((v) => v.voto === TipoVoto.EN_CONTRA)
      .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
    const abstenciones = votos
      .filter((v) => v.voto === TipoVoto.ABSTENCION)
      .reduce((sum, v) => sum + Number.parseFloat(v.coeficienteVoto.toString()), 0);
    
    const total = aFavor + enContra + abstenciones;
    const porcentaje = total > 0 ? (aFavor / total) * 100 : 0;
    const mayoriaReq = mayoriaRequerida ? Number.parseFloat(mayoriaRequerida.toString()) : 50.01;
    const resultado = porcentaje >= mayoriaReq ? 'APROBADO' : 'RECHAZADO';

    return [
      '   VOTACIÓN:',
      `   - A favor: ${aFavor.toFixed(4)}%`,
      `   - En contra: ${enContra.toFixed(4)}%`,
      `   - Abstenciones: ${abstenciones.toFixed(4)}%`,
      `   - Porcentaje a favor: ${porcentaje.toFixed(2)}%`,
      `   - RESULTADO: ${resultado}`,
    ];
  }

  // ==========================================================================
  // VERIFICACIONES PRIVADAS
  // ==========================================================================

  /**
   * Verifica que el usuario tiene permiso de gestión
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
      throw new ForbiddenException('No tiene permiso de gestión de asambleas');
    }
  }
}
