import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  Min,
  Max,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// =============================================================================
// DTOs para Unidades Funcionales
// =============================================================================

export enum TipoUnidadFuncional {
  DEPARTAMENTO = 'DEPARTAMENTO',
  COCHERA = 'COCHERA',
  BAULERA = 'BAULERA',
  LOCAL_COMERCIAL = 'LOCAL_COMERCIAL',
  OFICINA = 'OFICINA',
}

export class CreateUnidadFuncionalDto {
  @ApiProperty({ description: 'Código de la unidad (ej: 1A, PB-B)', example: '4B' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  codigo: string;

  @ApiPropertyOptional({ description: 'Piso', example: '4' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  piso?: string;

  @ApiPropertyOptional({ description: 'Número de unidad', example: 'B' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  numero?: string;

  @ApiPropertyOptional({
    description: 'Tipo de unidad',
    enum: TipoUnidadFuncional,
    default: TipoUnidadFuncional.DEPARTAMENTO,
  })
  @IsOptional()
  @IsEnum(TipoUnidadFuncional)
  tipo?: TipoUnidadFuncional;

  @ApiProperty({
    description: 'Coeficiente de participación (%)',
    example: 2.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  coeficiente: number;

  @ApiPropertyOptional({ description: 'Superficie en m²', example: 65.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  superficieM2?: number;
}

export class UpdateUnidadFuncionalDto extends PartialType(CreateUnidadFuncionalDto) {
  @ApiPropertyOptional({ description: 'Estado activo de la unidad' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class BulkCreateUnidadFuncionalDto {
  @ApiProperty({
    description: 'Lista de unidades funcionales a crear',
    type: [CreateUnidadFuncionalDto],
  })
  unidades: CreateUnidadFuncionalDto[];
}

// Response DTOs
export class UnidadFuncionalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  codigo: string;

  @ApiPropertyOptional()
  piso?: string;

  @ApiPropertyOptional()
  numero?: string;

  @ApiProperty({ enum: TipoUnidadFuncional })
  tipo: TipoUnidadFuncional;

  @ApiProperty()
  coeficiente: number;

  @ApiPropertyOptional()
  superficieM2?: number;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Datos relacionados
  @ApiPropertyOptional()
  propietario?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };

  @ApiPropertyOptional()
  inquilino?: {
    id: string;
    nombre: string;
    apellido: string;
    email: string;
  };

  @ApiPropertyOptional()
  saldoActual?: number;
}

export class UnidadFuncionalListResponseDto {
  @ApiProperty({ type: [UnidadFuncionalResponseDto] })
  data: UnidadFuncionalResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class ValidacionCoeficientesDto {
  @ApiProperty({ description: 'Suma total de coeficientes' })
  sumaTotal: number;

  @ApiProperty({ description: 'Indica si la suma es válida (100%)' })
  esValido: boolean;

  @ApiProperty({ description: 'Diferencia respecto a 100%' })
  diferencia: number;

  @ApiProperty({ description: 'Lista de unidades con su coeficiente' })
  detalle: Array<{
    codigo: string;
    coeficiente: number;
  }>;
}
