import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificacionesService } from './notificaciones.service';
import {
  FiltroNotificacionesDto,
  MarcarLeidasDto,
  ListaNotificacionesResponseDto,
  NotificacionResponseDto,
  ContadorNotificacionesDto,
} from './dto';

// Interface para request con usuario autenticado
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Notificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
  ) {}

  // ==========================================================================
  // LISTAR MIS NOTIFICACIONES
  // ==========================================================================

  @Get()
  @ApiOperation({
    summary: 'Listar mis notificaciones',
    description:
      'Lista las notificaciones del usuario autenticado con filtros opcionales.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificaciones',
    type: ListaNotificacionesResponseDto,
  })
  async listarMisNotificaciones(
    @Req() req: AuthenticatedRequest,
    @Query() filtros: FiltroNotificacionesDto,
  ): Promise<ListaNotificacionesResponseDto> {
    return this.notificacionesService.listarNotificaciones(
      req.user.id,
      filtros,
    );
  }

  // ==========================================================================
  // CONTADOR DE NO LEÍDAS (Para badge en UI)
  // ==========================================================================

  @Get('contador')
  @ApiOperation({
    summary: 'Obtener contador de notificaciones no leídas',
    description:
      'Retorna el número de notificaciones no leídas para mostrar en badges.',
  })
  @ApiResponse({
    status: 200,
    description: 'Contador de notificaciones',
    type: ContadorNotificacionesDto,
  })
  async obtenerContador(
    @Req() req: AuthenticatedRequest,
  ): Promise<ContadorNotificacionesDto> {
    return this.notificacionesService.obtenerContadorNoLeidas(req.user.id);
  }

  // ==========================================================================
  // MARCAR UNA COMO LEÍDA
  // ==========================================================================

  @Patch(':id/leer')
  @ApiOperation({
    summary: 'Marcar notificación como leída',
    description: 'Marca una notificación específica como leída.',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({
    status: 200,
    description: 'Notificación marcada como leída',
    type: NotificacionResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Notificación no encontrada' })
  async marcarComoLeida(
    @Req() req: AuthenticatedRequest,
    @Param('id') notificacionId: string,
  ): Promise<NotificacionResponseDto> {
    try {
      return await this.notificacionesService.marcarComoLeida(
        req.user.id,
        notificacionId,
      );
    } catch {
      throw new NotFoundException('Notificación no encontrada');
    }
  }

  // ==========================================================================
  // MARCAR MÚLTIPLES COMO LEÍDAS
  // ==========================================================================

  @Post('leer-multiples')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar múltiples notificaciones como leídas',
    description:
      'Marca varias notificaciones como leídas en una sola operación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones marcadas',
    schema: {
      type: 'object',
      properties: {
        marcadas: { type: 'number', example: 5 },
      },
    },
  })
  async marcarVariasComoLeidas(
    @Req() req: AuthenticatedRequest,
    @Body() dto: MarcarLeidasDto,
  ): Promise<{ marcadas: number }> {
    return this.notificacionesService.marcarVariasComoLeidas(
      req.user.id,
      dto.notificacionIds,
    );
  }

  // ==========================================================================
  // MARCAR TODAS COMO LEÍDAS
  // ==========================================================================

  @Post('leer-todas')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marcar todas las notificaciones como leídas',
    description: 'Marca todas las notificaciones no leídas del usuario.',
  })
  @ApiResponse({
    status: 200,
    description: 'Todas marcadas como leídas',
    schema: {
      type: 'object',
      properties: {
        marcadas: { type: 'number', example: 15 },
      },
    },
  })
  async marcarTodasComoLeidas(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ marcadas: number }> {
    return this.notificacionesService.marcarTodasComoLeidas(req.user.id);
  }

  // ==========================================================================
  // ELIMINAR NOTIFICACIÓN
  // ==========================================================================

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Eliminar notificación',
    description: 'Elimina una notificación específica del usuario.',
  })
  @ApiParam({ name: 'id', description: 'ID de la notificación' })
  @ApiResponse({
    status: 200,
    description: 'Notificación eliminada',
    schema: {
      type: 'object',
      properties: {
        eliminada: { type: 'boolean', example: true },
      },
    },
  })
  async eliminarNotificacion(
    @Req() req: AuthenticatedRequest,
    @Param('id') notificacionId: string,
  ): Promise<{ eliminada: boolean }> {
    return this.notificacionesService.eliminarNotificacion(
      req.user.id,
      notificacionId,
    );
  }

  // ==========================================================================
  // LIMPIAR TODAS LAS NOTIFICACIONES LEÍDAS
  // ==========================================================================

  @Delete('limpiar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Limpiar notificaciones leídas',
    description:
      'Elimina todas las notificaciones que ya han sido marcadas como leídas.',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificaciones leídas eliminadas',
    schema: {
      type: 'object',
      properties: {
        eliminadas: { type: 'number', example: 10 },
      },
    },
  })
  async limpiarNotificacionesLeidas(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ eliminadas: number }> {
    return this.notificacionesService.limpiarLeidas(req.user.id);
  }
}
