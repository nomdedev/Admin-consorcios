import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Tipos para Firebase Admin SDK
 * (Evitamos instalar firebase-admin hasta que esté configurado)
 */
interface FirebaseApp {
  messaging(): FirebaseMessaging;
}

interface FirebaseMessaging {
  send(message: Message): Promise<string>;
  sendEachForMulticast(message: MulticastMessage): Promise<BatchResponse>;
  subscribeToTopic(tokens: string[], topic: string): Promise<TopicResponse>;
  unsubscribeFromTopic(tokens: string[], topic: string): Promise<TopicResponse>;
}

interface Message {
  notification?: {
    title?: string;
    body?: string;
    imageUrl?: string;
  };
  data?: Record<string, string>;
  token?: string;
  topic?: string;
  condition?: string;
  android?: AndroidConfig;
  webpush?: WebpushConfig;
  apns?: ApnsConfig;
}

interface MulticastMessage extends Omit<Message, 'token' | 'topic' | 'condition'> {
  tokens: string[];
}

interface BatchResponse {
  successCount: number;
  failureCount: number;
  responses: SendResponse[];
}

interface SendResponse {
  success: boolean;
  messageId?: string;
  error?: { code: string; message: string };
}

interface TopicResponse {
  successCount: number;
  failureCount: number;
  errors: Array<{ index: number; error: { code: string; message: string } }>;
}

interface AndroidConfig {
  priority?: 'high' | 'normal';
  ttl?: number;
  notification?: {
    icon?: string;
    color?: string;
    sound?: string;
    clickAction?: string;
    channelId?: string;
  };
}

interface WebpushConfig {
  headers?: Record<string, string>;
  notification?: {
    icon?: string;
    badge?: string;
    actions?: Array<{ action: string; title: string; icon?: string }>;
  };
  fcmOptions?: {
    link?: string;
  };
}

interface ApnsConfig {
  headers?: Record<string, string>;
  payload?: {
    aps?: {
      badge?: number;
      sound?: string;
      category?: string;
    };
  };
}

// ============================================================================
// DTOs de entrada
// ============================================================================

export interface PushNotificationOptions {
  /** Token del dispositivo destino */
  token?: string;
  /** Lista de tokens para envío múltiple */
  tokens?: string[];
  /** Topic para envío a suscriptores */
  topic?: string;
  /** Título de la notificación */
  title: string;
  /** Cuerpo del mensaje */
  body: string;
  /** URL de imagen (opcional) */
  imageUrl?: string;
  /** Datos adicionales (key-value strings) */
  data?: Record<string, string>;
  /** URL a abrir al hacer click */
  clickAction?: string;
  /** Prioridad del mensaje */
  priority?: 'high' | 'normal';
  /** Tiempo de vida en segundos */
  ttlSeconds?: number;
  /** Badge number para iOS */
  badge?: number;
  /** Sonido personalizado */
  sound?: string;
  /** Canal de Android */
  androidChannelId?: string;
}

export interface PushResult {
  success: boolean;
  messageId?: string;
  error?: string;
  successCount?: number;
  failureCount?: number;
}

// ============================================================================
// Topics predefinidos para la aplicación
// ============================================================================

export const PUSH_TOPICS = {
  /** Todos los usuarios de un consorcio */
  consorcio: (id: string) => `consorcio_${id}`,
  /** Todos los propietarios de un consorcio */
  propietarios: (id: string) => `propietarios_${id}`,
  /** Todos los inquilinos de un consorcio */
  inquilinos: (id: string) => `inquilinos_${id}`,
  /** Staff de un consorcio (encargados) */
  staff: (id: string) => `staff_${id}`,
  /** Administradores de una organización */
  admins: (orgId: string) => `admins_${orgId}`,
  /** Alertas de emergencia (alta prioridad) */
  emergencias: (consorcioId: string) => `emergencias_${consorcioId}`,
  /** Notificaciones de pagos */
  pagos: (consorcioId: string) => `pagos_${consorcioId}`,
  /** Novedades y comunicados */
  comunicados: (consorcioId: string) => `comunicados_${consorcioId}`,
};

/**
 * Servicio para envío de notificaciones push via Firebase Cloud Messaging
 */
@Injectable()
export class PushService implements OnModuleInit {
  private readonly logger = new Logger(PushService.name);
  private firebaseApp: FirebaseApp | null = null;
  private isEnabled = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeFirebase();
  }

  /**
   * Inicializa Firebase Admin SDK
   */
  private async initializeFirebase(): Promise<void> {
    const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
    const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
    const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

    if (!projectId || !privateKey || !clientEmail) {
      this.logger.warn(
        'Firebase credentials not configured. Push notifications disabled. ' +
        'Set FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, and FIREBASE_CLIENT_EMAIL.',
      );
      return;
    }

    try {
      // Importación dinámica para evitar errores si firebase-admin no está instalado
      // NOTE: firebase-admin es dependencia opcional. El tipo real es complejo (namespace + default export).
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const admin = await import('firebase-admin').catch(() => null) as typeof import('firebase-admin') | null;
      
      if (!admin) {
        this.logger.warn(
          'firebase-admin package not installed. Run: pnpm add firebase-admin',
        );
        return;
      }

      // Verificar si ya hay una app inicializada
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.apps[0] as unknown as FirebaseApp;
      } else {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: privateKey.replaceAll(String.raw`\n`, '\n'),
            clientEmail,
          }),
        }) as unknown as FirebaseApp;
      }

      this.isEnabled = true;
      this.logger.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Failed to initialize Firebase: ${message}`);
    }
  }

  /**
   * Verifica si el servicio está habilitado
   */
  get enabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Envía una notificación push a un dispositivo específico
   */
  async sendToDevice(options: PushNotificationOptions): Promise<PushResult> {
    if (!this.isEnabled || !this.firebaseApp) {
      this.logger.debug('Push notifications disabled, skipping send');
      return { success: false, error: 'Push notifications not configured' };
    }

    if (!options.token) {
      return { success: false, error: 'Device token is required' };
    }

    try {
      const message = this.buildMessage(options);
      message.token = options.token;

      const messageId = await this.firebaseApp.messaging().send(message);
      
      this.logger.debug(`Push sent successfully: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      const errorMessage = this.handleFcmError(error);
      this.logger.error(`Failed to send push: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Envía notificaciones a múltiples dispositivos
   */
  async sendToDevices(options: PushNotificationOptions): Promise<PushResult> {
    if (!this.isEnabled || !this.firebaseApp) {
      return { success: false, error: 'Push notifications not configured' };
    }

    if (!options.tokens || options.tokens.length === 0) {
      return { success: false, error: 'At least one device token is required' };
    }

    // FCM tiene límite de 500 tokens por request
    const MAX_TOKENS_PER_BATCH = 500;
    const batches = this.chunkArray(options.tokens, MAX_TOKENS_PER_BATCH);
    
    let totalSuccess = 0;
    let totalFailure = 0;

    for (const tokenBatch of batches) {
      try {
        const message = this.buildMessage(options) as MulticastMessage;
        message.tokens = tokenBatch;

        const response = await this.firebaseApp.messaging().sendEachForMulticast(message);
        
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        // Log tokens inválidos para limpieza
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const invalidCodes = [
              'messaging/invalid-registration-token',
              'messaging/registration-token-not-registered',
            ];
            if (invalidCodes.includes(resp.error.code)) {
              this.logger.debug(`Invalid token detected: ${tokenBatch[idx]?.substring(0, 20)}...`);
              // NOTE: Emitir evento para limpiar token de la BD
            }
          }
        });
      } catch (error) {
        const errorMessage = this.handleFcmError(error);
        this.logger.error(`Batch send failed: ${errorMessage}`);
        totalFailure += tokenBatch.length;
      }
    }

    return {
      success: totalSuccess > 0,
      successCount: totalSuccess,
      failureCount: totalFailure,
    };
  }

  /**
   * Envía notificación a un topic (todos los suscriptores)
   */
  async sendToTopic(options: PushNotificationOptions): Promise<PushResult> {
    if (!this.isEnabled || !this.firebaseApp) {
      return { success: false, error: 'Push notifications not configured' };
    }

    if (!options.topic) {
      return { success: false, error: 'Topic is required' };
    }

    try {
      const message = this.buildMessage(options);
      message.topic = options.topic;

      const messageId = await this.firebaseApp.messaging().send(message);
      
      this.logger.debug(`Push sent to topic ${options.topic}: ${messageId}`);
      return { success: true, messageId };
    } catch (error) {
      const errorMessage = this.handleFcmError(error);
      this.logger.error(`Failed to send to topic: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Suscribe dispositivos a un topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<PushResult> {
    if (!this.isEnabled || !this.firebaseApp) {
      return { success: false, error: 'Push notifications not configured' };
    }

    if (tokens.length === 0) {
      return { success: false, error: 'At least one token is required' };
    }

    try {
      const response = await this.firebaseApp.messaging().subscribeToTopic(tokens, topic);
      
      this.logger.debug(
        `Subscribed ${response.successCount}/${tokens.length} devices to topic: ${topic}`,
      );

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      const errorMessage = this.handleFcmError(error);
      this.logger.error(`Failed to subscribe to topic: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Desuscribe dispositivos de un topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<PushResult> {
    if (!this.isEnabled || !this.firebaseApp) {
      return { success: false, error: 'Push notifications not configured' };
    }

    if (tokens.length === 0) {
      return { success: false, error: 'At least one token is required' };
    }

    try {
      const response = await this.firebaseApp.messaging().unsubscribeFromTopic(tokens, topic);
      
      this.logger.debug(
        `Unsubscribed ${response.successCount}/${tokens.length} devices from topic: ${topic}`,
      );

      return {
        success: response.successCount > 0,
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error) {
      const errorMessage = this.handleFcmError(error);
      this.logger.error(`Failed to unsubscribe from topic: ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  // ============================================================================
  // Métodos de conveniencia para casos de uso comunes
  // ============================================================================

  /**
   * Envía alerta de emergencia (alta prioridad)
   */
  async sendEmergencyAlert(
    consorcioId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<PushResult> {
    return this.sendToTopic({
      topic: PUSH_TOPICS.emergencias(consorcioId),
      title: `🚨 ${title}`,
      body,
      data: {
        type: 'emergency',
        consorcioId,
        ...data,
      },
      priority: 'high',
      sound: 'emergency',
      androidChannelId: 'emergencias',
    });
  }

  /**
   * Envía notificación de nuevo pago
   */
  async sendPaymentNotification(
    token: string,
    monto: string,
    periodo: string,
    data?: Record<string, string>,
  ): Promise<PushResult> {
    return this.sendToDevice({
      token,
      title: '✅ Pago Recibido',
      body: `Tu pago de ${monto} para ${periodo} fue procesado correctamente.`,
      data: {
        type: 'payment_received',
        ...data,
      },
      priority: 'normal',
    });
  }

  /**
   * Envía recordatorio de vencimiento
   */
  async sendDueReminder(
    token: string,
    diasRestantes: number,
    monto: string,
    data?: Record<string, string>,
  ): Promise<PushResult> {
    const titulo = this.getTituloVencimiento(diasRestantes);
    const estadoVencimiento = this.getEstadoVencimiento(diasRestantes);

    return this.sendToDevice({
      token,
      title: titulo,
      body: `Tu expensa de ${monto} ${estadoVencimiento}. Evitá intereses pagando a tiempo.`,
      data: {
        type: 'due_reminder',
        daysRemaining: String(diasRestantes),
        ...data,
      },
      priority: diasRestantes <= 0 ? 'high' : 'normal',
    });
  }

  /**
   * Envía notificación de nuevo comunicado
   */
  async sendComunicadoNotification(
    consorcioId: string,
    titulo: string,
    esImportante: boolean,
    data?: Record<string, string>,
  ): Promise<PushResult> {
    return this.sendToTopic({
      topic: PUSH_TOPICS.comunicados(consorcioId),
      title: esImportante ? `📢 ${titulo}` : titulo,
      body: 'Hay un nuevo comunicado del consorcio. Tocá para ver.',
      data: {
        type: 'comunicado',
        consorcioId,
        importante: String(esImportante),
        ...data,
      },
      priority: esImportante ? 'high' : 'normal',
    });
  }

  /**
   * Envía notificación de actualización de ticket
   */
  async sendTicketUpdate(
    token: string,
    ticketId: string,
    nuevoEstado: string,
    data?: Record<string, string>,
  ): Promise<PushResult> {
    return this.sendToDevice({
      token,
      title: '🔧 Actualización de Reclamo',
      body: `Tu reclamo cambió a estado: ${nuevoEstado}`,
      data: {
        type: 'ticket_update',
        ticketId,
        status: nuevoEstado,
        ...data,
      },
      priority: 'normal',
    });
  }

  // ============================================================================
  // Helpers privados
  // ============================================================================

  /**
   * Construye el mensaje FCM con configuración multiplataforma
   */
  private buildMessage(options: PushNotificationOptions): Message {
    const message: Message = {
      notification: {
        title: options.title,
        body: options.body,
        imageUrl: options.imageUrl,
      },
      data: options.data,
      android: {
        priority: options.priority || 'high',
        ttl: (options.ttlSeconds || 86400) * 1000, // Default 24h
        notification: {
          icon: 'ic_notification',
          color: '#4CAF50', // Verde VecinoSimple
          sound: options.sound || 'default',
          clickAction: options.clickAction,
          channelId: options.androidChannelId || 'default',
        },
      },
      webpush: {
        headers: {
          TTL: String(options.ttlSeconds || 86400),
          Urgency: options.priority === 'high' ? 'high' : 'normal',
        },
        notification: {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
        },
        fcmOptions: {
          link: options.clickAction,
        },
      },
      apns: {
        headers: {
          'apns-priority': options.priority === 'high' ? '10' : '5',
          'apns-expiration': String(
            Math.floor(Date.now() / 1000) + (options.ttlSeconds || 86400),
          ),
        },
        payload: {
          aps: {
            badge: options.badge,
            sound: options.sound || 'default',
          },
        },
      },
    };

    return message;
  }

  /**
   * Maneja errores de FCM y retorna mensaje legible
   */
  private handleFcmError(error: unknown): string {
    if (error instanceof Error) {
      // Errores comunes de FCM
      const errorMap: Record<string, string> = {
        'messaging/invalid-registration-token': 'Token de dispositivo inválido',
        'messaging/registration-token-not-registered': 'Dispositivo no registrado',
        'messaging/message-rate-exceeded': 'Límite de mensajes excedido',
        'messaging/topics-message-rate-exceeded': 'Límite de mensajes a topic excedido',
        'messaging/device-message-rate-exceeded': 'Límite de mensajes al dispositivo excedido',
        'messaging/internal-error': 'Error interno de FCM',
        'messaging/server-unavailable': 'Servidor FCM no disponible',
        'messaging/invalid-argument': 'Argumento inválido en el mensaje',
      };

      const code = (error as { code?: string }).code;
      if (code && errorMap[code]) {
        return errorMap[code];
      }

      return error.message;
    }

    return 'Error desconocido al enviar push';
  }

  /**
   * Obtiene el título de la notificación según los días restantes
   */
  private getTituloVencimiento(diasRestantes: number): string {
    if (diasRestantes === 0) return '⚠️ Vencimiento Hoy';
    if (diasRestantes < 0) return '🔴 Expensa Vencida';
    return `📅 Vence en ${diasRestantes} días`;
  }

  /**
   * Obtiene el texto del estado de vencimiento
   */
  private getEstadoVencimiento(diasRestantes: number): string {
    return diasRestantes <= 0 ? 'ya venció' : 'vence pronto';
  }

  /**
   * Divide un array en chunks de tamaño máximo
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
