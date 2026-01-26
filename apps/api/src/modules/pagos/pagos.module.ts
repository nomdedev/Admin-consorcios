import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosService } from './pagos.service';
import { MercadoPagoModule } from '../mercadopago/mercadopago.module';

@Module({
  imports: [MercadoPagoModule],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
