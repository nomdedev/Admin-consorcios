import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { TipoBadge } from '@prisma/client';

// ===========================================================================
// Constantes de configuración de badges
// ===========================================================================

/**
 * Configuración predefinida de badges del sistema
 * Cada badge tiene criterios automáticos de evaluación
 */
export const BADGES_CONFIG: Record<
  TipoBadge,
  {
    nombre: string;
    descripcion: string;
    icono: string;
    color: string;
    criteriosDefault: object;
  }
> = {
  PAGO_PUNTUAL: {
    nombre: 'Vecino Puntual',
    descripcion: 'Pagó antes del día de vencimiento',
    icono: '⏰',
    color: '#4CAF50',
    criteriosDefault: { diasAntesVencimiento: 0 },
  },
  RACHA_PAGOS: {
    nombre: 'Racha de Pagos',
    descripcion: 'Pagó X meses consecutivos antes del vencimiento',
    icono: '🔥',
    color: '#FF9800',
    criteriosDefault: { mesesConsecutivos: 3 },
  },
  VECINO_EJEMPLAR: {
    nombre: 'Vecino Ejemplar',
    descripcion: '6 meses consecutivos al día con las expensas',
    icono: '⭐',
    color: '#FFD700',
    criteriosDefault: { mesesConsecutivos: 6 },
  },
  PARTICIPATIVO: {
    nombre: 'Vecino Participativo',
    descripcion: 'Asiste regularmente a las asambleas',
    icono: '🗳️',
    color: '#2196F3',
    criteriosDefault: { asistenciasMinimas: 3 },
  },
  COLABORADOR: {
    nombre: 'Colaborador del Edificio',
    descripcion: 'Reporta problemas útiles para la comunidad',
    icono: '🛠️',
    color: '#9C27B0',
    criteriosDefault: { reportesUtiles: 5 },
  },
};

// ===========================================================================
// DTOs de entrada
// ===========================================================================

export class CreateBadgeDefinicionDto {
  @ApiProperty({ enum: TipoBadge, description: 'Tipo de badge' })
  @IsEnum(TipoBadge)
  tipo: TipoBadge;

  @ApiProperty({ example: 'Vecino Puntual', description: 'Nombre del badge' })
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @ApiProperty({ example: 'Pagó antes del vencimiento', description: 'Descripción' })
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @ApiProperty({
    example: { diasAntesVencimiento: 0, mesesConsecutivos: 1 },
    description: 'Criterios para obtener el badge (JSON)',
  })
  @IsObject()
  criterios: object;

  @ApiPropertyOptional({ example: '⭐', description: 'Icono o emoji' })
  @IsOptional()
  @IsString()
  iconoUrl?: string;

  @ApiPropertyOptional({ example: '#FFD700', description: 'Color hex' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    example: { descuentoProximo: 5 },
    description: 'Beneficios asociados (JSON)',
  })
  @IsOptional()
  @IsObject()
  beneficios?: object;

  @ApiPropertyOptional({
    example: 30,
    description: 'Días de vigencia del beneficio',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(365)
  diasVigenciaBeneficio?: number;
}

export class OtorgarBadgeManualDto {
  @ApiProperty({ description: 'ID del usuario' })
  @IsString()
  @IsNotEmpty()
  usuarioId: string;

  @ApiProperty({ description: 'ID del badge a otorgar' })
  @IsString()
  @IsNotEmpty()
  badgeId: string;

  @ApiPropertyOptional({
    example: { motivo: 'Premio especial por colaboración' },
    description: 'Datos adicionales de la obtención',
  })
  @IsOptional()
  @IsObject()
  datosObtencion?: object;
}

export class EvaluarBadgesUsuarioDto {
  @ApiProperty({ description: 'ID del usuario a evaluar' })
  @IsString()
  @IsNotEmpty()
  usuarioId: string;

  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  @IsNotEmpty()
  consorcioId: string;
}

export class ConfigurarVisibilidadBadgeDto {
  @ApiProperty({ description: 'Mostrar públicamente el badge' })
  @IsBoolean()
  mostrarPublico: boolean;
}

// ===========================================================================
// DTOs de respuesta
// ===========================================================================

export class BadgeDefinicionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: TipoBadge })
  tipo: TipoBadge;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  descripcion: string;

  @ApiProperty()
  criterios: object;

  @ApiPropertyOptional()
  iconoUrl?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  beneficios?: object;

  @ApiPropertyOptional()
  diasVigenciaBeneficio?: number;

  @ApiProperty()
  activo: boolean;

  @ApiProperty()
  createdAt: Date;
}

export class BadgeUsuarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  badgeId: string;

  @ApiPropertyOptional()
  datosObtencion?: object;

  @ApiPropertyOptional()
  beneficioHasta?: Date;

  @ApiProperty()
  beneficioUsado: boolean;

  @ApiProperty()
  mostrarPublico: boolean;

  @ApiProperty()
  obtenidoAt: Date;

  @ApiProperty({ type: BadgeDefinicionResponseDto })
  badge: BadgeDefinicionResponseDto;
}

export class BadgeConEstadoDto extends BadgeDefinicionResponseDto {
  @ApiProperty({ description: 'Si el usuario ya tiene este badge' })
  obtenido: boolean;

  @ApiPropertyOptional({ description: 'Fecha de obtención si aplica' })
  fechaObtencion?: Date;

  @ApiPropertyOptional({ description: 'Progreso hacia el badge (0-100)' })
  progreso?: number;

  @ApiPropertyOptional({ description: 'Descripción del progreso' })
  progresoDescripcion?: string;
}

export class ResumenBadgesUsuarioDto {
  @ApiProperty({ description: 'Total de badges obtenidos' })
  totalBadges: number;

  @ApiProperty({ description: 'Badges activos con beneficio vigente' })
  badgesConBeneficio: number;

  @ApiProperty({ type: [BadgeUsuarioResponseDto] })
  badges: BadgeUsuarioResponseDto[];

  @ApiProperty({ description: 'Próximos badges a obtener' })
  proximosBadges: BadgeConEstadoDto[];
}

// ===========================================================================
// Interfaces internas
// ===========================================================================

export interface CriteriosPagoPuntual {
  diasAntesVencimiento: number;
}

export interface CriteriosRachaPagos {
  mesesConsecutivos: number;
}

export interface CriteriosVecinoEjemplar {
  mesesConsecutivos: number;
}

export interface CriteriosParticipativo {
  asistenciasMinimas: number;
}

export interface CriteriosColaborador {
  reportesUtiles: number;
}

export interface ResultadoEvaluacion {
  tipo: TipoBadge;
  cumple: boolean;
  progreso: number; // 0-100
  progresoDescripcion: string;
  datosEvaluacion: object;
}

export interface BeneficioBadge {
  descuentoProximo?: number; // Porcentaje de descuento
  descuentoMonto?: number; // Monto fijo de descuento
  reservaPrioritaria?: boolean; // Prioridad en reserva de amenities
  comerciosAsociados?: string[]; // IDs de comercios con descuento
}
