import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CambiarEstadoTicketDto,
  AsignarTicketDto,
  CreateComentarioTicketDto,
  CreateArchivoTicketDto,
  FiltroTicketsDto,
  TicketResponseDto,
  TicketDetalleResponseDto,
  ListaTicketsResponseDto,
  ComentarioTicketResponseDto,
  EstadisticasTicketsDto,
} from './dto';
import { EstadoTicket, PrioridadTicket, Rol, Prisma } from '@prisma/client';

type TicketWithRelations = Prisma.TicketMantenimientoGetPayload<{
  include: {
    creador: { select: { id: true; nombre: true; apellido: true } };
    asignado: { select: { id: true; nombre: true; apellido: true } };
  };
}>;

// Dominios permitidos para archivos
const DOMINIOS_PERMITIDOS = [
  'storage.vecinosimple.com',
  'cdn.vecinosimple.com',
  'res.cloudinary.com',
  's3.amazonaws.com',
  'storage.googleapis.com',
];

// Tipos MIME permitidos
const TIPOS_MIME_PERMITIDOS = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'video/mp4',
  'video/quicktime',
];

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Sanitiza texto para prevenir XSS
   */
  private sanitizarTexto(texto: string | undefined | null): string {
    if (!texto) return '';
    return texto
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#x27;')
      .replaceAll('/', '&#x2F;');
  }

  /**
   * Valida que la URL sea de un dominio permitido
   */
  private validarUrlArchivo(url: string): void {
    try {
      const urlObj = new URL(url);
      const dominioPermitido = DOMINIOS_PERMITIDOS.some(
        (d) => urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`),
      );
      if (!dominioPermitido) {
        throw new BadRequestException(
          `Dominio no permitido para archivos. Dominios válidos: ${DOMINIOS_PERMITIDOS.join(', ')}`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('URL de archivo inválida');
    }
  }

  /**
   * Valida el tipo MIME del archivo
   */
  private validarTipoMime(tipo: string): void {
    if (!TIPOS_MIME_PERMITIDOS.includes(tipo)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Tipos válidos: ${TIPOS_MIME_PERMITIDOS.join(', ')}`,
      );
    }
  }

  /**
   * Verifica que el usuario tiene acceso al consorcio
   */
  private async verificarAccesoConsorcio(
    usuarioId: string,
    consorcioId: string,
  ): Promise<{ rol: Rol }> {
    const usuarioConsorcio = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        activo: true,
      },
      select: { rol: true },
    });

    if (!usuarioConsorcio) {
      throw new ForbiddenException('No tenés acceso a este consorcio');
    }

    return usuarioConsorcio;
  }

  /**
   * Verifica que el usuario puede ver el ticket
   * - Admins pueden ver todos
   * - Vecinos solo sus tickets
   */
  private async verificarAccesoTicket(
    usuarioId: string,
    ticketId: string,
    requiereAdmin: boolean = false,
  ): Promise<{ ticket: TicketWithRelations; rol: Rol }> {
    const ticket = await this.prisma.ticketMantenimiento.findUnique({
      where: { id: ticketId },
      include: {
        creador: { select: { id: true, nombre: true, apellido: true } },
        asignado: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket no encontrado');
    }

    const { rol } = await this.verificarAccesoConsorcio(usuarioId, ticket.consorcioId);

    const rolesAdmin: Rol[] = [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
    ];
    const esAdmin = rolesAdmin.includes(rol);

    if (requiereAdmin && !esAdmin) {
      throw new ForbiddenException('Esta acción requiere permisos de administrador');
    }

    // Los no-admin solo pueden ver sus propios tickets
    if (!esAdmin && ticket.creadorId !== usuarioId) {
      throw new ForbiddenException('No tenés permiso para acceder a este ticket');
    }

    return { ticket, rol };
  }

  private isAdminRole(rol: Rol): boolean {
    const rolesAdmin: Rol[] = [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
    ];

    return rolesAdmin.includes(rol);
  }

  private validateUpdatePermissions(
    ticket: TicketWithRelations,
    dto: UpdateTicketDto,
    usuarioId: string,
    esAdmin: boolean,
  ): void {
    if (!esAdmin && ticket.creadorId !== usuarioId) {
      throw new ForbiddenException('No tenés permiso para editar este ticket');
    }

    if (!esAdmin && (dto.estado || dto.asignadoId)) {
      throw new ForbiddenException(
        'Solo administradores pueden cambiar estado o asignar tickets',
      );
    }

    if (ticket.estado === EstadoTicket.CERRADO) {
      throw new BadRequestException('No se puede editar un ticket cerrado');
    }
  }

  private buildUpdateData(
    dto: UpdateTicketDto,
  ): Prisma.TicketMantenimientoUpdateInput {
    const datosActualizacion: Prisma.TicketMantenimientoUpdateInput = {};

    if (dto.titulo) datosActualizacion.titulo = this.sanitizarTexto(dto.titulo);
    if (dto.descripcion) datosActualizacion.descripcion = this.sanitizarTexto(dto.descripcion);
    if (dto.ubicacion !== undefined) {
      datosActualizacion.ubicacion = dto.ubicacion ? this.sanitizarTexto(dto.ubicacion) : null;
    }
    if (dto.prioridad) datosActualizacion.prioridad = dto.prioridad;
    if (dto.estado) datosActualizacion.estado = dto.estado;
    if (dto.asignadoId !== undefined) {
      datosActualizacion.asignado = dto.asignadoId
        ? { connect: { id: dto.asignadoId } }
        : { disconnect: true };
    }

    return datosActualizacion;
  }

  private shouldSetFechaResolucion(estado?: EstadoTicket): boolean {
    return estado === EstadoTicket.RESUELTO || estado === EstadoTicket.CERRADO;
  }

  /**
   * Datos de selección base para tickets
   */
  private getSelectBase() {
    return {
      id: true,
      consorcioId: true,
      titulo: true,
      descripcion: true,
      ubicacion: true,
      prioridad: true,
      estado: true,
      fechaResolucion: true,
      createdAt: true,
      updatedAt: true,
      creador: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          avatarUrl: true,
        },
      },
      asignado: {
        select: {
          id: true,
          nombre: true,
          apellido: true,
          avatarUrl: true,
        },
      },
      archivos: {
        select: {
          id: true,
          url: true,
          nombre: true,
          tipo: true,
          tamano: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' as const },
      },
      _count: {
        select: { comentarios: true },
      },
    };
  }

  // ============================================================================
  // CRUD DE TICKETS
  // ============================================================================

  /**
   * Crear un nuevo ticket
   */
  async crearTicket(
    dto: CreateTicketDto,
    usuarioId: string,
    ip?: string,
  ): Promise<TicketResponseDto> {
    // Verificar acceso al consorcio
    await this.verificarAccesoConsorcio(usuarioId, dto.consorcioId);

    // Sanitizar textos
    const titulo = this.sanitizarTexto(dto.titulo);
    const descripcion = this.sanitizarTexto(dto.descripcion);
    const ubicacion = dto.ubicacion ? this.sanitizarTexto(dto.ubicacion) : null;

    const ticket = await this.prisma.ticketMantenimiento.create({
      data: {
        consorcioId: dto.consorcioId,
        creadorId: usuarioId,
        titulo,
        descripcion,
        ubicacion,
        prioridad: dto.prioridad || PrioridadTicket.MEDIA,
        estado: EstadoTicket.ABIERTO,
      },
      select: this.getSelectBase(),
    });

    // Registrar en auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'TicketMantenimiento',
      entidadId: ticket.id,
      datosNuevos: { titulo, descripcion, ubicacion, prioridad: dto.prioridad },
      ip,
    });

    return ticket as TicketResponseDto;
  }

  /**
   * Listar tickets de un consorcio con filtros
   */
  async listarTickets(
    consorcioId: string,
    filtros: FiltroTicketsDto,
    usuarioId: string,
  ): Promise<ListaTicketsResponseDto> {
    const { rol } = await this.verificarAccesoConsorcio(usuarioId, consorcioId);

    const rolesAdminExtendido: Rol[] = [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
      Rol.ENCARGADO,
    ];
    const esAdmin = rolesAdminExtendido.includes(rol);

    // Construir where clause
    const where: Prisma.TicketMantenimientoWhereInput = {
      consorcioId,
      // Si no es admin, solo ver sus tickets
      ...(esAdmin ? {} : { creadorId: usuarioId }),
      // Filtros opcionales
      ...(filtros.estado && { estado: filtros.estado }),
      ...(filtros.prioridad && { prioridad: filtros.prioridad }),
      ...(filtros.asignadoId && { asignadoId: filtros.asignadoId }),
      ...(filtros.creadorId && { creadorId: filtros.creadorId }),
      ...(filtros.busqueda && {
        OR: [
          { titulo: { contains: filtros.busqueda, mode: 'insensitive' as const } },
          { descripcion: { contains: filtros.busqueda, mode: 'insensitive' as const } },
        ],
      }),
    };

    const pagina = filtros.pagina || 1;
    const porPagina = filtros.porPagina || 20;

    const [items, total] = await Promise.all([
      this.prisma.ticketMantenimiento.findMany({
        where,
        select: this.getSelectBase(),
        orderBy: [
          { prioridad: 'desc' }, // Urgentes primero
          { createdAt: 'desc' },
        ],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
      }),
      this.prisma.ticketMantenimiento.count({ where }),
    ]);

    return {
      items: items as TicketResponseDto[],
      total,
      pagina,
      porPagina,
      totalPaginas: Math.ceil(total / porPagina),
    };
  }

  /**
   * Obtener detalle de un ticket con comentarios
   */
  async obtenerTicket(
    ticketId: string,
    usuarioId: string,
  ): Promise<TicketDetalleResponseDto> {
    const { rol } = await this.verificarAccesoTicket(usuarioId, ticketId);

    const rolesAdmin: Rol[] = [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
    ];
    const esAdmin = rolesAdmin.includes(rol);

    // Obtener ticket con comentarios
    const ticketCompleto = await this.prisma.ticketMantenimiento.findUnique({
      where: { id: ticketId },
      select: {
        ...this.getSelectBase(),
        comentarios: {
          where: esAdmin ? {} : { esInterno: false }, // No admins no ven internos
          select: {
            id: true,
            contenido: true,
            esInterno: true,
            createdAt: true,
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return ticketCompleto as TicketDetalleResponseDto;
  }

  /**
   * Actualizar un ticket
   */
  async actualizarTicket(
    ticketId: string,
    dto: UpdateTicketDto,
    usuarioId: string,
    ip?: string,
  ): Promise<TicketResponseDto> {
    const { ticket, rol } = await this.verificarAccesoTicket(usuarioId, ticketId);

    const esAdmin = this.isAdminRole(rol);
    this.validateUpdatePermissions(ticket, dto, usuarioId, esAdmin);

    const datosActualizacion = this.buildUpdateData(dto);

    if (this.shouldSetFechaResolucion(dto.estado)) {
      datosActualizacion.fechaResolucion = new Date();
    }

    const ticketActualizado = await this.prisma.ticketMantenimiento.update({
      where: { id: ticketId },
      data: datosActualizacion,
      select: this.getSelectBase(),
    });

    // Auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'TicketMantenimiento',
      entidadId: ticketId,
      datosAnteriores: { estado: ticket.estado, prioridad: ticket.prioridad },
      datosNuevos: dto,
      ip,
    });

    return ticketActualizado as TicketResponseDto;
  }

  /**
   * Cambiar estado del ticket (solo admins)
   */
  async cambiarEstado(
    ticketId: string,
    dto: CambiarEstadoTicketDto,
    usuarioId: string,
    ip?: string,
  ): Promise<TicketResponseDto> {
    const { ticket } = await this.verificarAccesoTicket(usuarioId, ticketId, true);

    // Validar transiciones de estado
    const transicionesValidas: Record<EstadoTicket, EstadoTicket[]> = {
      [EstadoTicket.ABIERTO]: [
        EstadoTicket.EN_PROGRESO,
        EstadoTicket.ESPERANDO_RESPUESTA,
        EstadoTicket.RESUELTO,
        EstadoTicket.CERRADO,
      ],
      [EstadoTicket.EN_PROGRESO]: [
        EstadoTicket.ESPERANDO_RESPUESTA,
        EstadoTicket.RESUELTO,
        EstadoTicket.CERRADO,
      ],
      [EstadoTicket.ESPERANDO_RESPUESTA]: [
        EstadoTicket.EN_PROGRESO,
        EstadoTicket.RESUELTO,
        EstadoTicket.CERRADO,
      ],
      [EstadoTicket.RESUELTO]: [EstadoTicket.CERRADO, EstadoTicket.ABIERTO], // Reabrir
      [EstadoTicket.CERRADO]: [EstadoTicket.ABIERTO], // Reabrir
    };

    if (!transicionesValidas[ticket.estado]?.includes(dto.estado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${ticket.estado} a ${dto.estado}`,
      );
    }

    const data: Prisma.TicketMantenimientoUpdateInput = {
      estado: dto.estado,
    };

    // Registrar fecha de resolución
    if (dto.estado === EstadoTicket.RESUELTO || dto.estado === EstadoTicket.CERRADO) {
      data.fechaResolucion = new Date();
    }

    // Si se reabre, limpiar fecha
    if (dto.estado === EstadoTicket.ABIERTO && ticket.fechaResolucion) {
      data.fechaResolucion = null;
    }

    const ticketActualizado = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticketMantenimiento.update({
        where: { id: ticketId },
        data,
        select: this.getSelectBase(),
      });

      // Si hay comentario, agregarlo
      if (dto.comentario) {
        await tx.comentarioTicket.create({
          data: {
            ticketId,
            usuarioId,
            contenido: this.sanitizarTexto(dto.comentario),
            esInterno: false,
          },
        });
      }

      return updated;
    });

    // Auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'TicketMantenimiento',
      entidadId: ticketId,
      datosAnteriores: { estado: ticket.estado },
      datosNuevos: { estado: dto.estado, comentario: dto.comentario },
      ip,
    });

    return ticketActualizado as TicketResponseDto;
  }

  /**
   * Asignar ticket a un usuario (solo admins)
   */
  async asignarTicket(
    ticketId: string,
    dto: AsignarTicketDto,
    usuarioId: string,
    ip?: string,
  ): Promise<TicketResponseDto> {
    const { ticket } = await this.verificarAccesoTicket(usuarioId, ticketId, true);

    // Verificar que el usuario a asignar pertenece al consorcio Y tiene rol apropiado
    const usuarioAsignado = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId: dto.usuarioId,
        consorcioId: ticket.consorcioId,
        activo: true,
        // Solo se puede asignar a usuarios con roles de gestión
        rol: {
          in: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.ENCARGADO],
        },
      },
    });

    if (!usuarioAsignado) {
      throw new BadRequestException(
        'El usuario a asignar no pertenece a este consorcio o no tiene permisos para gestionar tickets',
      );
    }

    const ticketActualizado = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.ticketMantenimiento.update({
        where: { id: ticketId },
        data: {
          asignadoId: dto.usuarioId,
          // Si estaba ABIERTO, pasar a EN_PROGRESO
          estado:
            ticket.estado === EstadoTicket.ABIERTO
              ? EstadoTicket.EN_PROGRESO
              : ticket.estado,
        },
        select: this.getSelectBase(),
      });

      // Si hay comentario, agregarlo como interno
      if (dto.comentario) {
        await tx.comentarioTicket.create({
          data: {
            ticketId,
            usuarioId,
            contenido: this.sanitizarTexto(dto.comentario),
            esInterno: true, // Comentario interno sobre asignación
          },
        });
      }

      return updated;
    });

    // Auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'TicketMantenimiento',
      entidadId: ticketId,
      datosAnteriores: { asignadoId: ticket.asignadoId },
      datosNuevos: { asignadoId: dto.usuarioId },
      ip,
    });

    return ticketActualizado as TicketResponseDto;
  }

  // ============================================================================
  // COMENTARIOS
  // ============================================================================

  /**
   * Agregar comentario a un ticket
   */
  async agregarComentario(
    ticketId: string,
    dto: CreateComentarioTicketDto,
    usuarioId: string,
    ip?: string,
  ): Promise<ComentarioTicketResponseDto> {
    const { ticket, rol } = await this.verificarAccesoTicket(usuarioId, ticketId);

    // Verificar que el ticket no esté cerrado
    if (ticket.estado === EstadoTicket.CERRADO) {
      throw new BadRequestException('No se pueden agregar comentarios a un ticket cerrado');
    }

    const rolesAdmin: Rol[] = [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
    ];
    const esAdmin = rolesAdmin.includes(rol);

    // Solo admins pueden crear comentarios internos
    if (dto.esInterno && !esAdmin) {
      throw new ForbiddenException('Solo administradores pueden crear comentarios internos');
    }

    const comentario = await this.prisma.comentarioTicket.create({
      data: {
        ticketId,
        usuarioId,
        contenido: this.sanitizarTexto(dto.contenido),
        esInterno: dto.esInterno || false,
      },
      select: {
        id: true,
        contenido: true,
        esInterno: true,
        createdAt: true,
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Si un vecino comenta en un ticket ESPERANDO_RESPUESTA, pasar a EN_PROGRESO
    if (!esAdmin && ticket.estado === EstadoTicket.ESPERANDO_RESPUESTA) {
      await this.prisma.ticketMantenimiento.update({
        where: { id: ticketId },
        data: { estado: EstadoTicket.EN_PROGRESO },
      });
    }

    // Auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'ComentarioTicket',
      entidadId: comentario.id,
      datosNuevos: { ticketId, esInterno: dto.esInterno },
      ip,
    });

    return comentario as ComentarioTicketResponseDto;
  }

  // ============================================================================
  // ARCHIVOS
  // ============================================================================

  /**
   * Agregar archivo al ticket
   */
  async agregarArchivo(
    ticketId: string,
    dto: CreateArchivoTicketDto,
    usuarioId: string,
    ip?: string,
  ): Promise<{ id: string; url: string; nombre: string }> {
    await this.verificarAccesoTicket(usuarioId, ticketId);

    // Validaciones de seguridad
    this.validarUrlArchivo(dto.url);
    this.validarTipoMime(dto.tipo);

    // Verificar límite de archivos (máx 10 por ticket)
    const cantidadArchivos = await this.prisma.archivoTicket.count({
      where: { ticketId },
    });

    if (cantidadArchivos >= 10) {
      throw new BadRequestException('El ticket ya tiene el máximo de 10 archivos');
    }

    const archivo = await this.prisma.archivoTicket.create({
      data: {
        ticketId,
        url: dto.url,
        nombre: this.sanitizarTexto(dto.nombre),
        tipo: dto.tipo,
        tamano: dto.tamano,
      },
      select: {
        id: true,
        url: true,
        nombre: true,
      },
    });

    // Auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'ArchivoTicket',
      entidadId: archivo.id,
      datosNuevos: { ticketId, nombre: dto.nombre, tipo: dto.tipo },
      ip,
    });

    return archivo;
  }

  /**
   * Eliminar archivo del ticket
   */
  async eliminarArchivo(
    ticketId: string,
    archivoId: string,
    usuarioId: string,
    ip?: string,
  ): Promise<void> {
    const { ticket, rol } = await this.verificarAccesoTicket(usuarioId, ticketId);

    const archivo = await this.prisma.archivoTicket.findUnique({
      where: { id: archivoId },
    });

    if (archivo?.ticketId !== ticketId) {
      throw new NotFoundException('Archivo no encontrado');
    }

    const rolesAdmin: Rol[] = [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
    ];
    const esAdmin = rolesAdmin.includes(rol);

    // Solo el creador del ticket o admins pueden eliminar archivos
    if (!esAdmin && ticket.creadorId !== usuarioId) {
      throw new ForbiddenException('No tenés permiso para eliminar este archivo');
    }

    await this.prisma.archivoTicket.delete({
      where: { id: archivoId },
    });

    // Auditoría
    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'ArchivoTicket',
      entidadId: archivoId,
      datosAnteriores: { ticketId, nombre: archivo.nombre },
      ip,
    });
  }

  // ============================================================================
  // ESTADÍSTICAS
  // ============================================================================

  /**
   * Obtener estadísticas de tickets de un consorcio
   */
  async obtenerEstadisticas(
    consorcioId: string,
    usuarioId: string,
  ): Promise<EstadisticasTicketsDto> {
    await this.verificarAccesoConsorcio(usuarioId, consorcioId);

    const [
      total,
      abiertos,
      enProgreso,
      esperandoRespuesta,
      resueltos,
      cerrados,
      urgentesAbiertos,
      tiemposResolucion,
    ] = await Promise.all([
      this.prisma.ticketMantenimiento.count({ where: { consorcioId } }),
      this.prisma.ticketMantenimiento.count({
        where: { consorcioId, estado: EstadoTicket.ABIERTO },
      }),
      this.prisma.ticketMantenimiento.count({
        where: { consorcioId, estado: EstadoTicket.EN_PROGRESO },
      }),
      this.prisma.ticketMantenimiento.count({
        where: { consorcioId, estado: EstadoTicket.ESPERANDO_RESPUESTA },
      }),
      this.prisma.ticketMantenimiento.count({
        where: { consorcioId, estado: EstadoTicket.RESUELTO },
      }),
      this.prisma.ticketMantenimiento.count({
        where: { consorcioId, estado: EstadoTicket.CERRADO },
      }),
      this.prisma.ticketMantenimiento.count({
        where: {
          consorcioId,
          prioridad: PrioridadTicket.URGENTE,
          estado: { in: [EstadoTicket.ABIERTO, EstadoTicket.EN_PROGRESO] },
        },
      }),
      // Calcular tiempo promedio de resolución
      this.prisma.ticketMantenimiento.findMany({
        where: {
          consorcioId,
          fechaResolucion: { not: null },
        },
        select: {
          createdAt: true,
          fechaResolucion: true,
        },
        take: 100, // Últimos 100 para el promedio
        orderBy: { fechaResolucion: 'desc' },
      }),
    ]);

    // Calcular tiempo promedio en horas
    let tiempoPromedioResolucion: number | undefined;
    if (tiemposResolucion.length > 0) {
      const totalHoras = tiemposResolucion.reduce((acc, t) => {
        const diff = t.fechaResolucion!.getTime() - t.createdAt.getTime();
        return acc + diff / (1000 * 60 * 60); // Convertir a horas
      }, 0);
      tiempoPromedioResolucion = Math.round(totalHoras / tiemposResolucion.length);
    }

    return {
      total,
      abiertos,
      enProgreso,
      esperandoRespuesta,
      resueltos,
      cerrados,
      urgentesAbiertos,
      tiempoPromedioResolucion,
    };
  }
}
