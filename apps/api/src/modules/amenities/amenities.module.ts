import { Module } from '@nestjs/common';
import { AmenitiesController } from './amenities.controller';
import { AmenitiesService } from './amenities.service';
import { PrismaService } from '../../database/prisma.service';
import { AuditModule } from '../audit/audit.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [AuditModule, NotificacionesModule],
  controllers: [AmenitiesController],
  providers: [AmenitiesService, PrismaService],
  exports: [AmenitiesService],
})
export class AmenitiesModule {}
