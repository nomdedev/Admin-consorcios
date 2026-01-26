import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
import { AmenityRulesService } from './amenity-rules.service';
import {
  CreateReglaAmenityDto,
  UpdateReglaAmenityDto,
  AplicarPenalizacionDto,
  ReglaAmenityResponseDto,
  PenalizacionResponseDto,
  ValidacionReservaResultDto,
  ResumenPenalizacionesDto,
} from './dto/amenity-rules.dto';

@ApiTags('Amenities - Reglas y Penalizaciones')
@Controller('amenity-rules')
@ApiBearerAuth()
export class AmenityRulesController {
  constructor(private readonly service: AmenityRulesService) {}

  // ===========================================================================
  // CRUD de Reglas
  // ===========================================================================

  @Post()
  @ApiOperation({ summary: 'Crear nueva regla de amenity' })
  @ApiResponse({
    status: 201,
    description: 'Regla creada',
    type: ReglaAmenityResponseDto,
  })
  async crearRegla(@Body() dto: CreateReglaAmenityDto) {
    return this.service.crearRegla(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar regla' })
  @ApiParam({ name: 'id', description: 'ID de la regla' })
  @ApiResponse({
    status: 200,
    description: 'Regla actualizada',
    type: ReglaAmenityResponseDto,
  })
  async actualizarRegla(
    @Param('id') id: string,
    @Body() dto: UpdateReglaAmenityDto,
  ) {
    return this.service.actualizarRegla(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar regla' })
  @ApiParam({ name: 'id', description: 'ID de la regla' })
  @ApiResponse({ status: 204, description: 'Regla eliminada' })
  async eliminarRegla(@Param('id') id: string) {
    await this.service.eliminarRegla(id);
  }

  @Get('amenity/:amenityId')
  @ApiOperation({ summary: 'Obtener reglas de un amenity' })
  @ApiParam({ name: 'amenityId', description: 'ID del amenity' })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas',
    type: [ReglaAmenityResponseDto],
  })
  async obtenerReglasAmenity(@Param('amenityId') amenityId: string) {
    return this.service.obtenerReglasAmenity(amenityId);
  }

  @Get('consorcio/:consorcioId')
  @ApiOperation({ summary: 'Obtener todas las reglas de un consorcio' })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Lista de reglas por amenity',
    type: [ReglaAmenityResponseDto],
  })
  async obtenerReglasConsorcio(@Param('consorcioId') consorcioId: string) {
    return this.service.obtenerReglasConsorcio(consorcioId);
  }

  // ===========================================================================
  // Validación de Reservas
  // ===========================================================================

  @Get('validar')
  @ApiOperation({
    summary: 'Validar si una reserva cumple las reglas',
    description:
      'Verifica límites de período, horarios y penalizaciones activas del usuario',
  })
  @ApiQuery({ name: 'usuarioId', description: 'ID del usuario' })
  @ApiQuery({ name: 'amenityId', description: 'ID del amenity' })
  @ApiQuery({ name: 'fechaInicio', description: 'Fecha inicio ISO' })
  @ApiQuery({ name: 'fechaFin', description: 'Fecha fin ISO' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de validación',
    type: ValidacionReservaResultDto,
  })
  async validarReserva(
    @Query('usuarioId') usuarioId: string,
    @Query('amenityId') amenityId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.service.validarReserva(
      usuarioId,
      amenityId,
      new Date(fechaInicio),
      new Date(fechaFin),
    );
  }

  // ===========================================================================
  // Penalizaciones
  // ===========================================================================

  @Post('penalizaciones')
  @ApiOperation({ summary: 'Aplicar penalización manual a un usuario' })
  @ApiResponse({
    status: 201,
    description: 'Penalización aplicada',
    type: PenalizacionResponseDto,
  })
  async aplicarPenalizacion(@Body() dto: AplicarPenalizacionDto) {
    return this.service.aplicarPenalizacion(dto);
  }

  @Get('penalizaciones/activas/:usuarioId')
  @ApiOperation({ summary: 'Obtener penalizaciones activas de un usuario' })
  @ApiParam({ name: 'usuarioId', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Lista de penalizaciones activas',
    type: [PenalizacionResponseDto],
  })
  async obtenerPenalizacionesActivas(@Param('usuarioId') usuarioId: string) {
    return this.service.obtenerPenalizacionesActivas(usuarioId);
  }

  @Get('penalizaciones/resumen/:usuarioId')
  @ApiOperation({
    summary: 'Resumen de todas las penalizaciones de un usuario',
  })
  @ApiParam({ name: 'usuarioId', description: 'ID del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Resumen con totales',
    type: ResumenPenalizacionesDto,
  })
  async obtenerResumenPenalizaciones(@Param('usuarioId') usuarioId: string) {
    return this.service.obtenerResumenPenalizaciones(usuarioId);
  }

  @Post('penalizaciones/:id/pagar')
  @ApiOperation({
    summary: 'Marcar una multa como pagada',
    description: 'Se usa cuando la multa se incluye en una expensa',
  })
  @ApiParam({ name: 'id', description: 'ID de la penalización' })
  @ApiQuery({ name: 'periodoExpensa', description: 'Período ej: 2024-03' })
  @ApiResponse({
    status: 200,
    description: 'Penalización marcada como pagada',
    type: PenalizacionResponseDto,
  })
  async marcarMultaPagada(
    @Param('id') id: string,
    @Query('periodoExpensa') periodoExpensa: string,
  ) {
    return this.service.marcarMultaPagada(id, periodoExpensa);
  }

  // ===========================================================================
  // Procesamiento Automático
  // ===========================================================================

  @Post('procesar-no-shows/:consorcioId')
  @ApiOperation({
    summary: 'Procesar no-shows y aplicar penalizaciones automáticas',
    description:
      'Busca reservas pasadas sin completar y aplica las penalizaciones según las reglas configuradas',
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({
    status: 200,
    description: 'Resultado del procesamiento',
    schema: {
      properties: {
        procesadas: { type: 'number' },
        detalles: {
          type: 'array',
          items: {
            properties: {
              reservaId: { type: 'string' },
              amenity: { type: 'string' },
              penalizacionId: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async procesarNoShows(@Param('consorcioId') consorcioId: string) {
    return this.service.procesarNoShows(consorcioId);
  }
}
