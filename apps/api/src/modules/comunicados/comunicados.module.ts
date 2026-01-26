import { Module } from '@nestjs/common';
import { ComunicadosService } from './comunicados.service';
import { ComunicadosController } from './comunicados.controller';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [ComunicadosController],
  providers: [ComunicadosService],
  exports: [ComunicadosService],
})
export class ComunicadosModule {}
