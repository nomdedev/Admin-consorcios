import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsUrl,
} from 'class-validator';

// ===========================================================================
// Tipos de acciones del QR
// ===========================================================================

export enum AccionQR {
  PAGAR = 'pagar',
  VER_DETALLE = 'ver_detalle',
  DESCARGAR_PDF = 'descargar_pdf',
  ACTIVAR_CUENTA = 'activar_cuenta',
}

// ===========================================================================
// DTOs de entrada
// ===========================================================================

export class CreateQRExpensaDto {
  @ApiProperty({ description: 'Período de la expensa (YYYY-MM)' })
  @IsString()
  @IsNotEmpty()
  expensaPeriodo: string;

  @ApiProperty({ description: 'ID de la unidad funcional' })
  @IsString()
  @IsNotEmpty()
  unidadFuncionalId: string;

  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  @IsNotEmpty()
  consorcioId: string;

  @ApiProperty({ enum: AccionQR, description: 'Acción principal del QR' })
  @IsEnum(AccionQR)
  accion: AccionQR;
}

export class GenerarQRBulkDto {
  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  @IsNotEmpty()
  consorcioId: string;

  @ApiProperty({ description: 'Período de la expensa (YYYY-MM)' })
  @IsString()
  @IsNotEmpty()
  expensaPeriodo: string;

  @ApiProperty({ enum: AccionQR, description: 'Acción por defecto' })
  @IsEnum(AccionQR)
  accion: AccionQR;
}

export class RegistrarEscaneoDto {
  @ApiProperty({ description: 'Código único del QR' })
  @IsString()
  @IsNotEmpty()
  codigoQR: string;

  @ApiPropertyOptional({ description: 'User agent del dispositivo' })
  @IsOptional()
  @IsString()
  userAgent?: string;

  @ApiPropertyOptional({ description: 'IP del usuario' })
  @IsOptional()
  @IsString()
  ip?: string;
}

export class RegistrarConversionDto {
  @ApiProperty({ description: 'Código único del QR' })
  @IsString()
  @IsNotEmpty()
  codigoQR: string;
}

// ===========================================================================
// DTOs de respuesta
// ===========================================================================

export class QRExpensaResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  codigoQR: string;

  @ApiProperty()
  expensaPeriodo: string;

  @ApiProperty()
  unidadFuncionalId: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty({ enum: AccionQR })
  accion: AccionQR;

  @ApiProperty()
  urlDestino: string;

  @ApiProperty()
  escaneos: number;

  @ApiPropertyOptional()
  primerEscaneo?: Date;

  @ApiPropertyOptional()
  ultimoEscaneo?: Date;

  @ApiProperty()
  convertido: boolean;

  @ApiPropertyOptional()
  conversionAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class QRGeneradoDto {
  @ApiProperty()
  codigoQR: string;

  @ApiProperty()
  urlCompleta: string;

  @ApiProperty({ description: 'SVG del código QR para embeber en PDF' })
  qrSvg: string;

  @ApiProperty()
  unidadFuncionalId: string;

  @ApiProperty()
  codigoUF: string;
}

export class MetricasQRDto {
  @ApiProperty()
  totalQRGenerados: number;

  @ApiProperty()
  totalEscaneos: number;

  @ApiProperty()
  tasaEscaneo: string; // Porcentaje

  @ApiProperty()
  conversiones: number;

  @ApiProperty()
  tasaConversion: string; // Porcentaje

  @ApiProperty()
  accionesPorTipo: {
    pagar: number;
    ver_detalle: number;
    descargar_pdf: number;
    activar_cuenta: number;
  };

  @ApiProperty()
  escaneosUltimos7Dias: number;

  @ApiProperty()
  conversionesUltimos7Dias: number;
}

export class QRConDetalleDto extends QRExpensaResponseDto {
  @ApiProperty()
  unidadFuncional: {
    id: string;
    codigo: string;
    piso?: string;
    numero?: string;
  };
}
