import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsInt,
  IsNumber,
  IsDateString,
  IsEnum,
  IsUrl,
  IsArray,
  ValidateNested,
  MaxLength,
  MinLength,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { EstadoAsamblea, TipoVoto } from '@prisma/client';

// ============================================================================
// CREAR ASAMBLEA
// ============================================================================

export class CreateAsambleaDto {
  @ApiProperty({
    description: 'ID del consorcio',
    example: 'clxyz123...',
  })
  @IsUUID()
  consorcioId: string;

  @ApiProperty({
    description: 'Título de la asamblea',
    example: 'Asamblea Ordinaria Anual 2026',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El título no puede superar 200 caracteres' })
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descripción de la asamblea',
    example: 'Asamblea para tratar el balance anual y elección de consejo',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiProperty({
    description: 'Fecha y hora de la asamblea',
    example: '2026-02-15T19:00:00.000Z',
  })
  @IsDateString()
  fecha: string;

  @ApiPropertyOptional({
    description: 'Lugar de la asamblea',
    example: 'SUM del edificio',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  lugar?: string;

  @ApiPropertyOptional({
    description: 'Link para asamblea virtual (Zoom, Meet, etc.)',
    example: 'https://zoom.us/j/123456789',
  })
  @IsOptional()
  @IsUrl({}, { message: 'El link virtual debe ser una URL válida' })
  @MaxLength(500)
  linkVirtual?: string;

  @ApiProperty({
    description: 'Quórum requerido (% de coeficientes)',
    example: 50.00,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  quorumRequerido: number;
}

// ============================================================================
// ACTUALIZAR ASAMBLEA
// ============================================================================

export class UpdateAsambleaDto extends PartialType(CreateAsambleaDto) {
  @ApiPropertyOptional({
    description: 'Estado de la asamblea',
    enum: EstadoAsamblea,
  })
  @IsOptional()
  @IsEnum(EstadoAsamblea)
  estado?: EstadoAsamblea;
}

// ============================================================================
// PUNTO DE ORDEN DEL DÍA
// ============================================================================

export class CreatePuntoOrdenDto {
  @ApiProperty({
    description: 'Número de orden del punto',
    example: 1,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  orden: number;

  @ApiProperty({
    description: 'Título del punto',
    example: 'Aprobación del balance anual',
    minLength: 3,
    maxLength: 300,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del punto',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({
    description: '¿Requiere votación?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  requiereVotacion?: boolean;

  @ApiPropertyOptional({
    description: 'Mayoría requerida para aprobar (% de votos)',
    example: 50.01,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  mayoriaRequerida?: number;
}

export class UpdatePuntoOrdenDto extends PartialType(CreatePuntoOrdenDto) {}

// ============================================================================
// ASISTENCIA
// ============================================================================

export class RegistrarAsistenciaDto {
  @ApiProperty({
    description: 'ID del usuario que asiste',
  })
  @IsUUID()
  usuarioId: string;

  @ApiProperty({
    description: '¿Está presente?',
    default: true,
  })
  @IsBoolean()
  presente: boolean;

  @ApiPropertyOptional({
    description: 'Nombre del apoderado (si es representado)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  representadoPor?: string;

  @ApiPropertyOptional({
    description: 'URL del documento de poder',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(500)
  poderUrl?: string;
}

// ============================================================================
// VOTACIÓN
// ============================================================================

export class EmitirVotoDto {
  @ApiProperty({
    description: 'Tipo de voto',
    enum: TipoVoto,
  })
  @IsEnum(TipoVoto)
  voto: TipoVoto;
}

// ============================================================================
// FILTROS
// ============================================================================

export class FiltrosAsambleaDto {
  @ApiPropertyOptional({
    description: 'Estado de la asamblea',
    enum: EstadoAsamblea,
  })
  @IsOptional()
  @IsEnum(EstadoAsamblea)
  estado?: EstadoAsamblea;

  @ApiPropertyOptional({
    description: 'Fecha desde',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;
}

// ============================================================================
// RESPONSES
// ============================================================================

export class PuntoOrdenResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  orden: number;

  @ApiProperty()
  titulo: string;

  @ApiPropertyOptional()
  descripcion: string | null;

  @ApiProperty()
  requiereVotacion: boolean;

  @ApiPropertyOptional()
  mayoriaRequerida: number | null;

  @ApiPropertyOptional({ description: 'Resultado de la votación' })
  resultadoVotacion?: {
    aFavor: number;
    enContra: number;
    abstenciones: number;
    totalCoeficiente: number;
    porcentajeAFavor: number;
    aprobado: boolean | null;
  };
}

export class AsistenciaResponseDto {
  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  presente: boolean;

  @ApiPropertyOptional()
  representadoPor: string | null;

  @ApiPropertyOptional()
  horaRegistro: Date | null;

  @ApiPropertyOptional()
  usuario?: {
    id: string;
    nombre: string;
    apellido: string;
  };

  @ApiPropertyOptional()
  coeficiente?: number;
}

export class AsambleaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  titulo: string;

  @ApiPropertyOptional()
  descripcion: string | null;

  @ApiProperty()
  fecha: Date;

  @ApiPropertyOptional()
  lugar: string | null;

  @ApiPropertyOptional()
  linkVirtual: string | null;

  @ApiProperty({ enum: EstadoAsamblea })
  estado: EstadoAsamblea;

  @ApiProperty()
  quorumRequerido: number;

  @ApiPropertyOptional()
  actaUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Puntos del orden del día' })
  puntosOrden?: PuntoOrdenResponseDto[];

  @ApiPropertyOptional({ description: 'Lista de asistencia' })
  asistencias?: AsistenciaResponseDto[];

  @ApiPropertyOptional({ description: 'Estado del quórum' })
  quorum?: {
    requerido: number;
    actual: number;
    alcanzado: boolean;
    presentes: number;
    totalPropietarios: number;
  };
}

export class ResultadoVotacionDto {
  @ApiProperty()
  puntoOrdenId: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty()
  aFavor: number;

  @ApiProperty()
  enContra: number;

  @ApiProperty()
  abstenciones: number;

  @ApiProperty()
  totalVotos: number;

  @ApiProperty()
  totalCoeficiente: number;

  @ApiProperty()
  porcentajeAFavor: number;

  @ApiProperty()
  mayoriaRequerida: number;

  @ApiProperty({ description: 'null si la votación aún no cerró' })
  aprobado: boolean | null;

  @ApiProperty({ description: 'Detalle de votos (solo para admin)' })
  votos?: {
    usuarioId: string;
    nombre: string;
    voto: TipoVoto;
    coeficiente: number;
  }[];
}

export class MiVotoDto {
  @ApiProperty()
  puntoOrdenId: string;

  @ApiProperty({ enum: TipoVoto })
  voto: TipoVoto;

  @ApiProperty()
  timestampVoto: Date;
}

// ============================================================================
// ACTA
// ============================================================================

export class GenerarActaDto {
  @ApiPropertyOptional({
    description: 'Observaciones adicionales para el acta',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  observaciones?: string;
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

// ============================================================================
// QUÓRUM
// ============================================================================

export class QuorumResponseDto {
  @ApiProperty({ description: 'Porcentaje de quórum requerido' })
  requerido: number;

  @ApiProperty({ description: 'Porcentaje de quórum actual (por coeficientes)' })
  actual: number;

  @ApiProperty({ description: 'Si se alcanzó el quórum' })
  alcanzado: boolean;

  @ApiProperty({ description: 'Cantidad de propietarios presentes' })
  presentes: number;

  @ApiProperty({ description: 'Total de propietarios titulares' })
  totalPropietarios: number;
}
