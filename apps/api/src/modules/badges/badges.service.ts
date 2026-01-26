import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateBadgeDefinicionDto,
  OtorgarBadgeManualDto,
  BadgeDefinicionResponseDto,
  BadgeUsuarioResponseDto,
  ResumenBadgesUsuarioDto,
  ResultadoEvaluacion,
  BadgeConEstadoDto,
  BADGES_CONFIG,
} from './dto/badge.dto';
import { TipoBadge, EstadoPago } from '@prisma/client';

@Injectable()
export class BadgesService {
  private readonly logger = new Logger(BadgesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ===========================================================================
  // Gestión de definiciones de badges
  // ===========================================================================

  /**
   * Crea o actualiza una definición de badge
   */
  async crearOActualizarBadge(
    dto: CreateBadgeDefinicionDto
  ): Promise<BadgeDefinicionResponseDto> {
    const badge = await this.prisma.badgeDefinicion.upsert({
      where: { tipo: dto.tipo },
      update: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        criterios: dto.criterios,
        iconoUrl: dto.iconoUrl,
        color: dto.color,
        beneficios: dto.beneficios,
        diasVigenciaBeneficio: dto.diasVigenciaBeneficio,
      },
      create: {
        tipo: dto.tipo,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        criterios: dto.criterios,
        iconoUrl: dto.iconoUrl,
        color: dto.color,
        beneficios: dto.beneficios,
        diasVigenciaBeneficio: dto.diasVigenciaBeneficio,
      },
    });

    return badge as BadgeDefinicionResponseDto;
  }

  /**
   * Inicializa los badges predefinidos del sistema
   */
  async inicializarBadgesPredefinidos(): Promise<BadgeDefinicionResponseDto[]> {
    const badges: BadgeDefinicionResponseDto[] = [];

    for (const [tipo, config] of Object.entries(BADGES_CONFIG)) {
      const badge = await this.prisma.badgeDefinicion.upsert({
        where: { tipo: tipo as TipoBadge },
        update: {},
        create: {
          tipo: tipo as TipoBadge,
          nombre: config.nombre,
          descripcion: config.descripcion,
          criterios: config.criteriosDefault,
          iconoUrl: config.icono,
          color: config.color,
        },
      });
      badges.push(badge as BadgeDefinicionResponseDto);
    }

    this.logger.log(`Inicializados ${badges.length} badges predefinidos`);
    return badges;
  }

  /**
   * Obtiene todas las definiciones de badges activos
   */
  async obtenerBadgesDisponibles(): Promise<BadgeDefinicionResponseDto[]> {
    const badges = await this.prisma.badgeDefinicion.findMany({
      where: { activo: true },
      orderBy: { tipo: 'asc' },
    });

    return badges as BadgeDefinicionResponseDto[];
  }

  // ===========================================================================
  // Otorgamiento de badges
  // ===========================================================================

  /**
   * Otorga un badge manualmente a un usuario
   */
  async otorgarBadgeManual(
    dto: OtorgarBadgeManualDto
  ): Promise<BadgeUsuarioResponseDto> {
    // Verificar que el badge existe
    const badge = await this.prisma.badgeDefinicion.findUnique({
      where: { id: dto.badgeId },
    });

    if (!badge) {
      throw new NotFoundException('Badge no encontrado');
    }

    // Verificar que el usuario no tenga ya el badge
    const existente = await this.prisma.badgeUsuario.findUnique({
      where: {
        usuarioId_badgeId: {
          usuarioId: dto.usuarioId,
          badgeId: dto.badgeId,
        },
      },
    });

    if (existente) {
      throw new ConflictException('El usuario ya tiene este badge');
    }

    // Calcular fecha de vigencia del beneficio
    let beneficioHasta: Date | null = null;
    if (badge.diasVigenciaBeneficio) {
      beneficioHasta = new Date();
      beneficioHasta.setDate(
        beneficioHasta.getDate() + badge.diasVigenciaBeneficio
      );
    }

    // Otorgar el badge
    const badgeUsuario = await this.prisma.badgeUsuario.create({
      data: {
        usuarioId: dto.usuarioId,
        badgeId: dto.badgeId,
        datosObtencion: dto.datosObtencion,
        beneficioHasta,
      },
      include: {
        badge: true,
      },
    });

    this.logger.log(
      `Badge ${badge.nombre} otorgado manualmente al usuario ${dto.usuarioId}`
    );

    return badgeUsuario as BadgeUsuarioResponseDto;
  }

  /**
   * Evalúa y otorga badges automáticamente después de un pago
   */
  async evaluarYOtorgarBadgesPorPago(
    usuarioId: string,
    consorcioId: string
  ): Promise<BadgeUsuarioResponseDto[]> {
    const badgesOtorgados: BadgeUsuarioResponseDto[] = [];

    // Obtener badges disponibles
    const badges = await this.prisma.badgeDefinicion.findMany({
      where: { activo: true },
    });

    for (const badge of badges) {
      // Verificar si ya tiene el badge
      const yaOtorgado = await this.prisma.badgeUsuario.findUnique({
        where: {
          usuarioId_badgeId: {
            usuarioId,
            badgeId: badge.id,
          },
        },
      });

      if (yaOtorgado) continue;

      // Evaluar criterios según tipo
      const resultado = await this.evaluarCriterios(
        badge.tipo,
        badge.criterios as object,
        usuarioId,
        consorcioId
      );

      if (resultado.cumple) {
        // Calcular vigencia del beneficio
        let beneficioHasta: Date | null = null;
        if (badge.diasVigenciaBeneficio) {
          beneficioHasta = new Date();
          beneficioHasta.setDate(
            beneficioHasta.getDate() + badge.diasVigenciaBeneficio
          );
        }

        // Otorgar badge
        const badgeUsuario = await this.prisma.badgeUsuario.create({
          data: {
            usuarioId,
            badgeId: badge.id,
            datosObtencion: resultado.datosEvaluacion,
            beneficioHasta,
          },
          include: {
            badge: true,
          },
        });

        badgesOtorgados.push(badgeUsuario as BadgeUsuarioResponseDto);

        this.logger.log(
          `Badge ${badge.nombre} otorgado automáticamente al usuario ${usuarioId}`
        );
      }
    }

    return badgesOtorgados;
  }

  /**
   * Evalúa criterios específicos de un badge
   */
  private async evaluarCriterios(
    tipo: TipoBadge,
    criterios: object,
    usuarioId: string,
    consorcioId: string
  ): Promise<ResultadoEvaluacion> {
    switch (tipo) {
      case TipoBadge.PAGO_PUNTUAL:
        return this.evaluarPagoPuntual(criterios, usuarioId, consorcioId);

      case TipoBadge.RACHA_PAGOS:
        return this.evaluarRachaPagos(criterios, usuarioId, consorcioId);

      case TipoBadge.VECINO_EJEMPLAR:
        return this.evaluarVecinoEjemplar(criterios, usuarioId, consorcioId);

      case TipoBadge.PARTICIPATIVO:
        return this.evaluarParticipativo(criterios, usuarioId, consorcioId);

      case TipoBadge.COLABORADOR:
        return this.evaluarColaborador(criterios, usuarioId, consorcioId);

      default:
        return {
          tipo,
          cumple: false,
          progreso: 0,
          progresoDescripcion: 'Badge no evaluable automáticamente',
          datosEvaluacion: {},
        };
    }
  }

  /**
   * Evalúa badge de Pago Puntual
   */
  private async evaluarPagoPuntual(
    criterios: object,
    usuarioId: string,
    consorcioId: string
  ): Promise<ResultadoEvaluacion> {
    const config = criterios as { diasAntesVencimiento: number };

    // Obtener último pago aprobado del usuario
    const ultimoPago = await this.prisma.pago.findFirst({
      where: {
        usuarioId,
        estado: EstadoPago.APROBADO,
      },
      orderBy: { fechaPago: 'desc' },
    });

    if (!ultimoPago || !ultimoPago.fechaPago) {
      return {
        tipo: TipoBadge.PAGO_PUNTUAL,
        cumple: false,
        progreso: 0,
        progresoDescripcion: 'No hay pagos registrados',
        datosEvaluacion: { ultimoPago: null },
      };
    }

    // Obtener la expensa correspondiente al período pagado
    const periodo = ultimoPago.periodosAbonados[0];
    if (!periodo) {
      return {
        tipo: TipoBadge.PAGO_PUNTUAL,
        cumple: false,
        progreso: 0,
        progresoDescripcion: 'No se puede determinar el período',
        datosEvaluacion: {},
      };
    }

    const expensa = await this.prisma.expensa.findFirst({
      where: {
        periodo,
        consorcioId,
      },
    });

    if (!expensa) {
      return {
        tipo: TipoBadge.PAGO_PUNTUAL,
        cumple: false,
        progreso: 0,
        progresoDescripcion: 'Expensa no encontrada',
        datosEvaluacion: {},
      };
    }

    // Calcular si pagó antes del vencimiento
    const diasAntes = Math.floor(
      (expensa.fechaVencimiento.getTime() - ultimoPago.fechaPago.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const cumple = diasAntes >= config.diasAntesVencimiento;

    return {
      tipo: TipoBadge.PAGO_PUNTUAL,
      cumple,
      progreso: cumple ? 100 : 0,
      progresoDescripcion: cumple
        ? `Pagó ${diasAntes} días antes del vencimiento`
        : `Pagó ${-diasAntes} días después del vencimiento`,
      datosEvaluacion: {
        fechaPago: ultimoPago.fechaPago,
        fechaVencimiento: expensa.fechaVencimiento,
        diasAntes,
      },
    };
  }

  /**
   * Evalúa badge de Racha de Pagos
   */
  private async evaluarRachaPagos(
    criterios: object,
    usuarioId: string,
    consorcioId: string
  ): Promise<ResultadoEvaluacion> {
    const config = criterios as { mesesConsecutivos: number };

    // Obtener pagos de los últimos N meses
    const fechaInicio = new Date();
    fechaInicio.setMonth(fechaInicio.getMonth() - config.mesesConsecutivos);

    const pagosAprobados = await this.prisma.pago.findMany({
      where: {
        usuarioId,
        estado: EstadoPago.APROBADO,
        fechaPago: { gte: fechaInicio },
      },
      orderBy: { fechaPago: 'desc' },
    });

    // Contar períodos únicos pagados
    const periodosUnicos = new Set<string>();
    for (const pago of pagosAprobados) {
      for (const periodo of pago.periodosAbonados) {
        periodosUnicos.add(periodo);
      }
    }

    const mesesPagados = periodosUnicos.size;
    const progreso = Math.min(
      100,
      Math.round((mesesPagados / config.mesesConsecutivos) * 100)
    );
    const cumple = mesesPagados >= config.mesesConsecutivos;

    return {
      tipo: TipoBadge.RACHA_PAGOS,
      cumple,
      progreso,
      progresoDescripcion: `${mesesPagados}/${config.mesesConsecutivos} meses consecutivos`,
      datosEvaluacion: {
        mesesPagados,
        mesesRequeridos: config.mesesConsecutivos,
        periodos: Array.from(periodosUnicos),
      },
    };
  }

  /**
   * Evalúa badge de Vecino Ejemplar (6 meses al día)
   */
  private async evaluarVecinoEjemplar(
    criterios: object,
    usuarioId: string,
    consorcioId: string
  ): Promise<ResultadoEvaluacion> {
    const config = criterios as { mesesConsecutivos: number };

    // Obtener la unidad funcional del usuario
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        unidadFuncionalId: { not: null },
      },
    });

    if (!vinculo || !vinculo.unidadFuncionalId) {
      return {
        tipo: TipoBadge.VECINO_EJEMPLAR,
        cumple: false,
        progreso: 0,
        progresoDescripcion: 'No tiene unidad funcional asignada',
        datosEvaluacion: {},
      };
    }

    // Obtener movimientos de cuenta corriente
    const movimientos = await this.prisma.movimientoCuentaCorriente.findMany({
      where: {
        unidadFuncionalId: vinculo.unidadFuncionalId,
      },
      orderBy: { fecha: 'desc' },
      take: config.mesesConsecutivos * 2, // Suficientes para evaluar
    });

    // Verificar que el saldo siempre estuvo <= 0 (sin deuda)
    let mesesAlDia = 0;
    for (const mov of movimientos) {
      if (mov.saldoResultante.toNumber() <= 0) {
        mesesAlDia++;
      } else {
        break; // Rompe la racha
      }
    }

    const progreso = Math.min(
      100,
      Math.round((mesesAlDia / config.mesesConsecutivos) * 100)
    );
    const cumple = mesesAlDia >= config.mesesConsecutivos;

    return {
      tipo: TipoBadge.VECINO_EJEMPLAR,
      cumple,
      progreso,
      progresoDescripcion: `${mesesAlDia}/${config.mesesConsecutivos} meses al día`,
      datosEvaluacion: {
        mesesAlDia,
        mesesRequeridos: config.mesesConsecutivos,
      },
    };
  }

  /**
   * Evalúa badge de Participativo (asambleas)
   */
  private async evaluarParticipativo(
    criterios: object,
    usuarioId: string,
    consorcioId: string
  ): Promise<ResultadoEvaluacion> {
    const config = criterios as { asistenciasMinimas: number };

    // Contar asistencias a asambleas
    const asistencias = await this.prisma.asistenciaAsamblea.count({
      where: {
        asamblea: { consorcioId },
        presente: true,
      },
    });

    const progreso = Math.min(
      100,
      Math.round((asistencias / config.asistenciasMinimas) * 100)
    );
    const cumple = asistencias >= config.asistenciasMinimas;

    return {
      tipo: TipoBadge.PARTICIPATIVO,
      cumple,
      progreso,
      progresoDescripcion: `${asistencias}/${config.asistenciasMinimas} asambleas`,
      datosEvaluacion: {
        asistencias,
        asistenciasRequeridas: config.asistenciasMinimas,
      },
    };
  }

  /**
   * Evalúa badge de Colaborador (tickets útiles)
   */
  private async evaluarColaborador(
    criterios: object,
    usuarioId: string,
    consorcioId: string
  ): Promise<ResultadoEvaluacion> {
    const config = criterios as { reportesUtiles: number };

    // Contar tickets creados y resueltos
    const ticketsResueltos = await this.prisma.ticketMantenimiento.count({
      where: {
        creadorId: usuarioId,
        consorcioId,
        estado: 'RESUELTO',
      },
    });

    const progreso = Math.min(
      100,
      Math.round((ticketsResueltos / config.reportesUtiles) * 100)
    );
    const cumple = ticketsResueltos >= config.reportesUtiles;

    return {
      tipo: TipoBadge.COLABORADOR,
      cumple,
      progreso,
      progresoDescripcion: `${ticketsResueltos}/${config.reportesUtiles} reportes útiles`,
      datosEvaluacion: {
        ticketsResueltos,
        reportesRequeridos: config.reportesUtiles,
      },
    };
  }

  // ===========================================================================
  // Consultas de badges de usuario
  // ===========================================================================

  /**
   * Obtiene el resumen de badges de un usuario
   */
  async obtenerResumenBadges(
    usuarioId: string,
    consorcioId: string
  ): Promise<ResumenBadgesUsuarioDto> {
    // Badges obtenidos
    const badgesUsuario = await this.prisma.badgeUsuario.findMany({
      where: { usuarioId },
      include: { badge: true },
      orderBy: { obtenidoAt: 'desc' },
    });

    // Badges con beneficio vigente
    const ahora = new Date();
    const badgesConBeneficio = badgesUsuario.filter(
      (b) => b.beneficioHasta && b.beneficioHasta > ahora && !b.beneficioUsado
    ).length;

    // Badges disponibles no obtenidos
    const badgesObtenidosIds = badgesUsuario.map((b) => b.badgeId);
    const badgesDisponibles = await this.prisma.badgeDefinicion.findMany({
      where: {
        activo: true,
        id: { notIn: badgesObtenidosIds },
      },
    });

    // Evaluar progreso hacia cada badge no obtenido
    const proximosBadges: BadgeConEstadoDto[] = [];
    for (const badge of badgesDisponibles) {
      const evaluacion = await this.evaluarCriterios(
        badge.tipo,
        badge.criterios as object,
        usuarioId,
        consorcioId
      );

      proximosBadges.push({
        ...badge,
        criterios: badge.criterios as object,
        obtenido: false,
        progreso: evaluacion.progreso,
        progresoDescripcion: evaluacion.progresoDescripcion,
      } as BadgeConEstadoDto);
    }

    // Ordenar por progreso descendente
    proximosBadges.sort((a, b) => (b.progreso || 0) - (a.progreso || 0));

    return {
      totalBadges: badgesUsuario.length,
      badgesConBeneficio,
      badges: badgesUsuario as BadgeUsuarioResponseDto[],
      proximosBadges,
    };
  }

  /**
   * Obtiene los badges públicos de un usuario (para mostrar a otros)
   */
  async obtenerBadgesPublicos(
    usuarioId: string
  ): Promise<BadgeUsuarioResponseDto[]> {
    const badges = await this.prisma.badgeUsuario.findMany({
      where: {
        usuarioId,
        mostrarPublico: true,
      },
      include: { badge: true },
      orderBy: { obtenidoAt: 'desc' },
    });

    return badges as BadgeUsuarioResponseDto[];
  }

  /**
   * Configura la visibilidad de un badge del usuario
   */
  async configurarVisibilidad(
    badgeUsuarioId: string,
    mostrarPublico: boolean
  ): Promise<BadgeUsuarioResponseDto> {
    const badge = await this.prisma.badgeUsuario.update({
      where: { id: badgeUsuarioId },
      data: { mostrarPublico },
      include: { badge: true },
    });

    return badge as BadgeUsuarioResponseDto;
  }

  /**
   * Marca un beneficio como usado
   */
  async usarBeneficio(badgeUsuarioId: string): Promise<BadgeUsuarioResponseDto> {
    const badge = await this.prisma.badgeUsuario.findUnique({
      where: { id: badgeUsuarioId },
      include: { badge: true },
    });

    if (!badge) {
      throw new NotFoundException('Badge no encontrado');
    }

    if (badge.beneficioUsado) {
      throw new ConflictException('El beneficio ya fue utilizado');
    }

    if (badge.beneficioHasta && badge.beneficioHasta < new Date()) {
      throw new ConflictException('El beneficio ha expirado');
    }

    const actualizado = await this.prisma.badgeUsuario.update({
      where: { id: badgeUsuarioId },
      data: { beneficioUsado: true },
      include: { badge: true },
    });

    this.logger.log(`Beneficio de badge ${badge.badge.nombre} usado`);

    return actualizado as BadgeUsuarioResponseDto;
  }
}
