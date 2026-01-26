import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { PagosService } from './pagos.service';
import {
  IniciarPagoDto,
  RegistrarPagoManualDto,
  FilterPagosDto,
  ActualizarEstadoPagoDto,
  ReembolsarPagoDto,
  MercadoPagoWebhookDto,
  PagoResponseDto,
  PagoListResponseDto,
  IniciarPagoResponseDto,
  CuentaCorrienteResponseDto,
} from './dto';

// Interfaz para el request autenticado
interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

@ApiTags('Pagos')
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  // ===========================================================================
  // ENDPOINTS PARA VECINOS (Requieren autenticación)
  // ===========================================================================

  @Post('iniciar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.PROPIETARIO, Rol.INQUILINO)
  @ApiOperation({
    summary: 'Iniciar un pago como vecino',
    description:
      'Inicia el flujo de pago para expensas. Retorna URL de Mercado Pago ' +
      'o datos bancarios según el método seleccionado.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pago iniciado, se retornan datos para completarlo',
    type: IniciarPagoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos o período ya pagado' })
  @ApiResponse({ status: 403, description: 'Sin permisos para esta UF' })
  @ApiResponse({ status: 409, description: 'Ya existe un pago pendiente' })
  async iniciarPago(
    @Body() dto: IniciarPagoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.iniciarPago(dto, req.user.sub);
  }

  @Get('mis-pagos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ver mis pagos',
    description: 'Lista todos los pagos realizados por el usuario autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos del usuario',
    type: PagoListResponseDto,
  })
  async misPagos(
    @Query() filtros: FilterPagosDto,
    @Request() req: AuthenticatedRequest,
  ) {
    // Forzar filtro por usuario actual
    return this.pagosService.findAll(
      { ...filtros, usuarioId: req.user.sub },
      req.user.sub,
    );
  }

  @Get('cuenta-corriente/:unidadFuncionalId')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ver cuenta corriente de una unidad funcional',
    description:
      'Obtiene el estado de cuenta corriente con saldo, deudas pendientes ' +
      'y últimos movimientos. Accesible por el vecino o admin.',
  })
  @ApiParam({ name: 'unidadFuncionalId', description: 'ID de la unidad funcional' })
  @ApiResponse({
    status: 200,
    description: 'Estado de cuenta corriente',
    type: CuentaCorrienteResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Sin acceso a esta cuenta' })
  async cuentaCorriente(
    @Param('unidadFuncionalId') unidadFuncionalId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.obtenerCuentaCorriente(
      unidadFuncionalId,
      req.user.sub,
    );
  }

  // ===========================================================================
  // ENDPOINTS PARA ADMINISTRADORES
  // ===========================================================================

  @Post('manual')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Registrar pago manual (efectivo/transferencia)',
    description:
      'Permite a administradores registrar pagos recibidos en efectivo ' +
      'o transferencia bancaria. El pago se crea ya APROBADO.',
  })
  @ApiResponse({
    status: 201,
    description: 'Pago registrado exitosamente',
    type: PagoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  async registrarPagoManual(
    @Body() dto: RegistrarPagoManualDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.registrarPagoManual(dto, req.user.sub);
  }

  @Get('consorcio/:consorcioId/resumen')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Obtener resumen de pagos del consorcio',
    description:
      'Retorna estadísticas de pagos del mes: total recaudado, ' +
      'pagos pendientes, cantidad de pagos y últimos movimientos.',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de pagos del consorcio',
    schema: {
      type: 'object',
      properties: {
        periodo: { type: 'string', example: '2024-01' },
        totalRecaudadoMes: { type: 'number', example: 1500000 },
        cantidadPagosMes: { type: 'number', example: 42 },
        pagosPendientes: { type: 'number', example: 3 },
        pagosAprobadosMes: { type: 'number', example: 42 },
        ultimosPagos: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              monto: { type: 'number' },
              estado: { type: 'string' },
              metodoPago: { type: 'string' },
              fechaPago: { type: 'string', format: 'date-time' },
              vecino: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sin permisos de administrador' })
  async obtenerResumenConsorcio(
    @Param('consorcioId') consorcioId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.obtenerResumenConsorcio(consorcioId, req.user.sub);
  }

  @Post(':id/comprobante')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Generar comprobante de pago',
    description:
      'Genera o retorna el comprobante PDF de un pago aprobado. ' +
      'Accesible por el dueño del pago o administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({
    status: 200,
    description: 'Comprobante generado o existente',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', nullable: true },
        generado: { type: 'boolean' },
        datos: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Solo pagos aprobados tienen comprobante' })
  @ApiResponse({ status: 403, description: 'Sin acceso a este comprobante' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async generarComprobante(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.generarComprobante(id, req.user.sub);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Listar pagos (admin)',
    description:
      'Lista pagos con filtros. Requiere permisos de administrador. ' +
      'Incluye sumas totales y paginación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de pagos',
    type: PagoListResponseDto,
  })
  async findAll(
    @Query() filtros: FilterPagosDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.findAll(filtros, req.user.sub);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Ver detalle de un pago',
    description: 'Obtiene el detalle completo de un pago por ID.',
  })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del pago',
    type: PagoResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Sin acceso a este pago' })
  @ApiResponse({ status: 404, description: 'Pago no encontrado' })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.findOne(id, req.user.sub);
  }

  @Put(':id/estado')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Actualizar estado de pago manualmente',
    description:
      'Permite cambiar el estado de un pago manualmente. ' +
      'SOLO SUPER_ADMIN. Requiere motivo obligatorio.',
  })
  @ApiParam({ name: 'id', description: 'ID del pago' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado',
    type: PagoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Transición de estado no permitida' })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN puede hacer esto' })
  async actualizarEstado(
    @Param('id') id: string,
    @Body() dto: ActualizarEstadoPagoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.actualizarEstado(id, dto, req.user.sub);
  }

  @Post(':id/reembolso')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reembolsar un pago',
    description:
      'Procesa el reembolso de un pago aprobado. SOLO SUPER_ADMIN. ' +
      'Crea un movimiento inverso en la cuenta corriente.',
  })
  @ApiParam({ name: 'id', description: 'ID del pago a reembolsar' })
  @ApiResponse({
    status: 200,
    description: 'Reembolso procesado',
    type: PagoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Solo se pueden reembolsar pagos aprobados' })
  @ApiResponse({ status: 403, description: 'Solo SUPER_ADMIN puede hacer esto' })
  async reembolsar(
    @Param('id') id: string,
    @Body() dto: ReembolsarPagoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.pagosService.reembolsar(id, dto, req.user.sub);
  }

  // ===========================================================================
  // WEBHOOK DE MERCADO PAGO (Sin autenticación JWT, usa firma MP)
  // ===========================================================================

  @Post('webhook/mercadopago')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Webhook de Mercado Pago',
    description:
      'Endpoint para recibir notificaciones de Mercado Pago. ' +
      'NO requiere autenticación JWT, usa firma de MP.',
  })
  @ApiExcludeEndpoint() // Ocultar de documentación pública
  async webhookMercadoPago(
    @Body() body: MercadoPagoWebhookDto,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Headers('ts') timestamp: string,
  ) {
    // El service valida la firma internamente
    return this.pagosService.procesarWebhookMercadoPago(
      {
        type: body.type,
        dataId: body['data.id'],
        externalReference: body.external_reference,
        requestId,
        timestamp,
      },
      signature,
    );
  }
}
