import {
  IsString,
  IsBoolean,
  IsOptional,
  IsDateString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsEnum,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ============================================================================
// ENUMS LOCALES
// ============================================================================

export enum TipoComunicado {
  GENERAL = 'GENERAL',
  URGENTE = 'URGENTE',
  MANTENIMIENTO = 'MANTENIMIENTO',
  FINANCIERO = 'FINANCIERO',
  ASAMBLEA = 'ASAMBLEA',
  SEGURIDAD = 'SEGURIDAD',
}

export enum CanalNotificacion {
  NINGUNO = 'NINGUNO',
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  AMBOS = 'AMBOS',
}

// ============================================================================
// DTOs DE CREACIÓN
// ============================================================================

export class CreateComunicadoDto {
  @ApiProperty({
    description: 'Título del comunicado',
    example: 'Corte de agua programado',
  })
  @IsString()
  @IsNotEmpty({ message: 'El título es obligatorio' })
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El título no puede superar 200 caracteres' })
  titulo: string;

  @ApiProperty({
    description: 'Contenido completo del comunicado (soporta Markdown)',
    example:
      'Se informa a los vecinos que el día **15 de febrero** habrá corte de agua...',
  })
  @IsString()
  @IsNotEmpty({ message: 'El contenido es obligatorio' })
  @MinLength(10, { message: 'El contenido debe tener al menos 10 caracteres' })
  @MaxLength(10000, {
    message: 'El contenido no puede superar 10000 caracteres',
  })
  contenido: string;

  @ApiPropertyOptional({
    description: 'Tipo de comunicado para categorización',
    enum: TipoComunicado,
    default: TipoComunicado.GENERAL,
  })
  @IsOptional()
  @IsEnum(TipoComunicado, { message: 'Tipo de comunicado inválido' })
  tipo?: TipoComunicado;

  @ApiPropertyOptional({
    description: 'Marca el comunicado como importante (destacado visualmente)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  importante?: boolean;

  @ApiPropertyOptional({
    description:
      'Fecha/hora desde la cual el comunicado será visible (programación)',
    example: '2024-02-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de publicación inválida' })
  publicarDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha/hora hasta la cual el comunicado será visible',
    example: '2024-02-28T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de expiración inválida' })
  publicarHasta?: string;

  @ApiPropertyOptional({
    description: 'Canal de notificación al publicar',
    enum: CanalNotificacion,
    default: CanalNotificacion.NINGUNO,
  })
  @IsOptional()
  @IsEnum(CanalNotificacion, { message: 'Canal de notificación inválido' })
  canalNotificacion?: CanalNotificacion;
}

// ============================================================================
// DTOs DE ACTUALIZACIÓN
// ============================================================================

export class UpdateComunicadoDto extends PartialType(CreateComunicadoDto) {}

// ============================================================================
// DTOs DE FILTRADO
// ============================================================================

export class FiltroComunicadosDto {
  @ApiPropertyOptional({
    description: 'Buscar por texto en título o contenido',
    example: 'agua',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de comunicado',
    enum: TipoComunicado,
  })
  @IsOptional()
  @IsEnum(TipoComunicado)
  tipo?: TipoComunicado;

  @ApiPropertyOptional({
    description: 'Filtrar solo comunicados importantes',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  soloImportantes?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir comunicados expirados (para admins)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  incluirExpirados?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir comunicados programados no publicados aún (para admins)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  incluirProgramados?: boolean;

  @ApiPropertyOptional({
    description: 'Fecha desde la cual buscar comunicados',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta la cual buscar comunicados',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

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
// DTOs DE RESPUESTA
// ============================================================================

export class ComunicadoResponseDto {
  @ApiProperty({ description: 'ID único del comunicado' })
  id: string;

  @ApiProperty({ description: 'ID del consorcio' })
  consorcioId: string;

  @ApiProperty({ description: 'Título del comunicado' })
  titulo: string;

  @ApiProperty({ description: 'Contenido del comunicado' })
  contenido: string;

  @ApiProperty({ description: 'Tipo de comunicado' })
  tipo: TipoComunicado;

  @ApiProperty({ description: 'Es comunicado importante' })
  importante: boolean;

  @ApiProperty({ description: 'Fecha de publicación' })
  publicarDesde: Date;

  @ApiPropertyOptional({ description: 'Fecha de expiración' })
  publicarHasta: Date | null;

  @ApiProperty({ description: 'Se envió notificación por email' })
  enviarEmail: boolean;

  @ApiProperty({ description: 'Se envió notificación por WhatsApp' })
  enviarWhatsapp: boolean;

  @ApiProperty({ description: 'Comunicado está actualmente visible' })
  estaActivo: boolean;

  @ApiProperty({ description: 'Comunicado está programado para el futuro' })
  estaProgramado: boolean;

  @ApiProperty({ description: 'Comunicado ha expirado' })
  estaExpirado: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Fecha de última actualización' })
  updatedAt: Date;
}

export class ComunicadoDetalleResponseDto extends ComunicadoResponseDto {
  @ApiPropertyOptional({ description: 'Nombre del consorcio' })
  consorcioNombre?: string;

  @ApiPropertyOptional({ description: 'Estadísticas de visualización' })
  estadisticas?: {
    visualizaciones: number;
    notificacionesEnviadas: number;
  };
}

export class ListaComunicadosResponseDto {
  @ApiProperty({ type: [ComunicadoResponseDto] })
  data: ComunicadoResponseDto[];

  @ApiProperty({ description: 'Total de comunicados que coinciden' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  pagina: number;

  @ApiProperty({ description: 'Items por página' })
  limite: number;

  @ApiProperty({ description: 'Total de páginas' })
  totalPaginas: number;
}

// ============================================================================
// DTOs DE ESTADÍSTICAS
// ============================================================================

export class EstadisticasComunicadosDto {
  @ApiProperty({ description: 'Total de comunicados en el consorcio' })
  total: number;

  @ApiProperty({ description: 'Comunicados activos actualmente' })
  activos: number;

  @ApiProperty({ description: 'Comunicados programados pendientes' })
  programados: number;

  @ApiProperty({ description: 'Comunicados importantes activos' })
  importantes: number;

  @ApiProperty({ description: 'Comunicados creados este mes' })
  esteMes: number;

  @ApiProperty({ description: 'Desglose por tipo' })
  porTipo: {
    tipo: TipoComunicado;
    cantidad: number;
  }[];
}
