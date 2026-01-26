import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SnapshotsService } from '../snapshots/snapshots.service';
import { NotificacionesService } from '../notificaciones/notificaciones.service';
import { TipoNotificacion } from '../notificaciones/dto';
import {
  CreateExpensaDto,
  UpdateExpensaDto,
  CalcularProrrateoDto,
  AsignarGastosDto,
  CerrarExpensaDto,
  FilterExpensasDto,
  EstadoExpensa,
  ProrrateoResultDto,
  DetalleExpensaResponseDto,
} from './dto';
import { Prisma, Rol } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

import { ExpensaPdfService } from '../pdf/expensa-pdf.service';

@Injectable()
export class ExpensasService {
  private readonly logger = new Logger(ExpensasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly snapshotsService: SnapshotsService,
    private readonly expensaPdfService: ExpensaPdfService,
    private readonly notificacionesService: NotificacionesService,
  ) {}

  // ===========================================================================
  // VALIDACIONES DE SEGURIDAD
  // ===========================================================================

  /**
   * Valida que el usuario tenga acceso al consorcio
   * CRÍTICO: Previene acceso no autorizado a datos de otros consorcios
   */
  private async validarAccesoConsorcio(
    usuarioId: string,
    consorcioId: string,
    rolesPermitidos: Rol[] = [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF],
  ): Promise<void> {
    const usuarioConsorcio = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        rol: { in: rolesPermitidos },
        activo: true,
      },
    });

    // Verificar si es SUPER_ADMIN global
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        rolesConsorcio: {
          where: { rol: Rol.SUPER_ADMIN },
        },
      },
    });

    const esSuperAdmin = usuario?.rolesConsorcio.some(r => r.rol === Rol.SUPER_ADMIN);

    if (!usuarioConsorcio && !esSuperAdmin) {
      this.logger.warn(
        `Acceso denegado: Usuario ${usuarioId} intentó acceder al consorcio ${consorcioId}`,
      );
      throw new ForbiddenException('No tiene permisos para acceder a este consorcio');
    }
  }

  /**
   * Valida que la expensa pueda ser modificada (no esté cerrada)
   */
  private validarExpensaModificable(estado: string): void {
    if (estado === EstadoExpensa.CERRADA) {
      throw new BadRequestException(
        'No se puede modificar una expensa cerrada. Use notas de crédito/débito para ajustes.',
      );
    }
    // SEGURIDAD: Las expensas PUBLICADAS tampoco deberían modificarse libremente
    if (estado === EstadoExpensa.PUBLICADA) {
      throw new BadRequestException(
        'No se puede modificar una expensa ya publicada. Debe despublicarla primero o usar notas de crédito/débito.',
      );
    }
  }

  /**
   * Valida que la expensa esté en estado correcto para publicar
   */
  private validarExpensaPublicable(estado: string): void {
    if (estado === EstadoExpensa.PUBLICADA) {
      throw new BadRequestException('La expensa ya está publicada');
    }
    if (estado === EstadoExpensa.CERRADA) {
      throw new BadRequestException('No se puede publicar una expensa cerrada');
    }
    if (estado !== EstadoExpensa.LIQUIDADA) {
      throw new BadRequestException(
        'La expensa debe estar liquidada (con prorrateo calculado) antes de publicar',
      );
    }
  }

  /**
   * Valida que la expensa pueda cerrarse
   */
  private validarExpensaCerrable(estado: string): void {
    if (estado === EstadoExpensa.CERRADA) {
      throw new BadRequestException('La expensa ya está cerrada');
    }
    if (estado !== EstadoExpensa.PUBLICADA) {
      throw new BadRequestException('Solo se pueden cerrar expensas publicadas');
    }
  }

  // ===========================================================================
  // CRUD BÁSICO
  // ===========================================================================

  async create(dto: CreateExpensaDto, usuarioId: string) {
    // Validar acceso al consorcio
    await this.validarAccesoConsorcio(usuarioId, dto.consorcioId);

    // SEGURIDAD: Validar que el período no sea muy futuro (máximo 3 meses adelante)
    const ahora = new Date();
    const partesPeriodo = dto.periodo.split('-');
    const anio = parseInt(partesPeriodo[0] || '0', 10);
    const mes = parseInt(partesPeriodo[1] || '1', 10);
    const periodoDate = new Date(anio, mes - 1, 1);
    const tresMesesAdelante = new Date(ahora.getFullYear(), ahora.getMonth() + 3, 1);
    
    if (periodoDate > tresMesesAdelante) {
      throw new BadRequestException(
        'No se pueden crear expensas con más de 3 meses de anticipación',
      );
    }

    // SEGURIDAD: Validar que la fecha de vencimiento sea coherente con el período
    const fechaVenc = new Date(dto.fechaVencimiento);
    if (fechaVenc < periodoDate) {
      throw new BadRequestException(
        'La fecha de vencimiento no puede ser anterior al inicio del período',
      );
    }

    // Validar que no exista expensa para el mismo período
    const existente = await this.prisma.expensa.findUnique({
      where: {
        consorcioId_periodo: {
          consorcioId: dto.consorcioId,
          periodo: dto.periodo,
        },
      },
    });

    if (existente) {
      throw new ConflictException(
        `Ya existe una expensa para el período ${dto.periodo} en este consorcio`,
      );
    }

    // Validar que el consorcio exista y esté activo
    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: dto.consorcioId },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }

    if (!consorcio.activo) {
      throw new BadRequestException('No se pueden crear expensas en un consorcio inactivo');
    }

    // Crear la expensa
    const expensa = await this.prisma.expensa.create({
      data: {
        consorcioId: dto.consorcioId,
        periodo: dto.periodo,
        fechaVencimiento: new Date(dto.fechaVencimiento),
        fechaSegundoVencimiento: dto.fechaSegundoVencimiento
          ? new Date(dto.fechaSegundoVencimiento)
          : null,
        recargoSegundoVencimiento: dto.recargoSegundoVencimiento
          ? new Decimal(dto.recargoSegundoVencimiento)
          : null,
        fondoReserva: dto.fondoReserva
          ? new Decimal(dto.fondoReserva)
          : new Decimal(0),
        observaciones: this.sanitizarTexto(dto.observaciones),
        totalGastosOrdinarios: new Decimal(0),
        totalGastosExtraordinarios: new Decimal(0),
        totalIngresos: new Decimal(0),
        estado: 'BORRADOR',
      },
    });

    // Auditar la operación
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Expensa',
      entidadId: expensa.id,
      datosNuevos: expensa,
    });

    this.logger.log(`Expensa creada: ${expensa.id} para período ${dto.periodo}`);

    return expensa;
  }

  async findAll(filtros: FilterExpensasDto, usuarioId: string) {
    const { consorcioId, periodo, anio, estado, page = 1, limit = 10 } = filtros;

    // Si se especifica consorcioId, validar acceso
    if (consorcioId) {
      await this.validarAccesoConsorcio(usuarioId, consorcioId, [
        Rol.SUPER_ADMIN,
        Rol.ADMINISTRADOR,
        Rol.ADMIN_STAFF,
        Rol.AUDITOR,
      ]);
    }

    // Construir filtros de búsqueda
    const where: Prisma.ExpensaWhereInput = {};

    if (consorcioId) {
      where.consorcioId = consorcioId;
    }

    if (periodo) {
      where.periodo = periodo;
    }

    if (anio) {
      where.periodo = { startsWith: String(anio) };
    }

    if (estado) {
      where.estado = estado;
    }

    // Si no es SUPER_ADMIN, filtrar solo consorcios accesibles
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        rolesConsorcio: {
          where: {
            activo: true,
            rol: { in: [Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR] },
          },
          select: { consorcioId: true },
        },
      },
    });

    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: { usuarioId, rol: Rol.SUPER_ADMIN },
    });

    if (!esSuperAdmin && !consorcioId) {
      const consorciosAccesibles = usuario?.rolesConsorcio.map(r => r.consorcioId) || [];
      where.consorcioId = { in: consorciosAccesibles };
    }

    const [expensas, total] = await Promise.all([
      this.prisma.expensa.findMany({
        where,
        include: {
          consorcio: {
            select: { nombre: true, direccion: true },
          },
          _count: {
            select: { gastos: true, detalles: true },
          },
        },
        orderBy: { periodo: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expensa.count({ where }),
    ]);

    return {
      data: expensas,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, usuarioId: string) {
    const expensa = await this.prisma.expensa.findUnique({
      where: { id },
      include: {
        consorcio: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            diaVencimiento: true,
            tasaInteresMora: true,
          },
        },
        gastos: {
          include: {
            categoria: true,
            proveedor: { select: { razonSocial: true } },
          },
          orderBy: { fechaGasto: 'desc' },
        },
        detalles: {
          include: {
            unidadFuncional: {
              select: { codigo: true, coeficiente: true },
            },
          },
          orderBy: { unidadFuncional: { codigo: 'asc' } },
        },
      },
    });

    if (!expensa) {
      throw new NotFoundException('Expensa no encontrada');
    }

    // Validar acceso al consorcio
    await this.validarAccesoConsorcio(usuarioId, expensa.consorcioId, [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
      Rol.AUDITOR,
    ]);

    return expensa;
  }

  /**
   * Busca una expensa por consorcio y período
   * Usado por el portal de residentes para descargar PDFs
   */
  async findByPeriodo(consorcioId: string, periodo: string, usuarioId: string) {
    // Para residentes, validar que tengan acceso al consorcio
    const acceso = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        activo: true,
      },
    });

    if (!acceso) {
      throw new ForbiddenException('No tiene acceso a este consorcio');
    }

    const expensa = await this.prisma.expensa.findFirst({
      where: {
        consorcioId,
        periodo,
        estado: { in: ['PUBLICADA', 'CERRADA'] },
      },
    });

    if (!expensa) {
      throw new NotFoundException(
        `No se encontró expensa publicada para el período ${periodo}`,
      );
    }

    return expensa;
  }

  async update(id: string, dto: UpdateExpensaDto, usuarioId: string) {
    const expensa = await this.findOne(id, usuarioId);

    // Validar que se pueda modificar
    this.validarExpensaModificable(expensa.estado);

    // No permitir cambiar consorcio ni período
    const { consorcioId, periodo, ...datosActualizables } = dto;

    const datosAnteriores = { ...expensa };

    const expensaActualizada = await this.prisma.expensa.update({
      where: { id },
      data: {
        ...datosActualizables,
        fechaVencimiento: datosActualizables.fechaVencimiento
          ? new Date(datosActualizables.fechaVencimiento)
          : undefined,
        fechaSegundoVencimiento: datosActualizables.fechaSegundoVencimiento
          ? new Date(datosActualizables.fechaSegundoVencimiento)
          : undefined,
        recargoSegundoVencimiento: datosActualizables.recargoSegundoVencimiento !== undefined
          ? new Decimal(datosActualizables.recargoSegundoVencimiento)
          : undefined,
        fondoReserva: datosActualizables.fondoReserva !== undefined
          ? new Decimal(datosActualizables.fondoReserva)
          : undefined,
      },
    });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Expensa',
      entidadId: id,
      datosAnteriores,
      datosNuevos: expensaActualizada,
    });

    return expensaActualizada;
  }

  async delete(id: string, usuarioId: string) {
    const expensa = await this.findOne(id, usuarioId);

    // Solo se pueden eliminar expensas en BORRADOR
    if (expensa.estado !== 'BORRADOR') {
      throw new BadRequestException(
        'Solo se pueden eliminar expensas en estado BORRADOR',
      );
    }

    // Desasociar gastos (no eliminarlos)
    await this.prisma.gasto.updateMany({
      where: { expensaId: id },
      data: { expensaId: null },
    });

    // Eliminar detalles
    await this.prisma.detalleExpensa.deleteMany({
      where: { expensaId: id },
    });

    // Eliminar expensa
    await this.prisma.expensa.delete({ where: { id } });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'Expensa',
      entidadId: id,
      datosAnteriores: expensa,
    });

    this.logger.log(`Expensa eliminada: ${id}`);

    return { success: true, message: 'Expensa eliminada correctamente' };
  }

  // ===========================================================================
  // ASIGNACIÓN DE GASTOS
  // ===========================================================================

  async asignarGastos(id: string, dto: AsignarGastosDto, usuarioId: string) {
    const expensa = await this.findOne(id, usuarioId);
    this.validarExpensaModificable(expensa.estado);

    // Validar que los gastos existan y pertenezcan al mismo consorcio
    const gastos = await this.prisma.gasto.findMany({
      where: {
        id: { in: dto.gastosIds },
        consorcioId: expensa.consorcioId,
      },
    });

    if (gastos.length !== dto.gastosIds.length) {
      throw new BadRequestException(
        'Algunos gastos no existen o no pertenecen al mismo consorcio',
      );
    }

    // Verificar que los gastos no estén asignados a otra expensa
    const gastosYaAsignados = gastos.filter(
      g => g.expensaId && g.expensaId !== id,
    );

    if (gastosYaAsignados.length > 0) {
      throw new BadRequestException(
        `Los siguientes gastos ya están asignados a otra expensa: ${gastosYaAsignados.map(g => g.concepto).join(', ')}`,
      );
    }

    // Asignar gastos a la expensa
    await this.prisma.gasto.updateMany({
      where: { id: { in: dto.gastosIds } },
      data: { expensaId: id },
    });

    // Recalcular totales
    await this.recalcularTotales(id);

    return this.findOne(id, usuarioId);
  }

  async desasignarGastos(id: string, dto: AsignarGastosDto, usuarioId: string) {
    const expensa = await this.findOne(id, usuarioId);
    this.validarExpensaModificable(expensa.estado);

    await this.prisma.gasto.updateMany({
      where: {
        id: { in: dto.gastosIds },
        expensaId: id,
      },
      data: { expensaId: null },
    });

    await this.recalcularTotales(id);

    return this.findOne(id, usuarioId);
  }

  // ===========================================================================
  // CÁLCULO DE PRORRATEO - LÓGICA CRÍTICA
  // ===========================================================================

  /**
   * Calcula el prorrateo de gastos entre todas las unidades funcionales
   * LÓGICA CRÍTICA: Este es el corazón del sistema de expensas
   */
  async calcularProrrateo(
    id: string,
    dto: CalcularProrrateoDto,
    usuarioId: string,
  ): Promise<ProrrateoResultDto> {
    const expensa = await this.findOne(id, usuarioId);
    this.validarExpensaModificable(expensa.estado);

    const {
      incluirSaldoAnterior = true,
      incluirIntereses = true,
      bonificacionPorcentaje = 0,
    } = dto;

    // 1. Obtener todas las unidades funcionales del consorcio
    const unidades = await this.prisma.unidadFuncional.findMany({
      where: { consorcioId: expensa.consorcioId, activo: true },
      include: {
        usuarios: {
          where: {
            activo: true,
            tipoVinculo: 'TITULAR_VOTANTE',
          },
          include: {
            usuario: { select: { nombre: true, apellido: true } },
          },
          take: 1,
        },
      },
      orderBy: { codigo: 'asc' },
    });

    if (unidades.length === 0) {
      throw new BadRequestException(
        'No hay unidades funcionales activas en el consorcio',
      );
    }

    // 2. Validar que los coeficientes sumen ~100
    const sumaCoeficientes = unidades.reduce(
      (sum, u) => sum + Number(u.coeficiente),
      0,
    );

    // Tolerancia de 0.01% por redondeos
    if (Math.abs(sumaCoeficientes - 100) > 0.01) {
      this.logger.warn(
        `Suma de coeficientes: ${sumaCoeficientes}% (esperado: 100%)`,
      );
      throw new BadRequestException(
        `Los coeficientes de las unidades suman ${sumaCoeficientes.toFixed(4)}%, ` +
          `deberían sumar 100%. Corrija los coeficientes antes de calcular el prorrateo.`,
      );
    }

    // 3. Obtener gastos de la expensa separados por tipo
    const gastosOrdinarios = expensa.gastos.filter(g => !g.esExtraordinario);
    const gastosExtraordinarios = expensa.gastos.filter(g => g.esExtraordinario);

    const totalOrdinario = gastosOrdinarios.reduce(
      (sum, g) => sum + Number(g.monto),
      0,
    );
    const totalExtraordinario = gastosExtraordinarios.reduce(
      (sum, g) => sum + Number(g.monto),
      0,
    );

    // 4. Obtener período anterior para saldos
    const periodoAnterior = this.calcularPeriodoAnterior(expensa.periodo);

    // 5. Calcular detalle para cada unidad
    const detallesCalculados: DetalleExpensaResponseDto[] = [];
    let totalSaldosAnteriores = 0;
    let totalIntereses = 0;
    let totalBonificaciones = 0;

    for (const unidad of unidades) {
      const coeficiente = Number(unidad.coeficiente);

      // Prorrateo de gastos
      const montoOrdinario = (totalOrdinario * coeficiente) / 100;
      const montoExtraordinario = (totalExtraordinario * coeficiente) / 100;

      // Saldo anterior (de la expensa del período anterior)
      let saldoAnterior = 0;
      if (incluirSaldoAnterior) {
        saldoAnterior = await this.obtenerSaldoAnterior(
          unidad.id,
          periodoAnterior,
        );
      }

      // Intereses por mora
      let intereses = 0;
      if (incluirIntereses && saldoAnterior > 0) {
        const tasaMora = Number(expensa.consorcio.tasaInteresMora);
        intereses = saldoAnterior * (tasaMora / 100);
      }

      // Bonificación
      const subtotal = montoOrdinario + montoExtraordinario + saldoAnterior + intereses;
      const bonificacion = subtotal * (bonificacionPorcentaje / 100);

      // Total final
      const total = subtotal - bonificacion;

      totalSaldosAnteriores += saldoAnterior;
      totalIntereses += intereses;
      totalBonificaciones += bonificacion;

      // Propietario
      const propietario = unidad.usuarios[0]?.usuario;
      const nombrePropietario = propietario
        ? `${propietario.nombre} ${propietario.apellido}`
        : undefined;

      detallesCalculados.push({
        id: '', // Se asignará al guardar
        unidadFuncionalId: unidad.id,
        unidadCodigo: unidad.codigo,
        coeficiente,
        montoOrdinario: this.redondear(montoOrdinario),
        montoExtraordinario: this.redondear(montoExtraordinario),
        saldoAnterior: this.redondear(saldoAnterior),
        intereses: this.redondear(intereses),
        bonificacion: this.redondear(bonificacion),
        total: this.redondear(total),
        propietario: nombrePropietario,
      });
    }

    // 6. Guardar detalles en la base de datos (transacción)
    const detallesGuardados = await this.prisma.$transaction(async tx => {
      // Eliminar detalles anteriores
      await tx.detalleExpensa.deleteMany({
        where: { expensaId: id },
      });

      // Crear nuevos detalles
      const creados = await Promise.all(
        detallesCalculados.map(d =>
          tx.detalleExpensa.create({
            data: {
              expensaId: id,
              unidadFuncionalId: d.unidadFuncionalId,
              montoOrdinario: new Decimal(d.montoOrdinario),
              montoExtraordinario: new Decimal(d.montoExtraordinario),
              saldoAnterior: new Decimal(d.saldoAnterior),
              intereses: new Decimal(d.intereses),
              bonificacion: new Decimal(d.bonificacion),
              total: new Decimal(d.total),
            },
          }),
        ),
      );

      // Actualizar expensa a estado LIQUIDADA
      await tx.expensa.update({
        where: { id },
        data: {
          estado: 'LIQUIDADA',
          totalGastosOrdinarios: new Decimal(totalOrdinario),
          totalGastosExtraordinarios: new Decimal(totalExtraordinario),
        },
      });

      return creados;
    });

    // Asignar IDs a los detalles calculados
    for (let i = 0; i < detallesCalculados.length; i++) {
      const detalle = detallesGuardados[i];
      const detalleCalculado = detallesCalculados[i];
      if (detalle && detalleCalculado) {
        detalleCalculado.id = detalle.id;
      }
    }

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Expensa',
      entidadId: id,
      datosNuevos: {
        accion: 'PRORRATEO_CALCULADO',
        totalOrdinario,
        totalExtraordinario,
        totalUnidades: unidades.length,
      },
    });

    const totalARecaudar = detallesCalculados.reduce((sum, d) => sum + d.total, 0);

    return {
      expensa: {
        ...expensa,
        totalGastosOrdinarios: totalOrdinario,
        totalGastosExtraordinarios: totalExtraordinario,
        estado: EstadoExpensa.LIQUIDADA,
      } as any,
      detalles: detallesCalculados,
      resumen: {
        totalUnidades: unidades.length,
        totalCoeficientes: sumaCoeficientes,
        totalOrdinario: this.redondear(totalOrdinario),
        totalExtraordinario: this.redondear(totalExtraordinario),
        totalSaldosAnteriores: this.redondear(totalSaldosAnteriores),
        totalIntereses: this.redondear(totalIntereses),
        totalBonificaciones: this.redondear(totalBonificaciones),
        totalARecaudar: this.redondear(totalARecaudar),
      },
    };
  }

  // ===========================================================================
  // PUBLICACIÓN Y CIERRE
  // ===========================================================================

  async publicar(id: string, usuarioId: string) {
    const expensa = await this.findOne(id, usuarioId);
    this.validarExpensaPublicable(expensa.estado);

    // Verificar que haya detalles calculados
    if (expensa.detalles.length === 0) {
      throw new BadRequestException(
        'Debe calcular el prorrateo antes de publicar la expensa',
      );
    }

    const expensaPublicada = await this.prisma.expensa.update({
      where: { id },
      data: {
        estado: 'PUBLICADA',
        publicadaAt: new Date(),
      },
    });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Expensa',
      entidadId: id,
      datosNuevos: { accion: 'PUBLICADA', publicadaAt: expensaPublicada.publicadaAt },
    });

    this.logger.log(`Expensa publicada: ${id}`);

    // Disparar notificaciones a los vecinos (en background)
    this.notificarExpensaPublicada(id, expensaPublicada.consorcioId, expensaPublicada.periodo)
      .catch(err => this.logger.error(`Error notificando expensa: ${err.message}`));

    return expensaPublicada;
  }

  async cerrar(id: string, dto: CerrarExpensaDto, usuarioId: string) {
    const expensa = await this.findOne(id, usuarioId);
    this.validarExpensaCerrable(expensa.estado);

    // Delegar al SnapshotsService que maneja el cierre y creación de snapshot
    const snapshot = await this.snapshotsService.cerrarExpensa(
      {
        expensaId: id,
        motivoCierre: dto.motivoCierre || 'Cierre de período regular',
      },
      usuarioId,
    );

    this.logger.log(`Expensa cerrada: ${id}, Snapshot: ${snapshot.id}`);

    // Obtener expensa actualizada
    const expensaCerrada = await this.prisma.expensa.findUnique({
      where: { id },
    });

    return {
      expensa: expensaCerrada,
      snapshot,
    };
  }

  // ===========================================================================
  // UTILIDADES PRIVADAS
  // ===========================================================================

  private async recalcularTotales(expensaId: string): Promise<void> {
    const gastos = await this.prisma.gasto.findMany({
      where: { expensaId },
    });

    const totalOrdinarios = gastos
      .filter(g => !g.esExtraordinario)
      .reduce((sum, g) => sum + Number(g.monto), 0);

    const totalExtraordinarios = gastos
      .filter(g => g.esExtraordinario)
      .reduce((sum, g) => sum + Number(g.monto), 0);

    await this.prisma.expensa.update({
      where: { id: expensaId },
      data: {
        totalGastosOrdinarios: new Decimal(totalOrdinarios),
        totalGastosExtraordinarios: new Decimal(totalExtraordinarios),
      },
    });
  }

  private calcularPeriodoAnterior(periodo: string): string {
    const partes = periodo.split('-');
    const anio = parseInt(partes[0] || '0', 10);
    const mes = parseInt(partes[1] || '1', 10);
    const fecha = new Date(anio, mes - 2, 1); // mes - 1 (0-indexed) - 1 (anterior)
    const anioAnterior = fecha.getFullYear();
    const mesAnterior = String(fecha.getMonth() + 1).padStart(2, '0');
    return `${anioAnterior}-${mesAnterior}`;
  }

  private async obtenerSaldoAnterior(
    unidadFuncionalId: string,
    periodoAnterior: string,
  ): Promise<number> {
    // Buscar el último movimiento de cuenta corriente
    const ultimoMovimiento = await this.prisma.movimientoCuentaCorriente.findFirst({
      where: { unidadFuncionalId },
      orderBy: { fecha: 'desc' },
    });

    if (ultimoMovimiento) {
      return Number(ultimoMovimiento.saldoResultante);
    }

    // Si no hay movimientos, buscar detalle de expensa anterior
    const detalleAnterior = await this.prisma.detalleExpensa.findFirst({
      where: {
        unidadFuncionalId,
        expensa: { periodo: periodoAnterior },
      },
    });

    if (detalleAnterior) {
      // El saldo anterior es el total no pagado
      // En un sistema real, deberíamos verificar contra pagos realizados
      return Number(detalleAnterior.total);
    }

    return 0;
  }

  private redondear(valor: number, decimales = 2): number {
    const factor = Math.pow(10, decimales);
    return Math.round(valor * factor) / factor;
  }

  /**
   * Sanitiza texto para prevenir XSS almacenado
   * Aunque Prisma previene SQL injection, necesitamos prevenir XSS
   */
  private sanitizarTexto(texto?: string): string | undefined {
    if (!texto) return texto;
    
    // Remover tags HTML potencialmente peligrosos
    return texto
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // ===========================================================================
  // GENERACIÓN DE PDFs
  // ===========================================================================

  /**
   * Genera PDF de expensa individual para una unidad funcional
   */
  async generarPdfIndividual(
    expensaId: string,
    unidadFuncionalId: string,
    usuarioId: string,
  ): Promise<Buffer> {
    // Obtener expensa con detalles
    const expensa = await this.prisma.expensa.findUnique({
      where: { id: expensaId },
      include: {
        consorcio: true,
        gastos: {
          include: { categoria: true },
          orderBy: { fechaGasto: 'desc' },
        },
        detalles: {
          where: { unidadFuncionalId },
          include: { unidadFuncional: true },
        },
      },
    });

    if (!expensa) {
      throw new NotFoundException('Expensa no encontrada');
    }

    // Validar acceso
    await this.validarAccesoConsorcio(usuarioId, expensa.consorcioId, [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
      Rol.PROPIETARIO,
      Rol.INQUILINO,
    ]);

    const detalle = expensa.detalles[0];
    if (!detalle) {
      throw new NotFoundException('Detalle de expensa no encontrado para esta unidad');
    }

    // Separar gastos por tipo
    const gastosOrdinarios = expensa.gastos.filter(g => !g.esExtraordinario);
    const gastosExtraordinarios = expensa.gastos.filter(g => g.esExtraordinario);

    // Generar PDF
    return this.expensaPdfService.generateExpensaIndividual({
      consorcio: {
        nombre: expensa.consorcio.nombre,
        direccion: expensa.consorcio.direccion,
        cuit: expensa.consorcio.cuit || '',
      },
      periodo: expensa.periodo,
      unidadFuncional: detalle.unidadFuncional.codigo,
      fechaVencimiento: expensa.fechaVencimiento,
      gastosOrdinarios: gastosOrdinarios.map(g => ({
        concepto: g.concepto,
        monto: Number(g.monto),
      })),
      gastosExtraordinarios: gastosExtraordinarios.map(g => ({
        concepto: g.concepto,
        monto: Number(g.monto),
      })),
      coeficiente: Number(detalle.unidadFuncional.coeficiente),
      saldoAnterior: Number(detalle.saldoAnterior),
      intereses: Number(detalle.intereses),
      bonificacion: Number(detalle.bonificacion),
      total: Number(detalle.total),
    });
  }

  /**
   * Genera PDF resumen de expensa para el administrador
   */
  async generarPdfResumen(
    expensaId: string,
    usuarioId: string,
  ): Promise<Buffer> {
    const expensa = await this.prisma.expensa.findUnique({
      where: { id: expensaId },
      include: {
        consorcio: true,
        gastos: {
          include: { categoria: true },
          orderBy: { fechaGasto: 'desc' },
        },
        detalles: {
          include: { unidadFuncional: true },
          orderBy: { unidadFuncional: { codigo: 'asc' } },
        },
      },
    });

    if (!expensa) {
      throw new NotFoundException('Expensa no encontrada');
    }

    // Solo admins pueden ver el resumen completo
    await this.validarAccesoConsorcio(usuarioId, expensa.consorcioId, [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
      Rol.AUDITOR,
    ]);

    // Separar gastos
    const gastosOrdinarios = expensa.gastos.filter(g => !g.esExtraordinario);
    const gastosExtraordinarios = expensa.gastos.filter(g => g.esExtraordinario);

    // Preparar detalles por UF
    const detallesPorUF = expensa.detalles.map(d => ({
      unidad: d.unidadFuncional.codigo,
      coeficiente: Number(d.unidadFuncional.coeficiente),
      ordinario: Number(d.montoOrdinario),
      extraordinario: Number(d.montoExtraordinario),
      saldoAnterior: Number(d.saldoAnterior),
      intereses: Number(d.intereses),
      total: Number(d.total),
    }));

    return this.expensaPdfService.generateExpensaResumen({
      consorcio: {
        nombre: expensa.consorcio.nombre,
        direccion: expensa.consorcio.direccion,
        cuit: expensa.consorcio.cuit || '',
      },
      periodo: expensa.periodo,
      fechaVencimiento: expensa.fechaVencimiento,
      gastosOrdinarios: gastosOrdinarios.map(g => ({
        concepto: g.concepto,
        monto: Number(g.monto),
      })),
      gastosExtraordinarios: gastosExtraordinarios.map(g => ({
        concepto: g.concepto,
        monto: Number(g.monto),
      })),
      detallesPorUF,
      totalRecaudar: detallesPorUF.reduce((sum, d) => sum + d.total, 0),
    });
  }

  // ===========================================================================
  // NOTIFICACIONES
  // ===========================================================================

  /**
   * Notifica a los vecinos del consorcio cuando se publica una expensa
   * Se ejecuta en background para no bloquear la respuesta
   */
  private async notificarExpensaPublicada(
    expensaId: string,
    consorcioId: string,
    periodo: string,
  ): Promise<void> {
    try {
      // Obtener todos los usuarios del consorcio (propietarios e inquilinos)
      const usuariosConsorcio = await this.prisma.usuarioConsorcio.findMany({
        where: {
          consorcioId,
          activo: true,
          rol: { in: ['PROPIETARIO', 'INQUILINO'] },
        },
        select: { usuarioId: true },
      });

      // Formatear periodo para mostrar
      const partes = periodo.split('-');
      const anio = partes[0] ?? '';
      const mes = partes[1] ?? '01';
      const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      const mesIdx = parseInt(mes, 10) - 1;
      const periodoFormateado = `${meses[mesIdx] ?? mes} ${anio}`;

      // Enviar notificación a cada usuario
      const promesas = usuariosConsorcio.map(uc =>
        this.notificacionesService.crearNotificacion({
          usuarioId: uc.usuarioId,
          titulo: '📄 Nueva Expensa Disponible',
          mensaje: `La liquidación de expensas de ${periodoFormateado} ya está disponible. Consultá el detalle y realizá tu pago.`,
          tipo: TipoNotificacion.EXPENSA,
          referenciaId: expensaId,
          referenciaTipo: 'Expensa',
        }).catch(err => {
          this.logger.warn(`Error notificando a ${uc.usuarioId}: ${err.message}`);
        })
      );

      await Promise.allSettled(promesas);
      this.logger.log(`Notificaciones enviadas a ${usuariosConsorcio.length} usuarios para expensa ${periodo}`);
    } catch (error) {
      this.logger.error(`Error en notificarExpensaPublicada: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}
