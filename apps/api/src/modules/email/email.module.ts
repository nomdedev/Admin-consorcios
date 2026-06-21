import { BullModule } from '@nestjs/bull';
import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { EmailTemplateService } from './email-template.service';
import { EmailQueueService } from './email-queue.service';
import { EmailProcessor } from './email.processor';

@Global()
@Module({
  imports: [ConfigModule, BullModule.registerQueue({ name: 'email' })],
  providers: [EmailService, EmailTemplateService, EmailQueueService, EmailProcessor],
  exports: [EmailService, EmailTemplateService, EmailQueueService],
})
export class EmailModule {}
