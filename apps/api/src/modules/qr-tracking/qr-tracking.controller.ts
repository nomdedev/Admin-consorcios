import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { QRTrackingService } from './qr-tracking.service';
import {
  CreateQRExpensaDto,
  GenerarQRBulkDto,
  RegistrarEscaneoDto,
  RegistrarConversionDto,
  QRExpensaResponseDto,
  QRGeneradoDto,
  MetricasQRDto,
  QRConDetalleDto,
} from './dto/qr-tracking.dto';
import { Rol } from '@prisma/client';

@ApiTags('QR Tracking')
@Controller('qr-tracking')
export class QRTrackingController {
  constructor(private readonly qrTrackingService: QRTrackingService) {}

  // ===========================================================================
  // Generación de QR (requiere autenticación)
  // ===========================================================================

  @Post('generar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generar QR para una expensa',
    description: 'Genera un código QR único para una unidad funcional y período',
  })
  @ApiResponse({
    status: 201,
    description: 'QR generado',
    type: QRGeneradoDto,
  })
  async generarQR(@Body() dto: CreateQRExpensaDto): Promise<QRGeneradoDto> {
    return this.qrTrackingService.generarQR(dto);
  }

  @Post('generar-bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Generar QR para todas las UF de un consorcio',
    description:
      'Genera códigos QR para todas las unidades funcionales activas de un período',
  })
  @ApiResponse({
    status: 201,
    description: 'QRs generados',
    type: [QRGeneradoDto],
  })
  async generarQRBulk(@Body() dto: GenerarQRBulkDto): Promise<QRGeneradoDto[]> {
    return this.qrTrackingService.generarQRBulk(dto);
  }

  // ===========================================================================
  // Tracking público (no requiere autenticación)
  // ===========================================================================

  @Post('escaneo')
  @ApiOperation({
    summary: 'Registrar escaneo de QR',
    description:
      'Endpoint público llamado cuando alguien escanea un QR. Incrementa contador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Escaneo registrado',
    type: QRExpensaResponseDto,
  })
  async registrarEscaneo(
    @Body() dto: RegistrarEscaneoDto
  ): Promise<QRExpensaResponseDto> {
    return this.qrTrackingService.registrarEscaneo(dto.codigoQR);
  }

  @Post('conversion')
  @ApiOperation({
    summary: 'Registrar conversión de QR',
    description:
      'Llamado cuando el usuario completa la acción (ej: pago realizado)',
  })
  @ApiResponse({
    status: 200,
    description: 'Conversión registrada',
    type: QRExpensaResponseDto,
  })
  async registrarConversion(
    @Body() dto: RegistrarConversionDto
  ): Promise<QRExpensaResponseDto> {
    return this.qrTrackingService.registrarConversion(dto.codigoQR);
  }

  @Get('resolver/:codigoQR')
  @ApiOperation({
    summary: 'Resolver QR y obtener URL de destino',
    description:
      'Endpoint público para resolver un código QR y redirigir al usuario',
  })
  @ApiParam({ name: 'codigoQR', description: 'Código del QR' })
  @ApiResponse({
    status: 200,
    description: 'Datos del QR',
    type: QRConDetalleDto,
  })
  async resolverQR(
    @Param('codigoQR') codigoQR: string
  ): Promise<QRConDetalleDto> {
    // Registrar escaneo automáticamente
    await this.qrTrackingService.registrarEscaneo(codigoQR);
    return this.qrTrackingService.obtenerQR(codigoQR);
  }

  // ===========================================================================
  // Métricas y reportes (requiere autenticación)
  // ===========================================================================

  @Get('metricas/:consorcioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener métricas de QR',
    description: 'Estadísticas de escaneos y conversiones para un consorcio',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Métricas de QR',
    type: MetricasQRDto,
  })
  async obtenerMetricas(
    @Param('consorcioId') consorcioId: string
  ): Promise<MetricasQRDto> {
    return this.qrTrackingService.obtenerMetricas(consorcioId);
  }

  @Get('lista/:consorcioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar QR de un período' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiQuery({ name: 'periodo', description: 'Período (YYYY-MM)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de QR',
    type: [QRConDetalleDto],
  })
  async listarQR(
    @Param('consorcioId') consorcioId: string,
    @Query('periodo') periodo: string
  ): Promise<QRConDetalleDto[]> {
    return this.qrTrackingService.listarQRConDetalle(consorcioId, periodo);
  }
}
