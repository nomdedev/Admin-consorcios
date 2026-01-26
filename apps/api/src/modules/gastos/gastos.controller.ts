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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { GastosService } from './gastos.service';
import {
  CreateGastoDto,
  UpdateGastoDto,
  FilterGastosDto,
  CreateCategoriaGastoDto,
  UpdateCategoriaGastoDto,
  GastoResponseDto,
  GastoListResponseDto,
  CategoriaGastoResponseDto,
} from './dto';

// Interfaz para el request autenticado
interface AuthenticatedRequest {
  user: {
    sub: string;
    email: string;
  };
}

@ApiTags('Gastos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gastos')
export class GastosController {
  constructor(private readonly gastosService: GastosService) {}

  // ===========================================================================
  // CRUD DE GASTOS
  // ===========================================================================

  @Post()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Crear nuevo gasto',
    description:
      'Crea un nuevo gasto para un consorcio. Los gastos pueden asignarse ' +
      'opcionalmente a una expensa existente.',
  })
  @ApiResponse({
    status: 201,
    description: 'Gasto creado exitosamente',
    type: GastoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos para este consorcio' })
  async create(
    @Body() dto: CreateGastoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.create(dto, req.user.sub);
  }

  @Get()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Listar gastos',
    description:
      'Lista gastos con filtros opcionales. Incluye suma de montos y paginación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de gastos',
    type: GastoListResponseDto,
  })
  async findAll(
    @Query() filtros: FilterGastosDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.findAll(filtros, req.user.sub);
  }

  @Get(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Obtener gasto por ID',
    description: 'Obtiene el detalle completo de un gasto.',
  })
  @ApiParam({ name: 'id', description: 'ID del gasto' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del gasto',
    type: GastoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado' })
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.findOne(id, req.user.sub);
  }

  @Put(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Actualizar gasto',
    description:
      'Actualiza datos de un gasto. No se pueden modificar gastos ' +
      'asignados a expensas cerradas o publicadas.',
  })
  @ApiParam({ name: 'id', description: 'ID del gasto' })
  @ApiResponse({
    status: 200,
    description: 'Gasto actualizado',
    type: GastoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No se puede modificar el gasto' })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateGastoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.update(id, dto, req.user.sub);
  }

  @Delete(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar gasto',
    description:
      'Elimina un gasto. Solo ADMINISTRADOR o SUPER_ADMIN pueden eliminar. ' +
      'No se pueden eliminar gastos asignados a expensas cerradas.',
  })
  @ApiParam({ name: 'id', description: 'ID del gasto' })
  @ApiResponse({ status: 200, description: 'Gasto eliminado' })
  @ApiResponse({ status: 400, description: 'No se puede eliminar el gasto' })
  @ApiResponse({ status: 404, description: 'Gasto no encontrado' })
  async delete(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.delete(id, req.user.sub);
  }

  // ===========================================================================
  // CATEGORÍAS DE GASTOS
  // ===========================================================================

  @Get('categorias/todas')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({
    summary: 'Listar categorías de gastos',
    description: 'Lista todas las categorías de gastos disponibles.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de categorías',
    type: [CategoriaGastoResponseDto],
  })
  async findAllCategorias() {
    return this.gastosService.findAllCategorias();
  }

  @Post('categorias')
  @Roles(Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Crear categoría de gasto',
    description: 'Crea una nueva categoría global de gastos. Solo SUPER_ADMIN.',
  })
  @ApiResponse({
    status: 201,
    description: 'Categoría creada',
    type: CategoriaGastoResponseDto,
  })
  async createCategoria(
    @Body() dto: CreateCategoriaGastoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.createCategoria(dto, req.user.sub);
  }

  @Put('categorias/:id')
  @Roles(Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Actualizar categoría de gasto',
    description: 'Actualiza una categoría existente. Solo SUPER_ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({
    status: 200,
    description: 'Categoría actualizada',
    type: CategoriaGastoResponseDto,
  })
  async updateCategoria(
    @Param('id') id: string,
    @Body() dto: UpdateCategoriaGastoDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.updateCategoria(id, dto, req.user.sub);
  }

  @Delete('categorias/:id')
  @Roles(Rol.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar categoría de gasto',
    description:
      'Elimina una categoría. Solo SUPER_ADMIN. ' +
      'No se puede eliminar si tiene gastos asociados.',
  })
  @ApiParam({ name: 'id', description: 'ID de la categoría' })
  @ApiResponse({ status: 200, description: 'Categoría eliminada' })
  @ApiResponse({
    status: 400,
    description: 'Categoría tiene gastos asociados',
  })
  async deleteCategoria(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.gastosService.deleteCategoria(id, req.user.sub);
  }
}
