// =============================================================================
// DTOs para el Portal de Residentes
// =============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

// -----------------------------------------------------------------------------
// DTOs de Request
// -----------------------------------------------------------------------------

export class FilterMisExpensasDto {
  @ApiPropertyOptional({ description: 'Página (default: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite por página (default: 12)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 12;

  @ApiPropertyOptional({ description: 'Año a filtrar' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  anio?: number;

  @ApiPropertyOptional({ description: 'Solo mostrar pendientes de pago' })
  @IsOptional()
  @IsString()
  soloPendientes?: string;
}

export class FilterGastosEdificioDto {
  @ApiPropertyOptional({ description: 'Período (YYYY-MM)' })
  @IsOptional()
  @IsString()
  periodo?: string;

  @ApiPropertyOptional({ description: 'Categoría de gasto' })
  @IsOptional()
  @IsString()
  categoriaId?: string;

  @ApiPropertyOptional({ description: 'Solo gastos extraordinarios' })
  @IsOptional()
  @IsString()
  soloExtraordinarios?: string;

  @ApiPropertyOptional({ description: 'Página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Límite por página' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// -----------------------------------------------------------------------------
// DTOs de Response
// -----------------------------------------------------------------------------

export class MiUnidadFuncionalDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Código de la unidad (ej: 4B, PB-A)' })
  codigo: string;

  @ApiProperty({ description: 'Piso' })
  piso: string | null;

  @ApiProperty({ description: 'Número' })
  numero: string | null;

  @ApiProperty({ description: 'Tipo de unidad' })
  tipo: string;

  @ApiProperty({ description: 'Coeficiente de participación' })
  coeficiente: number;

  @ApiProperty({ description: 'Superficie en m2' })
  superficieM2: number | null;
}

export class MiConsorcioDto {
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

  @ApiProperty({ description: 'Día de vencimiento de expensas' })
  diaVencimiento: number;

  @ApiProperty({ description: 'Alias CBU para pagos (visible para vecinos)' })
  aliasCbu: string | null;

  @ApiProperty({ description: 'Banco del consorcio' })
  banco: string | null;

  @ApiProperty({ description: 'CUIT del consorcio' })
  cuit: string | null;
}

export class MiExpensaResumenDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Período (YYYY-MM)' })
  periodo: string;

  @ApiProperty({ description: 'Total a pagar' })
  total: number;

  @ApiProperty({ description: 'Monto ordinario' })
  montoOrdinario: number;

  @ApiProperty({ description: 'Monto extraordinario' })
  montoExtraordinario: number;

  @ApiProperty({ description: 'Saldo anterior (deuda/favor)' })
  saldoAnterior: number;

  @ApiProperty({ description: 'Intereses por mora' })
  intereses: number;

  @ApiProperty({ description: 'Bonificación aplicada' })
  bonificacion: number;

  @ApiProperty({ description: 'Estado del pago' })
  estadoPago: 'PENDIENTE' | 'PARCIAL' | 'PAGADO';

  @ApiProperty({ description: 'Fecha de vencimiento' })
  fechaVencimiento: Date;

  @ApiProperty({ description: 'Fecha segundo vencimiento' })
  fechaSegundoVencimiento: Date | null;

  @ApiProperty({ description: 'Estado de la expensa' })
  estado: string;
}

export class GastoEdificioDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  concepto: string;

  @ApiProperty()
  descripcion: string | null;

  @ApiProperty()
  monto: number;

  @ApiProperty()
  fechaGasto: Date;

  @ApiProperty({ description: 'Es extraordinario' })
  esExtraordinario: boolean;

  @ApiProperty({ description: 'Categoría del gasto' })
  categoria: { id: string; nombre: string } | null;

  @ApiProperty({ description: 'Proveedor' })
  proveedor: { id: string; razonSocial: string } | null;

  @ApiProperty({ description: 'URL del comprobante/factura' })
  archivoUrl: string | null;

  @ApiProperty({ description: 'Nombre del archivo' })
  archivoNombre: string | null;

  @ApiProperty({ description: 'Tipo de comprobante' })
  tipoComprobante: string | null;

  @ApiProperty({ description: 'Número de comprobante' })
  numeroComprobante: string | null;

  @ApiProperty({ description: 'CAE AFIP (factura electrónica)' })
  caeAfip: string | null;
}

export class ExpensaDetalleCompletoDto extends MiExpensaResumenDto {
  @ApiProperty({ description: 'Gastos ordinarios del período', type: [GastoEdificioDto] })
  gastosOrdinarios: GastoEdificioDto[];

  @ApiProperty({ description: 'Gastos extraordinarios del período', type: [GastoEdificioDto] })
  gastosExtraordinarios: GastoEdificioDto[];

  @ApiProperty({ description: 'Resumen por categoría' })
  resumenPorCategoria: { categoria: string; total: number }[];

  @ApiProperty({ description: 'Total gastos del edificio' })
  totalGastosEdificio: number;

  @ApiProperty({ description: 'Mi porcentaje de participación' })
  miCoeficiente: number;

  @ApiProperty({ description: 'Pagos realizados para este período' })
  pagosRealizados: {
    id: string;
    monto: number;
    fecha: Date;
    estado: string;
    metodoPago: string;
  }[];
}

export class ResumenUnidadesEdificioDto {
  @ApiProperty({ description: 'Total de unidades funcionales' })
  totalUnidades: number;

  @ApiProperty({ description: 'Unidades al día' })
  unidadesAlDia: number;

  @ApiProperty({ description: 'Unidades con deuda' })
  unidadesConDeuda: number;

  @ApiProperty({ description: 'Porcentaje de morosidad' })
  porcentajeMorosidad: number;

  @ApiProperty({ description: 'Lista de todas las unidades (sin datos sensibles)' })
  unidades: {
    codigo: string;
    tipo: string;
    coeficiente: number;
    estado: 'AL_DIA' | 'DEUDA_MENOR' | 'DEUDA_MAYOR';
  }[];
}

export class MisExpensasResponseDto {
  @ApiProperty({ type: [MiExpensaResumenDto] })
  data: MiExpensaResumenDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ description: 'Saldo actual de la cuenta' })
  saldoActual: number;
}

export class GastosEdificioResponseDto {
  @ApiProperty({ type: [GastoEdificioDto] })
  data: GastoEdificioDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty({ description: 'Suma total de gastos' })
  sumaTotal: number;

  @ApiProperty({ description: 'Suma gastos ordinarios' })
  sumaOrdinarios: number;

  @ApiProperty({ description: 'Suma gastos extraordinarios' })
  sumaExtraordinarios: number;
}

export class DatosBancariosConsorcioDto {
  @ApiProperty({ description: 'Alias CBU para pagos' })
  aliasCbu: string | null;

  @ApiProperty({ description: 'Banco' })
  banco: string | null;

  @ApiProperty({ description: 'Nombre del consorcio (titular de cuenta)' })
  titular: string;

  @ApiProperty({ description: 'CUIT del consorcio' })
  cuit: string | null;

  @ApiProperty({ description: 'Instrucciones de pago' })
  instrucciones: string;
}
