// =============================================================================
// Controlador del Portal de Residentes
// Endpoints específicos para propietarios e inquilinos
// =============================================================================

import {
  Controller,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
  Request,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiProduces,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { ResidentPortalService } from './resident-portal.service';
import { ExpensasService } from '../expensas/expensas.service';
import {
  FilterMisExpensasDto,
  FilterGastosEdificioDto,
  MisExpensasResponseDto,
  GastosEdificioResponseDto,
  ExpensaDetalleCompletoDto,
  ResumenUnidadesEdificioDto,
  DatosBancariosConsorcioDto,
} from './dto';

interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

@ApiTags('Portal Residentes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('mi-portal')
export class ResidentPortalController {
  constructor(
    private readonly residentService: ResidentPortalService,
    private readonly expensasService: ExpensasService,
  ) {}

  // ===========================================================================
  // MIS DATOS
  // ===========================================================================

  @Get('mis-datos')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Obtener mis datos',
    description:
      'Obtiene información de mi unidad funcional y consorcio. ' +
      'Incluye CBU para pagos y datos de contacto.',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario, unidad funcional y consorcio',
  })
  async obtenerMisDatos(@Request() req: AuthenticatedRequest) {
    return this.residentService.obtenerMisDatos(req.user.sub);
  }

  // ===========================================================================
  // MIS EXPENSAS
  // ===========================================================================

  @Get('expensas')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Listar mis expensas',
    description:
      'Lista todas las expensas de mi unidad funcional. ' +
      'Incluye estado de pago y saldo de cuenta corriente. ' +
      'Los inquilinos no ven gastos extraordinarios.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de expensas',
    type: MisExpensasResponseDto,
  })
  async listarMisExpensas(
    @Query() filtros: FilterMisExpensasDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.residentService.obtenerMisExpensas(req.user.sub, filtros);
  }

  @Get('expensas/:periodo')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Ver detalle de una expensa',
    description:
      'Obtiene el detalle completo de una expensa incluyendo todos los gastos, ' +
      'desglose por categoría, y estado de pagos. ' +
      'Los inquilinos no ven gastos extraordinarios.',
  })
  @ApiParam({ name: 'periodo', description: 'Período en formato YYYY-MM' })
  @ApiResponse({
    status: 200,
    description: 'Detalle completo de la expensa',
    type: ExpensaDetalleCompletoDto,
  })
  @ApiResponse({ status: 404, description: 'Expensa no encontrada' })
  async obtenerDetalleExpensa(
    @Param('periodo') periodo: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.residentService.obtenerDetalleExpensa(req.user.sub, periodo);
  }

  @Get('expensas/:periodo/pdf')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Descargar PDF de mi expensa',
    description:
      'Genera y descarga el PDF de la expensa para mi unidad funcional. ' +
      'Incluye desglose de gastos y datos para pago.',
  })
  @ApiParam({ name: 'periodo', description: 'Período en formato YYYY-MM' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF de la expensa',
    content: { 'application/pdf': {} },
  })
  async descargarMiExpensaPdf(
    @Param('periodo') periodo: string,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // Obtener mi unidad funcional
    const misDatos = await this.residentService.obtenerMisDatos(req.user.sub);
    
    // Buscar la expensa del período
    const expensa = await this.expensasService.findByPeriodo(
      misDatos.consorcio.id,
      periodo,
      req.user.sub,
    );

    // Generar PDF individual
    const pdfBuffer = await this.expensasService.generarPdfIndividual(
      expensa.id,
      misDatos.unidadFuncional.id,
      req.user.sub,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="expensa-${periodo}-${misDatos.unidadFuncional.codigo}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }

  // ===========================================================================
  // GASTOS DEL EDIFICIO (Transparencia)
  // ===========================================================================

  @Get('gastos-edificio')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Ver gastos del edificio',
    description:
      'Lista todos los gastos del edificio para transparencia. ' +
      'Incluye acceso a comprobantes/facturas de cada gasto. ' +
      'Los inquilinos no ven gastos extraordinarios.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de gastos del edificio',
    type: GastosEdificioResponseDto,
  })
  async listarGastosEdificio(
    @Query() filtros: FilterGastosEdificioDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.residentService.obtenerGastosEdificio(req.user.sub, filtros);
  }

  @Get('gastos-edificio/categorias')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Listar categorías de gastos',
    description: 'Obtiene las categorías disponibles para filtrar gastos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías',
  })
  async listarCategorias() {
    return this.residentService.obtenerCategorias();
  }

  // ===========================================================================
  // RESUMEN DEL EDIFICIO
  // ===========================================================================

  @Get('resumen-edificio')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Ver resumen del edificio',
    description:
      'Obtiene un resumen del estado de todas las unidades del edificio. ' +
      'Muestra porcentaje de morosidad sin revelar datos sensibles de vecinos.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resumen del edificio',
    type: ResumenUnidadesEdificioDto,
  })
  async obtenerResumenEdificio(@Request() req: AuthenticatedRequest) {
    return this.residentService.obtenerResumenEdificio(req.user.sub);
  }

  // ===========================================================================
  // DATOS BANCARIOS PARA PAGO
  // ===========================================================================

  @Get('datos-bancarios')
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Obtener datos bancarios para pago',
    description:
      'Obtiene el CBU/alias y datos bancarios del consorcio ' +
      'para realizar pagos por transferencia.',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos bancarios del consorcio',
    type: DatosBancariosConsorcioDto,
  })
  async obtenerDatosBancarios(@Request() req: AuthenticatedRequest) {
    return this.residentService.obtenerDatosBancarios(req.user.sub);
  }
}
