import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Prisma } from '@prisma/client';

// =============================================================================
// DTOs para Snapshots de Expensas
// =============================================================================

export class CerrarExpensaDto {
  @ApiProperty({ description: 'ID de la expensa a cerrar' })
  @IsString()
  expensaId: string;

  @ApiPropertyOptional({ description: 'Motivo del cierre' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  motivoCierre?: string;
}

export class CreateNotaCreditoDebitoDto {
  @ApiProperty({ description: 'ID del snapshot de la expensa' })
  @IsString()
  snapshotExpensaId: string;

  @ApiProperty({ description: 'ID de la unidad funcional afectada' })
  @IsString()
  unidadFuncionalId: string;

  @ApiProperty({ description: 'Tipo de nota', enum: ['credito', 'debito'] })
  @IsEnum(['credito', 'debito'])
  tipo: 'credito' | 'debito';

  @ApiProperty({ description: 'Monto de la nota (siempre positivo)' })
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  monto: number;

  @ApiProperty({ description: 'Concepto breve' })
  @IsString()
  @MaxLength(200)
  concepto: string;

  @ApiProperty({ description: 'Justificación detallada' })
  @IsString()
  justificacion: string;

  @ApiPropertyOptional({ description: 'URL del documento de respaldo' })
  @IsString()
  @IsOptional()
  documentoUrl?: string;

  @ApiProperty({ description: 'Período donde se aplicará el ajuste (ej: 2024-02)' })
  @IsString()
  aplicadoEnPeriodo: string;
}

// =============================================================================
// Response DTOs
// =============================================================================

export class SnapshotExpensaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  expensaId: string;

  @ApiProperty()
  periodo: string;

  @ApiProperty({ description: 'Hash SHA-256 para verificar integridad' })
  hashIntegridad: string;

  @ApiPropertyOptional({ nullable: true })
  firmaDigital?: string | null;

  @ApiProperty()
  cerradoPor: string;

  @ApiPropertyOptional({ nullable: true })
  motivoCierre?: string | null;

  @ApiProperty()
  fechaCierreLegal: Date;

  @ApiProperty()
  createdAt: Date;
}

export class SnapshotConDetalleDto extends SnapshotExpensaResponseDto {
  @ApiProperty({ description: 'Datos completos de la expensa (JSON)' })
  datosCompletos: Prisma.JsonValue;

  @ApiPropertyOptional({ description: 'Notas de crédito/débito asociadas' })
  notasCredito?: NotaCreditoDebitoResponseDto[];
}

export class NotaCreditoDebitoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  snapshotExpensaId: string;

  @ApiProperty()
  unidadFuncionalId: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  monto: Prisma.Decimal; // Decimal de Prisma

  @ApiProperty()
  concepto: string;

  @ApiProperty()
  justificacion: string;

  @ApiPropertyOptional({ nullable: true })
  documentoUrl?: string | null;

  @ApiProperty()
  aprobadoPor: string;

  @ApiProperty()
  aplicadoEnPeriodo: string;

  @ApiProperty()
  createdAt: Date;
}

// =============================================================================
// Tipos para el snapshot de datos
// =============================================================================

export interface ExpensaSnapshotData {
  // Metadatos
  consorcio: {
    id: string;
    nombre: string;
    direccion: string;
    cuit: string | null;
  };
  periodo: string;
  fechaVencimiento: string;
  fechaSnapshot: string;

  // Totales
  totales: {
    gastosOrdinarios: number;
    gastosExtraordinarios: number;
    ingresos: number;
    fondoReserva: number;
  };

  // Detalle de gastos
  gastos: Array<{
    id: string;
    concepto: string;
    monto: number;
    esExtraordinario: boolean;
    categoria: string | null;
    proveedor: string | null;
    fechaGasto: string;
    comprobante: {
      tipo: string | null;
      numero: string | null;
      cae: string | null;
    };
  }>;

  // Prorrateo por unidad
  detallesPorUnidad: Array<{
    unidadFuncional: {
      id: string;
      codigo: string;
      coeficiente: number;
    };
    montoOrdinario: number;
    montoExtraordinario: number;
    saldoAnterior: number;
    intereses: number;
    bonificacion: number;
    total: number;
  }>;
}

export interface VerificacionIntegridadResult {
  valido: boolean;
  hashCalculado: string;
  hashAlmacenado: string;
  diferencias?: string[];
}
