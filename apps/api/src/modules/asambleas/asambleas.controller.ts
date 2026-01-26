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
import { AsambleasService } from './asambleas.service';
import { Rol, EstadoAsamblea } from '@prisma/client';
import {
  CreateAsambleaDto,
  UpdateAsambleaDto,
  CreatePuntoOrdenDto,
  UpdatePuntoOrdenDto,
  RegistrarAsistenciaDto,
  EmitirVotoDto,
  FiltrosAsambleaDto,
  GenerarActaDto,
  AsambleaResponseDto,
  PuntoOrdenResponseDto,
  AsistenciaResponseDto,
  ResultadoVotacionDto,
  MiVotoDto,
  QuorumResponseDto,
} from './dto';

// Roles que pueden ver asambleas
const ROLES_LECTURA: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
  Rol.PROPIETARIO,
  Rol.AUDITOR,
];

// Roles que pueden gestionar asambleas
const ROLES_GESTION: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
];

// Roles que pueden votar
const ROLES_VOTO: Rol[] = [
  Rol.PROPIETARIO,
];

@ApiTags('Asambleas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('asambleas')
export class AsambleasController {
  constructor(private readonly asambleasService: AsambleasService) {}

  // ==========================================================================
  // ASAMBLEAS CRUD
  // ==========================================================================

  @Get()
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Lista asambleas del consorcio' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiQuery({ name: 'estado', required: false, enum: EstadoAsamblea })
  @ApiQuery({ name: 'fechaDesde', required: false })
  @ApiQuery({ name: 'fechaHasta', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de asambleas paginada' })
  async listarAsambleas(
    @Query('consorcioId') consorcioId: string,
    @Query('estado') estado?: EstadoAsamblea,
    @Query('fechaDesde') fechaDesde?: string,
    @Query('fechaHasta') fechaHasta?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
  ) {
    const filtros: FiltrosAsambleaDto = { estado, fechaDesde, fechaHasta };
    return this.asambleasService.listarAsambleas(consorcioId, filtros, page, limit);
  }

  @Get(':id')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Obtiene detalle de una asamblea' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: AsambleaResponseDto })
  @ApiResponse({ status: 404, description: 'Asamblea no encontrada' })
  async obtenerAsamblea(
    @Param('id') id: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string; rol: Rol },
  ): Promise<AsambleaResponseDto> {
    const esAdmin = ROLES_GESTION.includes(user.rol);
    return this.asambleasService.obtenerAsamblea(id, consorcioId, esAdmin);
  }

  @Post()
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Crea una nueva asamblea' })
  @ApiResponse({ status: 201, type: AsambleaResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Ya existe asamblea ese día' })
  async crearAsamblea(
    @Body() dto: CreateAsambleaDto,
    @CurrentUser() user: { userId: string },
  ): Promise<AsambleaResponseDto> {
    return this.asambleasService.crearAsamblea(dto, user.userId);
  }

  @Patch(':id')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Actualiza una asamblea programada' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: AsambleaResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o asamblea no editable' })
  @ApiResponse({ status: 404, description: 'Asamblea no encontrada' })
  async actualizarAsamblea(
    @Param('id') id: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: UpdateAsambleaDto,
    @CurrentUser() user: { userId: string },
  ): Promise<AsambleaResponseDto> {
    return this.asambleasService.actualizarAsamblea(id, dto, user.userId, consorcioId);
  }

  @Post(':id/iniciar')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia una asamblea (verifica quórum)' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: AsambleaResponseDto })
  @ApiResponse({ status: 400, description: 'Quórum no alcanzado o transición inválida' })
  async iniciarAsamblea(
    @Param('id') id: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<AsambleaResponseDto> {
    return this.asambleasService.cambiarEstado(
      id,
      EstadoAsamblea.EN_CURSO,
      user.userId,
      consorcioId,
    );
  }

  @Post(':id/finalizar')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finaliza una asamblea en curso' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: AsambleaResponseDto })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  async finalizarAsamblea(
    @Param('id') id: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<AsambleaResponseDto> {
    return this.asambleasService.cambiarEstado(
      id,
      EstadoAsamblea.FINALIZADA,
      user.userId,
      consorcioId,
    );
  }

  @Post(':id/cancelar')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela una asamblea' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: AsambleaResponseDto })
  @ApiResponse({ status: 400, description: 'Transición de estado inválida' })
  async cancelarAsamblea(
    @Param('id') id: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<AsambleaResponseDto> {
    return this.asambleasService.cambiarEstado(
      id,
      EstadoAsamblea.CANCELADA,
      user.userId,
      consorcioId,
    );
  }

  // ==========================================================================
  // PUNTOS DEL ORDEN DEL DÍA
  // ==========================================================================

  @Post(':id/puntos')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Agrega un punto al orden del día' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 201, type: PuntoOrdenResponseDto })
  @ApiResponse({ status: 400, description: 'Asamblea no editable' })
  @ApiResponse({ status: 409, description: 'Ya existe ese número de orden' })
  async agregarPuntoOrden(
    @Param('id') asambleaId: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: CreatePuntoOrdenDto,
    @CurrentUser() user: { userId: string },
  ): Promise<PuntoOrdenResponseDto> {
    return this.asambleasService.agregarPuntoOrden(
      asambleaId,
      dto,
      user.userId,
      consorcioId,
    );
  }

  @Patch(':id/puntos/:puntoId')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Actualiza un punto del orden del día' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiParam({ name: 'puntoId', description: 'ID del punto' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: PuntoOrdenResponseDto })
  @ApiResponse({ status: 400, description: 'Asamblea no editable' })
  async actualizarPuntoOrden(
    @Param('id') _asambleaId: string,
    @Param('puntoId') puntoId: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: UpdatePuntoOrdenDto,
    @CurrentUser() user: { userId: string },
  ): Promise<PuntoOrdenResponseDto> {
    return this.asambleasService.actualizarPuntoOrden(
      puntoId,
      dto,
      user.userId,
      consorcioId,
    );
  }

  @Delete(':id/puntos/:puntoId')
  @Roles(...ROLES_GESTION)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Elimina un punto del orden del día' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiParam({ name: 'puntoId', description: 'ID del punto' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 204, description: 'Punto eliminado' })
  @ApiResponse({ status: 400, description: 'Asamblea no editable' })
  async eliminarPuntoOrden(
    @Param('id') _asambleaId: string,
    @Param('puntoId') puntoId: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<void> {
    return this.asambleasService.eliminarPuntoOrden(
      puntoId,
      user.userId,
      consorcioId,
    );
  }

  // ==========================================================================
  // ASISTENCIA
  // ==========================================================================

  @Get(':id/asistencia')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Lista asistencia de una asamblea' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: [AsistenciaResponseDto] })
  async listarAsistencia(
    @Param('id') asambleaId: string,
    @Query('consorcioId') consorcioId: string,
  ): Promise<AsistenciaResponseDto[]> {
    return this.asambleasService.listarAsistencia(asambleaId, consorcioId);
  }

  @Post(':id/asistencia')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Registra asistencia de un propietario' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 201, type: AsistenciaResponseDto })
  @ApiResponse({ status: 400, description: 'Usuario no es propietario titular' })
  async registrarAsistencia(
    @Param('id') asambleaId: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: RegistrarAsistenciaDto,
    @CurrentUser() user: { userId: string },
  ): Promise<AsistenciaResponseDto> {
    return this.asambleasService.registrarAsistencia(
      asambleaId,
      dto,
      user.userId,
      consorcioId,
    );
  }

  // ==========================================================================
  // QUÓRUM
  // ==========================================================================

  @Get(':id/quorum')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Obtiene información del quórum actual' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: QuorumResponseDto })
  async obtenerQuorum(
    @Param('id') asambleaId: string,
    @Query('consorcioId') consorcioId: string,
  ): Promise<QuorumResponseDto> {
    const quorum = await this.asambleasService.calcularQuorum(asambleaId, consorcioId);
    return quorum;
  }

  // ==========================================================================
  // VOTACIÓN
  // ==========================================================================

  @Post(':id/puntos/:puntoId/votar')
  @Roles(...ROLES_VOTO)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Emite voto en un punto' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiParam({ name: 'puntoId', description: 'ID del punto de votación' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 201, type: MiVotoDto })
  @ApiResponse({ status: 400, description: 'Asamblea no en curso o punto no requiere votación' })
  @ApiResponse({ status: 403, description: 'No autorizado para votar' })
  @ApiResponse({ status: 409, description: 'Ya votó en este punto' })
  async emitirVoto(
    @Param('id') _asambleaId: string,
    @Param('puntoId') puntoId: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: EmitirVotoDto,
    @CurrentUser() user: { userId: string },
  ): Promise<MiVotoDto> {
    return this.asambleasService.emitirVoto(
      puntoId,
      dto,
      user.userId,
      consorcioId,
    );
  }

  @Get(':id/puntos/:puntoId/resultado')
  @Roles(...ROLES_LECTURA)
  @ApiOperation({ summary: 'Obtiene resultado de votación de un punto' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiParam({ name: 'puntoId', description: 'ID del punto de votación' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: ResultadoVotacionDto })
  async obtenerResultadoVotacion(
    @Param('id') _asambleaId: string,
    @Param('puntoId') puntoId: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string; rol: Rol },
  ): Promise<ResultadoVotacionDto> {
    const esAdmin = ROLES_GESTION.includes(user.rol);
    return this.asambleasService.obtenerResultadoVotacion(puntoId, consorcioId, esAdmin);
  }

  @Get(':id/puntos/:puntoId/mi-voto')
  @Roles(...ROLES_VOTO)
  @ApiOperation({ summary: 'Obtiene mi voto en un punto' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiParam({ name: 'puntoId', description: 'ID del punto de votación' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 200, type: MiVotoDto })
  @ApiResponse({ status: 200, description: 'null si no ha votado' })
  async obtenerMiVoto(
    @Param('id') _asambleaId: string,
    @Param('puntoId') puntoId: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: { userId: string },
  ): Promise<MiVotoDto | null> {
    return this.asambleasService.obtenerMiVoto(puntoId, user.userId, consorcioId);
  }

  // ==========================================================================
  // ACTA
  // ==========================================================================

  @Post(':id/acta')
  @Roles(...ROLES_GESTION)
  @ApiOperation({ summary: 'Genera el acta de la asamblea' })
  @ApiParam({ name: 'id', description: 'ID de la asamblea' })
  @ApiQuery({ name: 'consorcioId', required: true })
  @ApiResponse({ status: 201, description: 'Acta generada con URL y hash' })
  @ApiResponse({ status: 400, description: 'Asamblea no finalizada' })
  async generarActa(
    @Param('id') asambleaId: string,
    @Query('consorcioId') consorcioId: string,
    @Body() dto: GenerarActaDto,
    @CurrentUser() user: { userId: string },
  ): Promise<{ actaUrl: string; actaHash: string }> {
    return this.asambleasService.generarActa(
      asambleaId,
      dto,
      user.userId,
      consorcioId,
    );
  }
}
