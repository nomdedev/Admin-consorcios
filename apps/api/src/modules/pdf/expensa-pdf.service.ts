import { Injectable, Logger } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface ExpensaGasto {
  concepto: string;
  monto: number | Decimal;
  esExtraordinario?: boolean;
  categoria?: string;
}

export interface ExpensaUnidad {
  codigo?: string;
  unidad?: string;
  coeficiente: number | Decimal;
  montoOrdinario?: number | Decimal;
  ordinario?: number | Decimal;
  montoExtraordinario?: number | Decimal;
  extraordinario?: number | Decimal;
  saldoAnterior: number | Decimal;
  intereses: number | Decimal;
  total: number | Decimal;
}

// Interface para expensa individual (usada por generateExpensaIndividual)
export interface ExpensaIndividualData {
  consorcio: {
    nombre: string;
    direccion: string;
    cuit?: string;
    cbu?: string;
    aliasCbu?: string;
  };
  periodo: string;
  unidadFuncional?: string;
  fechaVencimiento: Date;
  fechaSegundoVencimiento?: Date;
  recargoSegundoVencimiento?: number;
  gastosOrdinarios: Array<{ concepto: string; monto: number }>;
  gastosExtraordinarios: Array<{ concepto: string; monto: number }>;
  coeficiente: number;
  saldoAnterior: number;
  intereses: number;
  bonificacion?: number;
  total: number;
  qrCode?: string;
  codigoQR?: string;
}

// Interface para expensa resumen (usada por generateExpensaResumen)
export interface ExpensaResumenData {
  consorcio: {
    nombre: string;
    direccion: string;
    cuit?: string;
  };
  periodo: string;
  fechaVencimiento: Date;
  gastosOrdinarios: Array<{ concepto: string; monto: number }>;
  gastosExtraordinarios: Array<{ concepto: string; monto: number }>;
  detallesPorUF: Array<{
    unidad: string;
    coeficiente: number;
    ordinario: number;
    extraordinario: number;
    saldoAnterior: number;
    intereses: number;
    total: number;
  }>;
  totalRecaudar: number;
}

/**
 * Servicio para generar PDFs de expensas
 */
@Injectable()
export class ExpensaPdfService {
  private readonly logger = new Logger(ExpensaPdfService.name);

  constructor(private readonly pdfService: PdfService) {}

  /**
   * Genera el PDF de una expensa individual (para un propietario)
   */
  async generateExpensaIndividual(data: ExpensaIndividualData): Promise<Buffer> {
    const doc = this.pdfService.createDocument({
      info: {
        title: `Expensa ${data.periodo} - ${data.unidadFuncional || 'General'}`,
        subject: `Liquidación de expensas ${data.periodo}`,
      },
    });

    // Header
    this.pdfService.drawHeader(doc, {
      title: 'Liquidación de Expensas',
      subtitle: `Período: ${this.formatPeriodo(data.periodo)}`,
      consorcio: data.consorcio.nombre,
      direccion: data.consorcio.direccion,
    });

    // Info de la unidad
    if (data.unidadFuncional) {
      this.drawUnidadInfoIndividual(doc, data);
    }

    // Resumen de montos
    this.drawResumenMontosIndividual(doc, data);

    this.pdfService.drawSeparator(doc);

    // Detalle de gastos ordinarios
    if (data.gastosOrdinarios.length > 0) {
      this.drawGastosTableSimple(doc, 'Gastos Ordinarios', data.gastosOrdinarios);
    }

    // Detalle de gastos extraordinarios
    if (data.gastosExtraordinarios.length > 0) {
      doc.y += 10;
      this.drawGastosTableSimple(doc, 'Gastos Extraordinarios', data.gastosExtraordinarios);
    }

    // Info de pago
    this.drawInfoPagoIndividual(doc, data);

    // Footer
    this.pdfService.drawFooter(doc, { pageNumber: 1, showDate: true });

    return this.pdfService.toBuffer(doc);
  }

  /**
   * Genera el PDF resumen de expensas (para el administrador)
   */
  async generateExpensaResumen(data: ExpensaResumenData): Promise<Buffer> {
    const doc = this.pdfService.createDocument({
      info: {
        title: `Resumen Expensa ${data.periodo}`,
        subject: `Resumen de liquidación ${data.periodo}`,
      },
    });

    // Header
    this.pdfService.drawHeader(doc, {
      title: 'Resumen de Liquidación',
      subtitle: `Período: ${this.formatPeriodo(data.periodo)}`,
      consorcio: data.consorcio.nombre,
      direccion: data.consorcio.direccion,
    });

    // Totales de gastos
    const totalOrdinarios = data.gastosOrdinarios.reduce((sum, g) => sum + g.monto, 0);
    const totalExtraordinarios = data.gastosExtraordinarios.reduce((sum, g) => sum + g.monto, 0);

    this.pdfService.drawSummaryBox(doc, {
      title: 'Totales del Consorcio',
      items: [
        {
          label: 'Gastos Ordinarios',
          value: this.pdfService.formatCurrency(totalOrdinarios),
        },
        {
          label: 'Gastos Extraordinarios',
          value: this.pdfService.formatCurrency(totalExtraordinarios),
        },
        {
          label: 'TOTAL GASTOS',
          value: this.pdfService.formatCurrency(totalOrdinarios + totalExtraordinarios),
          highlight: true,
        },
      ],
      width: 280,
      align: 'right',
    });

    this.pdfService.drawSeparator(doc);

    // Tabla de unidades
    doc
      .fontSize(14)
      .fillColor(this.pdfService.colors.text)
      .text('Detalle por Unidad Funcional', doc.page.margins.left, doc.y);
    doc.y += 15;

    // Convertir detallesPorUF a formato compatible con drawTable
    const unidadesData = data.detallesPorUF.map(d => ({
      unidad: d.unidad,
      coeficiente: d.coeficiente,
      ordinario: d.ordinario,
      extraordinario: d.extraordinario,
      saldoAnterior: d.saldoAnterior,
      intereses: d.intereses,
      total: d.total,
    }));

    this.pdfService.drawTable(doc, {
      columns: [
        { header: 'Unidad', field: 'unidad', width: 60, align: 'center' },
        { header: 'Coef.', field: 'coeficiente', width: 50, align: 'right', format: (v) => `${Number(v).toFixed(4)}%` },
        { header: 'Ordinarias', field: 'ordinario', width: 90, align: 'right', format: (v) => this.pdfService.formatCurrency(Number(v)) },
        { header: 'Extraord.', field: 'extraordinario', width: 90, align: 'right', format: (v) => this.pdfService.formatCurrency(Number(v)) },
        { header: 'Saldo Ant.', field: 'saldoAnterior', width: 90, align: 'right', format: (v) => this.pdfService.formatCurrency(Number(v)) },
        { header: 'Intereses', field: 'intereses', width: 70, align: 'right', format: (v) => this.pdfService.formatCurrency(Number(v)) },
        { header: 'TOTAL', field: 'total', width: 95, align: 'right', format: (v) => this.pdfService.formatCurrency(Number(v)) },
      ],
      data: unidadesData as Array<Record<string, unknown>>,
      fontSize: 8,
      headerFontSize: 9,
      rowHeight: 22,
    });

    // Total de recaudación esperada
    doc.y += 10;
    this.pdfService.drawSummaryBox(doc, {
      items: [
        {
          label: 'Total a Recaudar',
          value: this.pdfService.formatCurrency(data.totalRecaudar),
          highlight: true,
        },
      ],
      width: 200,
      align: 'right',
    });

    // Footer
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(i);
      this.pdfService.drawFooter(doc, {
        pageNumber: i + 1,
        totalPages: pages.count,
        showDate: true,
      });
    }

    return this.pdfService.toBuffer(doc);
  }

  // === Helpers privados ===

  private drawUnidadInfoIndividual(doc: PDFKit.PDFDocument, data: ExpensaIndividualData): void {
    doc
      .fontSize(16)
      .fillColor(this.pdfService.colors.primary)
      .font('Helvetica-Bold')
      .text(`Unidad: ${data.unidadFuncional}`, doc.page.margins.left, doc.y);

    doc
      .fontSize(10)
      .fillColor(this.pdfService.colors.textLight)
      .font('Helvetica')
      .text(`Coeficiente: ${data.coeficiente.toFixed(4)}%`, doc.page.margins.left, doc.y + 5);

    doc.y += 30;
  }

  private drawResumenMontosIndividual(doc: PDFKit.PDFDocument, data: ExpensaIndividualData): void {
    const totalOrdinarios = data.gastosOrdinarios.reduce((sum, g) => sum + g.monto, 0);
    const totalExtraordinarios = data.gastosExtraordinarios.reduce((sum, g) => sum + g.monto, 0);
    const montoOrdinario = totalOrdinarios * (data.coeficiente / 100);
    const montoExtraordinario = totalExtraordinarios * (data.coeficiente / 100);

    const items: Array<{ label: string; value: string; highlight?: boolean }> = [
      { label: 'Expensas Ordinarias', value: this.pdfService.formatCurrency(montoOrdinario) },
    ];

    if (montoExtraordinario > 0) {
      items.push({
        label: 'Expensas Extraordinarias',
        value: this.pdfService.formatCurrency(montoExtraordinario),
      });
    }

    if (data.saldoAnterior !== 0) {
      items.push({
        label: data.saldoAnterior > 0 ? 'Saldo Anterior (deuda)' : 'Saldo a Favor',
        value: this.pdfService.formatCurrency(Math.abs(data.saldoAnterior)),
      });
    }

    if (data.intereses > 0) {
      items.push({
        label: 'Intereses por Mora',
        value: this.pdfService.formatCurrency(data.intereses),
      });
    }

    if (data.bonificacion && data.bonificacion > 0) {
      items.push({
        label: 'Bonificación',
        value: `-${this.pdfService.formatCurrency(data.bonificacion)}`,
      });
    }

    items.push({
      label: 'TOTAL A PAGAR',
      value: this.pdfService.formatCurrency(data.total),
      highlight: true,
    });

    this.pdfService.drawSummaryBox(doc, {
      title: 'Resumen',
      items,
      width: 280,
      align: 'right',
    });
  }

  private drawGastosTableSimple(
    doc: PDFKit.PDFDocument,
    titulo: string,
    gastos: Array<{ concepto: string; monto: number }>,
  ): void {
    doc
      .fontSize(12)
      .fillColor(this.pdfService.colors.text)
      .font('Helvetica-Bold')
      .text(titulo, doc.page.margins.left, doc.y);
    doc.y += 15;
    doc.font('Helvetica');

    this.pdfService.drawTable(doc, {
      columns: [
        { header: 'Concepto', field: 'concepto', width: 400 },
        { header: 'Monto', field: 'monto', width: 145, align: 'right', format: (v) => this.pdfService.formatCurrency(Number(v)) },
      ],
      data: gastos as Array<Record<string, unknown>>,
      fontSize: 9,
    });
  }

  private drawInfoPagoIndividual(doc: PDFKit.PDFDocument, data: ExpensaIndividualData): void {
    doc.y += 15;

    // Box de información de pago
    const boxY = doc.y;
    const boxWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const boxHeight = 100;

    doc
      .rect(doc.page.margins.left, boxY, boxWidth, boxHeight)
      .fill('#E8F5E9');
    doc
      .rect(doc.page.margins.left, boxY, boxWidth, boxHeight)
      .strokeColor(this.pdfService.colors.primary)
      .lineWidth(2)
      .stroke();

    doc
      .fontSize(12)
      .fillColor(this.pdfService.colors.primaryDark)
      .font('Helvetica-Bold')
      .text('Información de Pago', doc.page.margins.left + 15, boxY + 12);

    doc.font('Helvetica').fontSize(10).fillColor(this.pdfService.colors.text);

    const col1X = doc.page.margins.left + 15;
    const col2X = doc.page.margins.left + 280;

    // Columna 1
    doc.text(`Vencimiento: ${this.pdfService.formatDate(data.fechaVencimiento)}`, col1X, boxY + 35);
    
    if (data.fechaSegundoVencimiento) {
      doc.text(
        `2do Venc.: ${this.pdfService.formatDate(data.fechaSegundoVencimiento)} (+${data.recargoSegundoVencimiento ?? 10}%)`,
        col1X,
        boxY + 50,
      );
    }

    if (data.codigoQR) {
      doc.text(`Código de pago: ${data.codigoQR}`, col1X, boxY + 70);
    }

    // Columna 2 - Datos bancarios
    if (data.consorcio.cbu ?? data.consorcio.aliasCbu) {
      doc.text('Datos para transferencia:', col2X, boxY + 35);
      if (data.consorcio.cbu) {
        doc.text(`CBU: ${data.consorcio.cbu}`, col2X, boxY + 50);
      }
      if (data.consorcio.aliasCbu) {
        doc.text(`Alias: ${data.consorcio.aliasCbu}`, col2X, boxY + 65);
      }
    }

    doc.y = boxY + boxHeight + 10;
  }

  private formatPeriodo(periodo: string): string {
    const [year, month] = periodo.split('-');
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const monthIndex = parseInt(month || '1', 10) - 1;
    return `${meses[monthIndex] ?? 'Mes'} ${year ?? ''}`;
  }
}
