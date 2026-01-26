import { Injectable, Logger } from '@nestjs/common';
import { PdfService } from './pdf.service';

export interface ReciboPagoData {
  // Consorcio
  consorcio: {
    nombre: string;
    direccion: string;
    cuit?: string;
  };
  // Pagador
  pagador: {
    nombre: string;
    unidad: string;
    dni?: string;
  };
  // Pago
  numeroRecibo: string;
  fecha: Date;
  monto: number;
  metodoPago: string;
  referencia?: string;
  // Períodos abonados
  periodos: string[];
  // Desglose opcional
  desglose?: Array<{
    concepto: string;
    monto: number;
  }>;
}

/**
 * Servicio para generar recibos de pago en PDF
 */
@Injectable()
export class ReciboPdfService {
  private readonly logger = new Logger(ReciboPdfService.name);

  constructor(private readonly pdfService: PdfService) {}

  /**
   * Genera el PDF del recibo de pago
   */
  async generateRecibo(data: ReciboPagoData): Promise<Buffer> {
    const doc = this.pdfService.createDocument({
      size: 'A4',
      info: {
        title: `Recibo ${data.numeroRecibo}`,
        subject: `Recibo de pago - ${data.pagador.nombre}`,
      },
    });

    // Header
    this.pdfService.drawHeader(doc, {
      title: 'Recibo de Pago',
      subtitle: `N° ${data.numeroRecibo}`,
      consorcio: data.consorcio.nombre,
      direccion: data.consorcio.direccion,
    });

    // Información del recibo
    this.drawReciboInfo(doc, data);

    this.pdfService.drawSeparator(doc);

    // Desglose si existe
    if (data.desglose && data.desglose.length > 0) {
      this.drawDesglose(doc, data.desglose);
    }

    // Períodos abonados
    this.drawPeriodos(doc, data.periodos);

    // Total y estado
    this.drawTotal(doc, data);

    // Firmas
    this.drawFirmas(doc);

    // Footer
    this.pdfService.drawFooter(doc, { pageNumber: 1, showDate: true });

    return this.pdfService.toBuffer(doc);
  }

  // === Helpers privados ===

  private drawReciboInfo(doc: PDFKit.PDFDocument, data: ReciboPagoData): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const col1X = doc.page.margins.left;
    const col2X = doc.page.margins.left + pageWidth / 2;
    const startY = doc.y;

    // Columna izquierda - Datos del pagador
    doc
      .fontSize(11)
      .fillColor(this.pdfService.colors.textLight)
      .text('RECIBIMOS DE:', col1X, startY);

    doc
      .fontSize(14)
      .fillColor(this.pdfService.colors.text)
      .font('Helvetica-Bold')
      .text(data.pagador.nombre, col1X, startY + 18);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor(this.pdfService.colors.textLight)
      .text(`Unidad: ${data.pagador.unidad}`, col1X, startY + 38);

    if (data.pagador.dni) {
      doc.text(`DNI: ${data.pagador.dni}`, col1X, startY + 52);
    }

    // Columna derecha - Datos del pago
    doc
      .fontSize(11)
      .fillColor(this.pdfService.colors.textLight)
      .text('FECHA:', col2X, startY);

    doc
      .fontSize(12)
      .fillColor(this.pdfService.colors.text)
      .text(this.pdfService.formatDate(data.fecha), col2X + 50, startY);

    doc
      .fontSize(11)
      .fillColor(this.pdfService.colors.textLight)
      .text('MÉTODO:', col2X, startY + 20);

    doc
      .fontSize(12)
      .fillColor(this.pdfService.colors.text)
      .text(this.formatMetodoPago(data.metodoPago), col2X + 50, startY + 20);

    if (data.referencia) {
      doc
        .fontSize(11)
        .fillColor(this.pdfService.colors.textLight)
        .text('REF:', col2X, startY + 40);

      doc
        .fontSize(10)
        .fillColor(this.pdfService.colors.text)
        .text(data.referencia, col2X + 50, startY + 40, { width: pageWidth / 2 - 60 });
    }

    doc.y = startY + 80;
  }

  private drawDesglose(doc: PDFKit.PDFDocument, desglose: Array<{ concepto: string; monto: number }>): void {
    doc
      .fontSize(12)
      .fillColor(this.pdfService.colors.text)
      .font('Helvetica-Bold')
      .text('Detalle del Pago', doc.page.margins.left, doc.y);
    doc.y += 15;
    doc.font('Helvetica');

    this.pdfService.drawTable(doc, {
      columns: [
        { header: 'Concepto', field: 'concepto', width: 400 },
        { header: 'Monto', field: 'monto', width: 145, align: 'right', format: (v) => this.pdfService.formatCurrency(Number(v)) },
      ],
      data: desglose,
      fontSize: 10,
    });
  }

  private drawPeriodos(doc: PDFKit.PDFDocument, periodos: string[]): void {
    doc
      .fontSize(12)
      .fillColor(this.pdfService.colors.text)
      .font('Helvetica-Bold')
      .text('Períodos Abonados', doc.page.margins.left, doc.y + 10);
    doc.y += 25;
    doc.font('Helvetica');

    const periodosFormateados = periodos.map((p) => this.formatPeriodo(p));
    
    // Dibujar como badges
    let xOffset = doc.page.margins.left;
    const maxX = doc.page.width - doc.page.margins.right;

    for (const periodo of periodosFormateados) {
      const badgeWidth = doc.widthOfString(periodo) + 20;

      if (xOffset + badgeWidth > maxX) {
        xOffset = doc.page.margins.left;
        doc.y += 28;
      }

      doc
        .roundedRect(xOffset, doc.y, badgeWidth, 22, 4)
        .fill(this.pdfService.colors.primary);

      doc
        .fontSize(10)
        .fillColor(this.pdfService.colors.white)
        .text(periodo, xOffset + 10, doc.y + 6);

      xOffset += badgeWidth + 8;
    }

    doc.y += 40;
  }

  private drawTotal(doc: PDFKit.PDFDocument, data: ReciboPagoData): void {
    // Box del total
    const boxWidth = 280;
    const boxX = doc.page.width - doc.page.margins.right - boxWidth;
    const boxY = doc.y;
    const boxHeight = 60;

    doc
      .rect(boxX, boxY, boxWidth, boxHeight)
      .fill('#E8F5E9');
    doc
      .rect(boxX, boxY, boxWidth, boxHeight)
      .strokeColor(this.pdfService.colors.primary)
      .lineWidth(2)
      .stroke();

    doc
      .fontSize(12)
      .fillColor(this.pdfService.colors.textLight)
      .text('IMPORTE TOTAL:', boxX + 15, boxY + 15);

    doc
      .fontSize(24)
      .fillColor(this.pdfService.colors.primary)
      .font('Helvetica-Bold')
      .text(this.pdfService.formatCurrency(data.monto), boxX + 15, boxY + 32);

    doc.font('Helvetica');

    // Estado de pago
    const estadoX = doc.page.margins.left;
    doc
      .fontSize(14)
      .fillColor(this.pdfService.colors.success)
      .font('Helvetica-Bold')
      .text('✓ PAGO CONFIRMADO', estadoX, boxY + 20);

    doc.font('Helvetica');
    doc.y = boxY + boxHeight + 20;
  }

  private drawFirmas(doc: PDFKit.PDFDocument): void {
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const firmaWidth = 180;
    const y = doc.page.height - doc.page.margins.bottom - 100;

    // Línea para firma del administrador
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + firmaWidth, y)
      .strokeColor(this.pdfService.colors.border)
      .stroke();

    doc
      .fontSize(9)
      .fillColor(this.pdfService.colors.textLight)
      .text('Administración', doc.page.margins.left, y + 5, {
        width: firmaWidth,
        align: 'center',
      });

    // Sello
    const selloX = doc.page.margins.left + pageWidth - firmaWidth;
    
    doc
      .rect(selloX, y - 40, firmaWidth, 50)
      .strokeColor(this.pdfService.colors.primary)
      .dash(3, { space: 3 })
      .stroke();

    doc
      .undash()
      .fontSize(10)
      .fillColor(this.pdfService.colors.primary)
      .text('VÁLIDO COMO COMPROBANTE', selloX, y - 30, {
        width: firmaWidth,
        align: 'center',
      });

    doc
      .fontSize(8)
      .fillColor(this.pdfService.colors.textLight)
      .text('Documento digital con validez fiscal', selloX, y - 15, {
        width: firmaWidth,
        align: 'center',
      });
  }

  private formatMetodoPago(metodo: string): string {
    const metodos: Record<string, string> = {
      'MERCADO_PAGO': 'Mercado Pago',
      'TRANSFERENCIA': 'Transferencia Bancaria',
      'EFECTIVO': 'Efectivo',
      'DEBITO_AUTOMATICO': 'Débito Automático',
      'SIRO': 'Red SIRO',
    };
    return metodos[metodo] || metodo;
  }

  private formatPeriodo(periodo: string): string {
    const [year, month] = periodo.split('-');
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
    ];
    const monthIndex = parseInt(month || '1', 10) - 1;
    return `${meses[monthIndex] ?? 'Mes'} ${year ?? ''}`;
  }
}
