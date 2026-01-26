import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BadgesService } from './badges.service';
import {
  CreateBadgeDefinicionDto,
  OtorgarBadgeManualDto,
  EvaluarBadgesUsuarioDto,
  ConfigurarVisibilidadBadgeDto,
  BadgeDefinicionResponseDto,
  BadgeUsuarioResponseDto,
  ResumenBadgesUsuarioDto,
} from './dto/badge.dto';
import { Rol } from '@prisma/client';

@ApiTags('Badges (Gamificación)')
@Controller('badges')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // ===========================================================================
  // Gestión de definiciones (Admin)
  // ===========================================================================

  @Post('definiciones')
  @UseGuards(RolesGuard)
  @Roles(Rol.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear o actualizar definición de badge' })
  @ApiResponse({
    status: 201,
    description: 'Badge creado/actualizado',
    type: BadgeDefinicionResponseDto,
  })
  async crearOActualizarBadge(
    @Body() dto: CreateBadgeDefinicionDto
  ): Promise<BadgeDefinicionResponseDto> {
    return this.badgesService.crearOActualizarBadge(dto);
  }

  @Post('definiciones/inicializar')
  @UseGuards(RolesGuard)
  @Roles(Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Inicializar badges predefinidos del sistema',
    description: 'Crea los badges estándar si no existen',
  })
  @ApiResponse({
    status: 201,
    description: 'Badges inicializados',
    type: [BadgeDefinicionResponseDto],
  })
  async inicializarBadges(): Promise<BadgeDefinicionResponseDto[]> {
    return this.badgesService.inicializarBadgesPredefinidos();
  }

  @Get('definiciones')
  @ApiOperation({ summary: 'Listar todos los badges disponibles' })
  @ApiResponse({
    status: 200,
    description: 'Lista de badges',
    type: [BadgeDefinicionResponseDto],
  })
  async listarBadges(): Promise<BadgeDefinicionResponseDto[]> {
    return this.badgesService.obtenerBadgesDisponibles();
  }

  // ===========================================================================
  // Otorgamiento de badges
  // ===========================================================================

  @Post('otorgar')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Otorgar badge manualmente a un usuario',
    description: 'Para casos especiales o premios manuales',
  })
  @ApiResponse({
    status: 201,
    description: 'Badge otorgado',
    type: BadgeUsuarioResponseDto,
  })
  async otorgarBadgeManual(
    @Body() dto: OtorgarBadgeManualDto
  ): Promise<BadgeUsuarioResponseDto> {
    return this.badgesService.otorgarBadgeManual(dto);
  }

  @Post('evaluar')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Evaluar y otorgar badges automáticamente',
    description: 'Evalúa todos los criterios y otorga badges que correspondan',
  })
  @ApiResponse({
    status: 201,
    description: 'Badges otorgados',
    type: [BadgeUsuarioResponseDto],
  })
  async evaluarYOtorgarBadges(
    @Body() dto: EvaluarBadgesUsuarioDto
  ): Promise<BadgeUsuarioResponseDto[]> {
    return this.badgesService.evaluarYOtorgarBadgesPorPago(
      dto.usuarioId,
      dto.consorcioId
    );
  }

  // ===========================================================================
  // Consultas de usuario
  // ===========================================================================

  @Get('mis-badges/:consorcioId')
  @ApiOperation({
    summary: 'Obtener resumen de mis badges',
    description: 'Incluye badges obtenidos, beneficios activos y progreso',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Resumen de badges',
    type: ResumenBadgesUsuarioDto,
  })
  async obtenerMisBadges(
    @Param('consorcioId') consorcioId: string,
    @CurrentUser() user: { id: string }
  ): Promise<ResumenBadgesUsuarioDto> {
    return this.badgesService.obtenerResumenBadges(user.id, consorcioId);
  }

  @Get('usuario/:usuarioId/publicos')
  @ApiOperation({
    summary: 'Ver badges públicos de un usuario',
    description: 'Muestra solo los badges que el usuario eligió mostrar',
  })
  @ApiParam({ name: 'usuarioId', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Badges públicos',
    type: [BadgeUsuarioResponseDto],
  })
  async obtenerBadgesPublicos(
    @Param('usuarioId') usuarioId: string
  ): Promise<BadgeUsuarioResponseDto[]> {
    return this.badgesService.obtenerBadgesPublicos(usuarioId);
  }

  // ===========================================================================
  // Configuración de badges del usuario
  // ===========================================================================

  @Patch(':badgeUsuarioId/visibilidad')
  @ApiOperation({ summary: 'Configurar visibilidad de un badge' })
  @ApiParam({ name: 'badgeUsuarioId', description: 'ID del badge del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Visibilidad actualizada',
    type: BadgeUsuarioResponseDto,
  })
  async configurarVisibilidad(
    @Param('badgeUsuarioId') badgeUsuarioId: string,
    @Body() dto: ConfigurarVisibilidadBadgeDto
  ): Promise<BadgeUsuarioResponseDto> {
    return this.badgesService.configurarVisibilidad(
      badgeUsuarioId,
      dto.mostrarPublico
    );
  }

  @Post(':badgeUsuarioId/usar-beneficio')
  @ApiOperation({
    summary: 'Usar el beneficio de un badge',
    description: 'Marca el beneficio como usado (solo se puede usar una vez)',
  })
  @ApiParam({ name: 'badgeUsuarioId', description: 'ID del badge del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Beneficio usado',
    type: BadgeUsuarioResponseDto,
  })
  async usarBeneficio(
    @Param('badgeUsuarioId') badgeUsuarioId: string
  ): Promise<BadgeUsuarioResponseDto> {
    return this.badgesService.usarBeneficio(badgeUsuarioId);
  }
}
