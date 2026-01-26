import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsObject,
  Min,
  Max,
} from 'class-validator';

// ===========================================================================
// Tipos de reglas
// ===========================================================================

export enum TipoReglaAmenity {
  LIMITE_PERIODO = 'limite_periodo',
  PENALIZACION = 'penalizacion',
  BLOQUEO = 'bloqueo',
  HORARIO = 'horario',
}

// ===========================================================================
// Interfaces de configuración por tipo de regla
// ===========================================================================

export interface ConfigLimitePeriodo {
  maxReservas: number;
  periodo: 'semana' | 'mes' | 'año';
  diasSemana?: number[]; // 0=Dom, 6=Sab. Si está vacío aplica a todos
}

export interface ConfigPenalizacion {
  horasAnticipacion: number; // Hs antes para cancelar sin penalidad
  montoMulta?: number;
  bloquearDias?: number;
}

export interface ConfigBloqueo {
  motivosBloqueo: ('no_show' | 'cancelacion_tardia' | 'mal_uso')[];
  diasBloqueo: number;
}

export interface ConfigHorario {
  horaInicio: string; // "08:00"
  horaFin: string; // "22:00"
  diasPermitidos?: number[]; // 0-6
}

// ===========================================================================
// DTOs de entrada
// ===========================================================================

export class CreateReglaAmenityDto {
  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  @IsNotEmpty()
  consorcioId!: string;

  @ApiProperty({ description: 'ID del amenity' })
  @IsString()
  @IsNotEmpty()
  amenityId!: string;

  @ApiProperty({ example: 'Límite fin de semana', description: 'Nombre de la regla' })
  @IsString()
  @IsNotEmpty()
  nombre!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({
    enum: TipoReglaAmenity,
    description: 'Tipo de regla',
  })
  @IsString()
  @IsNotEmpty()
  tipoRegla!: TipoReglaAmenity;

  @ApiProperty({
    example: { maxReservas: 2, periodo: 'mes', diasSemana: [6, 0] },
    description: 'Configuración específica según el tipo',
  })
  @IsObject()
  configuracion!: ConfigLimitePeriodo | ConfigPenalizacion | ConfigBloqueo | ConfigHorario;

  @ApiPropertyOptional({ example: 0, description: 'Prioridad (mayor = evalúa primero)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  prioridad?: number;
}

export class UpdateReglaAmenityDto {
  @ApiPropertyOptional({ description: 'Nombre de la regla' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiPropertyOptional({ description: 'Configuración' })
  @IsOptional()
  @IsObject()
  configuracion?: object;

  @ApiPropertyOptional({ description: 'Prioridad' })
  @IsOptional()
  @IsNumber()
  prioridad?: number;

  @ApiPropertyOptional({ description: 'Estado activo' })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

export class AplicarPenalizacionDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  usuarioId!: string;

  @ApiProperty({ description: 'ID de la reserva' })
  @IsString()
  @IsNotEmpty()
  reservaId!: string;

  @ApiProperty({ example: 'multa', description: 'Tipo de penalización' })
  @IsString()
  @IsNotEmpty()
  tipo!: 'multa' | 'bloqueo_temporal' | 'advertencia';

  @ApiProperty({ example: 'No show', description: 'Motivo' })
  @IsString()
  @IsNotEmpty()
  motivo!: string;

  @ApiPropertyOptional({ example: 5000, description: 'Monto de la multa' })
  @IsOptional()
  @IsNumber()
  montoMulta?: number;

  @ApiPropertyOptional({ example: 30, description: 'Días de bloqueo' })
  @IsOptional()
  @IsNumber()
  diasBloqueo?: number;
}

// ===========================================================================
// DTOs de respuesta
// ===========================================================================

export class ReglaAmenityResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  consorcioId!: string;

  @ApiProperty()
  amenityId!: string;

  @ApiProperty()
  nombre!: string;

  @ApiPropertyOptional()
  descripcion?: string;

  @ApiProperty()
  tipoRegla!: string;

  @ApiProperty()
  configuracion!: object;

  @ApiProperty()
  prioridad!: number;

  @ApiProperty()
  activa!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class PenalizacionResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  usuarioId!: string;

  @ApiProperty()
  reservaId!: string;

  @ApiProperty()
  tipo!: string;

  @ApiProperty()
  motivo!: string;

  @ApiPropertyOptional()
  montoMulta?: number;

  @ApiPropertyOptional()
  diasBloqueo?: number;

  @ApiPropertyOptional()
  fechaFinBloqueo?: Date;

  @ApiPropertyOptional()
  aplicadoEnExpensa?: string;

  @ApiProperty()
  pagada!: boolean;

  @ApiProperty()
  createdAt!: Date;
}

export class ValidacionReservaResultDto {
  @ApiProperty({ description: 'Si la reserva es válida según las reglas' })
  valida!: boolean;

  @ApiProperty({ description: 'Mensaje descriptivo' })
  mensaje!: string;

  @ApiPropertyOptional({ description: 'Reglas que bloquean (si no es válida)' })
  reglasVioladas?: string[];

  @ApiPropertyOptional({ description: 'Penalizaciones activas del usuario' })
  penalizacionesActivas?: PenalizacionResponseDto[];
}

export class ResumenPenalizacionesDto {
  @ApiProperty()
  totalPenalizaciones!: number;

  @ApiProperty()
  multasPendientes!: number;

  @ApiProperty()
  montoTotalPendiente!: number;

  @ApiProperty()
  bloqueosActivos!: number;

  @ApiProperty({ type: [PenalizacionResponseDto] })
  penalizaciones!: PenalizacionResponseDto[];
}
