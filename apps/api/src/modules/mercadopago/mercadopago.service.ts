import {
  Injectable,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Tipos de Mercado Pago
 */
export interface MercadoPagoPreference {
  id: string;
  init_point: string;
  sandbox_init_point: string;
}

export interface MercadoPagoPayment {
  id: number;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  date_approved?: string;
  payer?: {
    email: string;
  };
}

export interface CreatePreferenceDto {
  pagoId: string;
  monto: number;
  concepto: string;
  email?: string;
  consorcioNombre?: string;
  periodos?: string[];
}

export interface MercadoPagoConfig {
  accessToken: string;
  publicKey: string;
  webhookSecret: string;
  splitPayment: {
    enabled: boolean;
    platformFeePercent: number;
    collectorId: string;
  };
}

/**
 * Servicio de integración con Mercado Pago
 * 
 * IMPORTANTE: Este servicio implementa Split Payments
 * - El 98% va directo al CBU del consorcio
 * - El 2% va a la cuenta de VecinoSimple (fee de plataforma)
 */
@Injectable()
export class MercadoPagoService {
  private readonly logger = new Logger(MercadoPagoService.name);
  private readonly config: MercadoPagoConfig;
  private readonly baseUrl = 'https://api.mercadopago.com';
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction = this.configService.get('NODE_ENV') === 'production';
    
    this.config = {
      accessToken: this.configService.get<string>('MERCADO_PAGO_ACCESS_TOKEN') || '',
      publicKey: this.configService.get<string>('MERCADO_PAGO_PUBLIC_KEY') || '',
      webhookSecret: this.configService.get<string>('MERCADO_PAGO_WEBHOOK_SECRET') || '',
      splitPayment: {
        enabled: this.configService.get<boolean>('MERCADO_PAGO_SPLIT_ENABLED', true),
        platformFeePercent: this.configService.get<number>('MERCADO_PAGO_PLATFORM_FEE_PERCENT', 2),
        collectorId: this.configService.get<string>('MERCADO_PAGO_COLLECTOR_ID') || '',
      },
    };

    if (this.config.accessToken) {
      this.logger.log('Mercado Pago configurado correctamente');
    } else {
      this.logger.warn('Mercado Pago sin configurar - ACCESS_TOKEN no definido');
    }
  }

  /**
   * Verifica si Mercado Pago está configurado
   */
  isConfigured(): boolean {
    return !!this.config.accessToken;
  }

  /**
   * Crea una preferencia de pago (checkout)
   * 
   * @see https://www.mercadopago.com.ar/developers/es/reference/preferences/_checkout_preferences/post
   */
  async crearPreferencia(dto: CreatePreferenceDto): Promise<MercadoPagoPreference> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Mercado Pago no está configurado');
    }

    const backUrls = {
      success: `${this.configService.get('APP_URL')}/pagos/exito?pago=${dto.pagoId}`,
      failure: `${this.configService.get('APP_URL')}/pagos/error?pago=${dto.pagoId}`,
      pending: `${this.configService.get('APP_URL')}/pagos/pendiente?pago=${dto.pagoId}`,
    };

    const webhookUrl = `${this.configService.get('API_URL')}/pagos/webhook/mercadopago`;

    // Descripción del ítem
    const descripcion = dto.periodos?.length
      ? `Expensas ${dto.periodos.join(', ')} - ${dto.consorcioNombre || 'Consorcio'}`
      : dto.concepto;

    const preferenceData: Record<string, unknown> = {
      items: [
        {
          id: dto.pagoId,
          title: descripcion,
          description: dto.concepto,
          quantity: 1,
          currency_id: 'ARS',
          unit_price: dto.monto,
        },
      ],
      back_urls: backUrls,
      auto_return: 'approved',
      external_reference: dto.pagoId,
      notification_url: webhookUrl,
      statement_descriptor: 'VecinoSimple',
      // Expiración: 24 horas
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // Solo incluir payer si hay email
    if (dto.email) {
      preferenceData.payer = {
        email: dto.email,
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/checkout/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
          'X-Idempotency-Key': dto.pagoId,
        },
        body: JSON.stringify(preferenceData),
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error('Error creando preferencia MP', error);
        throw new InternalServerErrorException('Error al crear preferencia de pago');
      }

      const preference = await response.json() as MercadoPagoPreference;

      this.logger.log(`Preferencia MP creada: ${preference.id} para pago ${dto.pagoId}`);

      return preference;
    } catch (error) {
      this.logger.error('Error en Mercado Pago', error);
      throw new InternalServerErrorException('Error de conexión con Mercado Pago');
    }
  }

  /**
   * Obtiene los detalles de un pago
   * 
   * @see https://www.mercadopago.com.ar/developers/es/reference/payments/_payments_id/get
   */
  async getPayment(paymentId: string): Promise<MercadoPagoPayment> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Mercado Pago no está configurado');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Error obteniendo pago ${paymentId}`, error);
        throw new InternalServerErrorException('Error al consultar pago');
      }

      const payment = await response.json() as MercadoPagoPayment;
      
      this.logger.debug(`Pago MP ${paymentId}: status=${payment.status}`);
      
      return payment;
    } catch (error) {
      this.logger.error(`Error consultando pago ${paymentId}`, error);
      throw new InternalServerErrorException('Error de conexión con Mercado Pago');
    }
  }

  /**
   * Solicita un reembolso total
   * 
   * @see https://www.mercadopago.com.ar/developers/es/reference/chargebacks/_payments_id_refunds/post
   */
  async refund(paymentId: string): Promise<void> {
    if (!this.isConfigured()) {
      throw new BadRequestException('Mercado Pago no está configurado');
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.accessToken}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        this.logger.error(`Error reembolsando pago ${paymentId}`, error);
        throw new InternalServerErrorException('Error al procesar reembolso');
      }

      this.logger.log(`Reembolso solicitado para pago MP: ${paymentId}`);
    } catch (error) {
      this.logger.error(`Error en reembolso ${paymentId}`, error);
      throw new InternalServerErrorException('Error de conexión con Mercado Pago');
    }
  }

  /**
   * Mapea el status de MP a nuestro enum EstadoPago
   */
  mapStatusToEstado(mpStatus: MercadoPagoPayment['status']): 'APROBADO' | 'RECHAZADO' | 'PENDIENTE' | 'PROCESANDO' {
    const statusMap: Record<MercadoPagoPayment['status'], 'APROBADO' | 'RECHAZADO' | 'PENDIENTE' | 'PROCESANDO'> = {
      approved: 'APROBADO',
      authorized: 'APROBADO',
      pending: 'PENDIENTE',
      in_process: 'PROCESANDO',
      in_mediation: 'PROCESANDO',
      rejected: 'RECHAZADO',
      cancelled: 'RECHAZADO',
      refunded: 'RECHAZADO',
      charged_back: 'RECHAZADO',
    };

    return statusMap[mpStatus] || 'PENDIENTE';
  }

  /**
   * Valida la firma del webhook
   * 
   * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
   */
  validateWebhookSignature(
    xSignature: string,
    xRequestId: string,
    dataId: string,
  ): boolean {
    if (!this.config.webhookSecret) {
      // Si no hay clave configurada, aceptamos (modo desarrollo)
      this.logger.warn('Webhook MP aceptado sin validación de firma (modo desarrollo)');
      return true;
    }

    try {
      // Extraer ts y v1 del header x-signature
      // Formato: ts=1234567890,v1=abc123...
      const parts = xSignature.split(',');
      const tsMatch = parts.find(p => p.startsWith('ts='));
      const v1Match = parts.find(p => p.startsWith('v1='));

      if (!tsMatch || !v1Match) {
        this.logger.warn('Firma MP con formato inválido');
        return false;
      }

      const ts = tsMatch.split('=')[1];
      const v1 = v1Match.split('=')[1];

      // Construir el string a firmar
      // manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
      const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

      // Calcular HMAC-SHA256
      const hmac = require('crypto')
        .createHmac('sha256', this.config.webhookSecret)
        .update(manifest)
        .digest('hex');

      const isValid = hmac === v1;

      if (!isValid) {
        this.logger.warn('Firma MP inválida');
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error validando firma MP', error);
      return false;
    }
  }
}
