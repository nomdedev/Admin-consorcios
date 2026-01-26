import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateUnidadFuncionalDto,
  UpdateUnidadFuncionalDto,
  UnidadFuncionalResponseDto,
  TipoUnidadFuncional,
} from './dto/unidad-funcional.dto';
import { Prisma, UnidadFuncional } from '@prisma/client';

// =============================================================================
// Servicio de Unidades Funcionales
// =============================================================================

@Injectable()
export class UnidadesFuncionalesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crear una nueva unidad funcional
   */
  async create(
    consorcioId: string,
    organizacionId: string,
    dto: CreateUnidadFuncionalDto,
  ): Promise<UnidadFuncionalResponseDto> {
    // Verificar que el consorcio existe y pertenece a la organización
    await this.verificarConsorcio(consorcioId, organizacionId);

    // Verificar que el código no esté duplicado
    const existente = await this.prisma.unidadFuncional.findUnique({
      where: {
        consorcioId_codigo: {
          consorcioId,
          codigo: dto.codigo,
        },
      },
    });

    if (existente) {
      throw new ConflictException(`Ya existe una unidad con código ${dto.codigo}`);
    }

    const unidad = await this.prisma.unidadFuncional.create({
      data: {
        consorcioId,
        codigo: dto.codigo,
        piso: dto.piso,
        numero: dto.numero,
        tipo: dto.tipo || TipoUnidadFuncional.DEPARTAMENTO,
        coeficiente: dto.coeficiente,
        superficieM2: dto.superficieM2,
      },
    });

    return this.mapToResponse(unidad);
  }

  /**
   * Crear múltiples unidades funcionales en una sola operación
   */
  async bulkCreate(
    consorcioId: string,
    organizacionId: string,
    unidades: CreateUnidadFuncionalDto[],
  ): Promise<{ created: number; errors: string[] }> {
    await this.verificarConsorcio(consorcioId, organizacionId);

    const errors: string[] = [];
    let created = 0;

    for (const dto of unidades) {
      try {
        await this.create(consorcioId, organizacionId, dto);
        created++;
      } catch (error) {
        errors.push(`${dto.codigo}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    return { created, errors };
  }

  /**
   * Obtener todas las unidades de un consorcio
   */
  async findAll(
    consorcioId: string,
    organizacionId: string,
    options: {
      page?: number;
      limit?: number;
      tipo?: TipoUnidadFuncional;
      activo?: boolean;
      conDeuda?: boolean;
    } = {},
  ) {
    await this.verificarConsorcio(consorcioId, organizacionId);

    const { page = 1, limit = 50, tipo, activo } = options;
    const skip = (page - 1) * limit;

    const where: Prisma.UnidadFuncionalWhereInput = {
      consorcioId,
      ...(tipo && { tipo }),
      ...(activo !== undefined && { activo }),
    };

    const [unidades, total] = await Promise.all([
      this.prisma.unidadFuncional.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ piso: 'asc' }, { numero: 'asc' }, { codigo: 'asc' }],
        include: {
          usuarios: {
            where: { activo: true },
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
          },
        },
      }),
      this.prisma.unidadFuncional.count({ where }),
    ]);

    // Obtener saldos de todas las unidades
    const saldos = await this.getSaldosUnidades(unidades.map((u) => u.id));

    return {
      data: unidades.map((u) => ({
        ...this.mapToResponse(u),
        propietario: u.usuarios.find(
          (uc) => uc.tipoVinculo === 'TITULAR_VOTANTE' || uc.tipoVinculo === 'COPROPIETARIO',
        )?.usuario,
        inquilino: u.usuarios.find((uc) => uc.tipoVinculo === 'INQUILINO_PRINCIPAL')?.usuario,
        saldoActual: saldos[u.id] || 0,
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Obtener una unidad funcional por ID
   */
  async findOne(
    id: string,
    consorcioId: string,
    organizacionId: string,
  ): Promise<UnidadFuncionalResponseDto> {
    await this.verificarConsorcio(consorcioId, organizacionId);

    const unidad = await this.prisma.unidadFuncional.findFirst({
      where: { id, consorcioId },
      include: {
        usuarios: {
          where: { activo: true },
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
        },
      },
    });

    if (!unidad) {
      throw new NotFoundException('Unidad funcional no encontrada');
    }

    const saldos = await this.getSaldosUnidades([unidad.id]);

    return {
      ...this.mapToResponse(unidad),
      propietario: unidad.usuarios.find(
        (uc) => uc.tipoVinculo === 'TITULAR_VOTANTE' || uc.tipoVinculo === 'COPROPIETARIO',
      )?.usuario,
      inquilino: unidad.usuarios.find((uc) => uc.tipoVinculo === 'INQUILINO_PRINCIPAL')
        ?.usuario,
      saldoActual: saldos[unidad.id] || 0,
    };
  }

  /**
   * Actualizar una unidad funcional
   */
  async update(
    id: string,
    consorcioId: string,
    organizacionId: string,
    dto: UpdateUnidadFuncionalDto,
  ): Promise<UnidadFuncionalResponseDto> {
    await this.findOne(id, consorcioId, organizacionId);

    // Si se cambia el código, verificar que no exista
    if (dto.codigo) {
      const existente = await this.prisma.unidadFuncional.findFirst({
        where: {
          consorcioId,
          codigo: dto.codigo,
          id: { not: id },
        },
      });

      if (existente) {
        throw new ConflictException(`Ya existe una unidad con código ${dto.codigo}`);
      }
    }

    const unidad = await this.prisma.unidadFuncional.update({
      where: { id },
      data: {
        ...(dto.codigo && { codigo: dto.codigo }),
        ...(dto.piso !== undefined && { piso: dto.piso }),
        ...(dto.numero !== undefined && { numero: dto.numero }),
        ...(dto.tipo && { tipo: dto.tipo }),
        ...(dto.coeficiente !== undefined && { coeficiente: dto.coeficiente }),
        ...(dto.superficieM2 !== undefined && { superficieM2: dto.superficieM2 }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });

    return this.mapToResponse(unidad);
  }

  /**
   * Eliminar una unidad funcional (soft delete)
   */
  async remove(
    id: string,
    consorcioId: string,
    organizacionId: string,
  ): Promise<void> {
    const unidad = await this.findOne(id, consorcioId, organizacionId);

    // Verificar que no tenga saldo pendiente
    const saldos = await this.getSaldosUnidades([id]);
    if (saldos[id] && saldos[id] !== 0) {
      throw new BadRequestException(
        'No se puede eliminar una unidad con saldo pendiente',
      );
    }

    await this.prisma.unidadFuncional.update({
      where: { id },
      data: { activo: false },
    });
  }

  /**
   * Validar que la suma de coeficientes sea 100%
   */
  async validarCoeficientes(consorcioId: string, organizacionId: string) {
    await this.verificarConsorcio(consorcioId, organizacionId);

    const unidades = await this.prisma.unidadFuncional.findMany({
      where: { consorcioId, activo: true },
      select: { codigo: true, coeficiente: true },
      orderBy: { codigo: 'asc' },
    });

    const sumaTotal = unidades.reduce(
      (sum, u) => sum + Number(u.coeficiente),
      0,
    );

    return {
      sumaTotal: Math.round(sumaTotal * 1000000) / 1000000, // Redondear a 6 decimales
      esValido: Math.abs(sumaTotal - 100) < 0.001, // Tolerancia de 0.001%
      diferencia: Math.round((100 - sumaTotal) * 1000000) / 1000000,
      detalle: unidades.map((u) => ({
        codigo: u.codigo,
        coeficiente: Number(u.coeficiente),
      })),
    };
  }

  /**
   * Obtener cuenta corriente de una unidad
   */
  async getCuentaCorriente(
    id: string,
    consorcioId: string,
    organizacionId: string,
    options: { page?: number; limit?: number } = {},
  ) {
    await this.findOne(id, consorcioId, organizacionId);

    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [movimientos, total] = await Promise.all([
      this.prisma.movimientoCuentaCorriente.findMany({
        where: { unidadFuncionalId: id },
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.movimientoCuentaCorriente.count({
        where: { unidadFuncionalId: id },
      }),
    ]);

    return {
      data: movimientos.map((m) => ({
        id: m.id,
        tipo: m.tipo,
        concepto: m.concepto,
        monto: Number(m.monto),
        saldoResultante: Number(m.saldoResultante),
        fecha: m.fecha,
        expensaPeriodo: m.expensaPeriodo,
      })),
      total,
      page,
      limit,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers privados
  // ---------------------------------------------------------------------------

  private async verificarConsorcio(
    consorcioId: string,
    organizacionId: string,
  ): Promise<void> {
    const consorcio = await this.prisma.consorcio.findFirst({
      where: { id: consorcioId, organizacionId },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }
  }

  private async getSaldosUnidades(
    unidadIds: string[],
  ): Promise<Record<string, number>> {
    if (unidadIds.length === 0) return {};

    const ultimosMovimientos = await this.prisma.movimientoCuentaCorriente.findMany({
      where: {
        unidadFuncionalId: { in: unidadIds },
      },
      orderBy: { fecha: 'desc' },
      distinct: ['unidadFuncionalId'],
      select: {
        unidadFuncionalId: true,
        saldoResultante: true,
      },
    });

    return ultimosMovimientos.reduce(
      (acc, m) => {
        acc[m.unidadFuncionalId] = Number(m.saldoResultante);
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private mapToResponse(unidad: UnidadFuncional): UnidadFuncionalResponseDto {
    return {
      id: unidad.id,
      consorcioId: unidad.consorcioId,
      codigo: unidad.codigo,
      piso: unidad.piso ?? undefined,
      numero: unidad.numero ?? undefined,
      tipo: unidad.tipo as TipoUnidadFuncional,
      coeficiente: Number(unidad.coeficiente),
      superficieM2: unidad.superficieM2 ? Number(unidad.superficieM2) : undefined,
      activo: unidad.activo,
      createdAt: unidad.createdAt,
      updatedAt: unidad.updatedAt,
    };
  }
}
