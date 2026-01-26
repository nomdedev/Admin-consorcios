import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PushService } from './push.service';

/**
 * Módulo de Push Notifications usando Firebase Cloud Messaging (FCM)
 * 
 * Proporciona:
 * - Envío de notificaciones push a dispositivos individuales
 * - Envío masivo a topics/grupos
 * - Gestión de tokens de dispositivos
 * - Soporte para notificaciones con datos personalizados
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
