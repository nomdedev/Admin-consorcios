import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TipoEmergencia, Prisma } from '@prisma/client';
import {
  CreateAlertaEmergenciaDto,
  ResolverAlertaDto,
  EMERGENCIA_CONFIG,
} from './dto/alerta.dto';
import { EmailService } from '../email/email.service';
import { EmailTemplateService } from '../email/email-template.service';
import { PushService, PUSH_TOPICS } from '../push/push.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';

type AlertaConfig = (typeof EMERGENCIA_CONFIG)[TipoEmergencia];

interface UsuarioNotificacion {
  id: string;
  email: string | null;
  telefono: string | null;
  nombre: string;
  apellido: string;
}

interface DestinatarioNotificacion {
  usuario: UsuarioNotificacion;
}

@Injectable()
export class AlertasService {
  private readonly logger = new Logger(AlertasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly pushService: PushService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  /**
   * Enmascara un email para logging seguro
   */
  private maskEmail(email: string): string {
    if (!email || email.length < 5) return '***@***';
    const parts = email.split('@');
    const local = parts[0] || '';
    const domain = parts[1] || '***';
    return `${local.substring(0, 2)}***@${domain}`;
  }

  /**
   * Enmascara un teléfono para logging seguro
   */
  private maskPhone(phone: string): string {
    if (!phone || phone.length < 4) return '****';
    return `***${phone.slice(-4)}`;
  }

  // ==========================================================================
  // Crear alerta de emergencia
  // ==========================================================================

  async crearAlerta(dto: CreateAlertaEmergenciaDto, usuarioId: string) {
    // Verificar consorcio
    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: dto.consorcioId },
      include: {
        usuariosConsorcio: {
          where: { activo: true },
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
                telefono: true,
                nombre: true,
                apellido: true,
              },
            },
          },
        },
      },
    });

    if (!consorcio) {
      throw new NotFoundException('Consorcio no encontrado');
    }

    // Crear la alerta
    const alerta = await this.prisma.alertaEmergencia.create({
      data: {
        consorcioId: dto.consorcioId,
        creadoPorId: usuarioId,
        tipo: dto.tipo,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        instrucciones: dto.instrucciones,
        enviadoPush: dto.enviarPush ?? true,
        enviadoEmail: dto.enviarEmail ?? true,
        enviadoWhatsapp: dto.enviarWhatsapp ?? false,
        enviadoSms: dto.enviarSms ?? false,
        destinatariosTotal: consorcio.usuariosConsorcio.length,
      },
      include: {
        creadoPor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    // Disparar notificaciones (en background)
    this.enviarNotificaciones(alerta.id, consorcio.usuariosConsorcio, dto, consorcio.nombre);

    // Crear registro de auditoría
    await this.prisma.auditLog.create({
      data: {
        usuarioId,
        accion: 'CREATE',
        entidad: 'AlertaEmergencia',
        entidadId: alerta.id,
        datosNuevos: {
          tipo: dto.tipo,
          titulo: dto.titulo,
          canales: {
            push: dto.enviarPush,
            email: dto.enviarEmail,
            whatsapp: dto.enviarWhatsapp,
            sms: dto.enviarSms,
          },
        },
      },
    });

    return alerta;
  }

  // ==========================================================================
  // Enviar notificaciones multicanal
  // ==========================================================================

  private async enviarNotificaciones(
    alertaId: string,
    destinatarios: DestinatarioNotificacion[],
    dto: CreateAlertaEmergenciaDto,
    consorcioNombre: string
  ) {
    let enviosExitosos = 0;
    let enviosFallidos = 0;

    const config = EMERGENCIA_CONFIG[dto.tipo];

    for (const destinatario of destinatarios) {
      const usuario = destinatario.usuario;

      try {
        // 1. Notificación in-app (siempre)
        await this.prisma.notificacion.create({
          data: {
            usuarioId: usuario.id,
            titulo: `${config.icono} ${dto.titulo}`,
            mensaje: dto.descripcion,
            tipo: 'emergencia',
            referenciaId: alertaId,
            referenciaTipo: 'AlertaEmergencia',
          },
        });

        // 2. Push notification
        if (dto.enviarPush) {
          await this.enviarPush(usuario, dto, config);
        }

        // 3. Email
        if (dto.enviarEmail && usuario.email) {
          await this.enviarEmail(usuario, dto, config, consorcioNombre);
        }

        // 4. WhatsApp (usando templates pre-aprobados)
        if (dto.enviarWhatsapp && usuario.telefono && config.templateWhatsapp) {
          await this.enviarWhatsapp(usuario, dto, config, consorcioNombre);
        }

        // 5. SMS
        if (dto.enviarSms && usuario.telefono) {
          await this.enviarSms(usuario, dto);
        }

        enviosExitosos++;
      } catch (error) {
        const err = error as Error;
        this.logger.error(
          `Error enviando notificación a ${this.maskEmail(usuario.email ?? '')}`,
          err.stack,
        );
        enviosFallidos++;
      }
    }

    // Actualizar estadísticas
    await this.prisma.alertaEmergencia.update({
      where: { id: alertaId },
      data: {
        enviosExitosos,
        enviosFallidos,
      },
    });
  }

  private async enviarPush(
    usuario: UsuarioNotificacion,
    dto: CreateAlertaEmergenciaDto,
    config: AlertaConfig,
  ) {
    if (!this.pushService.enabled) {
      this.logger.debug('[PUSH] Firebase no configurado, omitiendo push');
      return;
    }

    this.logger.debug(
      `[PUSH] Enviando notificación de emergencia`,
      { titulo: dto.titulo, destinatario: this.maskEmail(usuario.email ?? '') },
    );
    
    // Enviar al topic de emergencias del consorcio
    const topic = PUSH_TOPICS.emergencias(dto.consorcioId);
    
    await this.pushService.sendToTopic({
      topic,
      title: `🚨 ${dto.titulo}`,
      body: dto.descripcion,
      data: {
        type: 'emergencia',
        tipoEmergencia: dto.tipo,
        alertaId: dto.consorcioId,
        instrucciones: dto.instrucciones || '',
      },
      priority: 'high',
    });
  }

  private async enviarEmail(
    usuario: UsuarioNotificacion,
    dto: CreateAlertaEmergenciaDto,
    config: AlertaConfig,
    consorcioNombre: string,
  ) {
    // El email ya fue validado en el caller, pero TypeScript necesita null check
    if (!usuario.email) return;

    this.logger.debug(
      `[EMAIL] Enviando notificación`,
      { titulo: dto.titulo, destinatario: this.maskEmail(usuario.email) },
    );
    
    // Generar template de email
    const template = this.emailTemplateService.alertaEmergencia({
      nombre: usuario.nombre,
      consorcio: consorcioNombre,
      tipoEmergencia: dto.tipo,
      titulo: dto.titulo,
      descripcion: dto.descripcion,
      instrucciones: dto.instrucciones,
    });
    
    // Enviar email con Resend
    const result = await this.emailService.send({
      to: usuario.email,
      subject: `🚨 EMERGENCIA: ${dto.titulo}`,
      html: template.html,
      text: template.text,
    });
    
    if (!result.success) {
      throw new Error(result.error || 'Error al enviar email');
    }
  }

  private async enviarWhatsapp(
    usuario: UsuarioNotificacion,
    dto: CreateAlertaEmergenciaDto,
    config: AlertaConfig,
    consorcioNombre: string,
  ) {
    // El teléfono ya fue validado en el caller, pero TypeScript necesita null check
    if (!usuario.telefono) return;

    if (!this.whatsAppService.enabled) {
      this.logger.debug('[WHATSAPP] WhatsApp API no configurado, omitiendo envío');
      return;
    }

    this.logger.debug(
      `[WHATSAPP] Enviando notificación de emergencia`,
      { titulo: dto.titulo, destinatario: this.maskPhone(usuario.telefono) },
    );
    
    // Enviar usando template de emergencia pre-aprobado
    await this.whatsAppService.sendEmergencyAlert(
      usuario.telefono,
      dto.tipo,
      dto.descripcion,
      consorcioNombre,
    );
  }

  private async enviarSms(usuario: UsuarioNotificacion, dto: CreateAlertaEmergenciaDto) {
    // El teléfono ya fue validado en el caller, pero TypeScript necesita null check
    if (!usuario.telefono) return;

    this.logger.debug(
      `[SMS] Enviando notificación`,
      { titulo: dto.titulo, destinatario: this.maskPhone(usuario.telefono) },
    );
  }

  // ==========================================================================
  // Resolver alerta
  // ==========================================================================

  async resolverAlerta(alertaId: string, dto: ResolverAlertaDto, usuarioId: string) {
    const alerta = await this.prisma.alertaEmergencia.findUnique({
      where: { id: alertaId },
      include: { consorcio: true },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }

    if (!alerta.activa) {
      throw new BadRequestException('Esta alerta ya fue resuelta');
    }

    // Actualizar alerta
    const alertaResuelta = await this.prisma.alertaEmergencia.update({
      where: { id: alertaId },
      data: {
        activa: false,
        resueltaAt: new Date(),
        resolucion: dto.resolucion,
      },
      include: {
        creadoPor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    // Notificar resolución a todos los usuarios del consorcio
    await this.notificarResolucion(alertaResuelta);

    // Auditoría
    await this.prisma.auditLog.create({
      data: {
        usuarioId,
        accion: 'UPDATE',
        entidad: 'AlertaEmergencia',
        entidadId: alertaId,
        datosAnteriores: { activa: true },
        datosNuevos: { activa: false, resolucion: dto.resolucion },
      },
    });

    return alertaResuelta;
  }

  private async notificarResolucion(alerta: {
    id: string;
    consorcioId: string;
    tipo: TipoEmergencia;
    titulo: string;
    resolucion: string | null;
  }) {
    const usuarios = await this.prisma.usuarioConsorcio.findMany({
      where: {
        consorcioId: alerta.consorcioId,
        activo: true,
      },
      select: { usuarioId: true },
    });

    for (const { usuarioId } of usuarios) {
      await this.prisma.notificacion.create({
        data: {
          usuarioId,
          titulo: `✅ Emergencia resuelta`,
          mensaje: `${alerta.titulo}: ${alerta.resolucion}`,
          tipo: 'emergencia_resuelta',
          referenciaId: alerta.id,
          referenciaTipo: 'AlertaEmergencia',
        },
      });
    }
  }

  // ==========================================================================
  // Consultas
  // ==========================================================================

  async obtenerAlerta(alertaId: string) {
    const alerta = await this.prisma.alertaEmergencia.findUnique({
      where: { id: alertaId },
      include: {
        creadoPor: {
          select: { id: true, nombre: true, apellido: true },
        },
        consorcio: {
          select: { id: true, nombre: true, direccion: true },
        },
      },
    });

    if (!alerta) {
      throw new NotFoundException('Alerta no encontrada');
    }

    return alerta;
  }

  async listarAlertas(
    consorcioId: string,
    filtros?: {
      activa?: boolean;
      tipo?: TipoEmergencia;
      desde?: Date;
      hasta?: Date;
    }
  ) {
    const where: Prisma.AlertaEmergenciaWhereInput = { consorcioId };

    if (filtros?.activa !== undefined) {
      where.activa = filtros.activa;
    }

    if (filtros?.tipo) {
      where.tipo = filtros.tipo;
    }

    if (filtros?.desde || filtros?.hasta) {
      where.createdAt = {};
      if (filtros.desde) where.createdAt.gte = filtros.desde;
      if (filtros.hasta) where.createdAt.lte = filtros.hasta;
    }

    return this.prisma.alertaEmergencia.findMany({
      where,
      include: {
        creadoPor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async obtenerAlertasActivas(consorcioId: string) {
    return this.prisma.alertaEmergencia.findMany({
      where: {
        consorcioId,
        activa: true,
      },
      include: {
        creadoPor: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
