// =============================================================================
// Servicio del Portal de Residentes
// Acceso a datos de expensas, gastos y pagos para propietarios e inquilinos
// =============================================================================

import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Rol, EstadoPago } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  FilterMisExpensasDto,
  FilterGastosEdificioDto,
  MiUnidadFuncionalDto,
  MiConsorcioDto,
  MiExpensaResumenDto,
  MisExpensasResponseDto,
  GastoEdificioDto,
  GastosEdificioResponseDto,
  ExpensaDetalleCompletoDto,
  ResumenUnidadesEdificioDto,
  DatosBancariosConsorcioDto,
} from './dto';

@Injectable()
export class ResidentPortalService {
  private readonly logger = new Logger(ResidentPortalService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // HELPERS DE SEGURIDAD
  // ===========================================================================

  /**
   * Obtiene la unidad funcional del usuario en un consorcio específico
   * CRÍTICO: Valida que el usuario tenga acceso como PROPIETARIO o INQUILINO
   */
  private async obtenerMiUnidadFuncional(
    usuarioId: string,
    consorcioId?: string,
  ): Promise<{
    unidadFuncional: MiUnidadFuncionalDto;
    consorcioId: string;
    rol: Rol;
  }> {
    const whereClause: Record<string, unknown> = {
      usuarioId,
      rol: { in: [Rol.PROPIETARIO, Rol.INQUILINO] },
      activo: true,
      unidadFuncionalId: { not: null },
    };

    if (consorcioId) {
      whereClause.consorcioId = consorcioId;
    }

    const usuarioConsorcio = await this.prisma.usuarioConsorcio.findFirst({
      where: whereClause,
      include: {
        unidadFuncional: true,
        consorcio: true,
      },
    });

    if (!usuarioConsorcio || !usuarioConsorcio.unidadFuncional) {
      this.logger.warn(
        `Usuario ${usuarioId} sin unidad funcional asignada`,
      );
      throw new ForbiddenException(
        'No tiene una unidad funcional asignada en este consorcio',
      );
    }

    const uf = usuarioConsorcio.unidadFuncional;

    return {
      unidadFuncional: {
        id: uf.id,
        codigo: uf.codigo,
        piso: uf.piso,
        numero: uf.numero,
        tipo: uf.tipo,
        coeficiente: Number(uf.coeficiente),
        superficieM2: uf.superficieM2 ? Number(uf.superficieM2) : null,
      },
      consorcioId: usuarioConsorcio.consorcioId,
      rol: usuarioConsorcio.rol,
    };
  }

  /**
   * Valida que un INQUILINO no vea gastos extraordinarios
   * Los inquilinos solo pagan expensas ordinarias
   */
  private puedeVerExtraordinarios(rol: Rol): boolean {
    return rol === Rol.PROPIETARIO;
  }

  // ===========================================================================
  // MIS DATOS
  // ===========================================================================

  /**
   * Obtiene información de mi unidad funcional y consorcio
   */
  async obtenerMisDatos(usuarioId: string): Promise<{
    unidadFuncional: MiUnidadFuncionalDto;
    consorcio: MiConsorcioDto;
    rol: string;
  }> {
    const { unidadFuncional, consorcioId, rol } =
      await this.obtenerMiUnidadFuncional(usuarioId);

    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: consorcioId },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }

    return {
      unidadFuncional,
      consorcio: {
        id: consorcio.id,
        nombre: consorcio.nombre,
        direccion: consorcio.direccion,
        localidad: consorcio.localidad,
        provincia: consorcio.provincia,
        diaVencimiento: consorcio.diaVencimiento,
        aliasCbu: consorcio.aliasCbu,
        banco: consorcio.banco,
        cuit: consorcio.cuit,
      },
      rol,
    };
  }

  // ===========================================================================
  // MIS EXPENSAS
  // ===========================================================================

  /**
   * Lista las expensas de mi unidad funcional
   */
  async obtenerMisExpensas(
    usuarioId: string,
    filtros: FilterMisExpensasDto,
  ): Promise<MisExpensasResponseDto> {
    const { unidadFuncional, consorcioId, rol } =
      await this.obtenerMiUnidadFuncional(usuarioId);

    const page = filtros.page || 1;
    const limit = filtros.limit || 12;
    const skip = (page - 1) * limit;

    // Construir filtro de búsqueda
    const whereClause: Record<string, unknown> = {
      expensa: {
        consorcioId,
        estado: { in: ['PUBLICADA', 'CERRADA'] }, // Solo expensas visibles
      },
      unidadFuncionalId: unidadFuncional.id,
    };

    // Filtrar por año si se especifica
    if (filtros.anio) {
      const periodoInicio = `${filtros.anio}-01`;
      const periodoFin = `${filtros.anio}-12`;
      whereClause.expensa = {
        ...whereClause.expensa as object,
        periodo: { gte: periodoInicio, lte: periodoFin },
      };
    }

    // Obtener detalles de expensas
    const [detalles, total] = await Promise.all([
      this.prisma.detalleExpensa.findMany({
        where: whereClause,
        include: {
          expensa: true,
        },
        orderBy: { expensa: { periodo: 'desc' } },
        skip,
        take: limit,
      }),
      this.prisma.detalleExpensa.count({ where: whereClause }),
    ]);

    // Calcular saldo actual de la cuenta corriente
    const ultimoMovimiento = await this.prisma.movimientoCuentaCorriente.findFirst({
      where: { unidadFuncionalId: unidadFuncional.id },
      orderBy: { fecha: 'desc' },
    });

    const saldoActual = ultimoMovimiento
      ? Number(ultimoMovimiento.saldoResultante)
      : 0;

    // Determinar estado de pago para cada expensa
    const expensasConEstado = await Promise.all(
      detalles.map(async (detalle) => {
        // Buscar pagos aprobados para este período
        const pagos = await this.prisma.pago.findMany({
          where: {
            usuarioId,
            periodosAbonados: { has: detalle.expensa.periodo },
            estado: EstadoPago.APROBADO,
          },
        });

        const totalPagado = pagos.reduce(
          (sum, p) => sum + Number(p.monto),
          0,
        );
        const totalExpensa = Number(detalle.total);

        let estadoPago: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';
        if (totalPagado >= totalExpensa) {
          estadoPago = 'PAGADO';
        } else if (totalPagado > 0) {
          estadoPago = 'PARCIAL';
        } else {
          estadoPago = 'PENDIENTE';
        }

        // Si es inquilino, no mostrar extraordinarios
        const montoExtraordinario = this.puedeVerExtraordinarios(rol)
          ? Number(detalle.montoExtraordinario)
          : 0;

        const totalAjustado = this.puedeVerExtraordinarios(rol)
          ? Number(detalle.total)
          : Number(detalle.montoOrdinario) +
            Number(detalle.saldoAnterior) +
            Number(detalle.intereses) -
            Number(detalle.bonificacion);

        return {
          id: detalle.id,
          periodo: detalle.expensa.periodo,
          total: totalAjustado,
          montoOrdinario: Number(detalle.montoOrdinario),
          montoExtraordinario,
          saldoAnterior: Number(detalle.saldoAnterior),
          intereses: Number(detalle.intereses),
          bonificacion: Number(detalle.bonificacion),
          estadoPago,
          fechaVencimiento: detalle.expensa.fechaVencimiento,
          fechaSegundoVencimiento: detalle.expensa.fechaSegundoVencimiento,
          estado: detalle.expensa.estado,
        };
      }),
    );

    // Filtrar solo pendientes si se solicita
    let data = expensasConEstado;
    let totalFiltrado = total;

    if (filtros.soloPendientes === 'true') {
      data = expensasConEstado.filter((e) => e.estadoPago !== 'PAGADO');
      totalFiltrado = data.length;
    }

    return {
      data,
      total: totalFiltrado,
      page,
      limit,
      totalPages: Math.ceil(totalFiltrado / limit),
      saldoActual,
    };
  }

  /**
   * Obtiene el detalle completo de una expensa
   */
  async obtenerDetalleExpensa(
    usuarioId: string,
    periodo: string,
  ): Promise<ExpensaDetalleCompletoDto> {
    const { unidadFuncional, consorcioId, rol } =
      await this.obtenerMiUnidadFuncional(usuarioId);

    // Buscar la expensa del período
    const expensa = await this.prisma.expensa.findFirst({
      where: {
        consorcioId,
        periodo,
        estado: { in: ['PUBLICADA', 'CERRADA'] },
      },
      include: {
        gastos: {
          include: {
            categoria: true,
            proveedor: true,
          },
        },
        detalles: {
          where: { unidadFuncionalId: unidadFuncional.id },
        },
      },
    });

    if (!expensa) {
      throw new NotFoundException(
        `No se encontró expensa publicada para el período ${periodo}`,
      );
    }

    const detalle = expensa.detalles[0];
    if (!detalle) {
      throw new NotFoundException(
        'No se encontró detalle de expensa para su unidad',
      );
    }

    // Separar gastos ordinarios y extraordinarios
    const gastosOrdinarios = expensa.gastos
      .filter((g) => !g.esExtraordinario)
      .map(this.mapGastoToDto);

    // Solo propietarios ven extraordinarios
    const gastosExtraordinarios = this.puedeVerExtraordinarios(rol)
      ? expensa.gastos.filter((g) => g.esExtraordinario).map(this.mapGastoToDto)
      : [];

    // Resumen por categoría
    const gastosParaResumen = this.puedeVerExtraordinarios(rol)
      ? expensa.gastos
      : expensa.gastos.filter((g) => !g.esExtraordinario);

    const resumenPorCategoria = this.agruparPorCategoria(gastosParaResumen);

    // Obtener pagos realizados
    const pagos = await this.prisma.pago.findMany({
      where: {
        usuarioId,
        periodosAbonados: { has: periodo },
        estado: { in: [EstadoPago.APROBADO, EstadoPago.PENDIENTE, EstadoPago.PROCESANDO] },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular estado de pago
    const totalPagado = pagos
      .filter((p) => p.estado === EstadoPago.APROBADO)
      .reduce((sum, p) => sum + Number(p.monto), 0);

    const totalExpensa = Number(detalle.total);
    let estadoPago: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';
    if (totalPagado >= totalExpensa) {
      estadoPago = 'PAGADO';
    } else if (totalPagado > 0) {
      estadoPago = 'PARCIAL';
    } else {
      estadoPago = 'PENDIENTE';
    }

    // Calcular totales
    const totalGastosEdificio = expensa.gastos.reduce(
      (sum, g) => sum + Number(g.monto),
      0,
    );

    return {
      id: detalle.id,
      periodo: expensa.periodo,
      total: Number(detalle.total),
      montoOrdinario: Number(detalle.montoOrdinario),
      montoExtraordinario: this.puedeVerExtraordinarios(rol)
        ? Number(detalle.montoExtraordinario)
        : 0,
      saldoAnterior: Number(detalle.saldoAnterior),
      intereses: Number(detalle.intereses),
      bonificacion: Number(detalle.bonificacion),
      estadoPago,
      fechaVencimiento: expensa.fechaVencimiento,
      fechaSegundoVencimiento: expensa.fechaSegundoVencimiento,
      estado: expensa.estado,
      gastosOrdinarios,
      gastosExtraordinarios,
      resumenPorCategoria,
      totalGastosEdificio,
      miCoeficiente: Number(unidadFuncional.coeficiente),
      pagosRealizados: pagos.map((p) => ({
        id: p.id,
        monto: Number(p.monto),
        fecha: p.fechaPago || p.createdAt,
        estado: p.estado,
        metodoPago: p.metodoPago,
      })),
    };
  }

  // ===========================================================================
  // GASTOS DEL EDIFICIO
  // ===========================================================================

  /**
   * Lista todos los gastos del edificio (transparencia)
   */
  async obtenerGastosEdificio(
    usuarioId: string,
    filtros: FilterGastosEdificioDto,
  ): Promise<GastosEdificioResponseDto> {
    const { consorcioId, rol } = await this.obtenerMiUnidadFuncional(usuarioId);

    const page = filtros.page || 1;
    const limit = filtros.limit || 20;
    const skip = (page - 1) * limit;

    // Construir filtro
    const whereClause: Record<string, unknown> = {
      consorcioId,
      // Solo mostrar gastos de expensas publicadas/cerradas
      expensa: {
        estado: { in: ['PUBLICADA', 'CERRADA'] },
      },
    };

    // Filtrar por período
    if (filtros.periodo) {
      whereClause.expensa = {
        ...whereClause.expensa as object,
        periodo: filtros.periodo,
      };
    }

    // Filtrar por categoría
    if (filtros.categoriaId) {
      whereClause.categoriaId = filtros.categoriaId;
    }

    // Inquilinos no ven extraordinarios
    if (!this.puedeVerExtraordinarios(rol)) {
      whereClause.esExtraordinario = false;
    } else if (filtros.soloExtraordinarios === 'true') {
      whereClause.esExtraordinario = true;
    }

    const [gastos, total, agregados] = await Promise.all([
      this.prisma.gasto.findMany({
        where: whereClause,
        include: {
          categoria: true,
          proveedor: true,
        },
        orderBy: { fechaGasto: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gasto.count({ where: whereClause }),
      this.prisma.gasto.aggregate({
        where: whereClause,
        _sum: { monto: true },
      }),
    ]);

    // Calcular sumas por tipo
    const whereOrdinarios = { ...whereClause, esExtraordinario: false };
    const whereExtraordinarios = { ...whereClause, esExtraordinario: true };

    const [sumaOrdinarios, sumaExtraordinarios] = await Promise.all([
      this.prisma.gasto.aggregate({
        where: whereOrdinarios,
        _sum: { monto: true },
      }),
      this.puedeVerExtraordinarios(rol)
        ? this.prisma.gasto.aggregate({
            where: whereExtraordinarios,
            _sum: { monto: true },
          })
        : { _sum: { monto: new Decimal(0) } },
    ]);

    return {
      data: gastos.map(this.mapGastoToDto),
      total,
      page,
      limit,
      sumaTotal: Number(agregados._sum.monto || 0),
      sumaOrdinarios: Number(sumaOrdinarios._sum.monto || 0),
      sumaExtraordinarios: Number(sumaExtraordinarios._sum.monto || 0),
    };
  }

  // ===========================================================================
  // RESUMEN DEL EDIFICIO
  // ===========================================================================

  /**
   * Obtiene resumen del estado de todas las unidades del edificio
   * (para transparencia, sin datos sensibles de otros vecinos)
   */
  async obtenerResumenEdificio(
    usuarioId: string,
  ): Promise<ResumenUnidadesEdificioDto> {
    const { consorcioId } = await this.obtenerMiUnidadFuncional(usuarioId);

    // Obtener todas las unidades del consorcio
    const unidades = await this.prisma.unidadFuncional.findMany({
      where: { consorcioId, activo: true },
      orderBy: [{ piso: 'asc' }, { codigo: 'asc' }],
    });

    // Para cada unidad, determinar si está al día
    const unidadesConEstado = await Promise.all(
      unidades.map(async (uf) => {
        const ultimoMovimiento =
          await this.prisma.movimientoCuentaCorriente.findFirst({
            where: { unidadFuncionalId: uf.id },
            orderBy: { fecha: 'desc' },
          });

        const saldo = ultimoMovimiento
          ? Number(ultimoMovimiento.saldoResultante)
          : 0;

        let estado: 'AL_DIA' | 'DEUDA_MENOR' | 'DEUDA_MAYOR';
        if (saldo <= 0) {
          estado = 'AL_DIA';
        } else if (saldo < 50000) {
          // Deuda menor a $50.000
          estado = 'DEUDA_MENOR';
        } else {
          estado = 'DEUDA_MAYOR';
        }

        return {
          codigo: uf.codigo,
          tipo: uf.tipo,
          coeficiente: Number(uf.coeficiente),
          estado,
        };
      }),
    );

    const unidadesAlDia = unidadesConEstado.filter(
      (u) => u.estado === 'AL_DIA',
    ).length;
    const unidadesConDeuda = unidadesConEstado.filter(
      (u) => u.estado !== 'AL_DIA',
    ).length;

    return {
      totalUnidades: unidades.length,
      unidadesAlDia,
      unidadesConDeuda,
      porcentajeMorosidad:
        unidades.length > 0
          ? Math.round((unidadesConDeuda / unidades.length) * 100)
          : 0,
      unidades: unidadesConEstado,
    };
  }

  // ===========================================================================
  // DATOS BANCARIOS
  // ===========================================================================

  /**
   * Obtiene los datos bancarios del consorcio para realizar pagos
   */
  async obtenerDatosBancarios(
    usuarioId: string,
  ): Promise<DatosBancariosConsorcioDto> {
    const { consorcioId } = await this.obtenerMiUnidadFuncional(usuarioId);

    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: consorcioId },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }

    return {
      aliasCbu: consorcio.aliasCbu,
      banco: consorcio.banco,
      titular: consorcio.nombre,
      cuit: consorcio.cuit,
      instrucciones: `Para realizar el pago por transferencia bancaria:
1. Transferir al alias: ${consorcio.aliasCbu || 'No disponible'}
2. Incluir en el concepto: su número de departamento y período
3. Enviar comprobante al administrador
4. El pago se acreditará en 24-48hs hábiles`,
    };
  }

  // ===========================================================================
  // CATEGORÍAS
  // ===========================================================================

  /**
   * Lista las categorías de gastos disponibles
   */
  async obtenerCategorias(): Promise<{ id: string; nombre: string }[]> {
    const categorias = await this.prisma.categoriaGasto.findMany({
      orderBy: { orden: 'asc' },
    });

    return categorias.map((c) => ({ id: c.id, nombre: c.nombre }));
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private mapGastoToDto = (gasto: {
    id: string;
    concepto: string;
    descripcion: string | null;
    monto: Decimal;
    fechaGasto: Date;
    esExtraordinario: boolean;
    archivoUrl: string | null;
    archivoNombre: string | null;
    tipoComprobante: string | null;
    numeroComprobante: string | null;
    caeAfip: string | null;
    categoria?: { id: string; nombre: string } | null;
    proveedor?: { id: string; razonSocial: string } | null;
  }): GastoEdificioDto => ({
    id: gasto.id,
    concepto: gasto.concepto,
    descripcion: gasto.descripcion,
    monto: Number(gasto.monto),
    fechaGasto: gasto.fechaGasto,
    esExtraordinario: gasto.esExtraordinario,
    categoria: gasto.categoria
      ? { id: gasto.categoria.id, nombre: gasto.categoria.nombre }
      : null,
    proveedor: gasto.proveedor
      ? { id: gasto.proveedor.id, razonSocial: gasto.proveedor.razonSocial }
      : null,
    archivoUrl: gasto.archivoUrl,
    archivoNombre: gasto.archivoNombre,
    tipoComprobante: gasto.tipoComprobante,
    numeroComprobante: gasto.numeroComprobante,
    caeAfip: gasto.caeAfip,
  });

  private agruparPorCategoria(
    gastos: { monto: Decimal; categoria?: { nombre: string } | null }[],
  ): { categoria: string; total: number }[] {
    const agrupado = new Map<string, number>();

    gastos.forEach((g) => {
      const cat = g.categoria?.nombre || 'Sin categoría';
      const actual = agrupado.get(cat) || 0;
      agrupado.set(cat, actual + Number(g.monto));
    });

    return Array.from(agrupado.entries())
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }
}
