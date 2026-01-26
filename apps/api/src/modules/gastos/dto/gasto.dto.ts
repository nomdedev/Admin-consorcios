import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsArray,
  Min,
  Max,
  Matches,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// =============================================================================
// ENUMS
// =============================================================================

export enum TipoComprobante {
  FACTURA_A = 'FACTURA_A',
  FACTURA_B = 'FACTURA_B',
  FACTURA_C = 'FACTURA_C',
  TICKET = 'TICKET',
  RECIBO = 'RECIBO',
  OTRO = 'OTRO',
}

// =============================================================================
// DTOs DE CREACIÓN
// =============================================================================

export class CreateGastoDto {
  @ApiProperty({
    description: 'ID del consorcio',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'El consorcio es obligatorio' })
  consorcioId: string;

  @ApiProperty({
    description: 'Concepto del gasto',
    example: 'Reparación de ascensor',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty({ message: 'El concepto es obligatorio' })
  @MaxLength(200, { message: 'El concepto no puede superar 200 caracteres' })
  concepto: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del gasto',
    example: 'Reparación del motor del ascensor principal',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  descripcion?: string;

  @ApiProperty({
    description: 'Monto del gasto',
    example: 150000.00,
    minimum: 0.01,
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @Max(1000000000, { message: 'El monto no puede superar $1.000.000.000' })
  monto: number;

  @ApiPropertyOptional({
    description: 'ID de la categoría del gasto',
    example: 'clx_categoria_123',
  })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional({
    description: 'Indica si es un gasto extraordinario',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esExtraordinario?: boolean;

  @ApiPropertyOptional({
    description: 'Indica si el gasto se prorratea entre unidades',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  esProrrateable?: boolean;

  @ApiPropertyOptional({
    description: 'Tipo de comprobante',
    enum: TipoComprobante,
    example: TipoComprobante.FACTURA_B,
  })
  @IsOptional()
  @IsEnum(TipoComprobante)
  tipoComprobante?: TipoComprobante;

  @ApiPropertyOptional({
    description: 'Número de comprobante',
    example: '0001-00012345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  numeroComprobante?: string;

  @ApiPropertyOptional({
    description: 'Código de Autorización Electrónico de AFIP',
    example: '12345678901234',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{14}$/, { message: 'El CAE debe tener 14 dígitos' })
  caeAfip?: string;

  @ApiPropertyOptional({
    description: 'Fecha del comprobante',
    example: '2026-01-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de comprobante inválida' })
  fechaComprobante?: string;

  @ApiPropertyOptional({
    description: 'ID del proveedor',
    example: 'clx_proveedor_123',
  })
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @ApiProperty({
    description: 'Fecha en que se realizó el gasto',
    example: '2026-01-15',
  })
  @IsDateString({}, { message: 'Fecha de gasto inválida' })
  fechaGasto: string;

  @ApiPropertyOptional({
    description: 'URL del archivo adjunto (factura/recibo escaneado)',
    example: 'https://storage.example.com/facturas/12345.pdf',
  })
  @IsOptional()
  @IsString()
  archivoUrl?: string;

  @ApiPropertyOptional({
    description: 'Nombre del archivo adjunto',
    example: 'factura_ascensor.pdf',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  archivoNombre?: string;

  @ApiPropertyOptional({
    description: 'ID de la expensa a la que asignar el gasto',
  })
  @IsOptional()
  @IsString()
  expensaId?: string;
}

// =============================================================================
// DTOs DE ACTUALIZACIÓN
// =============================================================================

export class UpdateGastoDto extends PartialType(CreateGastoDto) {
  // Hereda todos los campos opcionales de CreateGastoDto
  // No se puede cambiar el consorcioId
}

// =============================================================================
// DTOs DE RESPUESTA
// =============================================================================

export class CategoriaGastoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nombre: string;

  @ApiPropertyOptional()
  descripcion?: string;

  @ApiPropertyOptional()
  icono?: string;
}

export class ProveedorBasicoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  razonSocial: string;

  @ApiPropertyOptional()
  cuit?: string;
}

export class GastoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiPropertyOptional()
  expensaId?: string;

  @ApiProperty()
  concepto: string;

  @ApiPropertyOptional()
  descripcion?: string;

  @ApiProperty()
  monto: number;

  @ApiPropertyOptional()
  categoria?: CategoriaGastoResponseDto;

  @ApiProperty()
  esExtraordinario: boolean;

  @ApiProperty()
  esProrrateable: boolean;

  @ApiPropertyOptional()
  tipoComprobante?: string;

  @ApiPropertyOptional()
  numeroComprobante?: string;

  @ApiPropertyOptional()
  caeAfip?: string;

  @ApiPropertyOptional()
  fechaComprobante?: Date;

  @ApiPropertyOptional()
  proveedor?: ProveedorBasicoDto;

  @ApiPropertyOptional()
  archivoUrl?: string;

  @ApiPropertyOptional()
  archivoNombre?: string;

  @ApiProperty()
  fechaGasto: Date;

  @ApiProperty()
  fechaRegistro: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class GastoListResponseDto {
  @ApiProperty({ type: [GastoResponseDto] })
  data: GastoResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiPropertyOptional({ description: 'Suma total de montos en la página' })
  sumaPagina?: number;

  @ApiPropertyOptional({ description: 'Suma total de todos los gastos filtrados' })
  sumaTotal?: number;
}

// =============================================================================
// DTOs DE FILTROS
// =============================================================================

export class FilterGastosDto {
  @ApiPropertyOptional({ description: 'ID del consorcio' })
  @IsOptional()
  @IsString()
  consorcioId?: string;

  @ApiPropertyOptional({ description: 'ID de la expensa' })
  @IsOptional()
  @IsString()
  expensaId?: string;

  @ApiPropertyOptional({ description: 'Gastos sin expensa asignada' })
  @IsOptional()
  @IsBoolean()
  sinExpensa?: boolean;

  @ApiPropertyOptional({ description: 'ID de la categoría' })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional({ description: 'ID del proveedor' })
  @IsOptional()
  @IsString()
  proveedorId?: string;

  @ApiPropertyOptional({ description: 'Solo gastos extraordinarios' })
  @IsOptional()
  @IsBoolean()
  esExtraordinario?: boolean;

  @ApiPropertyOptional({ description: 'Fecha desde (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({ description: 'Fecha hasta (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({ description: 'Buscar en concepto/descripción' })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({ description: 'Monto mínimo' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montoMin?: number;

  @ApiPropertyOptional({ description: 'Monto máximo' })
  @IsOptional()
  @IsNumber()
  montoMax?: number;

  @ApiPropertyOptional({ description: 'Página', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Límite por página', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    enum: ['fechaGasto', 'monto', 'createdAt', 'concepto'],
    default: 'fechaGasto',
  })
  @IsOptional()
  @IsString()
  ordenarPor?: 'fechaGasto' | 'monto' | 'createdAt' | 'concepto';

  @ApiPropertyOptional({
    description: 'Dirección del ordenamiento',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  ordenDireccion?: 'asc' | 'desc';
}

// =============================================================================
// DTOs PARA CATEGORÍAS
// =============================================================================

export class CreateCategoriaGastoDto {
  @ApiProperty({ example: 'Servicios Públicos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiPropertyOptional({ example: 'Gastos de luz, gas, agua, etc.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiPropertyOptional({ example: 'zap' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  icono?: string;

  @ApiPropertyOptional({ description: 'Orden de visualización', default: 0 })
  @IsOptional()
  @IsNumber()
  orden?: number;
}

export class UpdateCategoriaGastoDto extends PartialType(CreateCategoriaGastoDto) {}

// =============================================================================
// DTOs PARA UPLOAD DE ARCHIVOS
// =============================================================================

export class UploadArchivoGastoDto {
  @ApiProperty({ description: 'ID del gasto al que asociar el archivo' })
  @IsString()
  @IsNotEmpty()
  gastoId: string;
}

export class ArchivoUploadedResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  tamano: number;

  @ApiProperty()
  tipo: string;
}
