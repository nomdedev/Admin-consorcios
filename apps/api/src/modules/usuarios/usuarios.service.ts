import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';
import {
  CreateUsuarioConRolDto,
  UpdateUsuarioDto,
  AsignarRolConsorcioDto,
  UpdateRolConsorcioDto,
  ListUsuariosQueryDto,
  Rol,
  TipoVinculoUF,
  EstadoUsuario,
  UsuarioResponseDto,
  UsuarioListResponseDto,
} from './dto';
import { randomBytes } from 'node:crypto';
import { Prisma } from '@prisma/client';

// Tipo flexible para el mapper que acepta la estructura de las queries
interface UsuarioConRoles {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono: string | null;
  avatarUrl: string | null;
  estado: string;
  emailVerificado: boolean;
  ultimoAcceso: Date | null;
  createdAt: Date;
  magicLinkToken?: string | null;
  rolesConsorcio?: Array<{
    id: string;
    consorcioId: string;
    consorcio?: { id: string; nombre: string };
    rol: string;
    unidadFuncionalId: string | null;
    unidadFuncional?: { id: string; codigo: string } | null;
    tipoVinculo: string | null;
    puedeCargarGastos: boolean;
    puedeVerConciliacion: boolean;
    puedeEnviarComunicados: boolean;
    activo: boolean;
  }>;
}

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);
  private readonly appUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly configService: ConfigService,
  ) {
    this.appUrl = this.configService.get<string>('APP_URL', 'https://vecinosimple.com');
  }

  /**
   * Sanitizar texto para prevenir XSS
   */
  private sanitizeText(text: string): string {
    return text
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#x27;')
      .trim();
  }

  /**
   * Listar usuarios con filtros y paginación
   */
  async findAll(
    query: ListUsuariosQueryDto,
    requestingUserId: string,
    requestingUserRol: Rol,
    organizacionId?: string,
  ): Promise<UsuarioListResponseDto> {
    const { search, consorcioId, rol, estado, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: Prisma.UsuarioWhereInput = {};

    // SUPER_ADMIN ve todos, otros solo su organización
    if (requestingUserRol !== Rol.SUPER_ADMIN && organizacionId) {
      where.organizacionId = organizacionId;
    }

    // Búsqueda por texto
    if (search) {
      where.OR = [
        { nombre: { contains: search, mode: 'insensitive' } },
        { apellido: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtro por estado
    if (estado) {
      where.estado = estado;
    }

    // Filtro por consorcio y/o rol
    if (consorcioId || rol) {
      where.rolesConsorcio = {
        some: {
          ...(consorcioId && { consorcioId }),
          ...(rol && { rol }),
          activo: true,
        },
      };
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
        include: {
          rolesConsorcio: {
            where: { activo: true },
            include: {
              consorcio: { select: { id: true, nombre: true } },
              unidadFuncional: { select: { id: true, codigo: true } },
            },
          },
        },
      }),
      this.prisma.usuario.count({ where }),
    ]);

    return {
      data: usuarios.map(this.mapUsuarioToResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtener usuarios de un consorcio específico
   */
  async findByConsorcio(
    consorcioId: string,
    requestingUserId: string,
  ): Promise<UsuarioResponseDto[]> {
    // Verificar que el consorcio existe
    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: consorcioId },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }

    const usuarios = await this.prisma.usuario.findMany({
      where: {
        rolesConsorcio: {
          some: {
            consorcioId,
            activo: true,
          },
        },
      },
      include: {
        rolesConsorcio: {
          where: { consorcioId, activo: true },
          include: {
            consorcio: { select: { id: true, nombre: true } },
            unidadFuncional: { select: { id: true, codigo: true } },
          },
        },
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    return usuarios.map(this.mapUsuarioToResponse);
  }

  /**
   * Obtener un usuario por ID
   */
  async findOne(id: string): Promise<UsuarioResponseDto> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        rolesConsorcio: {
          include: {
            consorcio: { select: { id: true, nombre: true } },
            unidadFuncional: { select: { id: true, codigo: true } },
          },
        },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.mapUsuarioToResponse(usuario);
  }

  /**
   * Crear usuario y asignar rol en consorcio
   */
  async create(
    dto: CreateUsuarioConRolDto,
    creadorId: string,
    creadorRol: Rol,
  ): Promise<UsuarioResponseDto> {
    // Verificar permisos
    this.verificarPermisoCreacion(creadorRol, dto.rolConsorcio.rol);

    // Verificar si el email ya existe
    const existente = await this.prisma.usuario.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Verificar que el consorcio existe
    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: dto.rolConsorcio.consorcioId },
      select: { id: true, nombre: true, direccion: true, organizacionId: true },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }

    // Si se especifica UF, verificar que existe
    if (dto.rolConsorcio.unidadFuncionalId) {
      const uf = await this.prisma.unidadFuncional.findUnique({
        where: { id: dto.rolConsorcio.unidadFuncionalId },
      });

      if (uf?.consorcioId !== dto.rolConsorcio.consorcioId) {
        throw new BadRequestException('Unidad funcional no válida para este consorcio');
      }

      // Si es TITULAR_VOTANTE, verificar que no haya otro
      if (dto.rolConsorcio.tipoVinculo === 'TITULAR_VOTANTE') {
        const titularExistente = await this.prisma.usuarioConsorcio.findFirst({
          where: {
            unidadFuncionalId: dto.rolConsorcio.unidadFuncionalId,
            tipoVinculo: 'TITULAR_VOTANTE',
            activo: true,
          },
        });

        if (titularExistente) {
          throw new ConflictException('Ya existe un titular votante para esta unidad');
        }
      }
    }

    // Generar magic link token para que complete registro
    const magicLinkToken = randomBytes(32).toString('hex');
    const magicLinkExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // Crear usuario con rol
    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email.toLowerCase(),
        nombre: this.sanitizeText(dto.nombre),
        apellido: this.sanitizeText(dto.apellido),
        dni: dto.dni,
        telefono: dto.telefono,
        organizacionId: consorcio.organizacionId,
        estado: EstadoUsuario.PENDIENTE_VERIFICACION,
        magicLinkToken,
        magicLinkExpira,
        rolesConsorcio: {
          create: {
            consorcioId: dto.rolConsorcio.consorcioId,
            rol: dto.rolConsorcio.rol,
            unidadFuncionalId: dto.rolConsorcio.unidadFuncionalId,
            tipoVinculo: dto.rolConsorcio.tipoVinculo,
            puedeCargarGastos: dto.rolConsorcio.puedeCargarGastos || false,
            puedeVerConciliacion: dto.rolConsorcio.puedeVerConciliacion || false,
            puedeEnviarComunicados: dto.rolConsorcio.puedeEnviarComunicados || false,
          },
        },
      },
      include: {
        rolesConsorcio: {
          include: {
            consorcio: { select: { id: true, nombre: true } },
            unidadFuncional: { select: { id: true, codigo: true } },
          },
        },
      },
    });

    // Registrar en audit log
    await this.auditService.log({
      usuarioId: creadorId,
      accion: 'CREATE',
      entidad: 'Usuario',
      entidadId: usuario.id,
      datosNuevos: { email: usuario.email, nombre: usuario.nombre, rol: dto.rolConsorcio.rol },
    });

    // Enviar email de invitación con magic link
    await this.enviarEmailInvitacion(usuario, consorcio);

    return this.mapUsuarioToResponse(usuario);
  }

  /**
   * Actualizar datos de un usuario
   */
  async update(
    id: string,
    dto: UpdateUsuarioDto,
    actualizadorId: string,
  ): Promise<UsuarioResponseDto> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const datosAnteriores = { ...usuario };

    const actualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...(dto.nombre && { nombre: this.sanitizeText(dto.nombre) }),
        ...(dto.apellido && { apellido: this.sanitizeText(dto.apellido) }),
        ...(dto.dni && { dni: dto.dni }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.estado && { estado: dto.estado }),
      },
      include: {
        rolesConsorcio: {
          include: {
            consorcio: { select: { id: true, nombre: true } },
            unidadFuncional: { select: { id: true, codigo: true } },
          },
        },
      },
    });

    await this.auditService.log({
      usuarioId: actualizadorId,
      accion: 'UPDATE',
      entidad: 'Usuario',
      entidadId: id,
      datosAnteriores,
      datosNuevos: dto,
    });

    return this.mapUsuarioToResponse(actualizado);
  }

  /**
   * Asignar un nuevo rol en un consorcio
   */
  async asignarRolConsorcio(
    usuarioId: string,
    dto: AsignarRolConsorcioDto,
    asignadorId: string,
    asignadorRol: Rol,
  ): Promise<UsuarioResponseDto> {
    this.verificarPermisoCreacion(asignadorRol, dto.rol);

    const usuario = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    // Verificar si ya tiene rol en ese consorcio
    const rolExistente = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId: dto.consorcioId,
        rol: dto.rol,
      },
    });

    if (rolExistente) {
      if (rolExistente.activo) {
        throw new ConflictException('El usuario ya tiene este rol en el consorcio');
      }
      // Reactivar rol existente
      await this.prisma.usuarioConsorcio.update({
        where: { id: rolExistente.id },
        data: { activo: true },
      });
    } else {
      // Crear nuevo rol
      await this.prisma.usuarioConsorcio.create({
        data: {
          usuarioId,
          consorcioId: dto.consorcioId,
          rol: dto.rol,
          unidadFuncionalId: dto.unidadFuncionalId,
          tipoVinculo: dto.tipoVinculo,
          puedeCargarGastos: dto.puedeCargarGastos || false,
          puedeVerConciliacion: dto.puedeVerConciliacion || false,
          puedeEnviarComunicados: dto.puedeEnviarComunicados || false,
        },
      });
    }

    await this.auditService.log({
      usuarioId: asignadorId,
      accion: 'CREATE',
      entidad: 'UsuarioConsorcio',
      entidadId: usuarioId,
      datosNuevos: dto,
    });

    return this.findOne(usuarioId);
  }

  /**
   * Actualizar rol de usuario en consorcio
   */
  async updateRolConsorcio(
    usuarioConsorcioId: string,
    dto: UpdateRolConsorcioDto,
    actualizadorId: string,
  ): Promise<UsuarioResponseDto> {
    const usuarioConsorcio = await this.prisma.usuarioConsorcio.findUnique({
      where: { id: usuarioConsorcioId },
    });

    if (!usuarioConsorcio) {
      throw new NotFoundException('Relación usuario-consorcio no encontrada');
    }

    await this.prisma.usuarioConsorcio.update({
      where: { id: usuarioConsorcioId },
      data: {
        ...(dto.rol && { rol: dto.rol }),
        ...(dto.unidadFuncionalId !== undefined && { unidadFuncionalId: dto.unidadFuncionalId }),
        ...(dto.tipoVinculo && { tipoVinculo: dto.tipoVinculo }),
        ...(dto.puedeCargarGastos !== undefined && { puedeCargarGastos: dto.puedeCargarGastos }),
        ...(dto.puedeVerConciliacion !== undefined && { puedeVerConciliacion: dto.puedeVerConciliacion }),
        ...(dto.puedeEnviarComunicados !== undefined && { puedeEnviarComunicados: dto.puedeEnviarComunicados }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });

    await this.auditService.log({
      usuarioId: actualizadorId,
      accion: 'UPDATE',
      entidad: 'UsuarioConsorcio',
      entidadId: usuarioConsorcioId,
      datosNuevos: dto,
    });

    return this.findOne(usuarioConsorcio.usuarioId);
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivate(id: string, desactivadorId: string): Promise<{ mensaje: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.estado === EstadoUsuario.INACTIVO) {
      throw new BadRequestException('El usuario ya está inactivo');
    }

    await this.prisma.$transaction([
      // Desactivar usuario
      this.prisma.usuario.update({
        where: { id },
        data: { estado: EstadoUsuario.INACTIVO },
      }),
      // Desactivar todos sus roles
      this.prisma.usuarioConsorcio.updateMany({
        where: { usuarioId: id },
        data: { activo: false },
      }),
    ]);

    await this.auditService.log({
      usuarioId: desactivadorId,
      accion: 'DELETE',
      entidad: 'Usuario',
      entidadId: id,
      datosNuevos: { estado: EstadoUsuario.INACTIVO },
    });

    return { mensaje: 'Usuario desactivado correctamente' };
  }

  /**
   * Reenviar invitación
   */
  async reinvitar(id: string, enviadorId: string): Promise<{ mensaje: string }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.emailVerificado) {
      throw new BadRequestException('El usuario ya verificó su email');
    }

    // Generar nuevo magic link
    const magicLinkToken = randomBytes(32).toString('hex');
    const magicLinkExpira = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.usuario.update({
      where: { id },
      data: { magicLinkToken, magicLinkExpira },
    });

    // Enviar email con nuevo magic link
    await this.enviarEmailReinvitacion(usuario, magicLinkToken);

    await this.auditService.log({
      usuarioId: enviadorId,
      accion: 'UPDATE',
      entidad: 'Usuario',
      entidadId: id,
      datosNuevos: { accion: 'reinvitar' },
    });

    return { mensaje: 'Invitación reenviada correctamente' };
  }

  /**
   * Verificar permisos de creación de usuarios
   */
  private verificarPermisoCreacion(creadorRol: Rol, nuevoRol: Rol): void {
    // SUPER_ADMIN puede crear cualquier rol
    if (creadorRol === Rol.SUPER_ADMIN) return;

    // ADMINISTRADOR puede crear todos menos SUPER_ADMIN y ADMINISTRADOR
    if (creadorRol === Rol.ADMINISTRADOR) {
      if (nuevoRol === Rol.SUPER_ADMIN || nuevoRol === Rol.ADMINISTRADOR) {
        throw new ForbiddenException('No tiene permisos para crear este tipo de usuario');
      }
      return;
    }

    // ADMIN_STAFF puede crear PROPIETARIO, INQUILINO, ENCARGADO
    if (creadorRol === Rol.ADMIN_STAFF) {
      const permitidos = [Rol.PROPIETARIO, Rol.INQUILINO, Rol.ENCARGADO];
      if (!permitidos.includes(nuevoRol)) {
        throw new ForbiddenException('No tiene permisos para crear este tipo de usuario');
      }
      return;
    }

    throw new ForbiddenException('No tiene permisos para crear usuarios');
  }

  /**
   * Mapear usuario de Prisma a DTO de respuesta
   */
  private mapUsuarioToResponse(usuario: UsuarioConRoles): UsuarioResponseDto {
    return {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      telefono: usuario.telefono ?? undefined,
      avatarUrl: usuario.avatarUrl ?? undefined,
      estado: usuario.estado as EstadoUsuario,
      emailVerificado: usuario.emailVerificado,
      ultimoAcceso: usuario.ultimoAcceso ?? undefined,
      createdAt: usuario.createdAt,
      rolesConsorcio: usuario.rolesConsorcio?.map((rc) => ({
        id: rc.id,
        consorcioId: rc.consorcioId,
        consorcioNombre: rc.consorcio?.nombre ?? '',
        rol: rc.rol as Rol,
        unidadFuncionalId: rc.unidadFuncionalId ?? undefined,
        unidadFuncionalCodigo: rc.unidadFuncional?.codigo,
        tipoVinculo: rc.tipoVinculo as TipoVinculoUF | undefined,
        puedeCargarGastos: rc.puedeCargarGastos,
        puedeVerConciliacion: rc.puedeVerConciliacion,
        puedeEnviarComunicados: rc.puedeEnviarComunicados,
        activo: rc.activo,
      })) || [],
    };
  }

  // ==========================================================================
  // MÉTODOS DE EMAIL
  // ==========================================================================

  /**
   * Envía email de invitación al nuevo usuario
   */
  private async enviarEmailInvitacion(
    usuario: UsuarioConRoles,
    consorcio: { nombre: string; direccion: string } | null,
  ): Promise<void> {
    if (!usuario.magicLinkToken) {
      this.logger.warn(`No hay magic link token para usuario ${usuario.id}`);
      return;
    }

    try {
      const unidadCodigo = usuario.rolesConsorcio?.[0]?.unidadFuncional?.codigo ?? 'N/A';
      const link = `${this.appUrl}/auth/verify?token=${usuario.magicLinkToken}`;

      const { html, text } = this.emailTemplateService.invitacionClaiming({
        nombre: usuario.nombre,
        consorcio: consorcio?.nombre ?? 'Tu Edificio',
        direccion: consorcio?.direccion ?? '',
        unidad: unidadCodigo,
        codigo: usuario.magicLinkToken.slice(0, 8).toUpperCase(),
        linkRegistro: link,
      });

      await this.emailService.send({
        to: usuario.email,
        subject: `Bienvenido a ${consorcio?.nombre ?? 'VecinoSimple'}`,
        html,
        text,
      });

      this.logger.log(`Email de invitación enviado a ${usuario.email}`);
    } catch (error) {
      // No fallar la operación principal si falla el email
      this.logger.error(
        `Error enviando email de invitación: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }
  }

  /**
   * Envía email de re-invitación (nuevo magic link)
   */
  private async enviarEmailReinvitacion(
    usuario: { id: string; email: string; nombre: string; apellido: string },
    magicLinkToken: string,
  ): Promise<void> {
    try {
      const link = `${this.appUrl}/auth/verify?token=${magicLinkToken}`;

      const { html, text } = this.emailTemplateService.magicLink({
        nombre: usuario.nombre,
        link,
        expiresIn: '7 días',
      });

      await this.emailService.send({
        to: usuario.email,
        subject: 'Nuevo enlace de acceso - VecinoSimple',
        html,
        text,
      });

      this.logger.log(`Email de reinvitación enviado a ${usuario.email}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email de reinvitación: ${error instanceof Error ? error.message : 'Unknown'}`,
      );
    }
  }
}
