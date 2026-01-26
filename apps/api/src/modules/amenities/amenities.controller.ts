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
  Req,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AmenitiesService } from './amenities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import {
  CreateAmenityDto,
  UpdateAmenityDto,
  CreateReservaDto,
  UpdateReservaDto,
  CancelarReservaDto,
  FiltrosReservaDto,
  FiltrosDisponibilidadDto,
  AmenityResponseDto,
  ReservaResponseDto,
  DisponibilidadResponseDto,
  MisReservasStatsDto,
  PaginationQueryDto,
} from './dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    roles?: Rol[];
  };
}

// Roles con permisos de gestión de amenities
const ROLES_GESTION: Rol[] = [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF];

// Roles que pueden ver y reservar amenities
const ROLES_USUARIOS: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
  Rol.PROPIETARIO,
  Rol.INQUILINO,
];

@ApiTags('Amenities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('amenities')
export class AmenitiesController {
  constructor(private readonly amenitiesService: AmenitiesService) {}

  // ==========================================================================
  // AMENITIES CRUD
  // ==========================================================================

  @Get()
  @Roles(...ROLES_USUARIOS)
  @ApiOperation({ summary: 'Lista amenities del consorcio' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiQuery({ name: 'incluirInactivos', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [AmenityResponseDto] })
  async listarAmenities(
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Query('incluirInactivos') incluirInactivos?: string,
    @Req() req?: AuthenticatedRequest,
  ): Promise<AmenityResponseDto[]> {
    const esAdmin = req?.user?.roles?.some((r) => ROLES_GESTION.includes(r)) || false;
    return this.amenitiesService.listarAmenities(
      consorcioId,
      esAdmin && incluirInactivos === 'true',
    );
  }

  @Get(':id')
  @Roles(...ROLES_USUARIOS)
  @ApiOperation({ summary: 'Obtiene detalle de un amenity' })
  @ApiParam({ name: 'id', description: 'ID del amenity' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: AmenityResponseDto })
  async obtenerAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
  ): Promise<AmenityResponseDto> {
    return this.amenitiesService.obtenerAmenity(id, consorcioId);
  }

  @Post()
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Crea un nuevo amenity' })
  @ApiResponse({ status: 201, type: AmenityResponseDto })
  async crearAmenity(
    @Body() dto: CreateAmenityDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AmenityResponseDto> {
    return this.amenitiesService.crearAmenity(dto, req.user.id);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Actualiza un amenity' })
  @ApiParam({ name: 'id', description: 'ID del amenity' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: AmenityResponseDto })
  async actualizarAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Body() dto: UpdateAmenityDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<AmenityResponseDto> {
    return this.amenitiesService.actualizarAmenity(id, dto, req.user.id, consorcioId);
  }

  @Delete(':id')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un amenity (solo sin reservas futuras)' })
  @ApiParam({ name: 'id', description: 'ID del amenity' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 204 })
  async eliminarAmenity(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    await this.amenitiesService.eliminarAmenity(id, req.user.id, consorcioId);
  }

  // ==========================================================================
  // RESERVAS
  // ==========================================================================

  @Post('reservas')
  @Roles(...ROLES_USUARIOS)
  @ApiOperation({ summary: 'Crea una nueva reserva' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 201, type: ReservaResponseDto })
  async crearReserva(
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Body() dto: CreateReservaDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReservaResponseDto> {
    return this.amenitiesService.crearReserva(dto, req.user.id, consorcioId);
  }

  @Get('reservas/listar')
  @Roles(...ROLES_USUARIOS)
  @ApiOperation({ summary: 'Lista reservas del consorcio' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200 })
  async listarReservas(
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Query() filtros: FiltrosReservaDto,
    @Query() pagination: PaginationQueryDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ data: ReservaResponseDto[]; total: number; page: number; totalPages: number }> {
    const esAdmin = req.user?.roles?.some((r) => ROLES_GESTION.includes(r)) || false;
    return this.amenitiesService.listarReservas(
      consorcioId,
      req.user.id,
      esAdmin,
      filtros,
      pagination.page || 1,
      pagination.limit || 20,
    );
  }

  @Get('reservas/:id')
  @Roles(...ROLES_USUARIOS)
  @ApiOperation({ summary: 'Obtiene detalle de una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: ReservaResponseDto })
  async obtenerReserva(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReservaResponseDto> {
    const esAdmin = req.user?.roles?.some((r) => ROLES_GESTION.includes(r)) || false;
    return this.amenitiesService.obtenerReserva(id, req.user.id, esAdmin, consorcioId);
  }

  @Patch('reservas/:id/aprobar')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Aprueba o rechaza una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: ReservaResponseDto })
  async gestionarAprobacion(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Body() dto: UpdateReservaDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<ReservaResponseDto> {
    return this.amenitiesService.gestionarAprobacion(id, dto, req.user.id, consorcioId);
  }

  @Delete('reservas/:id')
  @Roles(...ROLES_USUARIOS)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cancela una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 204 })
  async cancelarReserva(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Body() dto: CancelarReservaDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    const esAdmin = req.user?.roles?.some((r) => ROLES_GESTION.includes(r)) || false;
    await this.amenitiesService.cancelarReserva(id, dto, req.user.id, esAdmin, consorcioId);
  }

  // ==========================================================================
  // DISPONIBILIDAD
  // ==========================================================================

  @Get('disponibilidad')
  @Roles(...ROLES_USUARIOS)
  @ApiOperation({ summary: 'Consulta disponibilidad de amenities para una fecha' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: [DisponibilidadResponseDto] })
  async consultarDisponibilidad(
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Query() filtros: FiltrosDisponibilidadDto,
  ): Promise<DisponibilidadResponseDto[]> {
    return this.amenitiesService.consultarDisponibilidad(consorcioId, filtros);
  }

  // ==========================================================================
  // MIS ESTADÍSTICAS
  // ==========================================================================

  @Get('mis-stats')
  @Roles(...ROLES_USUARIOS)
  @ApiOperation({ summary: 'Obtiene estadísticas de reservas del usuario' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: MisReservasStatsDto })
  async obtenerMisStats(
    @Query('consorcioId', ParseUUIDPipe) consorcioId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<MisReservasStatsDto> {
    return this.amenitiesService.obtenerMisStats(req.user.id, consorcioId);
  }
}
