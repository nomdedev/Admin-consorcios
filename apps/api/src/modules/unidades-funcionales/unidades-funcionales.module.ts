import { Module } from '@nestjs/common';
import { UnidadesFuncionalesController } from './unidades-funcionales.controller';
import { UnidadesFuncionalesService } from './unidades-funcionales.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [UnidadesFuncionalesController],
  providers: [UnidadesFuncionalesService],
  exports: [UnidadesFuncionalesService],
})
export class UnidadesFuncionalesModule {}
