import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PdfService } from './pdf.service';
import { ExpensaPdfService } from './expensa-pdf.service';
import { ReciboPdfService } from './recibo-pdf.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [PdfService, ExpensaPdfService, ReciboPdfService],
  exports: [PdfService, ExpensaPdfService, ReciboPdfService],
})
export class PdfModule {}
