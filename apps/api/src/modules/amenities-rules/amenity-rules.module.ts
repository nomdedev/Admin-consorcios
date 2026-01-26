import { Module } from '@nestjs/common';
import { AmenityRulesController } from './amenity-rules.controller';
import { AmenityRulesService } from './amenity-rules.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [AmenityRulesController],
  providers: [AmenityRulesService],
  exports: [AmenityRulesService],
})
export class AmenityRulesModule {}
