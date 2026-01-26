import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateQRExpensaDto,
  GenerarQRBulkDto,
  QRExpensaResponseDto,
  QRGeneradoDto,
  MetricasQRDto,
  QRConDetalleDto,
  AccionQR,
} from './dto/qr-tracking.dto';
import * as crypto from 'node:crypto';

@Injectable()
export class QRTrackingService {
  private readonly logger = new Logger(QRTrackingService.name);
  private readonly baseUrl: string;

  constructor(private readonly prisma: PrismaService) {
    this.baseUrl = process.env.APP_URL || 'https://app.vecinosimple.com';
  }

  // ===========================================================================
  // Generación de QR
  // ===========================================================================

  /**
   * Genera un código QR único para una expensa
   */
  async generarQR(dto: CreateQRExpensaDto): Promise<QRGeneradoDto> {
    // Generar código único (8 caracteres alfanuméricos)
    const codigoQR = this.generarCodigoUnico();

    // Construir URL de destino
    const urlDestino = this.construirUrl(dto.accion, {
      consorcioId: dto.consorcioId,
      unidadFuncionalId: dto.unidadFuncionalId,
      periodo: dto.expensaPeriodo,
      qr: codigoQR,
    });

    // Obtener datos de la UF
    const uf = await this.prisma.unidadFuncional.findUnique({
      where: { id: dto.unidadFuncionalId },
      select: { codigo: true },
    });

    if (!uf) {
      throw new NotFoundException('Unidad funcional no encontrada');
    }

    // Guardar en BD
    await this.prisma.qRExpensaTracking.create({
      data: {
        codigoQR,
        expensaPeriodo: dto.expensaPeriodo,
        unidadFuncionalId: dto.unidadFuncionalId,
        consorcioId: dto.consorcioId,
        accion: dto.accion,
        urlDestino,
      },
    });

    // Generar SVG del QR
    const qrSvg = this.generarQRSvg(urlDestino);

    this.logger.log(
      `QR generado: ${codigoQR} para UF ${uf.codigo} - ${dto.expensaPeriodo}`
    );

    return {
      codigoQR,
      urlCompleta: urlDestino,
      qrSvg,
      unidadFuncionalId: dto.unidadFuncionalId,
      codigoUF: uf.codigo,
    };
  }

  /**
   * Genera QR para todas las UF de un consorcio en un período
   */
  async generarQRBulk(dto: GenerarQRBulkDto): Promise<QRGeneradoDto[]> {
    // Obtener todas las UF activas del consorcio
    const unidades = await this.prisma.unidadFuncional.findMany({
      where: {
        consorcioId: dto.consorcioId,
        activo: true,
      },
      select: { id: true, codigo: true },
    });

    const resultados: QRGeneradoDto[] = [];

    for (const uf of unidades) {
      const qr = await this.generarQR({
        consorcioId: dto.consorcioId,
        expensaPeriodo: dto.expensaPeriodo,
        unidadFuncionalId: uf.id,
        accion: dto.accion,
      });
      resultados.push(qr);
    }

    this.logger.log(
      `Generados ${resultados.length} QR para consorcio ${dto.consorcioId} - ${dto.expensaPeriodo}`
    );

    return resultados;
  }

  /**
   * Genera código único de 8 caracteres
   */
  private generarCodigoUnico(): string {
    const bytes = crypto.randomBytes(6);
    return bytes.toString('base64url').substring(0, 8).toUpperCase();
  }

  /**
   * Construye la URL de destino según la acción
   */
  private construirUrl(
    accion: AccionQR,
    params: {
      consorcioId: string;
      unidadFuncionalId: string;
      periodo: string;
      qr: string;
    }
  ): string {
    const base = `${this.baseUrl}/qr`;

    switch (accion) {
      case AccionQR.PAGAR:
        return `${base}/pagar?c=${params.consorcioId}&u=${params.unidadFuncionalId}&p=${params.periodo}&qr=${params.qr}`;

      case AccionQR.VER_DETALLE:
        return `${base}/detalle?c=${params.consorcioId}&u=${params.unidadFuncionalId}&p=${params.periodo}&qr=${params.qr}`;

      case AccionQR.DESCARGAR_PDF:
        return `${base}/pdf?c=${params.consorcioId}&u=${params.unidadFuncionalId}&p=${params.periodo}&qr=${params.qr}`;

      case AccionQR.ACTIVAR_CUENTA:
        return `${base}/activar?c=${params.consorcioId}&u=${params.unidadFuncionalId}&qr=${params.qr}`;

      default:
        return `${base}?qr=${params.qr}`;
    }
  }

  /**
   * Genera SVG simple de QR
   * NOTA: En producción usar librería como 'qrcode'
   */
  private generarQRSvg(url: string): string {
    // Placeholder - en producción usar librería qrcode
    // Este es un SVG de ejemplo que debería ser reemplazado
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
        <rect width="200" height="200" fill="white"/>
        <text x="100" y="100" text-anchor="middle" font-size="12" fill="black">
          QR: ${url.substring(0, 30)}...
        </text>
        <!-- Reemplazar con QR real usando librería -->
      </svg>
    `.trim();
  }

  // ===========================================================================
  // Tracking de escaneos
  // ===========================================================================

  /**
   * Registra un escaneo de QR
   */
  async registrarEscaneo(codigoQR: string): Promise<QRExpensaResponseDto> {
    const qr = await this.prisma.qRExpensaTracking.findUnique({
      where: { codigoQR },
    });

    if (!qr) {
      throw new NotFoundException('Código QR no encontrado');
    }

    const ahora = new Date();

    const actualizado = await this.prisma.qRExpensaTracking.update({
      where: { codigoQR },
      data: {
        escaneos: { increment: 1 },
        primerEscaneo: qr.primerEscaneo || ahora,
        ultimoEscaneo: ahora,
      },
    });

    this.logger.log(`Escaneo registrado para QR: ${codigoQR}`);

    return actualizado as unknown as QRExpensaResponseDto;
  }

  /**
   * Registra una conversión (acción completada)
   */
  async registrarConversion(codigoQR: string): Promise<QRExpensaResponseDto> {
    const qr = await this.prisma.qRExpensaTracking.findUnique({
      where: { codigoQR },
    });

    if (!qr) {
      throw new NotFoundException('Código QR no encontrado');
    }

    if (qr.convertido) {
      this.logger.log(`QR ${codigoQR} ya había convertido`);
      return qr as unknown as QRExpensaResponseDto;
    }

    const actualizado = await this.prisma.qRExpensaTracking.update({
      where: { codigoQR },
      data: {
        convertido: true,
        conversionAt: new Date(),
      },
    });

    this.logger.log(`Conversión registrada para QR: ${codigoQR}`);

    return actualizado as unknown as QRExpensaResponseDto;
  }

  /**
   * Obtiene datos de un QR por código
   */
  async obtenerQR(codigoQR: string): Promise<QRConDetalleDto> {
    const qr = await this.prisma.qRExpensaTracking.findUnique({
      where: { codigoQR },
    });

    if (!qr) {
      throw new NotFoundException('Código QR no encontrado');
    }

    const uf = await this.prisma.unidadFuncional.findUnique({
      where: { id: qr.unidadFuncionalId },
      select: { id: true, codigo: true, piso: true, numero: true },
    });

    return {
      ...qr,
      unidadFuncional: uf!,
    } as unknown as QRConDetalleDto;
  }

  // ===========================================================================
  // Métricas y reportes
  // ===========================================================================

  /**
   * Obtiene métricas de QR para un consorcio
   */
  async obtenerMetricas(consorcioId: string): Promise<MetricasQRDto> {
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 7);

    // Totales
    const totalQR = await this.prisma.qRExpensaTracking.count({
      where: { consorcioId },
    });

    const totalEscaneados = await this.prisma.qRExpensaTracking.count({
      where: {
        consorcioId,
        escaneos: { gt: 0 },
      },
    });

    const totalConvertidos = await this.prisma.qRExpensaTracking.count({
      where: {
        consorcioId,
        convertido: true,
      },
    });

    // Suma de escaneos
    const sumaEscaneos = await this.prisma.qRExpensaTracking.aggregate({
      where: { consorcioId },
      _sum: { escaneos: true },
    });

    // Por tipo de acción
    const porAccion = await this.prisma.qRExpensaTracking.groupBy({
      by: ['accion'],
      where: {
        consorcioId,
        convertido: true,
      },
      _count: true,
    });

    const accionesPorTipo = {
      pagar: 0,
      ver_detalle: 0,
      descargar_pdf: 0,
      activar_cuenta: 0,
    };

    for (const item of porAccion) {
      accionesPorTipo[item.accion as keyof typeof accionesPorTipo] = item._count;
    }

    // Últimos 7 días
    const escaneosRecientes = await this.prisma.qRExpensaTracking.count({
      where: {
        consorcioId,
        ultimoEscaneo: { gte: hace7Dias },
      },
    });

    const conversionesRecientes = await this.prisma.qRExpensaTracking.count({
      where: {
        consorcioId,
        conversionAt: { gte: hace7Dias },
      },
    });

    // Calcular tasas
    const tasaEscaneo =
      totalQR > 0
        ? ((totalEscaneados / totalQR) * 100).toFixed(1) + '%'
        : '0%';

    const tasaConversion =
      totalEscaneados > 0
        ? ((totalConvertidos / totalEscaneados) * 100).toFixed(1) + '%'
        : '0%';

    return {
      totalQRGenerados: totalQR,
      totalEscaneos: sumaEscaneos._sum.escaneos || 0,
      tasaEscaneo,
      conversiones: totalConvertidos,
      tasaConversion,
      accionesPorTipo,
      escaneosUltimos7Dias: escaneosRecientes,
      conversionesUltimos7Dias: conversionesRecientes,
    };
  }

  /**
   * Lista QR de un período específico
   */
  async listarQRPorPeriodo(
    consorcioId: string,
    periodo: string
  ): Promise<QRExpensaResponseDto[]> {
    const qrs = await this.prisma.qRExpensaTracking.findMany({
      where: {
        consorcioId,
        expensaPeriodo: periodo,
      },
      orderBy: { createdAt: 'desc' },
    });

    return qrs as unknown as QRExpensaResponseDto[];
  }

  /**
   * Lista QR con detalle de UF
   */
  async listarQRConDetalle(
    consorcioId: string,
    periodo: string
  ): Promise<QRConDetalleDto[]> {
    const qrs = await this.prisma.qRExpensaTracking.findMany({
      where: {
        consorcioId,
        expensaPeriodo: periodo,
      },
      orderBy: { createdAt: 'desc' },
    });

    const resultado: QRConDetalleDto[] = [];

    for (const qr of qrs) {
      const uf = await this.prisma.unidadFuncional.findUnique({
        where: { id: qr.unidadFuncionalId },
        select: { id: true, codigo: true, piso: true, numero: true },
      });

      resultado.push({
        ...qr,
        unidadFuncional: uf!,
      } as unknown as QRConDetalleDto);
    }

    return resultado;
  }
}
