import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// ============================================================================
// Tipos para WhatsApp Cloud API
// ============================================================================

export interface WhatsAppMessageResponse {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string }>;
}

export interface WhatsAppError {
  error: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
}

export interface WhatsAppTemplateComponent {
  type: 'header' | 'body' | 'button';
  sub_type?: 'quick_reply' | 'url';
  index?: number;
  parameters: WhatsAppParameter[];
}

export interface WhatsAppParameter {
  type: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
  text?: string;
  currency?: { fallback_value: string; code: string; amount_1000: number };
  date_time?: { fallback_value: string };
  image?: { link: string };
  document?: { link: string; filename?: string };
  video?: { link: string };
}

export interface SendMessageOptions {
  /** Número de teléfono destino (con código de país, ej: 5491155551234) */
  to: string;
  /** Mensaje de texto */
  text?: string;
  /** Template pre-aprobado */
  template?: {
    name: string;
    language: { code: string };
    components?: WhatsAppTemplateComponent[];
  };
  /** Documento adjunto */
  document?: {
    link: string;
    filename?: string;
    caption?: string;
  };
  /** Imagen adjunta */
  image?: {
    link: string;
    caption?: string;
  };
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ============================================================================
// Templates predefinidos para VecinoSimple
// ============================================================================

export const WHATSAPP_TEMPLATES = {
  /** Alerta de emergencia */
  ALERTA_EMERGENCIA: 'alerta_emergencia',
  /** Recordatorio de vencimiento */
  RECORDATORIO_VENCIMIENTO: 'recordatorio_vencimiento',
  /** Confirmación de pago */
  CONFIRMACION_PAGO: 'confirmacion_pago',
  /** Código de verificación */
  CODIGO_VERIFICACION: 'codigo_verificacion',
  /** Invitación a plataforma */
  INVITACION_PLATAFORMA: 'invitacion_plataforma',
  /** Nuevo comunicado */
  NUEVO_COMUNICADO: 'nuevo_comunicado',
  /** Actualización de reclamo */
  ACTUALIZACION_RECLAMO: 'actualizacion_reclamo',
  /** Asamblea programada */
  CONVOCATORIA_ASAMBLEA: 'convocatoria_asamblea',
};

/**
 * Servicio para envío de mensajes via WhatsApp Business API
 * 
 * Documentación: https://developers.facebook.com/docs/whatsapp/cloud-api
 */
@Injectable()
export class WhatsAppService implements OnModuleInit {
  private readonly logger = new Logger(WhatsAppService.name);
  private isEnabled = false;
  private phoneNumberId: string | null = null;
  private accessToken: string | null = null;
  private apiVersion = 'v18.0';
  private baseUrl = 'https://graph.facebook.com';

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.initialize();
  }

  /**
   * Inicializa la configuración de WhatsApp Business API
   */
  private initialize(): void {
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || null;
    this.accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN') || null;
    const apiVersion = this.configService.get<string>('WHATSAPP_API_VERSION');
    
    if (apiVersion) {
      this.apiVersion = apiVersion;
    }

    if (!this.phoneNumberId || !this.accessToken) {
      this.logger.warn(
        'WhatsApp credentials not configured. WhatsApp messaging disabled. ' +
        'Set WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN.',
      );
      return;
    }

    this.isEnabled = true;
    this.logger.log('✅ WhatsApp Business API initialized successfully');
  }

  /**
   * Verifica si el servicio está habilitado
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Envía un mensaje de texto simple
   */
  async sendText(to: string, text: string): Promise<SendResult> {
    return this.sendMessage({ to, text });
  }

  /**
   * Envía un template pre-aprobado
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'es_AR',
    components?: WhatsAppTemplateComponent[],
  ): Promise<SendResult> {
    return this.sendMessage({
      to,
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
  }

  /**
   * Envía un documento
   */
  async sendDocument(
    to: string,
    documentUrl: string,
    filename?: string,
    caption?: string,
  ): Promise<SendResult> {
    return this.sendMessage({
      to,
      document: {
        link: documentUrl,
        filename,
        caption,
      },
    });
  }

  /**
   * Envía una imagen
   */
  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string,
  ): Promise<SendResult> {
    return this.sendMessage({
      to,
      image: {
        link: imageUrl,
        caption,
      },
    });
  }

  /**
   * Método principal para enviar mensajes
   */
  async sendMessage(options: SendMessageOptions): Promise<SendResult> {
    if (!this.isEnabled) {
      this.logger.debug('WhatsApp messaging disabled, skipping send');
      return { success: false, error: 'WhatsApp not configured' };
    }

    // Normalizar número de teléfono (eliminar espacios, guiones, etc.)
    const normalizedPhone = this.normalizePhoneNumber(options.to);
    if (!normalizedPhone) {
      return { success: false, error: 'Invalid phone number format' };
    }

    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.phoneNumberId}/messages`;
      const body = this.buildMessageBody(normalizedPhone, options);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json() as WhatsAppMessageResponse | WhatsAppError;

      if (!response.ok) {
        const error = data as WhatsAppError;
        const errorMessage = error.error?.message || 'Unknown error';
        this.logger.error(`WhatsApp API error: ${errorMessage}`);
        return { success: false, error: errorMessage };
      }

      const result = data as WhatsAppMessageResponse;
      const messageId = result.messages?.[0]?.id;
      
      this.logger.debug(`WhatsApp message sent: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to send WhatsApp message: ${message}`);
      return { success: false, error: message };
    }
  }

  /**
   * Envía un mensaje a múltiples destinatarios
   */
  async sendBulk(
    phoneNumbers: string[],
    options: Omit<SendMessageOptions, 'to'>,
  ): Promise<{ success: number; failed: number; results: SendResult[] }> {
    const results: SendResult[] = [];
    let success = 0;
    let failed = 0;

    // WhatsApp tiene rate limits, enviamos secuencialmente con delay
    for (const phone of phoneNumbers) {
      const result = await this.sendMessage({ ...options, to: phone });
      results.push(result);
      
      if (result.success) {
        success++;
      } else {
        failed++;
      }

      // Delay de 100ms entre mensajes para evitar rate limiting
      await this.delay(100);
    }

    return { success, failed, results };
  }

  // ============================================================================
  // Métodos de conveniencia para casos de uso comunes
  // ============================================================================

  /**
   * Envía alerta de emergencia
   */
  async sendEmergencyAlert(
    to: string,
    tipoEmergencia: string,
    mensaje: string,
    consorcio: string,
  ): Promise<SendResult> {
    return this.sendTemplate(to, WHATSAPP_TEMPLATES.ALERTA_EMERGENCIA, 'es_AR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: tipoEmergencia },
          { type: 'text', text: consorcio },
          { type: 'text', text: mensaje },
        ],
      },
    ]);
  }

  /**
   * Envía recordatorio de vencimiento
   */
  async sendDueReminder(
    to: string,
    monto: string,
    fechaVencimiento: string,
    diasRestantes: number,
  ): Promise<SendResult> {
    return this.sendTemplate(to, WHATSAPP_TEMPLATES.RECORDATORIO_VENCIMIENTO, 'es_AR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: monto },
          { type: 'text', text: fechaVencimiento },
          { type: 'text', text: String(diasRestantes) },
        ],
      },
    ]);
  }

  /**
   * Envía confirmación de pago
   */
  async sendPaymentConfirmation(
    to: string,
    monto: string,
    periodo: string,
    fechaPago: string,
    comprobante?: string,
  ): Promise<SendResult> {
    // Primero envía el template de confirmación
    const result = await this.sendTemplate(to, WHATSAPP_TEMPLATES.CONFIRMACION_PAGO, 'es_AR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: monto },
          { type: 'text', text: periodo },
          { type: 'text', text: fechaPago },
        ],
      },
    ]);

    // Si hay comprobante PDF, lo envía como documento
    if (result.success && comprobante) {
      await this.delay(500);
      await this.sendDocument(to, comprobante, `Comprobante_${periodo}.pdf`);
    }

    return result;
  }

  /**
   * Envía código de verificación
   */
  async sendVerificationCode(to: string, code: string): Promise<SendResult> {
    return this.sendTemplate(to, WHATSAPP_TEMPLATES.CODIGO_VERIFICACION, 'es_AR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: code },
        ],
      },
    ]);
  }

  /**
   * Envía invitación a la plataforma
   */
  async sendPlatformInvitation(
    to: string,
    nombreUsuario: string,
    consorcio: string,
    codigoInvitacion: string,
    link: string,
  ): Promise<SendResult> {
    return this.sendTemplate(to, WHATSAPP_TEMPLATES.INVITACION_PLATAFORMA, 'es_AR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: nombreUsuario },
          { type: 'text', text: consorcio },
          { type: 'text', text: codigoInvitacion },
        ],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: 0,
        parameters: [
          { type: 'text', text: link },
        ],
      },
    ]);
  }

  /**
   * Envía notificación de nuevo comunicado
   */
  async sendComunicadoNotification(
    to: string,
    tituloComunicado: string,
    consorcio: string,
  ): Promise<SendResult> {
    return this.sendTemplate(to, WHATSAPP_TEMPLATES.NUEVO_COMUNICADO, 'es_AR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: consorcio },
          { type: 'text', text: tituloComunicado },
        ],
      },
    ]);
  }

  /**
   * Envía convocatoria de asamblea
   */
  async sendAsambleaConvocatoria(
    to: string,
    consorcio: string,
    fecha: string,
    hora: string,
    lugar: string,
  ): Promise<SendResult> {
    return this.sendTemplate(to, WHATSAPP_TEMPLATES.CONVOCATORIA_ASAMBLEA, 'es_AR', [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: consorcio },
          { type: 'text', text: fecha },
          { type: 'text', text: hora },
          { type: 'text', text: lugar },
        ],
      },
    ]);
  }

  // ============================================================================
  // Helpers privados
  // ============================================================================

  /**
   * Construye el cuerpo del mensaje según el tipo
   */
  private buildMessageBody(
    to: string,
    options: SendMessageOptions,
  ): Record<string, unknown> {
    const base = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
    };

    // Mensaje de texto
    if (options.text) {
      return {
        ...base,
        type: 'text',
        text: {
          preview_url: true,
          body: options.text,
        },
      };
    }

    // Template
    if (options.template) {
      return {
        ...base,
        type: 'template',
        template: options.template,
      };
    }

    // Documento
    if (options.document) {
      return {
        ...base,
        type: 'document',
        document: options.document,
      };
    }

    // Imagen
    if (options.image) {
      return {
        ...base,
        type: 'image',
        image: options.image,
      };
    }

    throw new Error('Invalid message options: must provide text, template, document, or image');
  }

  /**
   * Normaliza número de teléfono al formato WhatsApp
   * Acepta: +54 9 11 5555-1234, 54911555551234, 11 5555-1234
   * Retorna: 5491155551234
   */
  private normalizePhoneNumber(phone: string): string | null {
    // Eliminar todo excepto dígitos
    const digits = phone.replace(/\D/g, '');

    // Si está vacío, inválido
    if (digits.length < 10) {
      return null;
    }

    // Si ya tiene código de país Argentina (54)
    if (digits.startsWith('54')) {
      // Si tiene el 9 de celular, está correcto
      if (digits.startsWith('549')) {
        return digits;
      }
      // Si no tiene el 9, agregarlo después del 54
      return '549' + digits.substring(2);
    }

    // Si empieza con 9 (código de celular sin 54)
    if (digits.startsWith('9')) {
      return '54' + digits;
    }

    // Si es número local argentino (empieza con código de área)
    // Asumimos que necesita 54 + 9 + número
    return '549' + digits;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ============================================================================
  // Webhook handling (para mensajes entrantes)
  // ============================================================================

  /**
   * Verifica el token de webhook (GET request de Meta)
   */
  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');
    
    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified');
      return challenge;
    }
    
    this.logger.warn('WhatsApp webhook verification failed');
    return null;
  }

  /**
   * Procesa webhook de mensaje entrante
   * TODO: Implementar bot de consulta de saldo
   */
  async processIncomingMessage(payload: unknown): Promise<void> {
    this.logger.debug('Incoming WhatsApp message:', payload);
    
    // TODO: Parsear payload y extraer mensaje
    // TODO: Detectar intención (consulta de saldo, etc.)
    // TODO: Responder automáticamente
  }
}
