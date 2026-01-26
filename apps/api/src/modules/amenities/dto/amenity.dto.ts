import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  IsNumber,
  IsDateString,
  IsEnum,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

// ============================================================================
// ENUMS LOCALES
// ============================================================================

export enum EstadoReserva {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
  CANCELADA = 'CANCELADA',
  COMPLETADA = 'COMPLETADA',
  NO_SHOW = 'NO_SHOW',
}

// ============================================================================
// CREAR AMENITY
// ============================================================================

export class CreateAmenityDto {
  @ApiProperty({
    description: 'ID del consorcio',
    example: 'clxyz123...',
  })
  @IsUUID()
  consorcioId: string;

  @ApiProperty({
    description: 'Nombre del amenity',
    example: 'SUM - Salón de Usos Múltiples',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100, { message: 'El nombre no puede superar 100 caracteres' })
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del amenity',
    example: 'Salón con capacidad para eventos, incluye cocina y baños',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Capacidad máxima de personas',
    example: 50,
    minimum: 1,
    maximum: 1000,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  capacidad?: number;

  @ApiPropertyOptional({
    description: '¿Requiere aprobación del administrador?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereAprobacion?: boolean;

  @ApiPropertyOptional({
    description: 'Anticipación mínima para reservar (en horas)',
    example: 24,
    default: 24,
    minimum: 1,
    maximum: 720,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(720)
  anticipacionMinima?: number;

  @ApiPropertyOptional({
    description: 'Anticipación máxima para reservar (en horas)',
    example: 720,
    default: 720,
    minimum: 24,
    maximum: 8760, // 1 año
  })
  @IsOptional()
  @IsInt()
  @Min(24)
  @Max(8760)
  anticipacionMaxima?: number;

  @ApiPropertyOptional({
    description: 'Duración máxima de una reserva (en horas)',
    example: 4,
    default: 4,
    minimum: 1,
    maximum: 24,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(24)
  duracionMaxima?: number;

  @ApiPropertyOptional({
    description: 'Costo por reserva (ARS)',
    example: 5000.00,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Transform(({ value }) => value !== undefined ? parseFloat(value) : undefined)
  costoReserva?: number;
}

// ============================================================================
// ACTUALIZAR AMENITY
// ============================================================================

export class UpdateAmenityDto extends PartialType(CreateAmenityDto) {
  @ApiPropertyOptional({
    description: 'Estado activo/inactivo del amenity',
  })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// ============================================================================
// CREAR RESERVA
// ============================================================================

export class CreateReservaDto {
  @ApiProperty({
    description: 'ID del amenity a reservar',
    example: 'clxyz123...',
  })
  @IsUUID()
  amenityId: string;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la reserva',
    example: '2026-02-15T18:00:00.000Z',
  })
  @IsDateString()
  fechaInicio: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la reserva',
    example: '2026-02-15T22:00:00.000Z',
  })
  @IsDateString()
  fechaFin: string;

  @ApiPropertyOptional({
    description: 'Motivo de la reserva',
    example: 'Cumpleaños familiar',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}

// ============================================================================
// ACTUALIZAR RESERVA (Solo admin puede aprobar/rechazar)
// ============================================================================

export class UpdateReservaDto {
  @ApiPropertyOptional({
    description: 'Estado de aprobación de la reserva',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  aprobada?: boolean;

  @ApiPropertyOptional({
    description: 'Motivo del rechazo',
    example: 'El SUM estará en mantenimiento ese día',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivoRechazo?: string;
}

// ============================================================================
// CANCELAR RESERVA
// ============================================================================

export class CancelarReservaDto {
  @ApiPropertyOptional({
    description: 'Motivo de la cancelación',
    example: 'Cambio de planes',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  motivo?: string;
}

// ============================================================================
// FILTROS
// ============================================================================

export class FiltrosReservaDto {
  @ApiPropertyOptional({
    description: 'ID del amenity para filtrar',
  })
  @IsOptional()
  @IsUUID()
  amenityId?: string;

  @ApiPropertyOptional({
    description: 'Fecha desde (inclusive)',
    example: '2026-02-01',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta (inclusive)',
    example: '2026-02-28',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({
    description: 'Estado de aprobación',
    enum: ['pendiente', 'aprobada', 'rechazada'],
  })
  @IsOptional()
  @IsString()
  estado?: 'pendiente' | 'aprobada' | 'rechazada';

  @ApiPropertyOptional({
    description: 'Solo mis reservas',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  soloMias?: boolean;
}

export class FiltrosDisponibilidadDto {
  @ApiProperty({
    description: 'Fecha para consultar disponibilidad',
    example: '2026-02-15',
  })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({
    description: 'ID del amenity específico',
  })
  @IsOptional()
  @IsUUID()
  amenityId?: string;
}

// ============================================================================
// RESPONSES
// ============================================================================

export class AmenityResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiPropertyOptional()
  descripcion: string | null;

  @ApiPropertyOptional()
  capacidad: number | null;

  @ApiProperty()
  requiereAprobacion: boolean;

  @ApiProperty()
  anticipacionMinima: number;

  @ApiProperty()
  anticipacionMaxima: number;

  @ApiProperty()
  duracionMaxima: number;

  @ApiPropertyOptional()
  costoReserva: number | null;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Cantidad de reservas próximas' })
  proximasReservas?: number;
}

export class ReservaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  amenityId: string;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  fechaInicio: Date;

  @ApiProperty()
  fechaFin: Date;

  @ApiPropertyOptional()
  motivo: string | null;

  @ApiPropertyOptional({ description: 'null = pendiente, true = aprobada, false = rechazada' })
  aprobada: boolean | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  amenity?: {
    id: string;
    nombre: string;
  };

  @ApiPropertyOptional()
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
  };

  @ApiPropertyOptional({ description: 'Estado calculado de la reserva' })
  estadoCalculado?: EstadoReserva;

  @ApiPropertyOptional({ description: 'Si puede cancelarse' })
  puedeCancelarse?: boolean;
}

export class DisponibilidadResponseDto {
  @ApiProperty()
  amenityId: string;

  @ApiProperty()
  nombreAmenity: string;

  @ApiProperty()
  fecha: string;

  @ApiProperty({ description: 'Slots horarios disponibles (formato HH:mm)' })
  slotsDisponibles: string[];

  @ApiProperty({ description: 'Reservas existentes para ese día' })
  reservasExistentes: {
    inicio: string;
    fin: string;
    aprobada: boolean | null;
  }[];
}

export class MisReservasStatsDto {
  @ApiProperty({ description: 'Total de reservas del usuario' })
  totalReservas: number;

  @ApiProperty({ description: 'Reservas pendientes de aprobación' })
  pendientes: number;

  @ApiProperty({ description: 'Reservas aprobadas próximas' })
  proximasAprobadas: number;

  @ApiProperty({ description: 'Reservas rechazadas' })
  rechazadas: number;

  @ApiPropertyOptional({ description: 'Si tiene penalización activa' })
  tienePenalizacionActiva: boolean;

  @ApiPropertyOptional({ description: 'Fecha fin de penalización' })
  fechaFinPenalizacion: Date | null;
}

// ============================================================================
// PAGINACIÓN
// ============================================================================

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad por página',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;
}
