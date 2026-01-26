import { Module } from '@nestjs/common';
import { ConsorciosController } from './consorcios.controller';
import { ConsorciosService } from './consorcios.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ConsorciosController],
  providers: [ConsorciosService],
  exports: [ConsorciosService],
})
export class ConsorciosModule {}
