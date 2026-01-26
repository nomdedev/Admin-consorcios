import {
  IsString,
  IsOptional,
  IsBoolean,
  IsUUID,
  IsNumber,
  IsArray,
  IsUrl,
  IsEmail,
  IsEnum,
  IsDateString,
  MaxLength,
  MinLength,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

// ============================================================================
// CREAR PROVEEDOR
// ============================================================================

export class CreateProveedorDto {
  @ApiProperty({
    description: 'Razón social del proveedor',
    example: 'Plomería González SRL',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: 'La razón social debe tener al menos 3 caracteres' })
  @MaxLength(200, { message: 'La razón social no puede superar 200 caracteres' })
  razonSocial: string;

  @ApiProperty({
    description: 'CUIT del proveedor (sin guiones)',
    example: '20304050607',
  })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'El CUIT debe tener 11 dígitos sin guiones' })
  cuit: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'contacto@plomeriagonzalez.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+54 11 4567-8901',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @ApiPropertyOptional({
    description: 'Dirección del proveedor',
    example: 'Av. Corrientes 1234, CABA',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  direccion?: string;

  @ApiProperty({
    description: 'Categorías de servicios que ofrece',
    example: ['plomeria', 'gas'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => 
    Array.isArray(value) ? value.map((s: string) => s.toLowerCase().trim()) : value
  )
  servicios: string[];
}

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {}

// ============================================================================
// VERIFICAR PROVEEDOR (ADMIN)
// ============================================================================

export class VerificarProveedorDto {
  @ApiProperty({
    description: 'Si el proveedor está verificado',
    example: true,
  })
  @IsBoolean()
  verificado: boolean;
}

// ============================================================================
// ASOCIAR PROVEEDOR A CONSORCIO
// ============================================================================

export class AsociarProveedorDto {
  @ApiProperty({
    description: 'ID del proveedor',
    example: 'clxyz123...',
  })
  @IsUUID()
  proveedorId: string;

  @ApiProperty({
    description: 'ID del consorcio',
    example: 'clxyz456...',
  })
  @IsUUID()
  consorcioId: string;

  @ApiPropertyOptional({
    description: 'Marcar como favorito',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esFavorito?: boolean;

  @ApiPropertyOptional({
    description: 'Notas internas sobre el proveedor',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nota?: string;
}

export class UpdateAsociacionDto {
  @ApiPropertyOptional({
    description: 'Marcar como favorito',
  })
  @IsOptional()
  @IsBoolean()
  esFavorito?: boolean;

  @ApiPropertyOptional({
    description: 'Notas internas sobre el proveedor',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  nota?: string;
}

// ============================================================================
// TRABAJOS DE PROVEEDOR (AUTOGESTIÓN)
// ============================================================================

export class CreateTrabajoDto {
  @ApiProperty({
    description: 'ID del consorcio donde se realizó el trabajo',
    example: 'clxyz456...',
  })
  @IsUUID()
  consorcioId: string;

  @ApiProperty({
    description: 'Descripción del trabajo realizado',
    example: 'Reparación de cañería en planta baja',
    minLength: 10,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(1000)
  descripcion: string;

  @ApiProperty({
    description: 'Monto del trabajo',
    example: 25000.50,
    minimum: 1,
  })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  monto: number;

  @ApiPropertyOptional({
    description: 'URL de la factura',
    example: 'https://cdn.example.com/facturas/abc123.pdf',
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL de factura inválida' })
  facturaUrl?: string;

  @ApiPropertyOptional({
    description: 'URLs de fotos del trabajo',
    example: ['https://cdn.example.com/fotos/1.jpg'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Una de las URLs de foto es inválida' })
  fotosUrls?: string[];

  @ApiProperty({
    description: 'Fecha en que se realizó el trabajo',
    example: '2026-01-15',
  })
  @IsDateString()
  fechaTrabajo: string;
}

export class UpdateTrabajoDto {
  @ApiPropertyOptional({
    description: 'Descripción del trabajo',
    minLength: 10,
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Monto del trabajo',
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  monto?: number;

  @ApiPropertyOptional({
    description: 'URL de la factura',
  })
  @IsOptional()
  @IsUrl()
  facturaUrl?: string;

  @ApiPropertyOptional({
    description: 'URLs de fotos del trabajo',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  fotosUrls?: string[];
}

// ============================================================================
// APROBAR/RECHAZAR TRABAJO
// ============================================================================

export class AprobarTrabajoDto {
  @ApiProperty({
    description: 'Acción a realizar',
    enum: ['aprobar', 'rechazar'],
    example: 'aprobar',
  })
  @IsEnum(['aprobar', 'rechazar'])
  accion: 'aprobar' | 'rechazar';

  @ApiPropertyOptional({
    description: 'Motivo del rechazo (requerido si se rechaza)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  motivoRechazo?: string;
}

// ============================================================================
// RESEÑA DE PROVEEDOR
// ============================================================================

export class CreateResenaDto {
  @ApiProperty({
    description: 'ID del proveedor',
    example: 'clxyz123...',
  })
  @IsUUID()
  proveedorId: string;

  @ApiProperty({
    description: 'Puntuación (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  puntuacion: number;

  @ApiPropertyOptional({
    description: 'Comentario de la reseña',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}

// ============================================================================
// FILTROS
// ============================================================================

export class FiltrosProveedorDto {
  @ApiPropertyOptional({
    description: 'Buscar por razón social o CUIT',
    example: 'gonzalez',
  })
  @IsOptional()
  @IsString()
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por servicio',
    example: 'plomeria',
  })
  @IsOptional()
  @IsString()
  servicio?: string;

  @ApiPropertyOptional({
    description: 'Solo proveedores verificados',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  verificado?: boolean;

  @ApiPropertyOptional({
    description: 'Solo proveedores activos',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  activo?: boolean;
}

export class FiltrosTrabajosDto {
  @ApiPropertyOptional({
    description: 'ID del consorcio',
  })
  @IsOptional()
  @IsUUID()
  consorcioId?: string;

  @ApiPropertyOptional({
    description: 'Estado del trabajo',
    enum: ['pendiente', 'aprobado', 'rechazado'],
  })
  @IsOptional()
  @IsEnum(['pendiente', 'aprobado', 'rechazado'])
  estado?: 'pendiente' | 'aprobado' | 'rechazado';

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
// RESPONSE DTOs
// ============================================================================

export class ProveedorResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  razonSocial: string;

  @ApiProperty()
  cuit: string;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  telefono?: string;

  @ApiPropertyOptional()
  direccion?: string;

  @ApiProperty({ type: [String] })
  servicios: string[];

  @ApiPropertyOptional()
  puntuacionPromedio?: number;

  @ApiProperty()
  cantidadResenas: number;

  @ApiProperty()
  verificado: boolean;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  createdAt: Date;

  // Campos adicionales para contexto de consorcio
  @ApiPropertyOptional()
  esFavorito?: boolean;

  @ApiPropertyOptional()
  nota?: string | null;
}

export class TrabajoResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  proveedorId: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  monto: number;

  @ApiPropertyOptional()
  facturaUrl?: string;

  @ApiProperty({ type: [String] })
  fotosUrls: string[];

  @ApiProperty()
  estado: string;

  @ApiPropertyOptional()
  aprobadoPor?: string;

  @ApiPropertyOptional()
  aprobadoAt?: Date;

  @ApiPropertyOptional()
  gastoId?: string;

  @ApiProperty()
  fechaTrabajo: Date;

  @ApiProperty()
  createdAt: Date;

  // Datos del proveedor
  @ApiPropertyOptional()
  proveedor?: {
    razonSocial: string;
    cuit: string;
  };
}

export class ProveedorConTrabajosDto extends ProveedorResponseDto {
  @ApiProperty({ type: [TrabajoResponseDto] })
  trabajos: TrabajoResponseDto[];
}

// ============================================================================
// ESTADÍSTICAS
// ============================================================================

export class EstadisticasProveedorDto {
  @ApiProperty()
  totalTrabajos: number;

  @ApiProperty()
  trabajosPendientes: number;

  @ApiProperty()
  trabajosAprobados: number;

  @ApiProperty()
  trabajosRechazados: number;

  @ApiProperty()
  montoTotalAprobado: number;

  @ApiProperty()
  montoTotalPendiente: number;
}
