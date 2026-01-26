import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { TipoEmergencia } from '@prisma/client';

// =============================================================================
// DTOs para crear/actualizar alertas
// =============================================================================

export class CreateAlertaEmergenciaDto {
  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  @IsNotEmpty()
  consorcioId!: string;

  @ApiProperty({ 
    description: 'Tipo de emergencia', 
    enum: TipoEmergencia,
    example: TipoEmergencia.CORTE_AGUA
  })
  @IsEnum(TipoEmergencia)
  tipo!: TipoEmergencia;

  @ApiProperty({ 
    description: 'Título corto de la alerta',
    example: '⚠️ CORTE DE AGUA URGENTE'
  })
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  titulo!: string;

  @ApiProperty({ 
    description: 'Descripción detallada',
    example: 'Se produjo una rotura en el caño principal. El agua está cortada en todo el edificio.'
  })
  @IsString()
  @MinLength(10)
  descripcion!: string;

  @ApiPropertyOptional({ 
    description: 'Instrucciones específicas para los vecinos',
    example: 'Por favor cerrar canillas y llaves de paso. No usar los baños hasta nuevo aviso.'
  })
  @IsString()
  @IsOptional()
  instrucciones?: string;

  @ApiPropertyOptional({ 
    description: 'Enviar notificación push',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  enviarPush?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Enviar email',
    default: true
  })
  @IsBoolean()
  @IsOptional()
  enviarEmail?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Enviar WhatsApp (consume créditos)',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  enviarWhatsapp?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Enviar SMS (consume créditos)',
    default: false
  })
  @IsBoolean()
  @IsOptional()
  enviarSms?: boolean = false;
}

export class ResolverAlertaDto {
  @ApiProperty({ 
    description: 'Descripción de cómo se resolvió',
    example: 'Se reparó el caño. El servicio de agua ha sido restablecido.'
  })
  @IsString()
  @MinLength(10)
  resolucion!: string;
}

// =============================================================================
// Response DTOs
// =============================================================================

export class AlertaEmergenciaResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  consorcioId!: string;

  @ApiProperty({ enum: TipoEmergencia })
  tipo!: TipoEmergencia;

  @ApiProperty()
  titulo!: string;

  @ApiProperty()
  descripcion!: string;

  @ApiPropertyOptional({ nullable: true })
  instrucciones?: string | null;

  @ApiProperty()
  activa!: boolean;

  @ApiPropertyOptional({ nullable: true })
  resueltaAt?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  resolucion?: string | null;

  @ApiProperty()
  enviadoPush!: boolean;

  @ApiProperty()
  enviadoEmail!: boolean;

  @ApiProperty()
  enviadoWhatsapp!: boolean;

  @ApiProperty()
  enviadoSms!: boolean;

  @ApiProperty()
  destinatariosTotal!: number;

  @ApiProperty()
  enviosExitosos!: number;

  @ApiProperty()
  enviosFallidos!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiPropertyOptional()
  creadoPor?: {
    id: string;
    nombre: string;
    apellido: string;
  };
}

export class AlertaConEstadisticasDto extends AlertaEmergenciaResponseDto {
  @ApiProperty({ description: 'Estadísticas de envío por canal' })
  estadisticas!: {
    push: { enviados: number; fallidos: number };
    email: { enviados: number; fallidos: number };
    whatsapp: { enviados: number; fallidos: number };
    sms: { enviados: number; fallidos: number };
  };
}

// =============================================================================
// Tipos de emergencia con sus configuraciones
// =============================================================================

export const EMERGENCIA_CONFIG: Record<TipoEmergencia, {
  icono: string;
  color: string;
  prioridad: number;
  templateWhatsapp?: string;
}> = {
  [TipoEmergencia.CORTE_AGUA]: {
    icono: '💧',
    color: '#3B82F6', // blue
    prioridad: 3,
    templateWhatsapp: 'alerta_corte_agua',
  },
  [TipoEmergencia.CORTE_GAS]: {
    icono: '🔥',
    color: '#F97316', // orange
    prioridad: 5,
    templateWhatsapp: 'alerta_corte_gas',
  },
  [TipoEmergencia.CORTE_LUZ]: {
    icono: '⚡',
    color: '#EAB308', // yellow
    prioridad: 3,
    templateWhatsapp: 'alerta_corte_luz',
  },
  [TipoEmergencia.INCENDIO]: {
    icono: '🚨',
    color: '#EF4444', // red
    prioridad: 10,
    templateWhatsapp: 'alerta_incendio',
  },
  [TipoEmergencia.EVACUACION]: {
    icono: '🏃',
    color: '#EF4444', // red
    prioridad: 10,
    templateWhatsapp: 'alerta_evacuacion',
  },
  [TipoEmergencia.SEGURIDAD]: {
    icono: '🚔',
    color: '#8B5CF6', // purple
    prioridad: 7,
    templateWhatsapp: 'alerta_seguridad',
  },
  [TipoEmergencia.OTRO]: {
    icono: '⚠️',
    color: '#6B7280', // gray
    prioridad: 1,
  },
};
