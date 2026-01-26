import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppTemplateService } from './whatsapp-template.service';

/**
 * Módulo de WhatsApp Business API
 * 
 * Proporciona:
 * - Envío de mensajes de texto
 * - Envío de templates pre-aprobados
 * - Envío de documentos/imágenes
 * - Webhook para mensajes entrantes
 * - Bot de consulta de saldo
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [WhatsAppService, WhatsAppTemplateService],
  exports: [WhatsAppService, WhatsAppTemplateService],
})
export class WhatsAppModule {}
