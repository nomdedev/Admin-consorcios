import { Module, Global } from '@nestjs/common';
import { AuditService } from './audit.service';
import { DatabaseModule } from '../../database/database.module';

@Global() // Global para que esté disponible en toda la aplicación
@Module({
  imports: [DatabaseModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
