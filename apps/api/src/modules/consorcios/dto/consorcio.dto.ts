import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// =============================================================================
// DTOs para el módulo de Consorcios
// =============================================================================

export class CreateConsorcioDto {
  @ApiProperty({ description: 'Nombre del consorcio/edificio', example: 'Edificio San Martín' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ description: 'Dirección completa', example: 'Av. San Martín 1234' })
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  direccion: string;

  @ApiProperty({ description: 'Localidad', example: 'La Plata' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  localidad: string;

  @ApiPropertyOptional({ description: 'Provincia', default: 'Buenos Aires' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  provincia?: string;

  @ApiPropertyOptional({ description: 'Código postal', example: '1900' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  codigoPostal?: string;

  @ApiPropertyOptional({ description: 'CUIT del consorcio', example: '30-12345678-9' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}-\d{8}-\d{1}$/, { message: 'CUIT debe tener formato XX-XXXXXXXX-X' })
  cuit?: string;

  @ApiPropertyOptional({ description: 'Día de vencimiento de expensas (1-28)', default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(28)
  diaVencimiento?: number;

  @ApiPropertyOptional({ description: 'Tasa de interés por mora mensual (%)', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tasaInteresMora?: number;

  @ApiPropertyOptional({ description: 'Días de gracia antes de aplicar intereses', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(30)
  periodoGracia?: number;
}

export class UpdateConsorcioDto extends PartialType(CreateConsorcioDto) {
  @ApiPropertyOptional({ description: 'Estado activo del consorcio' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class ConsorcioBancarioDto {
  @ApiPropertyOptional({ description: 'CBU de la cuenta bancaria' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{22}$/, { message: 'CBU debe tener 22 dígitos' })
  cbu?: string;

  @ApiPropertyOptional({ description: 'Alias de la cuenta' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  aliasCbu?: string;

  @ApiPropertyOptional({ description: 'Nombre del banco' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  banco?: string;
}

// Response DTOs
export class ConsorcioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  direccion: string;

  @ApiProperty()
  localidad: string;

  @ApiProperty()
  provincia: string;

  @ApiPropertyOptional()
  codigoPostal?: string;

  @ApiPropertyOptional()
  cuit?: string;

  @ApiProperty()
  diaVencimiento: number;

  @ApiProperty()
  tasaInteresMora: number;

  @ApiProperty()
  periodoGracia: number;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  // Datos calculados
  @ApiPropertyOptional()
  totalUnidades?: number;

  @ApiPropertyOptional()
  totalPropietarios?: number;
}

export class ConsorcioListResponseDto {
  @ApiProperty({ type: [ConsorcioResponseDto] })
  data: ConsorcioResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}
