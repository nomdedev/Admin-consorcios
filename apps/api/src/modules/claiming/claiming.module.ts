import { Module } from '@nestjs/common';
import { ClaimingController } from './claiming.controller';
import { ClaimingService } from './claiming.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [ClaimingController],
  providers: [ClaimingService, PrismaService],
  exports: [ClaimingService],
})
export class ClaimingModule {}
