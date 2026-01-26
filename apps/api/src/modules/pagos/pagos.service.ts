import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  ConflictException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';
import { MercadoPagoService } from '../mercadopago/mercadopago.service';
import {
  IniciarPagoDto,
  RegistrarPagoManualDto,
  FilterPagosDto,
  ActualizarEstadoPagoDto,
  ReembolsarPagoDto,
  EstadoPago,
  MetodoPago,
} from './dto';
import { Prisma, Rol, TipoMovimiento } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PagosService {
  private readonly logger = new Logger(PagosService.name);
  private readonly mpSecretKey: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly mercadoPagoService: MercadoPagoService,
  ) {
    // Clave secreta de Mercado Pago para validar webhooks
    this.mpSecretKey = this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET') || '';
  }

  // ===========================================================================
  // VALIDACIONES DE SEGURIDAD
  // ===========================================================================

  /**
   * Valida que el usuario tenga acceso a la unidad funcional
   * CRÍTICO: Previene pagos fraudulentos
   */
  private async validarAccesoUnidadFuncional(
    usuarioId: string,
    unidadFuncionalId: string,
  ): Promise<{ consorcioId: string; codigo: string }> {
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        unidadFuncionalId,
        activo: true,
        rol: { in: [Rol.PROPIETARIO, Rol.INQUILINO] },
      },
      include: {
        unidadFuncional: {
          select: { consorcioId: true, codigo: true },
        },
      },
    });

    if (!vinculo || !vinculo.unidadFuncional) {
      throw new ForbiddenException(
        'No tiene permisos para realizar pagos en esta unidad funcional',
      );
    }

    return {
      consorcioId: vinculo.unidadFuncional.consorcioId,
      codigo: vinculo.unidadFuncional.codigo,
    };
  }

  /**
   * Valida permisos de administrador sobre un consorcio
   */
  private async validarPermisoAdmin(
    usuarioId: string,
    consorcioId: string,
  ): Promise<void> {
    const permiso = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        rol: { in: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF] },
        activo: true,
      },
    });

    // Verificar también si es SUPER_ADMIN global
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: { usuarioId, rol: Rol.SUPER_ADMIN, activo: true },
    });

    if (!permiso && !esSuperAdmin) {
      throw new ForbiddenException('No tiene permisos de administrador');
    }
  }

  /**
   * Valida firma HMAC del webhook de Mercado Pago
   * CRÍTICO: Previene webhooks fraudulentos
   */
  private validarFirmaMercadoPago(
    dataId: string,
    requestId: string,
    timestamp: string,
    signature: string,
  ): boolean {
    if (!this.mpSecretKey) {
      this.logger.warn('MERCADO_PAGO_WEBHOOK_SECRET no configurado');
      return false;
    }

    // Construir el mensaje a firmar según documentación de MP
    const message = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    
    // Calcular HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', this.mpSecretKey)
      .update(message)
      .digest('hex');

    // Comparación segura contra timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex'),
      );
    } catch {
      return false;
    }
  }

  /**
   * Verifica rate limiting para pagos por usuario
   * SEGURIDAD: Previene abuso de creación de pagos
   */
  private async verificarRateLimitPagos(usuarioId: string): Promise<void> {
    const unaHoraAtras = new Date();
    unaHoraAtras.setHours(unaHoraAtras.getHours() - 1);

    const pagosPendientesRecientes = await this.prisma.pago.count({
      where: {
        usuarioId,
        estado: { in: [EstadoPago.PENDIENTE, EstadoPago.PROCESANDO] },
        createdAt: { gte: unaHoraAtras },
      },
    });

    // Máximo 5 pagos pendientes por hora
    if (pagosPendientesRecientes >= 5) {
      this.logger.warn(`Rate limit excedido para usuario ${usuarioId}`);
      throw new HttpException(
        'Ha alcanzado el límite de intentos de pago. Intente más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Valida que los períodos existan y tengan deuda
   * CRÍTICO: Previene pagos duplicados o de períodos inexistentes
   */
  private async validarPeriodos(
    unidadFuncionalId: string,
    periodos: string[],
  ): Promise<{ montoTotal: number; detalles: Map<string, number> }> {
    const detalles = new Map<string, number>();
    let montoTotal = 0;

    // Obtener la UF con su consorcio para buscar expensas
    const uf = await this.prisma.unidadFuncional.findUnique({
      where: { id: unidadFuncionalId },
      select: { consorcioId: true },
    });

    if (!uf) {
      throw new NotFoundException('Unidad funcional no encontrada');
    }

    for (const periodo of periodos) {
      // Buscar detalle de expensa para este período y UF
      const detalle = await this.prisma.detalleExpensa.findFirst({
        where: {
          unidadFuncionalId,
          expensa: {
            periodo,
            consorcioId: uf.consorcioId,
            estado: { in: ['PUBLICADA', 'CERRADA'] },
          },
        },
        include: {
          expensa: { select: { periodo: true, estado: true } },
        },
      });

      if (!detalle) {
        throw new BadRequestException(
          `No se encontró expensa publicada para el período ${periodo}`,
        );
      }

      // Calcular monto pendiente (considerando pagos anteriores)
      const pagosPrevios = await this.prisma.pago.aggregate({
        where: {
          estado: EstadoPago.APROBADO,
          periodosAbonados: { has: periodo },
          usuario: {
            rolesConsorcio: {
              some: { unidadFuncionalId },
            },
          },
        },
        _sum: { monto: true },
      });

      const montoPagado = pagosPrevios._sum.monto
        ? Number(pagosPrevios._sum.monto)
        : 0;
      const montoExpensa = Number(detalle.total);
      const montoPendiente = Math.max(0, montoExpensa - montoPagado);

      if (montoPendiente <= 0) {
        throw new BadRequestException(
          `El período ${periodo} ya está completamente pagado`,
        );
      }

      detalles.set(periodo, montoPendiente);
      montoTotal += montoPendiente;
    }

    return { montoTotal, detalles };
  }

  // ===========================================================================
  // FLUJO DE PAGO - VECINOS
  // ===========================================================================

  /**
   * Inicia un pago como vecino (genera link de MP o datos de transferencia)
   * NO toca dinero directamente - solo genera la intención de pago
   */
  async iniciarPago(dto: IniciarPagoDto, usuarioId: string) {
    // SEGURIDAD: Verificar rate limit
    await this.verificarRateLimitPagos(usuarioId);

    // SEGURIDAD: Eliminar períodos duplicados
    const periodosUnicos = [...new Set(dto.periodosAbonados)];
    if (periodosUnicos.length !== dto.periodosAbonados.length) {
      this.logger.warn(`Períodos duplicados detectados de usuario ${usuarioId}`);
    }
    dto.periodosAbonados = periodosUnicos;

    // Validar acceso a la UF
    const { consorcioId, codigo } = await this.validarAccesoUnidadFuncional(
      usuarioId,
      dto.unidadFuncionalId,
    );

    // Validar períodos y calcular monto
    const { montoTotal, detalles } = await this.validarPeriodos(
      dto.unidadFuncionalId,
      dto.periodosAbonados,
    );

    // Si hay monto personalizado, validar que no supere el total
    const montoFinal = dto.montoPersonalizado
      ? Math.min(dto.montoPersonalizado, montoTotal)
      : montoTotal;

    // SEGURIDAD: Monto mínimo aumentado a $500 para prevenir micro-fraudes
    if (montoFinal < 500) {
      throw new BadRequestException('El monto mínimo de pago es $500');
    }

    // Verificar que no haya pagos PENDIENTES o PROCESANDO para los mismos períodos
    const pagosPendientes = await this.prisma.pago.findFirst({
      where: {
        usuarioId,
        estado: { in: [EstadoPago.PENDIENTE, EstadoPago.PROCESANDO] },
        periodosAbonados: { hasSome: dto.periodosAbonados },
      },
    });

    if (pagosPendientes) {
      throw new ConflictException(
        'Ya existe un pago pendiente para alguno de estos períodos. ' +
          'Espere a que se procese o cancélelo primero.',
      );
    }

    // Obtener datos del consorcio para transferencia
    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: consorcioId },
      select: { nombre: true, cbu: true, aliasCbu: true, banco: true },
    });

    // Generar concepto descriptivo
    const conceptoBase = `Expensas ${codigo} - ${dto.periodosAbonados.join(', ')}`;
    const concepto = dto.comentario
      ? `${conceptoBase} - ${dto.comentario.substring(0, 100)}`
      : conceptoBase;

    // Crear el pago en estado PENDIENTE
    const pago = await this.prisma.pago.create({
      data: {
        usuarioId,
        monto: new Decimal(montoFinal),
        metodoPago: dto.metodoPago,
        estado: EstadoPago.PENDIENTE,
        concepto: this.sanitizarTexto(concepto) ?? concepto,
        periodosAbonados: dto.periodosAbonados,
      },
    });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Pago',
      entidadId: pago.id,
      datosNuevos: {
        ...pago,
        unidadFuncionalId: dto.unidadFuncionalId,
        consorcioId,
        detallesPeriodos: Object.fromEntries(detalles),
      },
    });

    this.logger.log(
      `Pago iniciado: ${pago.id} - $${montoFinal} - UF ${codigo} - Método: ${dto.metodoPago}`,
    );

    // Preparar respuesta según método de pago
    const respuesta: {
      pagoId: string;
      estado: EstadoPago;
      monto: number;
      urlPago?: string;
      preferenceId?: string;
      datosTransferencia?: {
        cbu: string;
        alias: string;
        titular: string;
        banco: string;
        concepto: string;
      };
    } = {
      pagoId: pago.id,
      estado: pago.estado as EstadoPago,
      monto: montoFinal,
    };

    if (dto.metodoPago === MetodoPago.MERCADO_PAGO) {
      // Integración con Mercado Pago
      if (this.mercadoPagoService.isConfigured()) {
        try {
          // Obtener email del usuario para Mercado Pago
          const usuarioData = await this.prisma.usuario.findUnique({
            where: { id: usuarioId },
            select: { email: true },
          });

          const preference = await this.mercadoPagoService.crearPreferencia({
            pagoId: pago.id,
            monto: montoFinal,
            concepto,
            email: usuarioData?.email,
            consorcioNombre: consorcio?.nombre,
            periodos: dto.periodosAbonados,
          });
          respuesta.urlPago = preference.init_point;
          respuesta.preferenceId = preference.id;
        } catch (error) {
          this.logger.error('Error creando preferencia MP', error);
          // Fallback: devolvemos URL placeholder para que el usuario pueda reintentar
          respuesta.urlPago = `${this.configService.get('APP_URL')}/pagos/error?pago=${pago.id}&error=mp`;
        }
      } else {
        // Mercado Pago no configurado
        this.logger.warn('Mercado Pago no configurado - retornando URL placeholder');
        respuesta.urlPago = `https://mercadopago.com.ar/checkout/placeholder/${pago.id}`;
        respuesta.preferenceId = `pref_${pago.id}`;
      }
    } else if (dto.metodoPago === MetodoPago.TRANSFERENCIA) {
      // Datos para transferencia bancaria
      if (consorcio?.cbu) {
        respuesta.datosTransferencia = {
          cbu: consorcio.cbu, // En producción esto estaría encriptado
          alias: consorcio.aliasCbu || `vecinosimple.${codigo.toLowerCase()}`,
          titular: consorcio.nombre,
          banco: consorcio.banco || 'Banco a confirmar',
          concepto: `EXP-${pago.id.slice(-8).toUpperCase()}`,
        };
      }
    }

    return respuesta;
  }

  /**
   * Registra un pago manual (efectivo/transferencia) - Solo admins
   * CRÍTICO: Auditoría completa de quién registra qué
   */
  async registrarPagoManual(dto: RegistrarPagoManualDto, usuarioId: string) {
    // Obtener la UF y validar
    const uf = await this.prisma.unidadFuncional.findUnique({
      where: { id: dto.unidadFuncionalId },
      select: { consorcioId: true, codigo: true },
    });

    if (!uf) {
      throw new NotFoundException('Unidad funcional no encontrada');
    }

    // Validar permisos de admin sobre el consorcio
    await this.validarPermisoAdmin(usuarioId, uf.consorcioId);

    // Validar fecha de pago no futura
    const fechaPago = new Date(dto.fechaPago);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (fechaPago > hoy) {
      throw new BadRequestException('La fecha de pago no puede ser futura');
    }

    // Validar fecha no muy antigua (6 meses máximo para pagos manuales)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
    if (fechaPago < seisMesesAtras) {
      throw new BadRequestException(
        'La fecha de pago no puede ser anterior a 6 meses',
      );
    }

    // Buscar usuario asociado a la UF (para asignar el pago)
    const usuarioUF = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        unidadFuncionalId: dto.unidadFuncionalId,
        rol: { in: [Rol.PROPIETARIO, Rol.INQUILINO] },
        activo: true,
      },
      select: { usuarioId: true },
    });

    if (!usuarioUF) {
      throw new BadRequestException(
        'No hay usuario vinculado a esta unidad funcional',
      );
    }

    const conceptoFinal =
      dto.concepto ||
      `Pago ${dto.metodoPago} - ${uf.codigo} - ${dto.periodosAbonados.join(', ')}`;

    // Crear pago ya APROBADO (es manual)
    const pago = await this.prisma.pago.create({
      data: {
        usuarioId: usuarioUF.usuarioId,
        monto: new Decimal(dto.monto),
        metodoPago: dto.metodoPago,
        estado: EstadoPago.APROBADO,
        concepto: this.sanitizarTexto(conceptoFinal) ?? conceptoFinal,
        periodosAbonados: dto.periodosAbonados,
        transferenciaRef: dto.transferenciaRef,
        fechaPago,
      },
    });

    // Crear movimiento en cuenta corriente
    await this.registrarMovimientoCuentaCorriente(
      dto.unidadFuncionalId,
      pago.id,
      dto.monto,
      conceptoFinal,
    );

    // Auditar con información del admin que registra
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Pago',
      entidadId: pago.id,
      datosNuevos: {
        ...pago,
        registradoPor: usuarioId,
        tipoRegistro: 'MANUAL',
        unidadFuncionalId: dto.unidadFuncionalId,
        consorcioId: uf.consorcioId,
      },
    });

    this.logger.log(
      `Pago manual registrado: ${pago.id} - $${dto.monto} - UF ${uf.codigo} - ` +
        `Registrado por ${usuarioId}`,
    );

    // Enviar email de confirmación (async, no bloquea)
    this.enviarEmailConfirmacionPago(pago.id);

    return pago;
  }

  // ===========================================================================
  // WEBHOOK MERCADO PAGO
  // ===========================================================================

  /**
   * Procesa notificación de Mercado Pago
   * CRÍTICO: Validar firma del webhook antes de procesar
   */
  async procesarWebhookMercadoPago(
    data: {
      type: string;
      dataId: string;
      externalReference?: string;
      requestId?: string;
      timestamp?: string;
    },
    signature?: string,
  ) {
    // SEGURIDAD: Validar firma del webhook con clave secreta
    if (this.mpSecretKey && data.requestId && data.timestamp && signature) {
      const firmaValida = this.validarFirmaMercadoPago(
        data.dataId,
        data.requestId,
        data.timestamp,
        signature,
      );

      if (!firmaValida) {
        this.logger.warn(`Webhook MP rechazado - firma inválida para ${data.dataId}`);
        throw new ForbiddenException('Firma de webhook inválida');
      }
    } else if (this.mpSecretKey) {
      // Si tenemos clave configurada pero faltan datos, rechazar
      this.logger.warn('Webhook MP rechazado - faltan datos de firma');
      throw new ForbiddenException('Datos de firma incompletos');
    }

    if (data.type !== 'payment') {
      this.logger.debug(`Webhook MP ignorado - tipo: ${data.type}`);
      return { received: true, processed: false };
    }

    // Buscar el pago por external_reference (nuestro pagoId)
    if (!data.externalReference) {
      this.logger.warn('Webhook MP sin external_reference');
      return { received: true, processed: false };
    }

    const pago = await this.prisma.pago.findUnique({
      where: { id: data.externalReference },
    });

    if (!pago) {
      this.logger.warn(`Pago no encontrado: ${data.externalReference}`);
      return { received: true, processed: false };
    }

    // Consultar estado real en API de Mercado Pago
    let nuevoEstado: EstadoPago = EstadoPago.PENDIENTE;
    let mpPaymentStatus = 'unknown';
    
    if (this.mercadoPagoService.isConfigured() && data.dataId) {
      try {
        const mpPayment = await this.mercadoPagoService.getPayment(data.dataId);
        nuevoEstado = this.mercadoPagoService.mapStatusToEstado(mpPayment.status) as EstadoPago;
        mpPaymentStatus = mpPayment.status;
        
        this.logger.log(
          `Webhook MP - Pago ${data.externalReference}: MP status=${mpPayment.status} -> estado=${nuevoEstado}`,
        );
      } catch (error) {
        this.logger.error(`Error consultando pago MP ${data.dataId}`, error);
        // Si no podemos consultar, asumimos aprobado si el webhook dice payment
        nuevoEstado = EstadoPago.APROBADO;
        mpPaymentStatus = 'approved_assumed';
      }
    } else {
      // Sin Mercado Pago configurado, asumimos aprobado
      nuevoEstado = EstadoPago.APROBADO;
      mpPaymentStatus = 'approved_no_mp';
    }

    if (pago.estado === nuevoEstado) {
      return { received: true, processed: false, reason: 'already_processed' };
    }

    const pagoActualizado = await this.prisma.pago.update({
      where: { id: pago.id },
      data: {
        estado: nuevoEstado,
        mercadoPagoId: data.dataId,
        mercadoPagoStatus: mpPaymentStatus,
        fechaPago: nuevoEstado === EstadoPago.APROBADO ? new Date() : null,
      },
    });

    // Si se aprobó, crear movimiento en cuenta corriente
    if (nuevoEstado === EstadoPago.APROBADO) {
      // Buscar la UF del usuario
      const vinculoUF = await this.prisma.usuarioConsorcio.findFirst({
        where: {
          usuarioId: pago.usuarioId,
          rol: { in: [Rol.PROPIETARIO, Rol.INQUILINO] },
          activo: true,
        },
        select: { unidadFuncionalId: true },
      });

      if (vinculoUF?.unidadFuncionalId) {
        await this.registrarMovimientoCuentaCorriente(
          vinculoUF.unidadFuncionalId,
          pago.id,
          Number(pago.monto),
          pago.concepto,
        );
      }
    }

    await this.auditService.log({
      usuarioId: 'SYSTEM_WEBHOOK_MP',
      accion: 'UPDATE',
      entidad: 'Pago',
      entidadId: pago.id,
      datosAnteriores: { estado: pago.estado },
      datosNuevos: {
        estado: nuevoEstado,
        mercadoPagoId: data.dataId,
      },
    });

    this.logger.log(
      `Pago ${pago.id} actualizado vía webhook MP: ${pago.estado} → ${nuevoEstado}`,
    );

    return { received: true, processed: true };
  }

  // ===========================================================================
  // CONSULTAS
  // ===========================================================================

  async findAll(filtros: FilterPagosDto, usuarioId: string) {
    const {
      consorcioId,
      usuarioId: filterUsuarioId,
      unidadFuncionalId,
      estado,
      metodoPago,
      periodo,
      fechaDesde,
      fechaHasta,
      montoMin,
      montoMax,
      page = 1,
      limit = 20,
    } = filtros;

    // Construir filtros
    const where: Prisma.PagoWhereInput = {};

    if (filterUsuarioId) {
      where.usuarioId = filterUsuarioId;
    }

    if (estado) {
      where.estado = estado;
    }

    if (metodoPago) {
      where.metodoPago = metodoPago;
    }

    if (periodo) {
      where.periodosAbonados = { has: periodo };
    }

    if (fechaDesde || fechaHasta) {
      where.createdAt = {};
      if (fechaDesde) {
        where.createdAt.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.createdAt.lte = new Date(fechaHasta);
      }
    }

    if (montoMin !== undefined || montoMax !== undefined) {
      where.monto = {};
      if (montoMin !== undefined) {
        where.monto.gte = new Decimal(montoMin);
      }
      if (montoMax !== undefined) {
        where.monto.lte = new Decimal(montoMax);
      }
    }

    // Filtrar por consorcio si se especifica (para admins)
    if (consorcioId) {
      await this.validarPermisoAdmin(usuarioId, consorcioId);
      // Filtrar usuarios que pertenecen a este consorcio
      const usuariosEnConsorcio = await this.prisma.usuarioConsorcio.findMany({
        where: { consorcioId, activo: true },
        select: { usuarioId: true },
      });
      where.usuarioId = { in: usuariosEnConsorcio.map(u => u.usuarioId) };
    }

    // Filtrar por UF si se especifica
    if (unidadFuncionalId) {
      const usuariosEnUF = await this.prisma.usuarioConsorcio.findMany({
        where: { unidadFuncionalId, activo: true },
        select: { usuarioId: true },
      });
      if (where.usuarioId) {
        // Intersección con filtro de consorcio si existe
        const existingIds = where.usuarioId as { in: string[] };
        const ufIds = usuariosEnUF.map(u => u.usuarioId);
        where.usuarioId = { in: existingIds.in.filter(id => ufIds.includes(id)) };
      } else {
        where.usuarioId = { in: usuariosEnUF.map(u => u.usuarioId) };
      }
    }

    const [pagos, total, agregado] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        include: {
          usuario: { select: { nombre: true, apellido: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pago.count({ where }),
      this.prisma.pago.aggregate({
        where,
        _sum: { monto: true },
      }),
    ]);

    const sumaPagina = pagos.reduce((sum, p) => sum + Number(p.monto), 0);

    return {
      data: pagos,
      total,
      page,
      limit,
      sumaPagina,
      sumaTotal: agregado._sum.monto ? Number(agregado._sum.monto) : 0,
    };
  }

  async findOne(id: string, usuarioId: string) {
    const pago = await this.prisma.pago.findUnique({
      where: { id },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
        movimientoCuenta: true,
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Verificar permisos: propio usuario o admin del consorcio
    if (pago.usuarioId !== usuarioId) {
      // Verificar si es admin
      const esAdmin = await this.prisma.usuarioConsorcio.findFirst({
        where: {
          usuarioId,
          rol: { in: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR] },
          activo: true,
        },
      });

      if (!esAdmin) {
        throw new ForbiddenException('No tiene permisos para ver este pago');
      }
    }

    return pago;
  }

  /**
   * Obtiene la cuenta corriente de una unidad funcional
   */
  async obtenerCuentaCorriente(unidadFuncionalId: string, usuarioId: string) {
    // Validar acceso
    const uf = await this.prisma.unidadFuncional.findUnique({
      where: { id: unidadFuncionalId },
      select: { consorcioId: true, codigo: true },
    });

    if (!uf) {
      throw new NotFoundException('Unidad funcional no encontrada');
    }

    // Verificar si es el propio vecino o admin
    const vinculo = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        OR: [
          { unidadFuncionalId },
          {
            consorcioId: uf.consorcioId,
            rol: { in: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR] },
          },
        ],
        activo: true,
      },
    });

    if (!vinculo) {
      throw new ForbiddenException('No tiene acceso a esta cuenta corriente');
    }

    // Obtener último movimiento para saldo actual
    const ultimoMovimiento = await this.prisma.movimientoCuentaCorriente.findFirst({
      where: { unidadFuncionalId },
      orderBy: { fecha: 'desc' },
    });

    const saldoActual = ultimoMovimiento
      ? Number(ultimoMovimiento.saldoResultante)
      : 0;

    // Obtener expensas pendientes
    const detallesPendientes = await this.prisma.detalleExpensa.findMany({
      where: {
        unidadFuncionalId,
        expensa: { estado: { in: ['PUBLICADA', 'CERRADA'] } },
      },
      include: {
        expensa: { select: { periodo: true } },
      },
      orderBy: { expensa: { periodo: 'asc' } },
    });

    // Obtener pagos aprobados del usuario para esta UF
    const pagosAprobados = await this.prisma.pago.findMany({
      where: {
        usuarioId,
        estado: 'APROBADO',
        periodosAbonados: { isEmpty: false },
      },
      select: {
        periodosAbonados: true,
        monto: true,
      },
    });

    // Calcular montos pagados por período
    const montosPagadosPorPeriodo: Record<string, number> = {};
    for (const pago of pagosAprobados) {
      // Distribuir el monto entre los períodos abonados
      const cantidadPeriodos = pago.periodosAbonados.length;
      const montoPorPeriodo = Number(pago.monto) / cantidadPeriodos;
      
      for (const periodo of pago.periodosAbonados) {
        montosPagadosPorPeriodo[periodo] = 
          (montosPagadosPorPeriodo[periodo] || 0) + montoPorPeriodo;
      }
    }

    // Calcular pendientes reales (restando pagos parciales)
    const expensasPendientes = detallesPendientes
      .map(d => {
        const montoOriginal = Number(d.total);
        const montoPagado = montosPagadosPorPeriodo[d.expensa.periodo] || 0;
        const pendiente = Math.max(0, montoOriginal - montoPagado);
        
        return {
          periodo: d.expensa.periodo,
          montoOriginal,
          intereses: Number(d.intereses),
          montoPagado,
          totalAPagar: pendiente,
        };
      })
      .filter(e => e.totalAPagar > 0); // Solo mostrar los que tienen saldo pendiente

    // Últimos movimientos
    const movimientos = await this.prisma.movimientoCuentaCorriente.findMany({
      where: { unidadFuncionalId },
      orderBy: { fecha: 'desc' },
      take: 10,
    });

    return {
      unidadFuncionalId,
      codigoUnidad: uf.codigo,
      saldoActual,
      expensasPendientes,
      totalAdeudado: expensasPendientes.reduce((sum, e) => sum + e.totalAPagar, 0),
      ultimosMovimientos: movimientos.map(m => ({
        id: m.id,
        fecha: m.fecha,
        concepto: m.concepto,
        monto: Number(m.monto),
        saldoResultante: Number(m.saldoResultante),
      })),
    };
  }

  // ===========================================================================
  // ADMINISTRACIÓN
  // ===========================================================================

  /**
   * Actualiza estado de pago manualmente - Solo SUPER_ADMIN
   * CRÍTICO: Requiere motivo y se audita
   */
  async actualizarEstado(
    pagoId: string,
    dto: ActualizarEstadoPagoDto,
    usuarioId: string,
  ) {
    // Solo SUPER_ADMIN puede cambiar estados manualmente
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: { usuarioId, rol: Rol.SUPER_ADMIN, activo: true },
    });

    if (!esSuperAdmin) {
      throw new ForbiddenException(
        'Solo administradores globales pueden cambiar estados de pago manualmente',
      );
    }

    const pago = await this.prisma.pago.findUnique({ where: { id: pagoId } });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Validar transiciones de estado permitidas
    const transicionesPermitidas: Record<EstadoPago, EstadoPago[]> = {
      [EstadoPago.PENDIENTE]: [
        EstadoPago.PROCESANDO,
        EstadoPago.APROBADO,
        EstadoPago.RECHAZADO,
      ],
      [EstadoPago.PROCESANDO]: [EstadoPago.APROBADO, EstadoPago.RECHAZADO],
      [EstadoPago.APROBADO]: [EstadoPago.REEMBOLSADO],
      [EstadoPago.RECHAZADO]: [],
      [EstadoPago.REEMBOLSADO]: [],
    };

    const estadoActual = pago.estado as EstadoPago;
    if (!transicionesPermitidas[estadoActual]?.includes(dto.estado)) {
      throw new BadRequestException(
        `No se puede cambiar de ${estadoActual} a ${dto.estado}`,
      );
    }

    const pagoActualizado = await this.prisma.pago.update({
      where: { id: pagoId },
      data: {
        estado: dto.estado,
        ...(dto.estado === EstadoPago.APROBADO && { fechaPago: new Date() }),
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Pago',
      entidadId: pagoId,
      datosAnteriores: { estado: pago.estado },
      datosNuevos: {
        estado: dto.estado,
        motivo: dto.motivo,
        cambiadoManualmentePor: usuarioId,
      },
    });

    this.logger.warn(
      `Estado de pago ${pagoId} cambiado manualmente: ${pago.estado} → ${dto.estado} ` +
        `por ${usuarioId} - Motivo: ${dto.motivo}`,
    );

    return pagoActualizado;
  }

  /**
   * Procesa reembolso de un pago
   * CRÍTICO: Solo SUPER_ADMIN, crea movimiento inverso
   */
  async reembolsar(pagoId: string, dto: ReembolsarPagoDto, usuarioId: string) {
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: { usuarioId, rol: Rol.SUPER_ADMIN, activo: true },
    });

    if (!esSuperAdmin) {
      throw new ForbiddenException('Solo administradores globales pueden reembolsar');
    }

    const pago = await this.prisma.pago.findUnique({
      where: { id: pagoId },
      include: { movimientoCuenta: true },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    if (pago.estado !== EstadoPago.APROBADO) {
      throw new BadRequestException('Solo se pueden reembolsar pagos aprobados');
    }

    const montoReembolso = dto.montoReembolso || Number(pago.monto);
    if (montoReembolso > Number(pago.monto)) {
      throw new BadRequestException(
        'El monto de reembolso no puede superar el monto original',
      );
    }

    // Actualizar pago
    const pagoReembolsado = await this.prisma.pago.update({
      where: { id: pagoId },
      data: { estado: EstadoPago.REEMBOLSADO },
    });

    // Crear movimiento inverso si había movimiento original
    if (pago.movimientoCuenta) {
      const ultimoMov = await this.prisma.movimientoCuentaCorriente.findFirst({
        where: { unidadFuncionalId: pago.movimientoCuenta.unidadFuncionalId },
        orderBy: { fecha: 'desc' },
      });

      const saldoAnterior = ultimoMov ? Number(ultimoMov.saldoResultante) : 0;

      await this.prisma.movimientoCuentaCorriente.create({
        data: {
          unidadFuncionalId: pago.movimientoCuenta.unidadFuncionalId,
          tipo: TipoMovimiento.AJUSTE,
          concepto: `REEMBOLSO: ${pago.concepto} - ${dto.motivo}`,
          monto: new Decimal(-montoReembolso), // Negativo porque es reversión
          saldoResultante: new Decimal(saldoAnterior - montoReembolso),
        },
      });
    }

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Pago',
      entidadId: pagoId,
      datosAnteriores: { estado: pago.estado },
      datosNuevos: {
        estado: EstadoPago.REEMBOLSADO,
        montoReembolso,
        motivo: dto.motivo,
        reembolsadoPor: usuarioId,
      },
    });

    this.logger.warn(
      `Pago ${pagoId} REEMBOLSADO: $${montoReembolso} - ` +
        `Por: ${usuarioId} - Motivo: ${dto.motivo}`,
    );

    return pagoReembolsado;
  }

  // ===========================================================================
  // UTILIDADES PRIVADAS
  // ===========================================================================

  /**
   * Registra un movimiento en la cuenta corriente
   */
  private async registrarMovimientoCuentaCorriente(
    unidadFuncionalId: string,
    pagoId: string,
    monto: number,
    concepto: string,
  ): Promise<void> {
    // Obtener saldo anterior
    const ultimoMovimiento = await this.prisma.movimientoCuentaCorriente.findFirst({
      where: { unidadFuncionalId },
      orderBy: { fecha: 'desc' },
    });

    const saldoAnterior = ultimoMovimiento
      ? Number(ultimoMovimiento.saldoResultante)
      : 0;

    // El pago reduce la deuda (es un INGRESO en la cuenta)
    await this.prisma.movimientoCuentaCorriente.create({
      data: {
        unidadFuncionalId,
        pagoId,
        tipo: TipoMovimiento.INGRESO,
        concepto: `PAGO: ${concepto}`,
        monto: new Decimal(monto),
        saldoResultante: new Decimal(saldoAnterior + monto),
      },
    });
  }

  /**
   * Envía email de confirmación de pago
   */
  private async enviarEmailConfirmacionPago(pagoId: string): Promise<void> {
    try {
      // Obtener pago con datos relacionados
      const pago = await this.prisma.pago.findUnique({
        where: { id: pagoId },
        include: {
          usuario: true,
          movimientoCuenta: {
            include: {
              unidadFuncional: {
                include: {
                  consorcio: true,
                },
              },
            },
          },
        },
      });

      if (!pago || !pago.usuario.email || !pago.movimientoCuenta) {
        return;
      }

      const uf = pago.movimientoCuenta.unidadFuncional;
      const consorcio = uf.consorcio;

      // Generar template
      const template = this.emailTemplateService.pagoRecibido({
        nombre: pago.usuario.nombre,
        monto: this.formatearMonto(Number(pago.monto)),
        periodos: pago.periodosAbonados.join(', '),
        metodoPago: this.formatearMetodoPago(pago.metodoPago),
        fecha: this.formatearFecha(pago.fechaPago || new Date()),
      });

      // Enviar email
      await this.emailService.send({
        to: pago.usuario.email,
        subject: `✅ Pago recibido - ${consorcio.nombre}`,
        html: template.html,
        text: template.text,
      });

      this.logger.log(`Email de confirmación enviado para pago ${pagoId}`);
    } catch (error) {
      // No fallar el flujo si el email no se envía
      this.logger.warn(`No se pudo enviar email de confirmación: ${error}`);
    }
  }

  /**
   * Formatea el método de pago para mostrar
   */
  private formatearMetodoPago(metodo: string): string {
    const formatos: Record<string, string> = {
      MERCADO_PAGO: 'Mercado Pago',
      TRANSFERENCIA: 'Transferencia Bancaria',
      EFECTIVO: 'Efectivo',
      DEBITO_AUTOMATICO: 'Débito Automático',
      SIRO: 'SIRO',
    };
    return formatos[metodo] || metodo;
  }

  /**
   * Formatea monto como moneda argentina
   */
  private formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(monto);
  }

  /**
   * Formatea fecha en español
   */
  private formatearFecha(fecha: Date): string {
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(fecha);
  }

  /**
   * Sanitiza texto para prevenir XSS almacenado
   */
  private sanitizarTexto(texto?: string): string | undefined {
    if (!texto) return texto;

    return texto
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }

  // ===========================================================================
  // RESUMEN DE PAGOS POR CONSORCIO
  // ===========================================================================

  /**
   * Obtiene resumen de pagos para un consorcio
   * Usado en el dashboard de administrador
   */
  async obtenerResumenConsorcio(consorcioId: string, usuarioId: string) {
    // Validar permisos
    await this.validarPermisoAdmin(usuarioId, consorcioId);

    // Fecha del período actual (mes actual)
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const finMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59);

    // Consultas en paralelo
    const [
      totalRecaudadoMes,
      pagosPendientes,
      pagosAprobadosMes,
      ultimosPagos,
    ] = await Promise.all([
      // Total recaudado este mes
      this.prisma.pago.aggregate({
        where: {
          usuario: {
            rolesConsorcio: {
              some: { consorcioId },
            },
          },
          estado: 'APROBADO',
          fechaPago: {
            gte: inicioMes,
            lte: finMes,
          },
        },
        _sum: { monto: true },
        _count: true,
      }),

      // Pagos pendientes de confirmación
      this.prisma.pago.count({
        where: {
          usuario: {
            rolesConsorcio: {
              some: { consorcioId },
            },
          },
          estado: 'PENDIENTE',
        },
      }),

      // Cantidad de pagos aprobados este mes
      this.prisma.pago.count({
        where: {
          usuario: {
            rolesConsorcio: {
              some: { consorcioId },
            },
          },
          estado: 'APROBADO',
          fechaPago: {
            gte: inicioMes,
            lte: finMes,
          },
        },
      }),

      // Últimos 5 pagos
      this.prisma.pago.findMany({
        where: {
          usuario: {
            rolesConsorcio: {
              some: { consorcioId },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          usuario: {
            select: {
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
    ]);

    return {
      periodo: `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`,
      totalRecaudadoMes: totalRecaudadoMes._sum.monto?.toNumber() || 0,
      cantidadPagosMes: totalRecaudadoMes._count,
      pagosPendientes,
      pagosAprobadosMes,
      ultimosPagos: ultimosPagos.map((p) => ({
        id: p.id,
        monto: p.monto.toNumber(),
        estado: p.estado,
        metodoPago: p.metodoPago,
        fechaPago: p.fechaPago,
        vecino: `${p.usuario.nombre} ${p.usuario.apellido}`,
      })),
    };
  }

  // ===========================================================================
  // GENERAR COMPROBANTE DE PAGO
  // ===========================================================================

  /**
   * Genera un comprobante PDF para un pago aprobado
   */
  async generarComprobante(pagoId: string, usuarioId: string) {
    // Buscar el pago
    const pago = await this.prisma.pago.findUnique({
      where: { id: pagoId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            rolesConsorcio: {
              select: {
                consorcioId: true,
                unidadFuncional: {
                  select: { codigo: true },
                },
              },
            },
          },
        },
        movimientoCuenta: {
          include: {
            unidadFuncional: {
              include: {
                consorcio: true,
              },
            },
          },
        },
      },
    });

    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    // Validar acceso (el usuario debe ser dueño o admin)
    const esAdmin = await this.validarPermisoAdminSilent(usuarioId, pago.movimientoCuenta?.unidadFuncional?.consorcioId);
    if (pago.usuarioId !== usuarioId && !esAdmin) {
      throw new ForbiddenException('Sin acceso a este comprobante');
    }

    // Solo pagos aprobados tienen comprobante
    if (pago.estado !== 'APROBADO') {
      throw new BadRequestException('Solo se generan comprobantes para pagos aprobados');
    }

    // Si ya existe comprobante, retornar URL
    if (pago.comprobanteUrl) {
      return {
        url: pago.comprobanteUrl,
        generado: false,
      };
    }

    // Datos para el comprobante
    const consorcio = pago.movimientoCuenta?.unidadFuncional?.consorcio;
    const uf = pago.movimientoCuenta?.unidadFuncional;

    const datosComprobante = {
      numeroComprobante: `REC-${pago.id.slice(0, 8).toUpperCase()}`,
      fechaEmision: new Date(),
      fechaPago: pago.fechaPago,
      
      consorcio: consorcio ? {
        nombre: consorcio.nombre,
        direccion: consorcio.direccion,
        cuit: consorcio.cuit,
      } : null,

      vecino: {
        nombre: `${pago.usuario.nombre} ${pago.usuario.apellido}`,
        unidadFuncional: uf?.codigo || 'N/A',
      },

      pago: {
        monto: pago.monto.toNumber(),
        metodoPago: this.formatearMetodoPago(pago.metodoPago),
        concepto: pago.concepto,
        periodosAbonados: pago.periodosAbonados,
      },
    };

    // TODO: Integrar con PdfService para generar el PDF real
    // Por ahora, retornar los datos estructurados
    this.logger.debug(`Generando comprobante para pago ${pagoId}`);

    return {
      datos: datosComprobante,
      generado: true,
      mensaje: 'PDF pendiente de generación - integrar con PdfService',
    };
  }

  /**
   * Valida permisos de admin sin lanzar excepción
   */
  private async validarPermisoAdminSilent(
    usuarioId: string,
    consorcioId?: string,
  ): Promise<boolean> {
    if (!consorcioId) return false;

    try {
      await this.validarPermisoAdmin(usuarioId, consorcioId);
      return true;
    } catch {
      return false;
    }
  }
}
