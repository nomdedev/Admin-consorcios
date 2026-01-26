import {
  IsString,
  IsBoolean,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================================================
// ENUMS
// ============================================================================

export enum TipoNotificacion {
  PAGO = 'PAGO',
  EXPENSA = 'EXPENSA',
  RECLAMO = 'RECLAMO',
  COMUNICADO = 'COMUNICADO',
  ASAMBLEA = 'ASAMBLEA',
  VENCIMIENTO = 'VENCIMIENTO',
  EMERGENCIA = 'EMERGENCIA',
  SISTEMA = 'SISTEMA',
}

// ============================================================================
// DTOs DE CREACIÓN (Interno - usado por otros módulos)
// ============================================================================

export class CreateNotificacionDto {
  @ApiProperty({ description: 'ID del usuario destinatario' })
  @IsString()
  usuarioId: string;

  @ApiProperty({ description: 'Título de la notificación' })
  @IsString()
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  @MaxLength(1000)
  mensaje: string;

  @ApiProperty({ description: 'Tipo de notificación', enum: TipoNotificacion })
  @IsEnum(TipoNotificacion)
  tipo: TipoNotificacion;

  @ApiPropertyOptional({ description: 'ID del objeto relacionado' })
  @IsOptional()
  @IsString()
  referenciaId?: string;

  @ApiPropertyOptional({ description: 'Tipo del objeto relacionado' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenciaTipo?: string;
}

export class CreateNotificacionMasivaDto {
  @ApiProperty({
    description: 'IDs de los usuarios destinatarios',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  usuarioIds: string[];

  @ApiProperty({ description: 'Título de la notificación' })
  @IsString()
  @MaxLength(200)
  titulo: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  @IsString()
  @MaxLength(1000)
  mensaje: string;

  @ApiProperty({ description: 'Tipo de notificación', enum: TipoNotificacion })
  @IsEnum(TipoNotificacion)
  tipo: TipoNotificacion;

  @ApiPropertyOptional({ description: 'ID del objeto relacionado' })
  @IsOptional()
  @IsString()
  referenciaId?: string;

  @ApiPropertyOptional({ description: 'Tipo del objeto relacionado' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenciaTipo?: string;
}

// ============================================================================
// DTOs DE FILTRADO
// ============================================================================

export class FiltroNotificacionesDto {
  @ApiPropertyOptional({
    description: 'Filtrar solo no leídas',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  soloNoLeidas?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de notificación',
    enum: TipoNotificacion,
  })
  @IsOptional()
  @IsEnum(TipoNotificacion)
  tipo?: TipoNotificacion;

  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  pagina?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de items por página',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limite?: number;
}

// ============================================================================
// DTOs DE ACCIONES
// ============================================================================

export class MarcarLeidasDto {
  @ApiProperty({
    description: 'IDs de las notificaciones a marcar como leídas',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  notificacionIds: string[];
}

// ============================================================================
// DTOs DE RESPUESTA
// ============================================================================

export class NotificacionResponseDto {
  @ApiProperty({ description: 'ID único de la notificación' })
  id: string;

  @ApiProperty({ description: 'Título de la notificación' })
  titulo: string;

  @ApiProperty({ description: 'Mensaje de la notificación' })
  mensaje: string;

  @ApiProperty({ description: 'Tipo de notificación' })
  tipo: TipoNotificacion;

  @ApiPropertyOptional({ description: 'ID del objeto relacionado' })
  referenciaId?: string;

  @ApiPropertyOptional({ description: 'Tipo del objeto relacionado' })
  referenciaTipo?: string;

  @ApiProperty({ description: 'Si fue leída' })
  leida: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Tiempo relativo (ej: "hace 2 horas")' })
  tiempoRelativo?: string;
}

export class ListaNotificacionesResponseDto {
  @ApiProperty({ type: [NotificacionResponseDto] })
  data: NotificacionResponseDto[];

  @ApiProperty({ description: 'Total de notificaciones' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  pagina: number;

  @ApiProperty({ description: 'Items por página' })
  limite: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPaginas: number;
}

export class ContadorNotificacionesDto {
  @ApiProperty({ description: 'Total de notificaciones no leídas' })
  noLeidas: number;

  @ApiProperty({ description: 'Desglose por tipo' })
  porTipo: {
    tipo: TipoNotificacion;
    cantidad: number;
  }[];
}
