import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MercadoPagoService } from './mercadopago.service';

/**
 * Módulo de Mercado Pago
 * 
 * Provee integración con la API de Mercado Pago para:
 * - Crear preferencias de checkout
 * - Consultar estado de pagos
 * - Procesar reembolsos
 * - Validar webhooks
 * 
 * @example
 * ```typescript
 * // En cualquier servicio que lo necesite
 * constructor(private readonly mpService: MercadoPagoService) {}
 * 
 * async crearPago() {
 *   const pref = await this.mpService.crearPreferencia({
 *     pagoId: 'pago-123',
 *     monto: 15000,
 *     concepto: 'Expensas Enero 2026',
 *     email: 'vecino@ejemplo.com',
 *   });
 *   // pref.init_point -> URL de checkout
 * }
 * ```
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [MercadoPagoService],
  exports: [MercadoPagoService],
})
export class MercadoPagoModule {}
