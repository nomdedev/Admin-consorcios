import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ProveedoresService } from './proveedores.service';
import { Rol } from '@prisma/client';
import {
  CreateProveedorDto,
  UpdateProveedorDto,
  VerificarProveedorDto,
  AsociarProveedorDto,
  UpdateAsociacionDto,
  CreateTrabajoDto,
  UpdateTrabajoDto,
  AprobarTrabajoDto,
  FiltrosProveedorDto,
  FiltrosTrabajosDto,
  ProveedorResponseDto,
  TrabajoResponseDto,
  EstadisticasProveedorDto,
} from './dto';

// Roles de gestión
const ROLES_GESTION: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
];

// Roles de lectura
const ROLES_LECTURA: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
  Rol.AUDITOR,
];

@ApiTags('Proveedores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  // ==========================================================================
  // PROVEEDORES CRUD
  // ==========================================================================

  @Get()
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Lista proveedores (marketplace)' })
  @ApiQuery({ name: 'busqueda', required: false })
  @ApiQuery({ name: 'servicio', required: false })
  @ApiQuery({ name: 'verificado', required: false, type: Boolean })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de proveedores paginada' })
  async listarProveedores(
    @Query('busqueda') busqueda?: string,
    @Query('servicio') servicio?: string,
    @Query('verificado') verificado?: string,
    @Query('activo') activo?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filtros: FiltrosProveedorDto = {
      busqueda,
      servicio,
      verificado: verificado !== undefined ? verificado === 'true' : undefined,
      activo: activo !== undefined ? activo === 'true' : undefined,
    };
    return this.proveedoresService.listarProveedores(filtros, page, limit);
  }

  @Get('consorcio')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Lista proveedores asociados a un consorcio' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiQuery({ name: 'busqueda', required: false })
  @ApiQuery({ name: 'servicio', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de proveedores del consorcio' })
  async listarProveedoresConsorcio(
    @Query('consorcioId') consorcioId: string,
    @Query('busqueda') busqueda?: string,
    @Query('servicio') servicio?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filtros: FiltrosProveedorDto = { busqueda, servicio };
    return this.proveedoresService.listarProveedoresConsorcio(
      consorcioId,
      filtros,
      page,
      limit,
    );
  }

  @Get('servicios')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Lista servicios disponibles (para filtros)' })
  @ApiResponse({ status: 200, type: [String] })
  async listarServicios(): Promise<string[]> {
    return this.proveedoresService.obtenerServiciosDisponibles();
  }

  @Get(':id')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Obtiene detalle de un proveedor' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiQuery({ name: 'consorcioId', required: false })
  @ApiResponse({ status: 200, type: ProveedorResponseDto })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async obtenerProveedor(
    @Param('id') id: string,
    @Query('consorcioId') consorcioId?: string,
  ): Promise<ProveedorResponseDto> {
    return this.proveedoresService.obtenerProveedor(id, consorcioId);
  }

  @Post()
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Crea un nuevo proveedor' })
  @ApiResponse({ status: 201, type: ProveedorResponseDto })
  @ApiResponse({ status: 400, description: 'CUIT inválido' })
  @ApiResponse({ status: 409, description: 'CUIT ya existe' })
  async crearProveedor(
    @Body() dto: CreateProveedorDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ProveedorResponseDto> {
    return this.proveedoresService.crearProveedor(dto, user.userId);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Actualiza un proveedor' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiResponse({ status: 200, type: ProveedorResponseDto })
  @ApiResponse({ status: 404, description: 'Proveedor no encontrado' })
  async actualizarProveedor(
    @Param('id') id: string,
    @Body() dto: UpdateProveedorDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ProveedorResponseDto> {
    return this.proveedoresService.actualizarProveedor(id, dto, user.userId);
  }

  @Patch(':id/verificar')
  @Roles(Rol.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verifica o desverifica un proveedor (solo SUPER_ADMIN)' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiResponse({ status: 200, type: ProveedorResponseDto })
  async verificarProveedor(
    @Param('id') id: string,
    @Body() dto: VerificarProveedorDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ProveedorResponseDto> {
    return this.proveedoresService.verificarProveedor(id, dto, user.userId);
  }

  @Delete(':id')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactiva un proveedor (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiResponse({ status: 204, description: 'Proveedor desactivado' })
  @ApiResponse({ status: 400, description: 'Tiene trabajos pendientes' })
  async desactivarProveedor(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string },
  ): Promise<void> {
    return this.proveedoresService.desactivarProveedor(id, user.userId);
  }

  // ==========================================================================
  // ASOCIACIONES PROVEEDOR-CONSORCIO
  // ==========================================================================

  @Post('asociar')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Asocia un proveedor a un consorcio' })
  @ApiResponse({ status: 201, type: ProveedorResponseDto })
  @ApiResponse({ status: 409, description: 'Ya está asociado' })
  async asociarProveedor(
    @Body() dto: AsociarProveedorDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ProveedorResponseDto> {
    return this.proveedoresService.asociarAConsorcio(dto, user.userId);
  }

  @Patch(':id/asociacion')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Actualiza asociación proveedor-consorcio' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: ProveedorResponseDto })
  async actualizarAsociacion(
    @Param('id') proveedorId: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: UpdateAsociacionDto,
    @CurrentUser() user: { userId: string },
  ): Promise<ProveedorResponseDto> {
    return this.proveedoresService.actualizarAsociacion(
      proveedorId,
      consorcioId,
      dto,
      user.userId,
    );
  }

  @Delete(':id/asociacion')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desasocia un proveedor de un consorcio' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 204, description: 'Desasociado' })
  @ApiResponse({ status: 400, description: 'Tiene trabajos pendientes' })
  async desasociarProveedor(
    @Param('id') proveedorId: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<void> {
    return this.proveedoresService.desasociarDeConsorcio(
      proveedorId,
      consorcioId,
      user.userId,
    );
  }

  // ==========================================================================
  // TRABAJOS DE PROVEEDOR
  // ==========================================================================

  @Get('trabajos/listar')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Lista trabajos de proveedores (admin)' })
  @ApiQuery({ name: 'consorcioId', required: false })
  @ApiQuery({ name: 'estado', required: false, enum: ['pendiente', 'aprobado', 'rechazado'] })
  @ApiQuery({ name: 'fechaDesde', required: false })
  @ApiQuery({ name: 'fechaHasta', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de trabajos paginada' })
  async listarTrabajos(
    @Query('consorcioId') consorcioId?: string,
    @Query('estado') estado?: 'pendiente' | 'aprobado' | 'rechazado',
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filtros: FiltrosTrabajosDto = { consorcioId, estado, fechaDesde, fechaHasta };
    return this.proveedoresService.listarTrabajos(filtros, undefined, page, limit);
  }

  @Get(':id/trabajos')
  @Roles(...ROLES_LECTURA, Rol.PROVEEDOR_EXTERNO)
  @ApiOperation({ summary: 'Lista trabajos de un proveedor específico' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiQuery({ name: 'estado', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de trabajos del proveedor' })
  async listarTrabajosProveedor(
    @Param('id') proveedorId: string,
    @Query('estado') estado?: 'pendiente' | 'aprobado' | 'rechazado',
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    const filtros: FiltrosTrabajosDto = { estado };
    return this.proveedoresService.listarTrabajos(filtros, proveedorId, page, limit);
  }

  @Post(':id/trabajos')
  @Roles(Rol.PROVEEDOR_EXTERNO)
  @ApiOperation({ summary: 'Crea un trabajo (solo proveedor autenticado)' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiResponse({ status: 201, type: TrabajoResponseDto })
  @ApiResponse({ status: 403, description: 'No asociado al consorcio' })
  async crearTrabajo(
    @Param('id') proveedorId: string,
    @Body() dto: CreateTrabajoDto,
    @CurrentUser() user: { userId: string },
  ): Promise<TrabajoResponseDto> {
    return this.proveedoresService.crearTrabajo(dto, proveedorId, user.userId);
  }

  @Patch('trabajos/:trabajoId')
  @Roles(Rol.PROVEEDOR_EXTERNO)
  @ApiOperation({ summary: 'Actualiza un trabajo pendiente' })
  @ApiParam({ name: 'trabajoId', description: 'ID del trabajo' })
  @ApiQuery({ name: 'proveedorId', required: true })
  @ApiResponse({ status: 200, type: TrabajoResponseDto })
  @ApiResponse({ status: 400, description: 'Solo se pueden editar pendientes' })
  async actualizarTrabajo(
    @Param('trabajoId') trabajoId: string,
    @Query('proveedorId') proveedorId: string,
    @Body() dto: UpdateTrabajoDto,
    @CurrentUser() user: { userId: string },
  ): Promise<TrabajoResponseDto> {
    return this.proveedoresService.actualizarTrabajo(
      trabajoId,
      dto,
      proveedorId,
      user.userId,
    );
  }

  @Post('trabajos/:trabajoId/procesar')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprueba o rechaza un trabajo' })
  @ApiParam({ name: 'trabajoId', description: 'ID del trabajo' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: TrabajoResponseDto })
  @ApiResponse({ status: 400, description: 'Trabajo ya procesado' })
  async procesarTrabajo(
    @Param('trabajoId') trabajoId: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: AprobarTrabajoDto,
    @CurrentUser() user: { userId: string },
  ): Promise<TrabajoResponseDto> {
    return this.proveedoresService.aprobarRechazarTrabajo(
      trabajoId,
      dto,
      user.userId,
      consorcioId,
    );
  }

  @Delete('trabajos/:trabajoId')
  @Roles(Rol.PROVEEDOR_EXTERNO)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un trabajo pendiente' })
  @ApiParam({ name: 'trabajoId', description: 'ID del trabajo' })
  @ApiQuery({ name: 'proveedorId', required: true })
  @ApiResponse({ status: 204, description: 'Trabajo eliminado' })
  @ApiResponse({ status: 400, description: 'Solo se pueden eliminar pendientes' })
  async eliminarTrabajo(
    @Param('trabajoId') trabajoId: string,
    @Query('proveedorId') proveedorId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<void> {
    return this.proveedoresService.eliminarTrabajo(
      trabajoId,
      proveedorId,
      user.userId,
    );
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  @Get(':id/estadisticas')
  @Roles(...ROLES_LECTURA, Rol.PROVEEDOR_EXTERNO)
  @ApiOperation({ summary: 'Obtiene estadísticas del proveedor' })
  @ApiParam({ name: 'id', description: 'ID del proveedor' })
  @ApiResponse({ status: 200, type: EstadisticasProveedorDto })
  async obtenerEstadisticas(
    @Param('id') proveedorId: string,
  ): Promise<EstadisticasProveedorDto> {
    return this.proveedoresService.obtenerEstadisticas(proveedorId);
  }
}
