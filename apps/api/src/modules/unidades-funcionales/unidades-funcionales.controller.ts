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
import { UnidadesFuncionalesService } from './unidades-funcionales.service';
import {
  CreateUnidadFuncionalDto,
  UpdateUnidadFuncionalDto,
  BulkCreateUnidadFuncionalDto,
  UnidadFuncionalResponseDto,
  UnidadFuncionalListResponseDto,
  ValidacionCoeficientesDto,
  TipoUnidadFuncional,
} from './dto/unidad-funcional.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

// =============================================================================
// Controlador de Unidades Funcionales
// =============================================================================

@ApiTags('Unidades Funcionales')
@ApiBearerAuth()
@Controller('consorcios/:consorcioId/unidades')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UnidadesFuncionalesController {
  constructor(private readonly service: UnidadesFuncionalesService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF')
  @ApiOperation({ summary: 'Crear una nueva unidad funcional' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({ status: 201, type: UnidadFuncionalResponseDto })
  @ApiResponse({ status: 409, description: 'Código de unidad duplicado' })
  async create(
    @Param('consorcioId') consorcioId: string,
    @CurrentUser('organizacionId') organizacionId: string,
    @Body() dto: CreateUnidadFuncionalDto,
  ): Promise<UnidadFuncionalResponseDto> {
    return this.service.create(consorcioId, organizacionId, dto);
  }

  @Post('bulk')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF')
  @ApiOperation({ summary: 'Crear múltiples unidades funcionales' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({ status: 201 })
  async bulkCreate(
    @Param('consorcioId') consorcioId: string,
    @CurrentUser('organizacionId') organizacionId: string,
    @Body() dto: BulkCreateUnidadFuncionalDto,
  ): Promise<{ created: number; errors: string[] }> {
    return this.service.bulkCreate(consorcioId, organizacionId, dto.unidades);
  }

  @Get()
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF', 'AUDITOR')
  @ApiOperation({ summary: 'Listar unidades funcionales del consorcio' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({ status: 200, type: UnidadFuncionalListResponseDto })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tipo', required: false, enum: TipoUnidadFuncional })
  @ApiQuery({ name: 'activo', required: false, type: Boolean })
  async findAll(
    @Param('consorcioId') consorcioId: string,
    @CurrentUser('organizacionId') organizacionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('tipo') tipo?: TipoUnidadFuncional,
    @Query('activo') activo?: string,
  ): Promise<UnidadFuncionalListResponseDto> {
    return this.service.findAll(consorcioId, organizacionId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      tipo,
      activo: activo !== undefined ? activo === 'true' : undefined,
    });
  }

  @Get('validar-coeficientes')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF', 'AUDITOR')
  @ApiOperation({ summary: 'Validar que los coeficientes sumen 100%' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({ status: 200, type: ValidacionCoeficientesDto })
  async validarCoeficientes(
    @Param('consorcioId') consorcioId: string,
    @CurrentUser('organizacionId') organizacionId: string,
  ): Promise<ValidacionCoeficientesDto> {
    return this.service.validarCoeficientes(consorcioId, organizacionId);
  }

  @Get(':id')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF', 'AUDITOR')
  @ApiOperation({ summary: 'Obtener una unidad funcional por ID' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiParam({ name: 'id', description: 'ID de la unidad funcional' })
  @ApiResponse({ status: 200, type: UnidadFuncionalResponseDto })
  @ApiResponse({ status: 404, description: 'Unidad no encontrada' })
  async findOne(
    @Param('consorcioId') consorcioId: string,
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
  ): Promise<UnidadFuncionalResponseDto> {
    return this.service.findOne(id, consorcioId, organizacionId);
  }

  @Get(':id/cuenta-corriente')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF', 'AUDITOR')
  @ApiOperation({ summary: 'Obtener cuenta corriente de la unidad' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiParam({ name: 'id', description: 'ID de la unidad funcional' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCuentaCorriente(
    @Param('consorcioId') consorcioId: string,
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.getCuentaCorriente(id, consorcioId, organizacionId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Put(':id')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF')
  @ApiOperation({ summary: 'Actualizar una unidad funcional' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiParam({ name: 'id', description: 'ID de la unidad funcional' })
  @ApiResponse({ status: 200, type: UnidadFuncionalResponseDto })
  async update(
    @Param('consorcioId') consorcioId: string,
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
    @Body() dto: UpdateUnidadFuncionalDto,
  ): Promise<UnidadFuncionalResponseDto> {
    return this.service.update(id, consorcioId, organizacionId, dto);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMINISTRADOR')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una unidad funcional (soft delete)' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiParam({ name: 'id', description: 'ID de la unidad funcional' })
  @ApiResponse({ status: 204, description: 'Unidad eliminada' })
  @ApiResponse({ status: 400, description: 'Unidad tiene saldo pendiente' })
  async remove(
    @Param('consorcioId') consorcioId: string,
    @Param('id') id: string,
    @CurrentUser('organizacionId') organizacionId: string,
  ): Promise<void> {
    return this.service.remove(id, consorcioId, organizacionId);
  }
}
