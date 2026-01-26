import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateConsorcioDto,
  UpdateConsorcioDto,
  ConsorcioBancarioDto,
  ConsorcioResponseDto,
} from './dto/consorcio.dto';
import { Prisma, Consorcio } from '@prisma/client';

// =============================================================================
// Servicio de Consorcios
// =============================================================================

@Injectable()
export class ConsorciosService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear un nuevo consorcio
   */
  async create(
    organizacionId: string,
    dto: CreateConsorcioDto,
  ): Promise<ConsorcioResponseDto> {
    // Verificar límite de consorcios de la organización
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id: organizacionId },
      include: { _count: { select: { consorcios: true } } },
    });

    if (!organizacion) {
      throw new NotFoundException('Organización no encontrada');
    }

    if (organizacion._count.consorcios >= organizacion.limiteConsorcios) {
      throw new ForbiddenException(
        `Has alcanzado el límite de ${organizacion.limiteConsorcios} consorcios. Actualiza tu plan para agregar más.`,
      );
    }

    const consorcio = await this.prisma.consorcio.create({
      data: {
        organizacionId,
        nombre: dto.nombre,
        direccion: dto.direccion,
        localidad: dto.localidad,
        provincia: dto.provincia || 'Buenos Aires',
        codigoPostal: dto.codigoPostal,
        cuit: dto.cuit,
        diaVencimiento: dto.diaVencimiento || 10,
        tasaInteresMora: dto.tasaInteresMora || 0,
        periodoGracia: dto.periodoGracia || 0,
      },
    });

    return this.mapToResponse(consorcio);
  }

  /**
   * Obtener todos los consorcios de una organización
   */
  async findAll(
    organizacionId: string,
    options: {
      page?: number;
      limit?: number;
      search?: string;
      activo?: boolean;
    } = {},
  ) {
    const { page = 1, limit = 10, search, activo } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.ConsorcioWhereInput = {
      organizacionId,
      ...(activo !== undefined && { activo }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' } },
          { direccion: { contains: search, mode: 'insensitive' } },
          { localidad: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    const [consorcios, total] = await Promise.all([
      this.prisma.consorcio.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: {
          _count: {
            select: {
              unidadesFuncionales: true,
              usuariosConsorcio: {
                where: { rol: { in: ['PROPIETARIO', 'INQUILINO'] } },
              },
            },
          },
        },
      }),
      this.prisma.consorcio.count({ where }),
    ]);

    return {
      data: consorcios.map((c) => ({
        ...this.mapToResponse(c),
        totalUnidades: c._count.unidadesFuncionales,
        totalPropietarios: c._count.usuariosConsorcio,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Obtener un consorcio por ID
   */
  async findOne(
    id: string,
    organizacionId: string,
  ): Promise<ConsorcioResponseDto> {
    const consorcio = await this.prisma.consorcio.findFirst({
      where: { id, organizacionId },
      include: {
        _count: {
          select: {
            unidadesFuncionales: true,
            usuariosConsorcio: {
              where: { rol: { in: ['PROPIETARIO', 'INQUILINO'] } },
            },
          },
        },
      },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }

    return {
      ...this.mapToResponse(consorcio),
      totalUnidades: consorcio._count.unidadesFuncionales,
      totalPropietarios: consorcio._count.usuariosConsorcio,
    };
  }

  /**
   * Actualizar un consorcio
   */
  async update(
    id: string,
    organizacionId: string,
    dto: UpdateConsorcioDto,
  ): Promise<ConsorcioResponseDto> {
    // Verificar que existe y pertenece a la organización
    await this.findOne(id, organizacionId);

    const consorcio = await this.prisma.consorcio.update({
      where: { id },
      data: {
        ...(dto.nombre && { nombre: dto.nombre }),
        ...(dto.direccion && { direccion: dto.direccion }),
        ...(dto.localidad && { localidad: dto.localidad }),
        ...(dto.provincia && { provincia: dto.provincia }),
        ...(dto.codigoPostal !== undefined && { codigoPostal: dto.codigoPostal }),
        ...(dto.cuit !== undefined && { cuit: dto.cuit }),
        ...(dto.diaVencimiento !== undefined && { diaVencimiento: dto.diaVencimiento }),
        ...(dto.tasaInteresMora !== undefined && { tasaInteresMora: dto.tasaInteresMora }),
        ...(dto.periodoGracia !== undefined && { periodoGracia: dto.periodoGracia }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });

    return this.mapToResponse(consorcio);
  }

  /**
   * Actualizar datos bancarios del consorcio
   * Solo ADMINISTRADOR puede hacer esto
   */
  async updateBancario(
    id: string,
    organizacionId: string,
    dto: ConsorcioBancarioDto,
  ): Promise<ConsorcioResponseDto> {
    await this.findOne(id, organizacionId);

    const consorcio = await this.prisma.consorcio.update({
      where: { id },
      data: {
        cbu: dto.cbu,
        aliasCbu: dto.aliasCbu,
        banco: dto.banco,
      },
    });

    return this.mapToResponse(consorcio);
  }

  /**
   * Eliminar un consorcio (soft delete - desactivar)
   */
  async remove(id: string, organizacionId: string): Promise<void> {
    const consorcio = await this.findOne(id, organizacionId);

    // Verificar que no tenga saldos pendientes
    const saldosPendientes = await this.prisma.movimientoCuentaCorriente.aggregate({
      where: {
        unidadFuncional: { consorcioId: id },
      },
      _sum: { monto: true },
    });

    if (saldosPendientes._sum.monto && Number(saldosPendientes._sum.monto) !== 0) {
      throw new BadRequestException(
        'No se puede eliminar un consorcio con saldos pendientes',
      );
    }

    // Soft delete
    await this.prisma.consorcio.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Obtener estadísticas globales del dashboard para la organización
   */
  async getDashboardStats(organizacionId: string) {
    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      totalConsorcios,
      totalUnidades,
      recaudacionMes,
      unidadesConDeuda,
    ] = await Promise.all([
      // Total de consorcios activos
      this.prisma.consorcio.count({
        where: { organizacionId, activo: true },
      }),

      // Total de unidades funcionales activas
      this.prisma.unidadFuncional.count({
        where: {
          consorcio: { organizacionId, activo: true },
          activo: true,
        },
      }),

      // Total recaudado este mes (todos los consorcios de la org)
      this.prisma.pago.aggregate({
        where: {
          usuario: {
            rolesConsorcio: {
              some: {
                consorcio: { organizacionId, activo: true },
              },
            },
          },
          estado: 'APROBADO',
          fechaPago: { gte: inicioMes },
        },
        _sum: { monto: true },
      }),

      // Cantidad de unidades con deuda
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT uf.id) as count
        FROM unidades_funcionales uf
        JOIN consorcios c ON uf."consorcioId" = c.id
        LEFT JOIN movimientos_cuenta_corriente m ON m."unidadFuncionalId" = uf.id
        WHERE c."organizacionId" = ${organizacionId}
          AND c.activo = true
          AND uf.activo = true
        GROUP BY uf.id
        HAVING COALESCE(SUM(m.monto), 0) < 0
      `.then((r) => r.length).catch(() => 0),
    ]);

    const porcentajeMorosidad = totalUnidades > 0
      ? Math.round((unidadesConDeuda / totalUnidades) * 100)
      : 0;

    return {
      totalConsorcios,
      totalUnidades,
      recaudacionMes: Number(recaudacionMes._sum.monto || 0),
      unidadesConDeuda,
      porcentajeMorosidad,
    };
  }

  /**
   * Obtener estadísticas del consorcio
   */
  async getEstadisticas(id: string, organizacionId: string) {
    await this.findOne(id, organizacionId);

    const [
      totalUnidades,
      unidadesConDeuda,
      totalRecaudadoMes,
      gastosMes,
    ] = await Promise.all([
      // Total de unidades
      this.prisma.unidadFuncional.count({
        where: { consorcioId: id, activo: true },
      }),

      // Unidades con deuda (movimientos negativos)
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT uf.id) as count
        FROM unidades_funcionales uf
        LEFT JOIN movimientos_cuenta_corriente m ON m."unidadFuncionalId" = uf.id
        WHERE uf."consorcioId" = ${id}
        GROUP BY uf.id
        HAVING COALESCE(SUM(m.monto), 0) < 0
      `.then((r) => Number(r[0]?.count || 0)),

      // Total recaudado este mes
      this.prisma.pago.aggregate({
        where: {
          usuario: {
            rolesConsorcio: {
              some: { consorcioId: id },
            },
          },
          estado: 'APROBADO',
          fechaPago: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { monto: true },
      }),

      // Gastos del mes
      this.prisma.gasto.aggregate({
        where: {
          consorcioId: id,
          fechaGasto: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        _sum: { monto: true },
      }),
    ]);

    return {
      totalUnidades,
      unidadesConDeuda,
      porcentajeMorosidad: totalUnidades > 0
        ? Math.round((unidadesConDeuda / totalUnidades) * 100)
        : 0,
      totalRecaudadoMes: Number(totalRecaudadoMes._sum.monto || 0),
      totalGastosMes: Number(gastosMes._sum.monto || 0),
    };
  }

  /**
   * Mapear entidad a response DTO
   */
  private mapToResponse(consorcio: Consorcio): ConsorcioResponseDto {
    return {
      id: consorcio.id,
      nombre: consorcio.nombre,
      direccion: consorcio.direccion,
      localidad: consorcio.localidad,
      provincia: consorcio.provincia,
      codigoPostal: consorcio.codigoPostal ?? undefined,
      cuit: consorcio.cuit ?? undefined,
      diaVencimiento: consorcio.diaVencimiento,
      tasaInteresMora: Number(consorcio.tasaInteresMora),
      periodoGracia: consorcio.periodoGracia,
      activo: consorcio.activo,
      createdAt: consorcio.createdAt,
      updatedAt: consorcio.updatedAt,
    };
  }
}
