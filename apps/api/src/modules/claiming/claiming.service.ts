import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Rol, TipoVinculoUF, EstadoInvitacion } from '@prisma/client';
import {
  CreateInvitacionDto,
  CreateInvitacionBulkDto,
  ClaimUnidadDto,
  ValidarCodigoDto,
} from './dto/claiming.dto';

@Injectable()
export class ClaimingService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // Generación de códigos
  // ==========================================================================

  /**
   * Genera un código único de 8 caracteres alfanuméricos
   * Formato: 3 letras + 5 números (ej: ABC12345)
   */
  private generarCodigo(): string {
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sin I, O para evitar confusión
    const numeros = '0123456789';
    
    let codigo = '';
    
    // 3 letras
    for (let i = 0; i < 3; i++) {
      codigo += letras.charAt(Math.floor(Math.random() * letras.length));
    }
    
    // 5 números
    for (let i = 0; i < 5; i++) {
      codigo += numeros.charAt(Math.floor(Math.random() * numeros.length));
    }
    
    return codigo;
  }

  /**
   * Genera un código único verificando que no exista
   */
  private async generarCodigoUnico(): Promise<string> {
    let codigo: string;
    let intentos = 0;
    const maxIntentos = 10;

    do {
      codigo = this.generarCodigo();
      const existe = await this.prisma.invitacionUnidad.findUnique({
        where: { codigoInvitacion: codigo },
      });
      
      if (!existe) break;
      intentos++;
    } while (intentos < maxIntentos);

    if (intentos >= maxIntentos) {
      throw new Error('No se pudo generar un código único');
    }

    return codigo;
  }

  // ==========================================================================
  // Crear invitaciones (Admin)
  // ==========================================================================

  /**
   * Crea una invitación para una unidad específica
   */
  async crearInvitacion(dto: CreateInvitacionDto, adminId: string) {
    // Verificar que la unidad existe
    const unidad = await this.prisma.unidadFuncional.findUnique({
      where: { id: dto.unidadFuncionalId },
      include: { consorcio: true },
    });

    if (!unidad || unidad.consorcioId !== dto.consorcioId) {
      throw new NotFoundException('Unidad funcional no encontrada en este consorcio');
    }

    // Verificar si ya existe una invitación activa para esta UF
    const invitacionExistente = await this.prisma.invitacionUnidad.findFirst({
      where: {
        unidadFuncionalId: dto.unidadFuncionalId,
        estado: EstadoInvitacion.PENDIENTE,
        fechaExpiracion: { gt: new Date() },
      },
    });

    if (invitacionExistente) {
      throw new BadRequestException(
        'Ya existe una invitación activa para esta unidad. ' +
        `Código: ${invitacionExistente.codigoInvitacion}`
      );
    }

    // Generar código único
    const codigoInvitacion = await this.generarCodigoUnico();

    // Calcular fecha de expiración (90 días por defecto)
    const fechaExpiracion = dto.fechaExpiracion
      ? new Date(dto.fechaExpiracion)
      : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    // Crear invitación
    const invitacion = await this.prisma.invitacionUnidad.create({
      data: {
        consorcioId: dto.consorcioId,
        unidadFuncionalId: dto.unidadFuncionalId,
        codigoInvitacion,
        rolAsignado: dto.rolAsignado || Rol.PROPIETARIO,
        tipoVinculo: dto.tipoVinculo || TipoVinculoUF.TITULAR_VOTANTE,
        nombreEsperado: dto.nombreEsperado,
        dniEsperado: dto.dniEsperado,
        emailEsperado: dto.emailEsperado,
        fechaExpiracion,
        creadoPor: adminId,
        notas: dto.notas,
      },
      include: {
        consorcio: { select: { id: true, nombre: true, direccion: true } },
        unidadFuncional: { select: { id: true, codigo: true, piso: true, tipo: true } },
      },
    });

    return invitacion;
  }

  /**
   * Crea invitaciones en bulk para múltiples unidades
   */
  async crearInvitacionesBulk(dto: CreateInvitacionBulkDto, adminId: string) {
    // Tipo basado en lo que devuelve crearInvitacion (modelo Prisma con includes)
    type InvitacionCreada = Awaited<ReturnType<ClaimingService['crearInvitacion']>>;
    
    const resultados: {
      totalGeneradas: number;
      invitaciones: InvitacionCreada[];
      errores: string[];
    } = {
      totalGeneradas: 0,
      invitaciones: [],
      errores: [],
    };

    // Obtener unidades a procesar
    let unidadIds: string[];

    if (dto.generarParaTodas) {
      // Obtener todas las unidades sin invitación activa
      const unidadesSinInvitacion = await this.prisma.unidadFuncional.findMany({
        where: {
          consorcioId: dto.consorcioId,
          activo: true,
          invitaciones: {
            none: {
              estado: EstadoInvitacion.PENDIENTE,
              fechaExpiracion: { gt: new Date() },
            },
          },
        },
        select: { id: true, codigo: true },
      });

      unidadIds = unidadesSinInvitacion.map(u => u.id);
    } else {
      unidadIds = dto.unidadFuncionalIds || [];
    }

    // Crear invitación para cada unidad
    for (const unidadId of unidadIds) {
      try {
        const invitacion = await this.crearInvitacion(
          {
            consorcioId: dto.consorcioId,
            unidadFuncionalId: unidadId,
          },
          adminId
        );
        resultados.invitaciones.push(invitacion);
        resultados.totalGeneradas++;
      } catch (error) {
        resultados.errores.push(
          `Unidad ${unidadId}: ${error instanceof Error ? error.message : 'Error desconocido'}`
        );
      }
    }

    return resultados;
  }

  // ==========================================================================
  // Validar y reclamar (Usuario)
  // ==========================================================================

  /**
   * Valida un código de invitación sin consumirlo
   */
  async validarCodigo(dto: ValidarCodigoDto) {
    const invitacion = await this.prisma.invitacionUnidad.findUnique({
      where: { codigoInvitacion: dto.codigoInvitacion.toUpperCase() },
      include: {
        consorcio: { select: { id: true, nombre: true, direccion: true } },
        unidadFuncional: { select: { id: true, codigo: true, tipo: true } },
      },
    });

    if (!invitacion) {
      return {
        valido: false,
        mensaje: 'Código de invitación no encontrado',
      };
    }

    if (invitacion.estado !== EstadoInvitacion.PENDIENTE) {
      return {
        valido: false,
        mensaje: invitacion.estado === EstadoInvitacion.ACEPTADA
          ? 'Este código ya fue utilizado'
          : 'Este código ya no es válido',
      };
    }

    if (invitacion.fechaExpiracion < new Date()) {
      // Actualizar estado a expirado
      await this.prisma.invitacionUnidad.update({
        where: { id: invitacion.id },
        data: { estado: EstadoInvitacion.EXPIRADA },
      });

      return {
        valido: false,
        mensaje: 'Este código ha expirado. Contacta al administrador.',
      };
    }

    return {
      valido: true,
      requiereDni: !!invitacion.dniEsperado,
      preview: {
        consorcioNombre: invitacion.consorcio.nombre,
        unidadCodigo: invitacion.unidadFuncional.codigo,
        rolAsignado: invitacion.rolAsignado,
      },
    };
  }

  /**
   * Reclama una unidad usando el código de invitación
   */
  async claimUnidad(dto: ClaimUnidadDto, usuarioId: string) {
    const codigoUpper = dto.codigoInvitacion.toUpperCase();

    // Buscar invitación
    const invitacion = await this.prisma.invitacionUnidad.findUnique({
      where: { codigoInvitacion: codigoUpper },
      include: {
        consorcio: { select: { id: true, nombre: true, direccion: true } },
        unidadFuncional: { select: { id: true, codigo: true, tipo: true } },
      },
    });

    if (!invitacion) {
      throw new NotFoundException('Código de invitación no válido');
    }

    // Validar estado
    if (invitacion.estado !== EstadoInvitacion.PENDIENTE) {
      throw new BadRequestException(
        invitacion.estado === EstadoInvitacion.ACEPTADA
          ? 'Este código ya fue utilizado'
          : 'Este código ya no es válido'
      );
    }

    // Validar expiración
    if (invitacion.fechaExpiracion < new Date()) {
      await this.prisma.invitacionUnidad.update({
        where: { id: invitacion.id },
        data: { estado: EstadoInvitacion.EXPIRADA },
      });
      throw new BadRequestException('El código ha expirado');
    }

    // Validar DNI si se requiere
    if (invitacion.dniEsperado) {
      if (!dto.dniValidacion) {
        throw new BadRequestException('Se requiere validación de DNI');
      }

      if (dto.dniValidacion !== invitacion.dniEsperado) {
        // Incrementar intentos fallidos
        const nuevosIntentos = invitacion.intentosFallidos + 1;
        
        await this.prisma.invitacionUnidad.update({
          where: { id: invitacion.id },
          data: { intentosFallidos: nuevosIntentos },
        });

        // Bloquear después de 5 intentos
        if (nuevosIntentos >= 5) {
          await this.prisma.invitacionUnidad.update({
            where: { id: invitacion.id },
            data: { estado: EstadoInvitacion.REVOCADA },
          });
          throw new ForbiddenException(
            'Demasiados intentos fallidos. El código ha sido bloqueado.'
          );
        }

        throw new BadRequestException(
          `DNI incorrecto. Intentos restantes: ${5 - nuevosIntentos}`
        );
      }
    }

    // Verificar que el usuario no esté ya asociado a esta UF
    const vinculoExistente = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId: invitacion.consorcioId,
        unidadFuncionalId: invitacion.unidadFuncionalId,
      },
    });

    if (vinculoExistente) {
      throw new BadRequestException(
        'Ya estás asociado a esta unidad funcional'
      );
    }

    // Ejecutar claim en transacción
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Crear relación usuario-consorcio
      const usuarioConsorcio = await tx.usuarioConsorcio.create({
        data: {
          usuarioId,
          consorcioId: invitacion.consorcioId,
          unidadFuncionalId: invitacion.unidadFuncionalId,
          rol: invitacion.rolAsignado,
          tipoVinculo: invitacion.tipoVinculo,
          activo: true,
        },
      });

      // Marcar invitación como usada
      await tx.invitacionUnidad.update({
        where: { id: invitacion.id },
        data: {
          estado: EstadoInvitacion.ACEPTADA,
          usadaPor: usuarioId,
          usadaAt: new Date(),
        },
      });

      // Crear registro de auditoría
      await tx.auditLog.create({
        data: {
          usuarioId,
          accion: 'CLAIM_UNIDAD',
          entidad: 'InvitacionUnidad',
          entidadId: invitacion.id,
          datosNuevos: {
            consorcioId: invitacion.consorcioId,
            unidadFuncionalId: invitacion.unidadFuncionalId,
            rol: invitacion.rolAsignado,
            codigoUsado: codigoUpper,
          },
        },
      });

      return usuarioConsorcio;
    });

    return {
      success: true,
      mensaje: '¡Unidad reclamada exitosamente!',
      usuarioConsorcioId: resultado.id,
      consorcio: invitacion.consorcio,
      unidad: {
        id: invitacion.unidadFuncional.id,
        codigo: invitacion.unidadFuncional.codigo,
      },
    };
  }

  // ==========================================================================
  // Consultas (Admin)
  // ==========================================================================

  /**
   * Lista invitaciones de un consorcio con filtros
   */
  async listarInvitaciones(
    consorcioId: string,
    filtros?: {
      estado?: EstadoInvitacion;
      unidadFuncionalId?: string;
    }
  ) {
    const where: Prisma.InvitacionUnidadWhereInput = { consorcioId };

    if (filtros?.estado) {
      where.estado = filtros.estado;
    }

    if (filtros?.unidadFuncionalId) {
      where.unidadFuncionalId = filtros.unidadFuncionalId;
    }

    return this.prisma.invitacionUnidad.findMany({
      where,
      include: {
        unidadFuncional: { select: { id: true, codigo: true, piso: true, tipo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Revoca una invitación
   */
  async revocarInvitacion(invitacionId: string, adminId: string) {
    const invitacion = await this.prisma.invitacionUnidad.findUnique({
      where: { id: invitacionId },
    });

    if (!invitacion) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitacion.estado !== EstadoInvitacion.PENDIENTE) {
      throw new BadRequestException('Solo se pueden revocar invitaciones pendientes');
    }

    return this.prisma.invitacionUnidad.update({
      where: { id: invitacionId },
      data: {
        estado: EstadoInvitacion.REVOCADA,
        notas: `${invitacion.notas || ''}\n[Revocada por admin ${adminId} el ${new Date().toISOString()}]`,
      },
    });
  }

  /**
   * Regenera el código de una invitación (mantiene la misma pero con código nuevo)
   */
  async regenerarCodigo(invitacionId: string) {
    const invitacion = await this.prisma.invitacionUnidad.findUnique({
      where: { id: invitacionId },
    });

    if (!invitacion) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (invitacion.estado !== EstadoInvitacion.PENDIENTE) {
      throw new BadRequestException('Solo se puede regenerar código de invitaciones pendientes');
    }

    const nuevoCodigo = await this.generarCodigoUnico();

    return this.prisma.invitacionUnidad.update({
      where: { id: invitacionId },
      data: {
        codigoInvitacion: nuevoCodigo,
        intentosFallidos: 0, // Reset intentos
      },
    });
  }
}
