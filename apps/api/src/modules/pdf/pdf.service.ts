import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

export interface PdfOptions {
  size?: 'A4' | 'LETTER' | 'LEGAL';
  orientation?: 'portrait' | 'landscape';
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  info?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
  };
}

export interface TableColumn {
  header: string;
  field: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: (value: unknown) => string;
}

export interface TableOptions {
  columns: TableColumn[];
  data: Array<Record<string, unknown>>;
  headerBackground?: string;
  headerColor?: string;
  alternateRowColor?: string;
  fontSize?: number;
  headerFontSize?: number;
  rowHeight?: number;
  headerHeight?: number;
}

/**
 * Servicio base para generación de PDFs
 * Usa PDFKit para máxima flexibilidad
 */
@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  // Colores del branding
  readonly colors = {
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    secondary: '#2196F3',
    text: '#333333',
    textLight: '#666666',
    border: '#E0E0E0',
    background: '#F5F5F5',
    white: '#FFFFFF',
    danger: '#F44336',
    warning: '#FF9800',
    success: '#4CAF50',
  };

  /**
   * Crea un nuevo documento PDF
   */
  createDocument(options: PdfOptions = {}): PDFKit.PDFDocument {
    const doc = new PDFDocument({
      size: options.size || 'A4',
      layout: options.orientation || 'portrait',
      margins: {
        top: options.margins?.top || 50,
        bottom: options.margins?.bottom || 50,
        left: options.margins?.left || 50,
        right: options.margins?.right || 50,
      },
      info: {
        Title: options.info?.title || 'VecinoSimple',
        Author: options.info?.author || 'VecinoSimple',
        Subject: options.info?.subject,
        Keywords: options.info?.keywords,
        CreationDate: new Date(),
        Producer: 'VecinoSimple PDF Generator',
      },
      autoFirstPage: true,
      bufferPages: true,
    });

    return doc;
  }

  /**
   * Convierte el documento PDF a Buffer
   */
  async toBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.end();
    });
  }

  /**
   * Convierte el documento PDF a Stream
   */
  toStream(doc: PDFKit.PDFDocument): Readable {
    return doc as unknown as Readable;
  }

  /**
   * Dibuja el header estándar de VecinoSimple
   */
  drawHeader(
    doc: PDFKit.PDFDocument,
    options: {
      title: string;
      subtitle?: string;
      consorcio?: string;
      direccion?: string;
      logo?: Buffer;
    },
  ): number {
    const startY = doc.y;
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Fondo del header
    doc
      .rect(doc.page.margins.left - 10, startY - 10, pageWidth + 20, 80)
      .fill(this.colors.primary);

    // Logo placeholder (círculo con emoji)
    doc
      .circle(doc.page.margins.left + 25, startY + 30, 20)
      .fill(this.colors.white);
    
    doc
      .fontSize(20)
      .fillColor(this.colors.primary)
      .text('🏢', doc.page.margins.left + 15, startY + 20);

    // Título
    doc
      .fontSize(22)
      .fillColor(this.colors.white)
      .text(options.title, doc.page.margins.left + 60, startY + 5);

    // Subtítulo
    if (options.subtitle) {
      doc
        .fontSize(10)
        .fillColor(this.colors.white)
        .text(options.subtitle, doc.page.margins.left + 60, startY + 32);
    }

    // Consorcio y dirección (derecha)
    if (options.consorcio) {
      doc
        .fontSize(11)
        .fillColor(this.colors.white)
        .text(options.consorcio, doc.page.margins.left + 60, startY + 48, {
          width: pageWidth - 70,
          align: 'left',
        });
    }

    doc.y = startY + 90;
    doc.fillColor(this.colors.text);

    return doc.y;
  }

  /**
   * Dibuja el footer estándar
   */
  drawFooter(
    doc: PDFKit.PDFDocument,
    options: {
      pageNumber?: number;
      totalPages?: number;
      showDate?: boolean;
    } = {},
  ): void {
    const pageWidth = doc.page.width;
    const y = doc.page.height - 40;

    // Línea separadora
    doc
      .moveTo(doc.page.margins.left, y - 10)
      .lineTo(pageWidth - doc.page.margins.right, y - 10)
      .strokeColor(this.colors.border)
      .stroke();

    // Fecha
    if (options.showDate !== false) {
      const date = new Date().toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      doc
        .fontSize(8)
        .fillColor(this.colors.textLight)
        .text(date, doc.page.margins.left, y, { lineBreak: false });
    }

    // Número de página
    if (options.pageNumber) {
      const pageText = options.totalPages
        ? `Página ${options.pageNumber} de ${options.totalPages}`
        : `Página ${options.pageNumber}`;

      doc
        .fontSize(8)
        .fillColor(this.colors.textLight)
        .text(
          pageText,
          doc.page.margins.left,
          y,
          { width: pageWidth - doc.page.margins.left - doc.page.margins.right, align: 'center' },
        );
    }

    // VecinoSimple
    doc
      .fontSize(8)
      .fillColor(this.colors.textLight)
      .text(
        'Generado por VecinoSimple',
        doc.page.margins.left,
        y,
        { width: pageWidth - doc.page.margins.left - doc.page.margins.right, align: 'right' },
      );
  }

  /**
   * Dibuja una tabla
   */
  drawTable(doc: PDFKit.PDFDocument, options: TableOptions): number {
    const {
      columns,
      data,
      headerBackground = this.colors.primary,
      headerColor = this.colors.white,
      alternateRowColor = '#F9F9F9',
      fontSize = 9,
      headerFontSize = 10,
      rowHeight = 25,
      headerHeight = 30,
    } = options;

    const startX = doc.page.margins.left;
    const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    let currentY = doc.y;

    // Calcular anchos de columna
    const totalDefinedWidth = columns.reduce((sum, col) => sum + (col.width || 0), 0);
    const remainingWidth = tableWidth - totalDefinedWidth;
    const undefinedCols = columns.filter((col) => !col.width).length;
    const defaultColWidth = undefinedCols > 0 ? remainingWidth / undefinedCols : 0;

    // Header
    doc.rect(startX, currentY, tableWidth, headerHeight).fill(headerBackground);

    let xOffset = startX;
    for (const col of columns) {
      const colWidth = col.width || defaultColWidth;
      doc
        .fontSize(headerFontSize)
        .fillColor(headerColor)
        .text(col.header, xOffset + 5, currentY + 8, {
          width: colWidth - 10,
          align: col.align || 'left',
        });
      xOffset += colWidth;
    }

    currentY += headerHeight;

    // Rows
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (!row) continue;

      // Check for page break
      if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom - 50) {
        doc.addPage();
        currentY = doc.page.margins.top;

        // Re-draw header on new page
        doc.rect(startX, currentY, tableWidth, headerHeight).fill(headerBackground);
        xOffset = startX;
        for (const col of columns) {
          const colWidth = col.width || defaultColWidth;
          doc
            .fontSize(headerFontSize)
            .fillColor(headerColor)
            .text(col.header, xOffset + 5, currentY + 8, {
              width: colWidth - 10,
              align: col.align || 'left',
            });
          xOffset += colWidth;
        }
        currentY += headerHeight;
      }

      // Alternate row background
      if (i % 2 === 1) {
        doc.rect(startX, currentY, tableWidth, rowHeight).fill(alternateRowColor);
      }

      // Row border
      doc
        .rect(startX, currentY, tableWidth, rowHeight)
        .strokeColor(this.colors.border)
        .stroke();

      // Cell content
      xOffset = startX;
      for (const col of columns) {
        const colWidth = col.width || defaultColWidth;
        const value = row[col.field];
        const displayValue = col.format ? col.format(value) : String(value ?? '');

        doc
          .fontSize(fontSize)
          .fillColor(this.colors.text)
          .text(displayValue, xOffset + 5, currentY + 7, {
            width: colWidth - 10,
            align: col.align || 'left',
            height: rowHeight - 14,
            ellipsis: true,
          });

        xOffset += colWidth;
      }

      currentY += rowHeight;
    }

    doc.y = currentY + 10;
    return doc.y;
  }

  /**
   * Dibuja un box de resumen (para totales, etc.)
   */
  drawSummaryBox(
    doc: PDFKit.PDFDocument,
    options: {
      title?: string;
      items: Array<{ label: string; value: string; highlight?: boolean }>;
      width?: number;
      align?: 'left' | 'right';
    },
  ): number {
    const boxWidth = options.width || 250;
    const boxX = options.align === 'right'
      ? doc.page.width - doc.page.margins.right - boxWidth
      : doc.page.margins.left;

    let currentY = doc.y;

    // Title
    if (options.title) {
      doc
        .fontSize(11)
        .fillColor(this.colors.text)
        .font('Helvetica-Bold')
        .text(options.title, boxX, currentY);
      currentY += 20;
    }

    // Box background
    const boxHeight = options.items.length * 22 + 15;
    doc
      .rect(boxX, currentY, boxWidth, boxHeight)
      .fill(this.colors.background);
    doc
      .rect(boxX, currentY, boxWidth, boxHeight)
      .strokeColor(this.colors.border)
      .stroke();

    currentY += 8;

    // Items
    for (const item of options.items) {
      doc
        .fontSize(item.highlight ? 12 : 10)
        .font(item.highlight ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(item.highlight ? this.colors.primary : this.colors.textLight)
        .text(item.label, boxX + 10, currentY);

      doc
        .fontSize(item.highlight ? 12 : 10)
        .font(item.highlight ? 'Helvetica-Bold' : 'Helvetica')
        .fillColor(item.highlight ? this.colors.primary : this.colors.text)
        .text(item.value, boxX + 10, currentY, {
          width: boxWidth - 20,
          align: 'right',
        });

      currentY += 22;
    }

    doc.y = currentY + 10;
    doc.font('Helvetica');
    return doc.y;
  }

  /**
   * Dibuja un separador
   */
  drawSeparator(doc: PDFKit.PDFDocument, margin = 10): number {
    doc.y += margin;
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor(this.colors.border)
      .stroke();
    doc.y += margin;
    return doc.y;
  }

  /**
   * Formatea un monto como moneda argentina
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Formatea una fecha
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
}
