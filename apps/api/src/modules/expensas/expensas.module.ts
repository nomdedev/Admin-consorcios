import { Module } from '@nestjs/common';
import { ExpensasController } from './expensas.controller';
import { ExpensasService } from './expensas.service';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';
import { SnapshotsModule } from '../snapshots/snapshots.module';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [
    DatabaseModule,
    AuditModule,
    SnapshotsModule,
    NotificacionesModule,
  ],
  controllers: [ExpensasController],
  providers: [ExpensasService],
  exports: [ExpensasService],
})
export class ExpensasModule {}
