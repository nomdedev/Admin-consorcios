import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsDecimal,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// =============================================================================
// ENUMS
// =============================================================================

export enum EstadoExpensa {
  BORRADOR = 'BORRADOR',
  LIQUIDADA = 'LIQUIDADA',
  PUBLICADA = 'PUBLICADA',
  CERRADA = 'CERRADA',
}

// =============================================================================
// DTOs DE CREACIÓN
// =============================================================================

export class CreateExpensaDto {
  @ApiProperty({
    description: 'ID del consorcio',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty({ message: 'El consorcio es obligatorio' })
  consorcioId: string;

  @ApiProperty({
    description: 'Período de la expensa en formato YYYY-MM',
    example: '2026-01',
  })
  @IsString()
  @IsNotEmpty({ message: 'El período es obligatorio' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'El período debe tener formato YYYY-MM (ej: 2026-01)',
  })
  periodo: string;

  @ApiProperty({
    description: 'Fecha de vencimiento',
    example: '2026-02-10',
  })
  @IsDateString({}, { message: 'Fecha de vencimiento inválida' })
  fechaVencimiento: string;

  @ApiPropertyOptional({
    description: 'Fecha de segundo vencimiento',
    example: '2026-02-20',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Fecha de segundo vencimiento inválida' })
  fechaSegundoVencimiento?: string;

  @ApiPropertyOptional({
    description: 'Recargo por segundo vencimiento (%)',
    example: 10,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El recargo debe ser un número' })
  @Min(0, { message: 'El recargo no puede ser negativo' })
  @Max(100, { message: 'El recargo no puede superar 100%' })
  recargoSegundoVencimiento?: number;

  @ApiPropertyOptional({
    description: 'Monto del fondo de reserva',
    example: 50000,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El fondo de reserva debe ser un número' })
  @Min(0, { message: 'El fondo de reserva no puede ser negativo' })
  fondoReserva?: number;

  @ApiPropertyOptional({
    description: 'Observaciones de la expensa',
    example: 'Incluye reparación de ascensor',
  })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

// =============================================================================
// DTOs DE ACTUALIZACIÓN
// =============================================================================

export class UpdateExpensaDto extends PartialType(CreateExpensaDto) {
  // Hereda todos los campos opcionales de CreateExpensaDto
}

// =============================================================================
// DTOs DE ACCIONES
// =============================================================================

export class AsignarGastosDto {
  @ApiProperty({
    description: 'IDs de los gastos a asignar a la expensa',
    example: ['clx1234567890', 'clx0987654321'],
    type: [String],
  })
  @IsArray({ message: 'Debe proporcionar un array de IDs de gastos' })
  @IsString({ each: true, message: 'Cada ID de gasto debe ser un string' })
  @IsNotEmpty({ each: true })
  gastosIds: string[];
}

export class CalcularProrrateoDto {
  @ApiPropertyOptional({
    description: 'Incluir saldo anterior en el cálculo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  incluirSaldoAnterior?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir intereses por mora en el cálculo',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  incluirIntereses?: boolean;

  @ApiPropertyOptional({
    description: 'Aplicar bonificación por pago anticipado (%)',
    example: 5,
    minimum: 0,
    maximum: 50,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  bonificacionPorcentaje?: number;
}

export class CerrarExpensaDto {
  @ApiPropertyOptional({
    description: 'Motivo del cierre',
    example: 'Cierre de período mensual regular',
  })
  @IsOptional()
  @IsString()
  motivoCierre?: string;
}

// =============================================================================
// DTOs DE RESPUESTA
// =============================================================================

export class DetalleExpensaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  unidadFuncionalId: string;

  @ApiProperty({ description: 'Código de la unidad funcional' })
  unidadCodigo: string;

  @ApiProperty({ description: 'Coeficiente de la unidad' })
  coeficiente: number;

  @ApiProperty()
  montoOrdinario: number;

  @ApiProperty()
  montoExtraordinario: number;

  @ApiProperty()
  saldoAnterior: number;

  @ApiProperty()
  intereses: number;

  @ApiProperty()
  bonificacion: number;

  @ApiProperty()
  total: number;

  @ApiPropertyOptional({ description: 'Nombre del propietario' })
  propietario?: string;
}

export class ExpensaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  periodo: string;

  @ApiProperty()
  totalGastosOrdinarios: number;

  @ApiProperty()
  totalGastosExtraordinarios: number;

  @ApiProperty()
  totalIngresos: number;

  @ApiProperty()
  fondoReserva: number;

  @ApiProperty()
  fechaVencimiento: Date;

  @ApiPropertyOptional()
  fechaSegundoVencimiento?: Date;

  @ApiPropertyOptional()
  recargoSegundoVencimiento?: number;

  @ApiProperty({ enum: EstadoExpensa })
  estado: EstadoExpensa;

  @ApiPropertyOptional()
  observaciones?: string;

  @ApiPropertyOptional()
  publicadaAt?: Date;

  @ApiPropertyOptional()
  cerradaAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [DetalleExpensaResponseDto] })
  detalles?: DetalleExpensaResponseDto[];

  @ApiPropertyOptional({ description: 'Cantidad de gastos asignados' })
  cantidadGastos?: number;

  @ApiPropertyOptional({ description: 'Total a recaudar' })
  totalARecaudar?: number;
}

export class ExpensaListResponseDto {
  @ApiProperty({ type: [ExpensaResponseDto] })
  data: ExpensaResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;
}

export class ProrrateoResultDto {
  @ApiProperty({ description: 'Expensa actualizada' })
  expensa: ExpensaResponseDto;

  @ApiProperty({ description: 'Detalles calculados por unidad' })
  detalles: DetalleExpensaResponseDto[];

  @ApiProperty({ description: 'Resumen del cálculo' })
  resumen: {
    totalUnidades: number;
    totalCoeficientes: number;
    totalOrdinario: number;
    totalExtraordinario: number;
    totalSaldosAnteriores: number;
    totalIntereses: number;
    totalBonificaciones: number;
    totalARecaudar: number;
  };
}

// =============================================================================
// DTOs DE FILTROS
// =============================================================================

export class FilterExpensasDto {
  @ApiPropertyOptional({
    description: 'ID del consorcio',
  })
  @IsOptional()
  @IsString()
  consorcioId?: string;

  @ApiPropertyOptional({
    description: 'Período específico (YYYY-MM)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  periodo?: string;

  @ApiPropertyOptional({
    description: 'Año para filtrar',
    example: 2026,
  })
  @IsOptional()
  @IsNumber()
  anio?: number;

  @ApiPropertyOptional({
    description: 'Estado de la expensa',
    enum: EstadoExpensa,
  })
  @IsOptional()
  @IsEnum(EstadoExpensa)
  estado?: EstadoExpensa;

  @ApiPropertyOptional({
    description: 'Página para paginación',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Límite de resultados por página',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
