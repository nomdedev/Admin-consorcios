import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';

import type { EmailOptions } from './email.service';
import { EmailService } from './email.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailService: EmailService) {}

  @Process('send')
  async handleSend(job: Job<EmailOptions>) {
    this.logger.debug(`Procesando email job ${job.id}`);
    return this.emailService.sendDirect(job.data);
  }
}
