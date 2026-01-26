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
import { TicketsService } from './tickets.service';
import {
  CreateTicketDto,
  UpdateTicketDto,
  CambiarEstadoTicketDto,
  AsignarTicketDto,
  CreateComentarioTicketDto,
  CreateArchivoTicketDto,
  FiltroTicketsDto,
  TicketResponseDto,
  TicketDetalleResponseDto,
  ListaTicketsResponseDto,
  ComentarioTicketResponseDto,
  EstadisticasTicketsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Rol } from '@prisma/client';
import { RequestWithUser } from '../../common/interfaces';

@ApiTags('Tickets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  // ============================================================================
  // CRUD DE TICKETS
  // ============================================================================

  @Post()
  @ApiOperation({
    summary: 'Crear ticket de mantenimiento',
    description: 'Cualquier usuario del consorcio puede crear un ticket',
  })
  @ApiResponse({
    status: 201,
    description: 'Ticket creado exitosamente',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 403, description: 'Sin acceso al consorcio' })
  async crearTicket(
    @Body() dto: CreateTicketDto,
    @Request() req: RequestWithUser,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.crearTicket(
      dto,
      req.user.id,
      req.ip,
    );
  }

  @Get('consorcio/:consorcioId')
  @ApiOperation({
    summary: 'Listar tickets de un consorcio',
    description: 'Admins ven todos, vecinos solo los suyos',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de tickets',
    type: ListaTicketsResponseDto,
  })
  async listarTickets(
    @Param('consorcioId') consorcioId: string,
    @Query() filtros: FiltroTicketsDto,
    @Request() req: RequestWithUser,
  ): Promise<ListaTicketsResponseDto> {
    return this.ticketsService.listarTickets(
      consorcioId,
      filtros,
      req.user.id,
    );
  }

  @Get('consorcio/:consorcioId/estadisticas')
  @ApiOperation({
    summary: 'Obtener estadísticas de tickets',
    description: 'Resumen de tickets por estado y métricas',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de tickets',
    type: EstadisticasTicketsDto,
  })
  async obtenerEstadisticas(
    @Param('consorcioId') consorcioId: string,
    @Request() req: RequestWithUser,
  ): Promise<EstadisticasTicketsDto> {
    return this.ticketsService.obtenerEstadisticas(
      consorcioId,
      req.user.id,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener detalle de ticket',
    description: 'Incluye comentarios y archivos',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del ticket',
    type: TicketDetalleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket no encontrado' })
  async obtenerTicket(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<TicketDetalleResponseDto> {
    return this.ticketsService.obtenerTicket(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar ticket',
    description: 'Solo el creador o admins pueden editar',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket actualizado',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No se puede editar ticket cerrado' })
  @ApiResponse({ status: 403, description: 'Sin permiso para editar' })
  async actualizarTicket(
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @Request() req: RequestWithUser,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.actualizarTicket(
      id,
      dto,
      req.user.id,
      req.ip,
    );
  }

  // ============================================================================
  // CAMBIOS DE ESTADO (SOLO ADMINS)
  // ============================================================================

  @Patch(':id/estado')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.ENCARGADO)
  @ApiOperation({
    summary: 'Cambiar estado del ticket',
    description: 'Solo administradores y encargados',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  async cambiarEstado(
    @Param('id') id: string,
    @Body() dto: CambiarEstadoTicketDto,
    @Request() req: RequestWithUser,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.cambiarEstado(
      id,
      dto,
      req.user.id,
      req.ip,
    );
  }

  @Patch(':id/asignar')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({
    summary: 'Asignar ticket a un usuario',
    description: 'Solo administradores',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({
    status: 200,
    description: 'Ticket asignado',
    type: TicketResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Usuario no pertenece al consorcio' })
  async asignarTicket(
    @Param('id') id: string,
    @Body() dto: AsignarTicketDto,
    @Request() req: RequestWithUser,
  ): Promise<TicketResponseDto> {
    return this.ticketsService.asignarTicket(
      id,
      dto,
      req.user.id,
      req.ip,
    );
  }

  // ============================================================================
  // COMENTARIOS
  // ============================================================================

  @Post(':id/comentarios')
  @ApiOperation({
    summary: 'Agregar comentario al ticket',
    description: 'Comentarios internos solo para admins',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({
    status: 201,
    description: 'Comentario agregado',
    type: ComentarioTicketResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No se puede comentar en ticket cerrado' })
  async agregarComentario(
    @Param('id') id: string,
    @Body() dto: CreateComentarioTicketDto,
    @Request() req: RequestWithUser,
  ): Promise<ComentarioTicketResponseDto> {
    return this.ticketsService.agregarComentario(
      id,
      dto,
      req.user.id,
      req.ip,
    );
  }

  // ============================================================================
  // ARCHIVOS
  // ============================================================================

  @Post(':id/archivos')
  @ApiOperation({
    summary: 'Agregar archivo al ticket',
    description: 'Máximo 10 archivos por ticket, máx 10MB cada uno',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiResponse({
    status: 201,
    description: 'Archivo agregado',
  })
  @ApiResponse({ status: 400, description: 'Límite de archivos alcanzado o tipo no permitido' })
  async agregarArchivo(
    @Param('id') id: string,
    @Body() dto: CreateArchivoTicketDto,
    @Request() req: RequestWithUser,
  ): Promise<{ id: string; url: string; nombre: string }> {
    return this.ticketsService.agregarArchivo(
      id,
      dto,
      req.user.id,
      req.ip,
    );
  }

  @Delete(':id/archivos/:archivoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Eliminar archivo del ticket',
    description: 'Solo el creador del ticket o admins',
  })
  @ApiParam({ name: 'id', description: 'ID del ticket' })
  @ApiParam({ name: 'archivoId', description: 'ID del archivo' })
  @ApiResponse({ status: 204, description: 'Archivo eliminado' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async eliminarArchivo(
    @Param('id') id: string,
    @Param('archivoId') archivoId: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.ticketsService.eliminarArchivo(
      id,
      archivoId,
      req.user.id,
      req.ip,
    );
  }
}
