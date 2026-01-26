/**
 * DTOs para DocumentosModule
 * Gestión de documentos del consorcio (reglamento, actas, contratos, planos)
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsIn,
  IsUrl,
  IsInt,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// ============================================================================
// CATEGORÍAS DE DOCUMENTOS
// ============================================================================

export const CATEGORIAS_DOCUMENTO = [
  'reglamento',
  'acta',
  'contrato',
  'plano',
  'seguro',
  'habilitacion',
  'otro',
] as const;

export type CategoriaDocumento = typeof CATEGORIAS_DOCUMENTO[number];

// ============================================================================
// CREATE / UPDATE DTOs
// ============================================================================

export class CreateDocumentoDto {
  @ApiProperty({
    description: 'ID del consorcio',
    example: 'clxyz123...',
  })
  @IsUUID()
  consorcioId: string;

  @ApiProperty({
    description: 'Nombre del documento',
    example: 'Reglamento de Copropiedad 2024',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @ApiPropertyOptional({
    description: 'Descripción del documento',
    example: 'Reglamento actualizado aprobado en asamblea del 15/03/2024',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @ApiProperty({
    description: 'Categoría del documento',
    enum: CATEGORIAS_DOCUMENTO,
    example: 'reglamento',
  })
  @IsString()
  @IsIn(CATEGORIAS_DOCUMENTO, { message: 'Categoría inválida' })
  categoria: CategoriaDocumento;

  @ApiProperty({
    description: 'URL del archivo',
    example: 'https://cdn.vecinosimple.com/docs/reglamento-2024.pdf',
  })
  @IsUrl({}, { message: 'URL de archivo inválida' })
  archivoUrl: string;

  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'reglamento-copropiedad.pdf',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  archivoNombre: string;

  @ApiProperty({
    description: 'Tipo MIME del archivo',
    example: 'application/pdf',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  archivoTipo: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 1048576,
    minimum: 1,
    maximum: 52428800, // 50MB
  })
  @IsInt()
  @Min(1)
  @Max(52428800, { message: 'El archivo no puede superar 50MB' })
  archivoTamano: number;

  @ApiPropertyOptional({
    description: 'Si el documento es visible para todos los vecinos',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  esPublico?: boolean;
}

export class UpdateDocumentoDto {
  @ApiPropertyOptional({
    description: 'Nombre del documento',
    minLength: 3,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @Transform(({ value }) => value?.trim())
  nombre?: string;

  @ApiPropertyOptional({
    description: 'Descripción del documento',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Transform(({ value }) => value?.trim())
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Categoría del documento',
    enum: CATEGORIAS_DOCUMENTO,
  })
  @IsOptional()
  @IsString()
  @IsIn(CATEGORIAS_DOCUMENTO)
  categoria?: CategoriaDocumento;

  @ApiPropertyOptional({
    description: 'URL del archivo (para reemplazar)',
  })
  @IsOptional()
  @IsUrl()
  archivoUrl?: string;

  @ApiPropertyOptional({
    description: 'Nombre original del archivo',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  archivoNombre?: string;

  @ApiPropertyOptional({
    description: 'Tipo MIME del archivo',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  archivoTipo?: string;

  @ApiPropertyOptional({
    description: 'Tamaño del archivo en bytes',
    minimum: 1,
    maximum: 52428800,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(52428800)
  archivoTamano?: number;

  @ApiPropertyOptional({
    description: 'Si el documento es visible para todos los vecinos',
  })
  @IsOptional()
  @IsBoolean()
  esPublico?: boolean;
}

// ============================================================================
// FILTROS
// ============================================================================

export class FiltrosDocumentoDto {
  @ApiPropertyOptional({
    description: 'Buscar por nombre',
    example: 'reglamento',
  })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por categoría',
    enum: CATEGORIAS_DOCUMENTO,
  })
  @IsOptional()
  @IsString()
  @IsIn(CATEGORIAS_DOCUMENTO)
  categoria?: CategoriaDocumento;

  @ApiPropertyOptional({
    description: 'Solo documentos públicos',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  soloPublicos?: boolean;

  @ApiPropertyOptional({
    description: 'Página',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Resultados por página',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class DocumentoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  nombre: string;

  @ApiPropertyOptional()
  descripcion?: string;

  @ApiProperty({ enum: CATEGORIAS_DOCUMENTO })
  categoria: string;

  @ApiProperty()
  archivoUrl: string;

  @ApiProperty()
  archivoNombre: string;

  @ApiProperty()
  archivoTipo: string;

  @ApiProperty()
  archivoTamano: number;

  @ApiProperty()
  esPublico: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class DocumentoListResponseDto {
  @ApiProperty({ type: [DocumentoResponseDto] })
  data: DocumentoResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}

export class CategoriaStatsDto {
  @ApiProperty()
  categoria: string;

  @ApiProperty()
  cantidad: number;

  @ApiProperty()
  tamanoTotal: number;
}

export class DocumentosStatsResponseDto {
  @ApiProperty()
  totalDocumentos: number;

  @ApiProperty()
  tamanoTotal: number;

  @ApiProperty({ type: [CategoriaStatsDto] })
  porCategoria: CategoriaStatsDto[];
}
