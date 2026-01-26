import {
  Controller,
  Get,
  Post,
  Patch,
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
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ClaimingService } from './claiming.service';
import {
  CreateInvitacionDto,
  CreateInvitacionBulkDto,
  ClaimUnidadDto,
  ValidarCodigoDto,
  InvitacionResponseDto,
  InvitacionConDetalleDto,
  ValidacionCodigoResponseDto,
  ClaimResultDto,
  BulkInvitacionResultDto,
} from './dto/claiming.dto';
import { Rol, EstadoInvitacion } from '@prisma/client';

@ApiTags('Claiming / KYC')
@Controller('claiming')
export class ClaimingController {
  constructor(private readonly claimingService: ClaimingService) {}

  // ===========================================================================
  // Endpoints públicos (pre-auth) para validar código
  // ===========================================================================

  @Post('validar-codigo')
  @HttpCode(HttpStatus.OK)
  // ✅ SEGURIDAD: Rate limit para prevenir enumeración de códigos
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 intentos por minuto
  @ApiOperation({ 
    summary: 'Validar código de invitación',
    description: 'Verifica si un código es válido sin consumirlo. Útil para mostrar preview al usuario.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Resultado de la validación',
    type: ValidacionCodigoResponseDto 
  })
  async validarCodigo(
    @Body() dto: ValidarCodigoDto
  ): Promise<ValidacionCodigoResponseDto> {
    return this.claimingService.validarCodigo(dto);
  }

  // ===========================================================================
  // Endpoints autenticados para usuarios
  // ===========================================================================

  @Post('reclamar')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Reclamar una unidad funcional',
    description: 'Usa el código de invitación para asociar tu cuenta a una unidad funcional.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Unidad reclamada exitosamente',
    type: ClaimResultDto 
  })
  @ApiResponse({ status: 400, description: 'Código inválido o expirado' })
  @ApiResponse({ status: 403, description: 'Demasiados intentos fallidos' })
  async claimUnidad(
    @Body() dto: ClaimUnidadDto,
    @CurrentUser() user: { id: string }
  ): Promise<ClaimResultDto> {
    return this.claimingService.claimUnidad(dto, user.id);
  }

  // ===========================================================================
  // Endpoints para administradores
  // ===========================================================================

  @Post('invitaciones')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Crear invitación para una unidad',
    description: 'Genera un código de invitación para que un usuario reclame una unidad funcional.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invitación creada',
    type: InvitacionConDetalleDto 
  })
  async crearInvitacion(
    @Body() dto: CreateInvitacionDto,
    @CurrentUser() user: { id: string }
  ): Promise<InvitacionConDetalleDto> {
    return this.claimingService.crearInvitacion(dto, user.id);
  }

  @Post('invitaciones/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Crear invitaciones en lote',
    description: 'Genera invitaciones para múltiples unidades o todas las unidades sin invitación activa.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invitaciones creadas',
    type: BulkInvitacionResultDto 
  })
  async crearInvitacionesBulk(
    @Body() dto: CreateInvitacionBulkDto,
    @CurrentUser() user: { id: string }
  ): Promise<BulkInvitacionResultDto> {
    return this.claimingService.crearInvitacionesBulk(dto, user.id);
  }

  @Get('invitaciones/:consorcioId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar invitaciones de un consorcio' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiQuery({ name: 'estado', enum: EstadoInvitacion, required: false })
  @ApiQuery({ name: 'unidadFuncionalId', required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de invitaciones',
    type: [InvitacionResponseDto] 
  })
  async listarInvitaciones(
    @Param('consorcioId') consorcioId: string,
    @Query('estado') estado?: EstadoInvitacion,
    @Query('unidadFuncionalId') unidadFuncionalId?: string,
  ): Promise<InvitacionResponseDto[]> {
    return this.claimingService.listarInvitaciones(consorcioId, {
      estado,
      unidadFuncionalId,
    });
  }

  @Patch('invitaciones/:id/revocar')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revocar una invitación' })
  @ApiParam({ name: 'id', description: 'ID de la invitación' })
  @ApiResponse({ 
    status: 200, 
    description: 'Invitación revocada',
    type: InvitacionResponseDto 
  })
  async revocarInvitacion(
    @Param('id') id: string,
    @CurrentUser() user: { id: string }
  ): Promise<InvitacionResponseDto> {
    return this.claimingService.revocarInvitacion(id, user.id);
  }

  @Patch('invitaciones/:id/regenerar-codigo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Regenerar código de invitación',
    description: 'Genera un nuevo código para la misma invitación. Útil si el código se filtró.'
  })
  @ApiParam({ name: 'id', description: 'ID de la invitación' })
  @ApiResponse({ 
    status: 200, 
    description: 'Código regenerado',
    type: InvitacionResponseDto 
  })
  async regenerarCodigo(
    @Param('id') id: string
  ): Promise<InvitacionResponseDto> {
    return this.claimingService.regenerarCodigo(id);
  }
}
