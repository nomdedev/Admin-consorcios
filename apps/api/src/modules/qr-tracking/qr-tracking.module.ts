import { Module } from '@nestjs/common';
import { QRTrackingController } from './qr-tracking.controller';
import { QRTrackingService } from './qr-tracking.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [QRTrackingController],
  providers: [QRTrackingService],
  exports: [QRTrackingService],
})
export class QRTrackingModule {}
