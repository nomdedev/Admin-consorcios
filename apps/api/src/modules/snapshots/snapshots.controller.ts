import {
  Controller,
  Get,
  Post,
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
import { SnapshotsService } from './snapshots.service';
import {
  CerrarExpensaDto,
  CreateNotaCreditoDebitoDto,
  SnapshotExpensaResponseDto,
  SnapshotConDetalleDto,
  NotaCreditoDebitoResponseDto,
} from './dto/snapshot.dto';
import { Rol } from '@prisma/client';

@ApiTags('Snapshots de Expensas')
@Controller('snapshots')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SnapshotsController {
  constructor(private readonly snapshotsService: SnapshotsService) {}

  // ===========================================================================
  // Cerrar expensa y crear snapshot
  // ===========================================================================

  @Post('cerrar-expensa')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Cerrar expensa y crear snapshot inmutable',
    description:
      'Cierra definitivamente una expensa y crea un snapshot inmutable con hash de integridad. ' +
      'Una vez cerrada, solo se pueden hacer ajustes mediante notas de crédito/débito.',
  })
  @ApiResponse({
    status: 201,
    description: 'Snapshot creado',
    type: SnapshotConDetalleDto,
  })
  async cerrarExpensa(
    @Body() dto: CerrarExpensaDto,
    @CurrentUser() user: { id: string }
  ): Promise<SnapshotConDetalleDto> {
    return this.snapshotsService.cerrarExpensa(dto, user.id);
  }

  // ===========================================================================
  // Notas de crédito/débito
  // ===========================================================================

  @Post('notas')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Crear nota de crédito/débito',
    description:
      'Única forma de ajustar montos después del cierre de una expensa. ' +
      'Requiere justificación y queda registrado en auditoría.',
  })
  @ApiResponse({
    status: 201,
    description: 'Nota creada',
    type: NotaCreditoDebitoResponseDto,
  })
  async crearNota(
    @Body() dto: CreateNotaCreditoDebitoDto,
    @CurrentUser() user: { id: string }
  ): Promise<NotaCreditoDebitoResponseDto> {
    return this.snapshotsService.crearNotaCreditoDebito(dto, user.id);
  }

  // ===========================================================================
  // Consultas
  // ===========================================================================

  @Get(':id')
  @ApiOperation({ summary: 'Obtener snapshot por ID' })
  @ApiParam({ name: 'id', description: 'ID del snapshot' })
  @ApiResponse({
    status: 200,
    description: 'Detalle del snapshot',
    type: SnapshotConDetalleDto,
  })
  async obtenerSnapshot(@Param('id') id: string): Promise<SnapshotConDetalleDto> {
    return this.snapshotsService.obtenerSnapshot(id);
  }

  @Get('expensa/:expensaId')
  @ApiOperation({ summary: 'Obtener snapshot de una expensa' })
  @ApiParam({ name: 'expensaId', description: 'ID de la expensa' })
  @ApiResponse({
    status: 200,
    description: 'Snapshot de la expensa',
    type: SnapshotConDetalleDto,
  })
  async obtenerSnapshotPorExpensa(
    @Param('expensaId') expensaId: string
  ): Promise<SnapshotConDetalleDto> {
    return this.snapshotsService.obtenerSnapshotPorExpensa(expensaId);
  }

  @Get('consorcio/:consorcioId')
  @ApiOperation({ summary: 'Listar snapshots de un consorcio' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de snapshots',
    type: [SnapshotExpensaResponseDto],
  })
  async listarSnapshots(
    @Param('consorcioId') consorcioId: string
  ): Promise<SnapshotExpensaResponseDto[]> {
    return this.snapshotsService.listarSnapshots(consorcioId);
  }

  // ===========================================================================
  // Verificación de integridad
  // ===========================================================================

  @Get(':id/verificar-integridad')
  @ApiOperation({
    summary: 'Verificar integridad del snapshot',
    description:
      'Recalcula el hash y lo compara con el almacenado para verificar que no fue alterado.',
  })
  @ApiParam({ name: 'id', description: 'ID del snapshot' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la verificación',
  })
  async verificarIntegridad(@Param('id') id: string) {
    return this.snapshotsService.verificarIntegridad(id);
  }

  // ===========================================================================
  // Certificado de deuda (para juicios)
  // ===========================================================================

  @Get('certificado-deuda/:consorcioId/:unidadFuncionalId')
  @UseGuards(RolesGuard)
  @Roles(Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR, Rol.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Generar certificado de deuda',
    description:
      'Genera un certificado con todo el historial de deuda para uso legal. ' +
      'Incluye hashes de integridad para validación.',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiParam({ name: 'unidadFuncionalId', description: 'ID de la unidad funcional' })
  @ApiResponse({
    status: 200,
    description: 'Certificado de deuda',
  })
  async generarCertificadoDeuda(
    @Param('consorcioId') consorcioId: string,
    @Param('unidadFuncionalId') unidadFuncionalId: string
  ) {
    return this.snapshotsService.generarCertificadoDeuda(
      unidadFuncionalId,
      consorcioId
    );
  }

  // ===========================================================================
  // Notas por unidad
  // ===========================================================================

  @Get('notas/unidad/:unidadFuncionalId')
  @ApiOperation({ summary: 'Obtener notas de crédito/débito de una unidad' })
  @ApiParam({ name: 'unidadFuncionalId', description: 'ID de la unidad funcional' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notas',
    type: [NotaCreditoDebitoResponseDto],
  })
  async obtenerNotasPorUnidad(
    @Param('unidadFuncionalId') unidadFuncionalId: string
  ): Promise<NotaCreditoDebitoResponseDto[]> {
    return this.snapshotsService.obtenerNotasPorUnidad(unidadFuncionalId);
  }
}
