import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Res,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { ExpensasService } from './expensas.service';
import {
  CreateExpensaDto,
  UpdateExpensaDto,
  CalcularProrrateoDto,
  AsignarGastosDto,
  CerrarExpensaDto,
  FilterExpensasDto,
  ExpensaResponseDto,
  ExpensaListResponseDto,
  ProrrateoResultDto,
} from './dto';

// Interfaz para el request autenticado
interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

@ApiTags('Expensas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('expensas')
export class ExpensasController {
  constructor(private readonly expensasService: ExpensasService) {}

  // ===========================================================================
  // CRUD BÁSICO
  // ===========================================================================

  @Post()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Crear nueva expensa',
    description: 'Crea una nueva expensa para un período específico. Requiere rol de administrador.',
  })
  @ApiResponse({
    status: 201,
    description: 'Expensa creada exitosamente',
    type: ExpensaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos para este consorcio' })
  @ApiResponse({ status: 409, description: 'Ya existe expensa para este período' })
  async create(@Body() dto: CreateExpensaDto, @Request() req: AuthenticatedRequest) {
    return this.expensasService.create(dto, req.user.sub);
  }

  @Get()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Listar expensas',
    description: 'Lista expensas con filtros opcionales. Solo muestra expensas de consorcios accesibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de expensas',
    type: ExpensaListResponseDto,
  })
  async findAll(@Query() filtros: FilterExpensasDto, @Request() req: AuthenticatedRequest) {
    return this.expensasService.findAll(filtros, req.user.sub);
  }

  @Get(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Obtener expensa por ID',
    description: 'Obtiene el detalle completo de una expensa incluyendo gastos y detalles por unidad.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({
    status: 200,
    description: 'Detalle de la expensa',
    type: ExpensaResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Expensa no encontrada' })
  async findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.expensasService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Actualizar expensa',
    description: 'Actualiza datos de una expensa. No se pueden modificar expensas cerradas.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({
    status: 200,
    description: 'Expensa actualizada',
    type: ExpensaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No se puede modificar expensa cerrada' })
  @ApiResponse({ status: 404, description: 'Expensa no encontrada' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpensaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.expensasService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar expensa',
    description: 'Elimina una expensa. Solo se pueden eliminar expensas en estado BORRADOR.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({ status: 200, description: 'Expensa eliminada' })
  @ApiResponse({ status: 400, description: 'Solo se pueden eliminar expensas en BORRADOR' })
  @ApiResponse({ status: 404, description: 'Expensa no encontrada' })
  async delete(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.expensasService.delete(id, req.user.sub);
  }

  // ===========================================================================
  // GESTIÓN DE GASTOS
  // ===========================================================================

  @Post(':id/gastos/asignar')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Asignar gastos a la expensa',
    description: 'Asigna gastos existentes a esta expensa para incluirlos en la liquidación.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({
    status: 200,
    description: 'Gastos asignados exitosamente',
    type: ExpensaResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Gastos ya asignados a otra expensa' })
  async asignarGastos(
    @Param('id') id: string,
    @Body() dto: AsignarGastosDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.expensasService.asignarGastos(id, dto, req.user.sub);
  }

  @Post(':id/gastos/desasignar')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Desasignar gastos de la expensa',
    description: 'Remueve gastos de esta expensa. Los gastos no se eliminan, solo se desvinculan.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({
    status: 200,
    description: 'Gastos desasignados exitosamente',
    type: ExpensaResponseDto,
  })
  async desasignarGastos(
    @Param('id') id: string,
    @Body() dto: AsignarGastosDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.expensasService.desasignarGastos(id, dto, req.user.sub);
  }

  // ===========================================================================
  // CÁLCULO DE PRORRATEO
  // ===========================================================================

  @Post(':id/calcular')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Calcular prorrateo',
    description:
      'Calcula la distribución de gastos entre todas las unidades funcionales ' +
      'según sus coeficientes. Incluye saldos anteriores e intereses por mora.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({
    status: 200,
    description: 'Prorrateo calculado exitosamente',
    type: ProrrateoResultDto,
  })
  @ApiResponse({ status: 400, description: 'Coeficientes no suman 100%' })
  async calcularProrrateo(
    @Param('id') id: string,
    @Body() dto: CalcularProrrateoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.expensasService.calcularProrrateo(id, dto, req.user.sub);
  }

  // ===========================================================================
  // PUBLICACIÓN Y CIERRE
  // ===========================================================================

  @Post(':id/publicar')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar expensa',
    description:
      'Publica la expensa haciéndola visible para los vecinos. ' +
      'Una vez publicada, los vecinos pueden ver y pagar sus expensas.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({ status: 200, description: 'Expensa publicada' })
  @ApiResponse({ status: 400, description: 'Expensa no liquidada o ya publicada' })
  async publicar(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.expensasService.publicar(id, req.user.sub);
  }

  @Post(':id/cerrar')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar expensa',
    description:
      'Cierra definitivamente la expensa creando un snapshot inmutable. ' +
      'Las expensas cerradas no pueden modificarse, solo mediante notas de crédito/débito.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiResponse({
    status: 200,
    description: 'Expensa cerrada y snapshot creado',
  })
  @ApiResponse({ status: 400, description: 'Expensa no publicada o ya cerrada' })
  async cerrar(
    @Param('id') id: string,
    @Body() dto: CerrarExpensaDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.expensasService.cerrar(id, dto, req.user.sub);
  }

  // ===========================================================================
  // GENERACIÓN DE PDFs
  // ===========================================================================

  @Get(':id/pdf')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Descargar PDF resumen de expensa',
    description: 'Genera y descarga el PDF con el resumen completo de la expensa para administradores.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF de la expensa',
    content: { 'application/pdf': {} },
  })
  async descargarPdfResumen(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.expensasService.generarPdfResumen(id, req.user.sub);

    // Obtener información de la expensa para el nombre del archivo
    const expensa = await this.expensasService.findOne(id, req.user.sub);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="expensa-${expensa.periodo}-resumen.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }

  @Get(':id/pdf/:unidadFuncionalId')
  @Roles(
    Rol.SUPER_ADMIN,
    Rol.ADMINISTRADOR,
    Rol.ADMIN_STAFF,
    Rol.PROPIETARIO,
    Rol.INQUILINO,
  )
  @ApiOperation({
    summary: 'Descargar PDF de expensa individual',
    description: 'Genera y descarga el PDF de expensa para una unidad funcional específica.',
  })
  @ApiParam({ name: 'id', description: 'ID de la expensa' })
  @ApiParam({ name: 'unidadFuncionalId', description: 'ID de la unidad funcional' })
  @ApiProduces('application/pdf')
  @ApiResponse({
    status: 200,
    description: 'PDF de la expensa individual',
    content: { 'application/pdf': {} },
  })
  async descargarPdfIndividual(
    @Param('id') id: string,
    @Param('unidadFuncionalId') unidadFuncionalId: string,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const pdfBuffer = await this.expensasService.generarPdfIndividual(
      id,
      unidadFuncionalId,
      req.user.sub,
    );

    // Obtener información para el nombre
    const expensa = await this.expensasService.findOne(id, req.user.sub);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="expensa-${expensa.periodo}-${unidadFuncionalId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    return new StreamableFile(pdfBuffer);
  }
}
