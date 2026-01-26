import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { EstadoExpensa } from '@prisma/client';
import * as crypto from 'crypto';
import {
  CerrarExpensaDto,
  CreateNotaCreditoDebitoDto,
  ExpensaSnapshotData,
  VerificacionIntegridadResult,
} from './dto/snapshot.dto';

@Injectable()
export class SnapshotsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================================================
  // Cerrar expensa y crear snapshot inmutable
  // ==========================================================================

  async cerrarExpensa(dto: CerrarExpensaDto, usuarioId: string) {
    // Obtener expensa con todos los datos necesarios
    const expensa = await this.prisma.expensa.findUnique({
      where: { id: dto.expensaId },
      include: {
        consorcio: {
          select: {
            id: true,
            nombre: true,
            direccion: true,
            cuit: true,
          },
        },
        gastos: {
          include: {
            categoria: true,
            proveedor: true,
          },
        },
        detalles: {
          include: {
            unidadFuncional: {
              select: {
                id: true,
                codigo: true,
                coeficiente: true,
              },
            },
          },
        },
      },
    });

    if (!expensa) {
      throw new NotFoundException('Expensa no encontrada');
    }

    // Verificar que no esté ya cerrada
    if (expensa.estado === EstadoExpensa.CERRADA) {
      throw new ConflictException('Esta expensa ya está cerrada');
    }

    // Verificar que ya haya sido publicada
    if (expensa.estado === EstadoExpensa.BORRADOR) {
      throw new BadRequestException(
        'La expensa debe ser publicada antes de cerrarla'
      );
    }

    // Verificar que no exista ya un snapshot
    const snapshotExistente = await this.prisma.snapshotExpensa.findUnique({
      where: { expensaId: dto.expensaId },
    });

    if (snapshotExistente) {
      throw new ConflictException('Ya existe un snapshot para esta expensa');
    }

    // Construir datos del snapshot
    const datosCompletos: ExpensaSnapshotData = {
      consorcio: expensa.consorcio,
      periodo: expensa.periodo,
      fechaVencimiento: expensa.fechaVencimiento.toISOString(),
      fechaSnapshot: new Date().toISOString(),
      totales: {
        gastosOrdinarios: Number(expensa.totalGastosOrdinarios),
        gastosExtraordinarios: Number(expensa.totalGastosExtraordinarios),
        ingresos: Number(expensa.totalIngresos),
        fondoReserva: Number(expensa.fondoReserva),
      },
      gastos: expensa.gastos.map((g) => ({
        id: g.id,
        concepto: g.concepto,
        monto: Number(g.monto),
        esExtraordinario: g.esExtraordinario,
        categoria: g.categoria?.nombre || null,
        proveedor: g.proveedor?.razonSocial || null,
        fechaGasto: g.fechaGasto.toISOString(),
        comprobante: {
          tipo: g.tipoComprobante,
          numero: g.numeroComprobante,
          cae: g.caeAfip,
        },
      })),
      detallesPorUnidad: expensa.detalles.map((d) => ({
        unidadFuncional: {
          id: d.unidadFuncional.id,
          codigo: d.unidadFuncional.codigo,
          coeficiente: Number(d.unidadFuncional.coeficiente),
        },
        montoOrdinario: Number(d.montoOrdinario),
        montoExtraordinario: Number(d.montoExtraordinario),
        saldoAnterior: Number(d.saldoAnterior),
        intereses: Number(d.intereses),
        bonificacion: Number(d.bonificacion),
        total: Number(d.total),
      })),
    };

    // Calcular hash de integridad
    const hashIntegridad = this.calcularHash(datosCompletos);

    // Crear snapshot y actualizar expensa en transacción
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Crear snapshot inmutable
      const snapshot = await tx.snapshotExpensa.create({
        data: {
          consorcioId: expensa.consorcioId,
          expensaId: expensa.id,
          periodo: expensa.periodo,
          datosCompletos: datosCompletos as any,
          hashIntegridad,
          cerradoPor: usuarioId,
          motivoCierre: dto.motivoCierre,
          fechaCierreLegal: new Date(),
        },
      });

      // Actualizar estado de la expensa
      await tx.expensa.update({
        where: { id: expensa.id },
        data: {
          estado: EstadoExpensa.CERRADA,
          cerradaAt: new Date(),
        },
      });

      // Crear registro de auditoría
      await tx.auditLog.create({
        data: {
          usuarioId,
          accion: 'CERRAR_EXPENSA',
          entidad: 'Expensa',
          entidadId: expensa.id,
          datosNuevos: {
            snapshotId: snapshot.id,
            hashIntegridad,
            motivoCierre: dto.motivoCierre,
          },
        },
      });

      return snapshot;
    });

    return {
      ...resultado,
      datosCompletos, // Incluir datos para referencia
    };
  }

  // ==========================================================================
  // Hash de integridad
  // ==========================================================================

  private calcularHash(datos: ExpensaSnapshotData): string {
    // Ordenar las claves para consistencia
    const datosOrdenados = JSON.stringify(datos, Object.keys(datos).sort());
    return crypto.createHash('sha256').update(datosOrdenados).digest('hex');
  }

  async verificarIntegridad(snapshotId: string): Promise<VerificacionIntegridadResult> {
    const snapshot = await this.prisma.snapshotExpensa.findUnique({
      where: { id: snapshotId },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot no encontrado');
    }

    const hashCalculado = this.calcularHash(
      snapshot.datosCompletos as unknown as ExpensaSnapshotData
    );

    return {
      valido: hashCalculado === snapshot.hashIntegridad,
      hashCalculado,
      hashAlmacenado: snapshot.hashIntegridad,
    };
  }

  // ==========================================================================
  // Notas de crédito/débito (única forma de ajustar después del cierre)
  // ==========================================================================

  async crearNotaCreditoDebito(
    dto: CreateNotaCreditoDebitoDto,
    usuarioId: string
  ) {
    // Verificar que el snapshot existe
    const snapshot = await this.prisma.snapshotExpensa.findUnique({
      where: { id: dto.snapshotExpensaId },
      include: { consorcio: true },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot de expensa no encontrado');
    }

    // Verificar que la unidad pertenece al consorcio
    const unidad = await this.prisma.unidadFuncional.findFirst({
      where: {
        id: dto.unidadFuncionalId,
        consorcioId: snapshot.consorcioId,
      },
    });

    if (!unidad) {
      throw new NotFoundException(
        'Unidad funcional no encontrada en este consorcio'
      );
    }

    // Crear la nota
    const nota = await this.prisma.$transaction(async (tx) => {
      const notaCreada = await tx.notaCreditoDebito.create({
        data: {
          snapshotExpensaId: dto.snapshotExpensaId,
          unidadFuncionalId: dto.unidadFuncionalId,
          tipo: dto.tipo,
          monto: dto.monto,
          concepto: dto.concepto,
          justificacion: dto.justificacion,
          documentoUrl: dto.documentoUrl,
          aprobadoPor: usuarioId,
          aplicadoEnPeriodo: dto.aplicadoEnPeriodo,
        },
      });

      // Registrar en cuenta corriente
      // Obtener saldo actual
      const ultimoMovimiento = await tx.movimientoCuentaCorriente.findFirst({
        where: { unidadFuncionalId: dto.unidadFuncionalId },
        orderBy: { fecha: 'desc' },
      });

      const saldoAnterior = ultimoMovimiento
        ? Number(ultimoMovimiento.saldoResultante)
        : 0;

      // El efecto en el saldo depende del tipo
      // Crédito = a favor del propietario (reduce deuda)
      // Débito = a favor del consorcio (aumenta deuda)
      const efectoEnSaldo =
        dto.tipo === 'credito' ? -dto.monto : dto.monto;

      await tx.movimientoCuentaCorriente.create({
        data: {
          unidadFuncionalId: dto.unidadFuncionalId,
          tipo: dto.tipo === 'credito' ? 'INGRESO' : 'EGRESO',
          concepto: `Nota de ${dto.tipo}: ${dto.concepto}`,
          monto: dto.monto,
          saldoResultante: saldoAnterior + efectoEnSaldo,
          expensaPeriodo: dto.aplicadoEnPeriodo,
        },
      });

      // Auditoría
      await tx.auditLog.create({
        data: {
          usuarioId,
          accion: 'CREATE',
          entidad: 'NotaCreditoDebito',
          entidadId: notaCreada.id,
          datosNuevos: {
            tipo: dto.tipo,
            monto: dto.monto,
            concepto: dto.concepto,
            snapshotPeriodo: snapshot.periodo,
            unidadCodigo: unidad.codigo,
          },
        },
      });

      return notaCreada;
    });

    return nota;
  }

  // ==========================================================================
  // Consultas
  // ==========================================================================

  async obtenerSnapshot(snapshotId: string) {
    const snapshot = await this.prisma.snapshotExpensa.findUnique({
      where: { id: snapshotId },
      include: {
        notasCredito: {
          orderBy: { createdAt: 'desc' },
        },
        consorcio: {
          select: { id: true, nombre: true, direccion: true },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException('Snapshot no encontrado');
    }

    return snapshot;
  }

  async obtenerSnapshotPorExpensa(expensaId: string) {
    const snapshot = await this.prisma.snapshotExpensa.findUnique({
      where: { expensaId },
      include: {
        notasCredito: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException('No existe snapshot para esta expensa');
    }

    return snapshot;
  }

  async listarSnapshots(consorcioId: string) {
    return this.prisma.snapshotExpensa.findMany({
      where: { consorcioId },
      orderBy: { periodo: 'desc' },
      include: {
        _count: {
          select: { notasCredito: true },
        },
      },
    });
  }

  async obtenerNotasPorUnidad(unidadFuncionalId: string) {
    return this.prisma.notaCreditoDebito.findMany({
      where: { unidadFuncionalId },
      include: {
        snapshotExpensa: {
          select: { periodo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ==========================================================================
  // Generar certificado de deuda (para juicios)
  // ==========================================================================

  async generarCertificadoDeuda(unidadFuncionalId: string, consorcioId: string) {
    // Obtener todos los snapshots del consorcio
    const snapshots = await this.prisma.snapshotExpensa.findMany({
      where: { consorcioId },
      orderBy: { periodo: 'asc' },
      include: {
        notasCredito: {
          where: { unidadFuncionalId },
        },
      },
    });

    // Obtener unidad y propietario
    const unidad = await this.prisma.unidadFuncional.findUnique({
      where: { id: unidadFuncionalId },
      include: {
        usuarios: {
          where: { activo: true },
          include: {
            usuario: {
              select: { nombre: true, apellido: true, dni: true },
            },
          },
        },
        consorcio: {
          select: { nombre: true, direccion: true, cuit: true },
        },
      },
    });

    if (!unidad) {
      throw new NotFoundException('Unidad funcional no encontrada');
    }

    // Construir historial de deuda
    const historial = snapshots.map((snapshot) => {
      const datos = snapshot.datosCompletos as unknown as ExpensaSnapshotData;
      const detalleUF = datos.detallesPorUnidad.find(
        (d) => d.unidadFuncional.id === unidadFuncionalId
      );

      // Sumar notas de crédito/débito
      const ajustes = snapshot.notasCredito.reduce(
        (acc, nota) => {
          if (nota.tipo === 'credito') {
            acc.creditos += Number(nota.monto);
          } else {
            acc.debitos += Number(nota.monto);
          }
          return acc;
        },
        { creditos: 0, debitos: 0 }
      );

      return {
        periodo: snapshot.periodo,
        fechaCierre: snapshot.fechaCierreLegal,
        hashIntegridad: snapshot.hashIntegridad,
        montos: detalleUF
          ? {
              ordinario: detalleUF.montoOrdinario,
              extraordinario: detalleUF.montoExtraordinario,
              saldoAnterior: detalleUF.saldoAnterior,
              intereses: detalleUF.intereses,
              bonificacion: detalleUF.bonificacion,
              total: detalleUF.total,
            }
          : null,
        ajustes,
      };
    });

    // Obtener saldo actual
    const ultimoMovimiento = await this.prisma.movimientoCuentaCorriente.findFirst({
      where: { unidadFuncionalId },
      orderBy: { fecha: 'desc' },
    });

    return {
      fechaEmision: new Date(),
      consorcio: unidad.consorcio,
      unidad: {
        codigo: unidad.codigo,
        propietario: unidad.usuarios[0]?.usuario || null,
      },
      historial,
      saldoActual: ultimoMovimiento
        ? Number(ultimoMovimiento.saldoResultante)
        : 0,
      hashCertificado: crypto
        .createHash('sha256')
        .update(JSON.stringify({ historial, fecha: new Date().toISOString() }))
        .digest('hex'),
    };
  }
}
