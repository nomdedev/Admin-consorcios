import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import { EmailQueueService } from './email-queue.service';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend | null = null;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly emailQueueService?: EmailQueueService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.fromEmail = this.configService.get<string>('EMAIL_FROM', 'noreply@vecinosimple.com');
    this.fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'VecinoSimple');
    this.isEnabled = !!apiKey && apiKey !== 'test';

    if (this.isEnabled && apiKey) {
      this.resend = new Resend(apiKey);
    }
  }

  onModuleInit() {
    if (this.isEnabled) {
      this.logger.log('✅ Email service initialized with Resend');
    } else {
      this.logger.warn('⚠️ Email service disabled (no RESEND_API_KEY configured)');
    }
  }

  /**
   * Envía un email usando Resend
   */
  async send(options: EmailOptions): Promise<EmailResult> {
    const queueEnabled =
      this.configService.get<string>('QUEUE_EMAIL_ENABLED', 'true') === 'true';

    if (queueEnabled && this.emailQueueService) {
      await this.emailQueueService.enqueue(options);
      return {
        success: true,
        messageId: `queued-${Date.now()}`,
      };
    }

    return this.sendDirect(options);
  }

  /**
   * Envía un email directamente (sin cola)
   */
  async sendDirect(options: EmailOptions): Promise<EmailResult> {
    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // Si el servicio no está habilitado, loguear y retornar
    if (!this.isEnabled || !this.resend) {
      this.logger.debug(`[DEV MODE] Email would be sent to: ${recipients.join(', ')}`);
      this.logger.debug(`Subject: ${options.subject}`);
      return {
        success: true,
        messageId: `dev-${Date.now()}`,
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: `${this.fromName} <${this.fromEmail}>`,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        replyTo: options.replyTo,
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      if (error) {
        this.logger.error(`Failed to send email: ${error.message}`, error);
        return {
          success: false,
          error: error.message,
        };
      }

      this.logger.log(`Email sent successfully to ${recipients.join(', ')} [${data?.id}]`);
      return {
        success: true,
        messageId: data?.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending email: ${errorMessage}`, error);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Envía múltiples emails en batch
   */
  async sendBatch(
    emails: Array<EmailOptions & { to: string }>,
  ): Promise<{ total: number; success: number; failed: number }> {
    const results = await Promise.allSettled(
      emails.map((email) => this.send(email)),
    );

    const success = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success,
    ).length;

    return {
      total: emails.length,
      success,
      failed: emails.length - success,
    };
  }

  /**
   * Verifica si el servicio de email está habilitado
   */
  isServiceEnabled(): boolean {
    return this.isEnabled;
  }
}
