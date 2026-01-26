import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ConsorciosService } from './consorcios.service';
import {
  CreateConsorcioDto,
  UpdateConsorcioDto,
  ConsorcioBancarioDto,
  ConsorcioResponseDto,
  ConsorcioListResponseDto,
} from './dto/consorcio.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

// =============================================================================
// Controlador de Consorcios
// =============================================================================

@ApiTags('Consorcios')
@ApiBearerAuth()
@Controller('consorcios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ConsorciosController {
  constructor(private readonly consorciosService: ConsorciosService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR')
  @ApiOperation({ summary: 'Crear un nuevo consorcio' })
  @ApiResponse({ status: 201, type: ConsorcioResponseDto })
  @ApiResponse({ status: 403, description: 'Límite de consorcios alcanzado' })
  async create(
    @CurrentUser('organizacionId') organizacionId: string,
    @Body() dto: CreateConsorcioDto,
  ): Promise<ConsorcioResponseDto> {
    return this.consorciosService.create(organizacionId, dto);
  }

  @Get('dashboard/stats')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF')
  @ApiOperation({ summary: 'Obtener estadísticas globales del dashboard' })
  @ApiResponse({ status: 200, description: 'Estadísticas del dashboard' })
  async getDashboardStats(
    @CurrentUser('organizacionId') organizacionId: string,
  ) {
    return this.consorciosService.getDashboardStats(organizacionId);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF')
  @ApiOperation({ summary: 'Listar consorcios de la organización' })
  @ApiResponse({ status: 200, type: ConsorcioListResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  async findAll(
    @CurrentUser('organizacionId') organizacionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('activo') activo?: string,
  ): Promise<ConsorcioListResponseDto> {
    return this.consorciosService.findAll(organizacionId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      search,
      activo: activo !== undefined ? activo === 'true' : undefined,
    });
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF')
  @ApiOperation({ summary: 'Obtener un consorcio por ID' })
  @ApiResponse({ status: 200, type: ConsorcioResponseDto })
  @ApiResponse({ status: 404, description: 'Consorcio no encontrado' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
  ): Promise<ConsorcioResponseDto> {
    return this.consorciosService.findOne(id, organizacionId);
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR')
  @ApiOperation({ summary: 'Actualizar un consorcio' })
  @ApiResponse({ status: 200, type: ConsorcioResponseDto })
  @ApiResponse({ status: 404, description: 'Consorcio no encontrado' })
  async update(
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
    @Body() dto: UpdateConsorcioDto,
  ): Promise<ConsorcioResponseDto> {
    return this.consorciosService.update(id, organizacionId, dto);
  }

  @Patch(':id/bancario')
  @Roles('ADMINISTRADOR') // Solo el administrador puede cambiar datos bancarios
  @ApiOperation({ summary: 'Actualizar datos bancarios del consorcio' })
  @ApiResponse({ status: 200, type: ConsorcioResponseDto })
  async updateBancario(
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
    @Body() dto: ConsorcioBancarioDto,
  ): Promise<ConsorcioResponseDto> {
    return this.consorciosService.updateBancario(id, organizacionId, dto);
  }

  @Delete(':id')
  @Roles('ADMINISTRADOR') // Solo el administrador puede eliminar
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un consorcio (soft delete)' })
  @ApiResponse({ status: 204, description: 'Consorcio eliminado' })
  @ApiResponse({ status: 400, description: 'Consorcio tiene saldos pendientes' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
  ): Promise<void> {
    return this.consorciosService.remove(id, organizacionId);
  }

  @Get(':id/estadisticas')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF', 'AUDITOR')
  @ApiOperation({ summary: 'Obtener estadísticas del consorcio' })
  @ApiResponse({ status: 200 })
  async getEstadisticas(
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
  ) {
    return this.consorciosService.getEstadisticas(id, organizacionId);
  }
}
