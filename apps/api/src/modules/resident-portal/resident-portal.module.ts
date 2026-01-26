// =============================================================================
// Módulo del Portal de Residentes
// =============================================================================

import { Module } from '@nestjs/common';
import { ResidentPortalController } from './resident-portal.controller';
import { ResidentPortalService } from './resident-portal.service';
import { ExpensasModule } from '../expensas/expensas.module';

@Module({
  imports: [ExpensasModule],
  controllers: [ResidentPortalController],
  providers: [ResidentPortalService],
  exports: [ResidentPortalService],
})
export class ResidentPortalModule {}
