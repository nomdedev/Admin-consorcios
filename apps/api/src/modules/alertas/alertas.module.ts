import { Module } from '@nestjs/common';
import { AlertasController } from './alertas.controller';
import { AlertasService } from './alertas.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [AlertasController],
  providers: [AlertasService, PrismaService],
  exports: [AlertasService],
})
export class AlertasModule {}
