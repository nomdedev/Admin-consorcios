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
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';

// Interface para request con usuario autenticado
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { ComunicadosService } from './comunicados.service';
import {
  CreateComunicadoDto,
  UpdateComunicadoDto,
  FiltroComunicadosDto,
  ComunicadoDetalleResponseDto,
  ListaComunicadosResponseDto,
  EstadisticasComunicadosDto,
  ComunicadoResponseDto,
} from './dto';

@ApiTags('Comunicados')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('comunicados')
export class ComunicadosController {
  constructor(private readonly comunicadosService: ComunicadosService) {}

  // ==========================================================================
  // CREAR COMUNICADO
  // ==========================================================================

  @Post('consorcio/:consorcioId')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Crear comunicado',
    description:
      'Crea un nuevo comunicado para el consorcio. Puede ser programado para publicación futura.',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 201,
    description: 'Comunicado creado exitosamente',
    type: ComunicadoDetalleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos para crear comunicados' })
  @ApiResponse({ status: 404, description: 'Consorcio no encontrado' })
  async crearComunicado(
    @Req() req: AuthenticatedRequest,
    @Param('consorcioId') consorcioId: string,
    @Body() dto: CreateComunicadoDto,
  ): Promise<ComunicadoDetalleResponseDto> {
    return this.comunicadosService.crearComunicado(
      req.user.id,
      consorcioId,
      dto,
    );
  }

  // ==========================================================================
  // LISTAR COMUNICADOS
  // ==========================================================================

  @Get('consorcio/:consorcioId')
  @ApiOperation({
    summary: 'Listar comunicados del consorcio',
    description:
      'Lista comunicados con filtros. Vecinos solo ven comunicados activos, admins ven todos.',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de comunicados',
    type: ListaComunicadosResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Sin acceso al consorcio' })
  @ApiResponse({ status: 404, description: 'Consorcio no encontrado' })
  async listarComunicados(
    @Req() req: AuthenticatedRequest,
    @Param('consorcioId') consorcioId: string,
    @Query() filtros: FiltroComunicadosDto,
  ): Promise<ListaComunicadosResponseDto> {
    return this.comunicadosService.listarComunicados(
      req.user.id,
      consorcioId,
      filtros,
    );
  }

  // ==========================================================================
  // COMUNICADOS RECIENTES (DASHBOARD)
  // ==========================================================================

  @Get('consorcio/:consorcioId/recientes')
  @ApiOperation({
    summary: 'Obtener comunicados recientes',
    description:
      'Obtiene los comunicados más recientes activos para mostrar en el dashboard.',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiQuery({
    name: 'cantidad',
    required: false,
    type: Number,
    description: 'Cantidad de comunicados a obtener (default: 5)',
  })
  @ApiResponse({
    status: 200,
    description: 'Comunicados recientes',
    type: [ComunicadoResponseDto],
  })
  async obtenerRecientes(
    @Req() req: AuthenticatedRequest,
    @Param('consorcioId') consorcioId: string,
    @Query('cantidad') cantidad?: number,
  ): Promise<ComunicadoResponseDto[]> {
    return this.comunicadosService.obtenerComunicadosRecientes(
      req.user.id,
      consorcioId,
      cantidad ?? 5,
    );
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  @Get('consorcio/:consorcioId/estadisticas')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Obtener estadísticas de comunicados',
    description:
      'Obtiene estadísticas de comunicados del consorcio (solo admins).',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de comunicados',
    type: EstadisticasComunicadosDto,
  })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async obtenerEstadisticas(
    @Req() req: AuthenticatedRequest,
    @Param('consorcioId') consorcioId: string,
  ): Promise<EstadisticasComunicadosDto> {
    return this.comunicadosService.obtenerEstadisticas(req.user.id, consorcioId);
  }

  // ==========================================================================
  // OBTENER COMUNICADO POR ID
  // ==========================================================================

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener comunicado por ID',
    description:
      'Obtiene el detalle de un comunicado. Vecinos solo pueden ver comunicados activos.',
  })
  @ApiParam({ name: 'id', description: 'ID del comunicado' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del comunicado',
    type: ComunicadoDetalleResponseDto,
  })
  @ApiResponse({ status: 403, description: 'Sin acceso al comunicado' })
  @ApiResponse({ status: 404, description: 'Comunicado no encontrado' })
  async obtenerComunicado(
    @Req() req: AuthenticatedRequest,
    @Param('id') comunicadoId: string,
  ): Promise<ComunicadoDetalleResponseDto> {
    return this.comunicadosService.obtenerComunicado(req.user.id, comunicadoId);
  }

  // ==========================================================================
  // ACTUALIZAR COMUNICADO
  // ==========================================================================

  @Put(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Actualizar comunicado',
    description: 'Actualiza un comunicado existente.',
  })
  @ApiParam({ name: 'id', description: 'ID del comunicado' })
  @ApiResponse({
    status: 200,
    description: 'Comunicado actualizado',
    type: ComunicadoDetalleResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  @ApiResponse({ status: 404, description: 'Comunicado no encontrado' })
  async actualizarComunicado(
    @Req() req: AuthenticatedRequest,
    @Param('id') comunicadoId: string,
    @Body() dto: UpdateComunicadoDto,
  ): Promise<ComunicadoDetalleResponseDto> {
    return this.comunicadosService.actualizarComunicado(
      req.user.id,
      comunicadoId,
      dto,
    );
  }

  // ==========================================================================
  // ELIMINAR COMUNICADO
  // ==========================================================================

  @Delete(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar comunicado',
    description:
      'Elimina un comunicado. Solo SUPER_ADMIN y ADMINISTRADOR pueden eliminar.',
  })
  @ApiParam({ name: 'id', description: 'ID del comunicado' })
  @ApiResponse({
    status: 200,
    description: 'Comunicado eliminado',
    schema: {
      type: 'object',
      properties: {
        mensaje: { type: 'string', example: 'Comunicado eliminado exitosamente' },
      },
    },
  })
  @ApiResponse({ status: 403, description: 'Sin permisos para eliminar' })
  @ApiResponse({ status: 404, description: 'Comunicado no encontrado' })
  async eliminarComunicado(
    @Req() req: AuthenticatedRequest,
    @Param('id') comunicadoId: string,
  ): Promise<{ mensaje: string }> {
    return this.comunicadosService.eliminarComunicado(req.user.id, comunicadoId);
  }
}
