import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AlertasService } from './alertas.service';
import {
  CreateAlertaEmergenciaDto,
  ResolverAlertaDto,
  AlertaEmergenciaResponseDto,
} from './dto/alerta.dto';
import { Rol, TipoEmergencia } from '@prisma/client';

@ApiTags('Alertas de Emergencia')
@Controller('alertas')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertasController {
  constructor(private readonly alertasService: AlertasService) {}

  // ===========================================================================
  // Crear alerta (Solo admins)
  // ===========================================================================

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN, Rol.ENCARGADO)
  @ApiOperation({ 
    summary: 'Crear alerta de emergencia',
    description: 'Crea una alerta y dispara notificaciones en todos los canales configurados (push, email, WhatsApp, SMS).'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Alerta creada y notificaciones enviadas',
    type: AlertaEmergenciaResponseDto 
  })
  async crearAlerta(
    @Body() dto: CreateAlertaEmergenciaDto,
    @CurrentUser() user: { id: string }
  ): Promise<AlertaEmergenciaResponseDto> {
    return this.alertasService.crearAlerta(dto, user.id);
  }

  // ===========================================================================
  // Resolver alerta
  // ===========================================================================

  @Patch(':id/resolver')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN, Rol.ENCARGADO)
  @ApiOperation({ 
    summary: 'Marcar alerta como resuelta',
    description: 'Cierra una emergencia activa y notifica a todos los usuarios.'
  })
  @ApiParam({ name: 'id', description: 'ID de la alerta' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alerta resuelta',
    type: AlertaEmergenciaResponseDto 
  })
  async resolverAlerta(
    @Param('id') id: string,
    @Body() dto: ResolverAlertaDto,
    @CurrentUser() user: { id: string }
  ): Promise<AlertaEmergenciaResponseDto> {
    return this.alertasService.resolverAlerta(id, dto, user.id);
  }

  // ===========================================================================
  // Consultas
  // ===========================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una alerta' })
  @ApiParam({ name: 'id', description: 'ID de la alerta' })
  @ApiResponse({ 
    status: 200, 
    description: 'Detalle de la alerta',
    type: AlertaEmergenciaResponseDto 
  })
  async obtenerAlerta(
    @Param('id') id: string
  ): Promise<AlertaEmergenciaResponseDto> {
    return this.alertasService.obtenerAlerta(id);
  }

  @Get('consorcio/:consorcioId')
  @ApiOperation({ summary: 'Listar alertas de un consorcio' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiQuery({ name: 'activa', required: false, type: Boolean })
  @ApiQuery({ name: 'tipo', enum: TipoEmergencia, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de alertas',
    type: [AlertaEmergenciaResponseDto] 
  })
  async listarAlertas(
    @Param('consorcioId') consorcioId: string,
    @Query('activa') activa?: string,
    @Query('tipo') tipo?: TipoEmergencia,
  ): Promise<AlertaEmergenciaResponseDto[]> {
    return this.alertasService.listarAlertas(consorcioId, {
      activa: activa !== undefined ? activa === 'true' : undefined,
      tipo,
    });
  }

  @Get('consorcio/:consorcioId/activas')
  @ApiOperation({ 
    summary: 'Obtener alertas activas',
    description: 'Retorna solo las emergencias que aún no han sido resueltas.'
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({ 
    status: 200, 
    description: 'Alertas activas',
    type: [AlertaEmergenciaResponseDto] 
  })
  async obtenerAlertasActivas(
    @Param('consorcioId') consorcioId: string
  ): Promise<AlertaEmergenciaResponseDto[]> {
    return this.alertasService.obtenerAlertasActivas(consorcioId);
  }
}
