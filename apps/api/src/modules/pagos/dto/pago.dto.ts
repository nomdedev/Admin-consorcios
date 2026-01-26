import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  ArrayMinSize,
  Matches,
  Min,
  Max,
  MaxLength,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

// =============================================================================
// ENUMS (sincronizados con Prisma)
// =============================================================================

export enum MetodoPago {
  MERCADO_PAGO = 'MERCADO_PAGO',
  TRANSFERENCIA = 'TRANSFERENCIA',
  EFECTIVO = 'EFECTIVO',
  DEBITO_AUTOMATICO = 'DEBITO_AUTOMATICO',
  SIRO = 'SIRO',
}

export enum EstadoPago {
  PENDIENTE = 'PENDIENTE',
  PROCESANDO = 'PROCESANDO',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
  REEMBOLSADO = 'REEMBOLSADO',
}

// =============================================================================
// DTOs DE CREACIÓN - PAGO VECINO
// =============================================================================

/**
 * DTO para iniciar un pago como vecino (PROPIETARIO/INQUILINO)
 * Este inicia el flujo de pago (ej: genera link de Mercado Pago)
 */
export class IniciarPagoDto {
  @ApiProperty({
    description: 'ID de la unidad funcional que realiza el pago',
    example: 'clx_uf_123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La unidad funcional es obligatoria' })
  unidadFuncionalId: string;

  @ApiProperty({
    description: 'Períodos de expensa a abonar (formato YYYY-MM)',
    example: ['2026-01', '2026-02'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Debe seleccionar al menos un período' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    each: true,
    message: 'Los períodos deben estar en formato YYYY-MM',
  })
  periodosAbonados: string[];

  @ApiProperty({
    description: 'Método de pago seleccionado',
    enum: MetodoPago,
    example: MetodoPago.MERCADO_PAGO,
  })
  @IsEnum(MetodoPago, { message: 'Método de pago inválido' })
  metodoPago: MetodoPago;

  @ApiPropertyOptional({
    description: 'Monto a pagar (si es pago parcial). Si no se especifica, se calcula automáticamente.',
    example: 50000.00,
  })
  @IsOptional()
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(100, { message: 'El monto mínimo es $100' })
  @Max(10000000, { message: 'El monto máximo es $10.000.000' })
  montoPersonalizado?: number;

  @ApiPropertyOptional({
    description: 'Comentario opcional del vecino',
    example: 'Pago de expensas atrasadas',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}

/**
 * DTO para registrar pago manual (EFECTIVO/TRANSFERENCIA)
 * Solo para ADMINISTRADOR/ADMIN_STAFF
 */
export class RegistrarPagoManualDto {
  @ApiProperty({
    description: 'ID de la unidad funcional que realiza el pago',
    example: 'clx_uf_123',
  })
  @IsString()
  @IsNotEmpty({ message: 'La unidad funcional es obligatoria' })
  unidadFuncionalId: string;

  @ApiProperty({
    description: 'Monto del pago recibido',
    example: 75000.00,
  })
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @Min(1, { message: 'El monto debe ser mayor a 0' })
  @Max(100000000, { message: 'El monto no puede superar $100.000.000' })
  monto: number;

  @ApiProperty({
    description: 'Método de pago',
    enum: [MetodoPago.EFECTIVO, MetodoPago.TRANSFERENCIA],
    example: MetodoPago.TRANSFERENCIA,
  })
  @IsEnum([MetodoPago.EFECTIVO, MetodoPago.TRANSFERENCIA], {
    message: 'Solo se permiten pagos en EFECTIVO o TRANSFERENCIA',
  })
  metodoPago: MetodoPago;

  @ApiProperty({
    description: 'Períodos de expensa que cubre el pago',
    example: ['2026-01'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1)
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    each: true,
    message: 'Los períodos deben estar en formato YYYY-MM',
  })
  periodosAbonados: string[];

  @ApiPropertyOptional({
    description: 'Referencia de transferencia bancaria',
    example: 'TRF-2026012512345',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  transferenciaRef?: string;

  @ApiProperty({
    description: 'Fecha efectiva del pago',
    example: '2026-01-15T14:30:00Z',
  })
  @IsDateString({}, { message: 'Fecha de pago inválida' })
  fechaPago: string;

  @ApiPropertyOptional({
    description: 'Concepto o comentario',
    example: 'Pago en efectivo recibido en oficina',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  concepto?: string;
}

// =============================================================================
// DTOs PARA WEBHOOKS DE PASARELAS
// =============================================================================

/**
 * DTO para webhook de Mercado Pago
 * CRÍTICO: Solo acepta notificaciones verificadas
 */
export class MercadoPagoWebhookDto {
  @ApiProperty({ description: 'Tipo de notificación' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'ID de la entidad en Mercado Pago' })
  @IsString()
  @IsNotEmpty()
  'data.id': string;

  @ApiPropertyOptional({ description: 'ID de usuario de MP' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ description: 'ID externo (nuestro pagoId)' })
  @IsOptional()
  @IsString()
  external_reference?: string;

  @ApiPropertyOptional({ description: 'Acción del webhook' })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: 'Modo API' })
  @IsOptional()
  @IsBoolean()
  live_mode?: boolean;
}

// =============================================================================
// DTOs DE CONSULTA/FILTROS
// =============================================================================

export class FilterPagosDto {
  @ApiPropertyOptional({
    description: 'ID del consorcio para filtrar',
    example: 'clx_consorcio_123',
  })
  @IsOptional()
  @IsString()
  consorcioId?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que realizó el pago',
    example: 'clx_usuario_123',
  })
  @IsOptional()
  @IsString()
  usuarioId?: string;

  @ApiPropertyOptional({
    description: 'ID de la unidad funcional',
    example: 'clx_uf_123',
  })
  @IsOptional()
  @IsString()
  unidadFuncionalId?: string;

  @ApiPropertyOptional({
    description: 'Estado del pago',
    enum: EstadoPago,
  })
  @IsOptional()
  @IsEnum(EstadoPago)
  estado?: EstadoPago;

  @ApiPropertyOptional({
    description: 'Método de pago',
    enum: MetodoPago,
  })
  @IsOptional()
  @IsEnum(MetodoPago)
  metodoPago?: MetodoPago;

  @ApiPropertyOptional({
    description: 'Período de expensa (formato YYYY-MM)',
    example: '2026-01',
  })
  @IsOptional()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, {
    message: 'El período debe estar en formato YYYY-MM',
  })
  periodo?: string;

  @ApiPropertyOptional({
    description: 'Fecha desde',
    example: '2026-01-01',
  })
  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @ApiPropertyOptional({
    description: 'Fecha hasta',
    example: '2026-01-31',
  })
  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @ApiPropertyOptional({
    description: 'Monto mínimo',
    example: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montoMin?: number;

  @ApiPropertyOptional({
    description: 'Monto máximo',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  montoMax?: number;

  @ApiPropertyOptional({
    description: 'Página de resultados',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}

// =============================================================================
// DTOs DE RESPUESTA
// =============================================================================

export class PagoResponseDto {
  @ApiProperty({ description: 'ID del pago' })
  id: string;

  @ApiProperty({ description: 'ID del usuario' })
  usuarioId: string;

  @ApiProperty({ description: 'Monto del pago' })
  monto: number;

  @ApiProperty({ description: 'Método de pago', enum: MetodoPago })
  metodoPago: MetodoPago;

  @ApiProperty({ description: 'Estado del pago', enum: EstadoPago })
  estado: EstadoPago;

  @ApiPropertyOptional({ description: 'ID de Mercado Pago' })
  mercadoPagoId?: string;

  @ApiPropertyOptional({ description: 'Referencia de transferencia' })
  transferenciaRef?: string;

  @ApiProperty({ description: 'Concepto' })
  concepto: string;

  @ApiProperty({ description: 'Períodos abonados', type: [String] })
  periodosAbonados: string[];

  @ApiPropertyOptional({ description: 'URL del comprobante' })
  comprobanteUrl?: string;

  @ApiPropertyOptional({ description: 'Fecha del pago' })
  fechaPago?: Date;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;
}

export class IniciarPagoResponseDto {
  @ApiProperty({ description: 'ID del pago creado' })
  pagoId: string;

  @ApiProperty({ description: 'Estado inicial' })
  estado: EstadoPago;

  @ApiProperty({ description: 'Monto total a pagar' })
  monto: number;

  @ApiPropertyOptional({
    description: 'URL para completar el pago (Mercado Pago)',
  })
  urlPago?: string;

  @ApiPropertyOptional({
    description: 'Preference ID de Mercado Pago',
  })
  preferenceId?: string;

  @ApiPropertyOptional({
    description: 'Datos para transferencia',
  })
  datosTransferencia?: {
    cbu: string;
    alias: string;
    titular: string;
    banco: string;
    concepto: string;
  };
}

export class PagoListResponseDto {
  @ApiProperty({ description: 'Lista de pagos', type: [PagoResponseDto] })
  data: PagoResponseDto[];

  @ApiProperty({ description: 'Total de registros' })
  total: number;

  @ApiProperty({ description: 'Página actual' })
  page: number;

  @ApiProperty({ description: 'Resultados por página' })
  limit: number;

  @ApiProperty({ description: 'Suma de montos de la página actual' })
  sumaPagina: number;

  @ApiProperty({ description: 'Suma total de todos los montos filtrados' })
  sumaTotal: number;
}

// =============================================================================
// DTOs DE CUENTA CORRIENTE
// =============================================================================

export class CuentaCorrienteResponseDto {
  @ApiProperty({ description: 'ID de la unidad funcional' })
  unidadFuncionalId: string;

  @ApiProperty({ description: 'Código de la unidad (ej: "3B")' })
  codigoUnidad: string;

  @ApiProperty({ description: 'Saldo actual (positivo = a favor, negativo = deuda)' })
  saldoActual: number;

  @ApiProperty({
    description: 'Detalle de expensas pendientes',
    type: 'array',
  })
  expensasPendientes: Array<{
    periodo: string;
    montoOriginal: number;
    intereses: number;
    totalAPagar: number;
  }>;

  @ApiProperty({ description: 'Monto total adeudado' })
  totalAdeudado: number;

  @ApiProperty({
    description: 'Últimos movimientos',
    type: 'array',
  })
  ultimosMovimientos: Array<{
    id: string;
    fecha: Date;
    concepto: string;
    monto: number;
    saldoResultante: number;
  }>;
}

// =============================================================================
// DTOs PARA ADMINISTRACIÓN
// =============================================================================

/**
 * DTO para actualizar estado de pago manualmente
 * Solo SUPER_ADMIN puede usar esto
 */
export class ActualizarEstadoPagoDto {
  @ApiProperty({
    description: 'Nuevo estado del pago',
    enum: EstadoPago,
  })
  @IsEnum(EstadoPago)
  estado: EstadoPago;

  @ApiProperty({
    description: 'Motivo del cambio de estado',
    example: 'Verificación manual de transferencia bancaria',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  motivo: string;
}

/**
 * DTO para reembolso de pago
 */
export class ReembolsarPagoDto {
  @ApiProperty({
    description: 'Motivo del reembolso',
    example: 'Pago duplicado por error del sistema',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  motivo: string;

  @ApiPropertyOptional({
    description: 'Monto a reembolsar (si es parcial)',
    example: 25000.00,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  montoReembolso?: number;
}
