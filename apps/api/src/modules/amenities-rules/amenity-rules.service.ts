import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateReglaAmenityDto,
  UpdateReglaAmenityDto,
  AplicarPenalizacionDto,
  TipoReglaAmenity,
  ConfigLimitePeriodo,
  ConfigPenalizacion,
  ConfigHorario,
  ValidacionReservaResultDto,
} from './dto/amenity-rules.dto';

@Injectable()
export class AmenityRulesService {
  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // CRUD de Reglas
  // ===========================================================================

  async crearRegla(dto: CreateReglaAmenityDto) {
    // Verificar que el amenity existe y pertenece al consorcio
    const amenity = await this.prisma.amenity.findFirst({
      where: {
        id: dto.amenityId,
        consorcioId: dto.consorcioId,
      },
    });

    if (!amenity) {
      throw new NotFoundException('Amenity no encontrado en este consorcio');
    }

    // Validar configuración según tipo
    this.validarConfiguracion(dto.tipoRegla, dto.configuracion);

    return this.prisma.reglaReservaAmenity.create({
      data: {
        consorcioId: dto.consorcioId,
        amenityId: dto.amenityId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        tipoRegla: dto.tipoRegla,
        configuracion: dto.configuracion as any,
        prioridad: dto.prioridad ?? 0,
        activa: true,
      },
    });
  }

  async actualizarRegla(id: string, dto: UpdateReglaAmenityDto) {
    const regla = await this.prisma.reglaReservaAmenity.findUnique({
      where: { id },
    });

    if (!regla) {
      throw new NotFoundException('Regla no encontrada');
    }

    // Si se actualiza configuración, validarla
    if (dto.configuracion) {
      this.validarConfiguracion(regla.tipoRegla, dto.configuracion);
    }

    return this.prisma.reglaReservaAmenity.update({
      where: { id },
      data: dto,
    });
  }

  async eliminarRegla(id: string) {
    return this.prisma.reglaReservaAmenity.delete({
      where: { id },
    });
  }

  async obtenerReglasAmenity(amenityId: string) {
    return this.prisma.reglaReservaAmenity.findMany({
      where: {
        amenityId,
        activa: true,
      },
      orderBy: { prioridad: 'desc' },
    });
  }

  async obtenerReglasConsorcio(consorcioId: string) {
    return this.prisma.reglaReservaAmenity.findMany({
      where: { consorcioId },
      include: {
        amenity: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: [{ amenityId: 'asc' }, { prioridad: 'desc' }],
    });
  }

  // ===========================================================================
  // Validación de Reservas
  // ===========================================================================

  async validarReserva(
    usuarioId: string,
    amenityId: string,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ValidacionReservaResultDto> {
    const reglasVioladas: string[] = [];

    // Obtener reglas del amenity
    const reglas = await this.obtenerReglasAmenity(amenityId);

    // Obtener penalizaciones activas
    const penalizacionesActivas = await this.obtenerPenalizacionesActivas(usuarioId);

    // Verificar si hay bloqueo activo
    const bloqueoActivo = penalizacionesActivas.find(
      (p) => p.tipo === 'bloqueo_temporal' && p.fechaFinBloqueo && p.fechaFinBloqueo > new Date(),
    );

    if (bloqueoActivo) {
      return {
        valida: false,
        mensaje: `Usuario bloqueado hasta ${bloqueoActivo.fechaFinBloqueo?.toLocaleDateString()}. Motivo: ${bloqueoActivo.motivo}`,
        penalizacionesActivas: penalizacionesActivas as any,
      };
    }

    // Evaluar cada regla
    for (const regla of reglas) {
      const config = regla.configuracion as any;

      switch (regla.tipoRegla) {
        case TipoReglaAmenity.LIMITE_PERIODO:
          const violaLimite = await this.verificarLimitePeriodo(
            usuarioId,
            amenityId,
            fechaInicio,
            config as ConfigLimitePeriodo,
          );
          if (violaLimite) {
            reglasVioladas.push(`${regla.nombre}: ${violaLimite}`);
          }
          break;

        case TipoReglaAmenity.HORARIO:
          const violaHorario = this.verificarHorario(
            fechaInicio,
            fechaFin,
            config as ConfigHorario,
          );
          if (violaHorario) {
            reglasVioladas.push(`${regla.nombre}: ${violaHorario}`);
          }
          break;
      }
    }

    if (reglasVioladas.length > 0) {
      return {
        valida: false,
        mensaje: 'La reserva viola una o más reglas del amenity',
        reglasVioladas,
        penalizacionesActivas: penalizacionesActivas as any,
      };
    }

    return {
      valida: true,
      mensaje: 'Reserva válida',
      penalizacionesActivas: penalizacionesActivas as any,
    };
  }

  private async verificarLimitePeriodo(
    usuarioId: string,
    amenityId: string,
    fechaInicio: Date,
    config: ConfigLimitePeriodo,
  ): Promise<string | null> {
    // Calcular rango de fechas según período
    const { inicio, fin } = this.calcularRangoPeriodo(fechaInicio, config.periodo);

    // Contar reservas del usuario en el período
    const whereClause: any = {
      usuarioId,
      amenityId,
      fechaInicio: {
        gte: inicio,
        lte: fin,
      },
      aprobada: { not: false }, // Incluye aprobadas y pendientes
    };

    // Si hay restricción por días de semana, aplicarla
    if (config.diasSemana && config.diasSemana.length > 0) {
      const diaSemana = fechaInicio.getDay();
      if (!config.diasSemana.includes(diaSemana)) {
        return null; // No aplica a este día
      }

      // Contar solo reservas en días específicos
      const reservas = await this.prisma.reservaAmenity.findMany({
        where: whereClause,
      });

      const reservasEnDias = reservas.filter((r) =>
        config.diasSemana!.includes(r.fechaInicio.getDay()),
      );

      if (reservasEnDias.length >= config.maxReservas) {
        const diasNombres = config.diasSemana.map((d) => this.nombreDia(d)).join(', ');
        return `Máximo ${config.maxReservas} reserva(s) por ${config.periodo} en ${diasNombres}`;
      }
    } else {
      const count = await this.prisma.reservaAmenity.count({
        where: whereClause,
      });

      if (count >= config.maxReservas) {
        return `Máximo ${config.maxReservas} reserva(s) por ${config.periodo}`;
      }
    }

    return null;
  }

  private verificarHorario(
    fechaInicio: Date,
    fechaFin: Date,
    config: ConfigHorario,
  ): string | null {
    const horaInicio = this.horaToMinutos(config.horaInicio);
    const horaFin = this.horaToMinutos(config.horaFin);

    const horaReservaInicio =
      fechaInicio.getHours() * 60 + fechaInicio.getMinutes();
    const horaReservaFin = fechaFin.getHours() * 60 + fechaFin.getMinutes();

    if (horaReservaInicio < horaInicio || horaReservaFin > horaFin) {
      return `Horario permitido: ${config.horaInicio} - ${config.horaFin}`;
    }

    // Verificar día de la semana
    if (config.diasPermitidos && config.diasPermitidos.length > 0) {
      const diaSemana = fechaInicio.getDay();
      if (!config.diasPermitidos.includes(diaSemana)) {
        const diasNombres = config.diasPermitidos
          .map((d) => this.nombreDia(d))
          .join(', ');
        return `Solo disponible: ${diasNombres}`;
      }
    }

    return null;
  }

  // ===========================================================================
  // Penalizaciones
  // ===========================================================================

  async aplicarPenalizacion(dto: AplicarPenalizacionDto) {
    // Verificar que la reserva existe
    const reserva = await this.prisma.reservaAmenity.findUnique({
      where: { id: dto.reservaId },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Verificar que no tiene ya una penalización
    const penalizacionExistente = await this.prisma.penalizacionReserva.findUnique({
      where: { reservaId: dto.reservaId },
    });

    if (penalizacionExistente) {
      throw new BadRequestException('Esta reserva ya tiene una penalización');
    }

    // Calcular fecha fin de bloqueo si aplica
    let fechaFinBloqueo: Date | undefined;
    if (dto.tipo === 'bloqueo_temporal' && dto.diasBloqueo) {
      fechaFinBloqueo = new Date();
      fechaFinBloqueo.setDate(fechaFinBloqueo.getDate() + dto.diasBloqueo);
    }

    return this.prisma.penalizacionReserva.create({
      data: {
        usuarioId: dto.usuarioId,
        reservaId: dto.reservaId,
        tipo: dto.tipo,
        motivo: dto.motivo,
        montoMulta: dto.montoMulta,
        diasBloqueo: dto.diasBloqueo,
        fechaFinBloqueo,
        pagada: false,
      },
    });
  }

  async obtenerPenalizacionesActivas(usuarioId: string) {
    const ahora = new Date();

    return this.prisma.penalizacionReserva.findMany({
      where: {
        usuarioId,
        OR: [
          // Multas no pagadas
          { tipo: 'multa', pagada: false },
          // Bloqueos activos
          {
            tipo: 'bloqueo_temporal',
            fechaFinBloqueo: { gt: ahora },
          },
        ],
      },
      include: {
        reserva: {
          select: {
            id: true,
            fechaInicio: true,
            amenity: { select: { nombre: true } },
          },
        },
      },
    });
  }

  async obtenerResumenPenalizaciones(usuarioId: string) {
    const penalizaciones = await this.prisma.penalizacionReserva.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });

    const ahora = new Date();
    const multasPendientes = penalizaciones.filter(
      (p) => p.tipo === 'multa' && !p.pagada,
    );
    const bloqueosActivos = penalizaciones.filter(
      (p) =>
        p.tipo === 'bloqueo_temporal' &&
        p.fechaFinBloqueo &&
        p.fechaFinBloqueo > ahora,
    );

    const montoTotalPendiente = multasPendientes.reduce(
      (sum, p) => sum + (p.montoMulta?.toNumber() || 0),
      0,
    );

    return {
      totalPenalizaciones: penalizaciones.length,
      multasPendientes: multasPendientes.length,
      montoTotalPendiente,
      bloqueosActivos: bloqueosActivos.length,
      penalizaciones,
    };
  }

  async marcarMultaPagada(penalizacionId: string, periodoExpensa: string) {
    return this.prisma.penalizacionReserva.update({
      where: { id: penalizacionId },
      data: {
        pagada: true,
        aplicadoEnExpensa: periodoExpensa,
      },
    });
  }

  // ===========================================================================
  // Procesamiento automático de No-Shows
  // ===========================================================================

  async procesarNoShows(consorcioId: string) {
    const ahora = new Date();
    const haceDosHoras = new Date(ahora.getTime() - 2 * 60 * 60 * 1000);

    // Buscar reservas que ya pasaron y no se marcaron como completadas
    const reservasNoShow = await this.prisma.reservaAmenity.findMany({
      where: {
        amenity: { consorcioId },
        fechaFin: { lt: haceDosHoras },
        aprobada: true,
        // No tiene penalización aún
        penalizacion: null,
      },
      include: {
        amenity: true,
      },
    });

    const resultados = [];

    for (const reserva of reservasNoShow) {
      // Buscar reglas de penalización del amenity
      const reglasPenalizacion = await this.prisma.reglaReservaAmenity.findMany({
        where: {
          amenityId: reserva.amenityId,
          tipoRegla: TipoReglaAmenity.PENALIZACION,
          activa: true,
        },
      });

      for (const regla of reglasPenalizacion) {
        const config = regla.configuracion as unknown as ConfigPenalizacion;

        // Aplicar penalización automática
        const penalizacion = await this.aplicarPenalizacion({
          usuarioId: reserva.usuarioId,
          reservaId: reserva.id,
          tipo: config.bloquearDias ? 'bloqueo_temporal' : 'multa',
          motivo: 'No show - No se presentó a la reserva',
          montoMulta: config.montoMulta,
          diasBloqueo: config.bloquearDias,
        });

        resultados.push({
          reservaId: reserva.id,
          amenity: reserva.amenity.nombre,
          penalizacionId: penalizacion.id,
        });
      }
    }

    return {
      procesadas: resultados.length,
      detalles: resultados,
    };
  }

  // ===========================================================================
  // Helpers
  // ===========================================================================

  private validarConfiguracion(tipo: string, config: any) {
    switch (tipo) {
      case TipoReglaAmenity.LIMITE_PERIODO:
        if (!config.maxReservas || !config.periodo) {
          throw new BadRequestException(
            'limite_periodo requiere maxReservas y periodo',
          );
        }
        if (!['semana', 'mes', 'año'].includes(config.periodo)) {
          throw new BadRequestException(
            'periodo debe ser: semana, mes o año',
          );
        }
        break;

      case TipoReglaAmenity.HORARIO:
        if (!config.horaInicio || !config.horaFin) {
          throw new BadRequestException(
            'horario requiere horaInicio y horaFin',
          );
        }
        break;

      case TipoReglaAmenity.PENALIZACION:
        if (!config.horasAnticipacion) {
          throw new BadRequestException(
            'penalizacion requiere horasAnticipacion',
          );
        }
        break;
    }
  }

  private calcularRangoPeriodo(
    fecha: Date,
    periodo: 'semana' | 'mes' | 'año',
  ): { inicio: Date; fin: Date } {
    const inicio = new Date(fecha);
    const fin = new Date(fecha);

    switch (periodo) {
      case 'semana':
        const diaSemana = inicio.getDay();
        inicio.setDate(inicio.getDate() - diaSemana); // Domingo
        fin.setDate(fin.getDate() + (6 - diaSemana)); // Sábado
        break;
      case 'mes':
        inicio.setDate(1);
        fin.setMonth(fin.getMonth() + 1, 0); // Último día del mes
        break;
      case 'año':
        inicio.setMonth(0, 1);
        fin.setMonth(11, 31);
        break;
    }

    inicio.setHours(0, 0, 0, 0);
    fin.setHours(23, 59, 59, 999);

    return { inicio, fin };
  }

  private horaToMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  }

  private nombreDia(dia: number): string {
    const dias = [
      'Domingo',
      'Lunes',
      'Martes',
      'Miércoles',
      'Jueves',
      'Viernes',
      'Sábado',
    ];
    return dias[dia] || '';
  }
}
