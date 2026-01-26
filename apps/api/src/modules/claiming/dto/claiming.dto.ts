import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Rol, TipoVinculoUF, EstadoInvitacion } from '@prisma/client';

// =============================================================================
// DTOs para creación de invitaciones (Admin)
// =============================================================================

export class CreateInvitacionDto {
  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  consorcioId: string;

  @ApiProperty({ description: 'ID de la unidad funcional a reclamar' })
  @IsString()
  unidadFuncionalId: string;

  @ApiPropertyOptional({ description: 'Rol que se asignará al usuario', enum: Rol })
  @IsEnum(Rol)
  @IsOptional()
  rolAsignado?: Rol = Rol.PROPIETARIO;

  @ApiPropertyOptional({ description: 'Tipo de vínculo con la UF', enum: TipoVinculoUF })
  @IsEnum(TipoVinculoUF)
  @IsOptional()
  tipoVinculo?: TipoVinculoUF = TipoVinculoUF.TITULAR_VOTANTE;

  @ApiPropertyOptional({ description: 'Nombre esperado del usuario (para validación)' })
  @IsString()
  @IsOptional()
  nombreEsperado?: string;

  @ApiPropertyOptional({ description: 'Últimos 4 dígitos del DNI (para validación)' })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  @IsOptional()
  dniEsperado?: string;

  @ApiPropertyOptional({ description: 'Email esperado del usuario' })
  @IsEmail()
  @IsOptional()
  emailEsperado?: string;

  @ApiPropertyOptional({ description: 'Fecha de expiración de la invitación' })
  @IsDateString()
  @IsOptional()
  fechaExpiracion?: string;

  @ApiPropertyOptional({ description: 'Notas internas' })
  @IsString()
  @IsOptional()
  notas?: string;
}

export class CreateInvitacionBulkDto {
  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  consorcioId: string;

  @ApiPropertyOptional({ description: 'Generar para todas las unidades sin invitación activa' })
  generarParaTodas?: boolean;

  @ApiPropertyOptional({ description: 'IDs específicos de unidades funcionales' })
  @IsString({ each: true })
  @IsOptional()
  unidadFuncionalIds?: string[];
}

// =============================================================================
// DTOs para claiming (Usuario final)
// =============================================================================

export class ClaimUnidadDto {
  @ApiProperty({ 
    description: 'Código de invitación (8 caracteres)',
    example: 'ABC12345'
  })
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  @Matches(/^[A-Z0-9]{8}$/, {
    message: 'El código debe ser de 8 caracteres alfanuméricos en mayúsculas'
  })
  codigoInvitacion: string;

  @ApiPropertyOptional({ description: 'Últimos 4 dígitos del DNI (si se requiere validación)' })
  @IsString()
  @MinLength(4)
  @MaxLength(4)
  @IsOptional()
  dniValidacion?: string;
}

export class ValidarCodigoDto {
  @ApiProperty({ description: 'Código de invitación a validar' })
  @IsString()
  @MinLength(8)
  @MaxLength(8)
  codigoInvitacion: string;
}

// =============================================================================
// Response DTOs
// =============================================================================

export class InvitacionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  codigoInvitacion: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  unidadFuncionalId: string;

  @ApiProperty({ enum: Rol })
  rolAsignado: Rol;

  @ApiProperty({ enum: TipoVinculoUF })
  tipoVinculo: TipoVinculoUF;

  @ApiProperty({ enum: EstadoInvitacion })
  estado: EstadoInvitacion;

  @ApiProperty()
  fechaExpiracion: Date;

  @ApiPropertyOptional({ nullable: true })
  nombreEsperado?: string | null;

  @ApiPropertyOptional({ nullable: true })
  emailEsperado?: string | null;

  @ApiPropertyOptional({ nullable: true })
  notas?: string | null;

  @ApiProperty()
  intentosFallidos: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional({ nullable: true })
  usadaAt?: Date | null;
}

export class InvitacionConDetalleDto extends InvitacionResponseDto {
  @ApiProperty({ description: 'Datos del consorcio' })
  consorcio: {
    id: string;
    nombre: string;
    direccion: string;
  };

  @ApiProperty({ description: 'Datos de la unidad funcional' })
  unidadFuncional: {
    id: string;
    codigo: string;
    piso?: string | null;
    tipo: string;
  };
}

export class ValidacionCodigoResponseDto {
  @ApiProperty({ description: 'Si el código es válido' })
  valido: boolean;

  @ApiPropertyOptional({ description: 'Mensaje de error si no es válido' })
  mensaje?: string;

  @ApiPropertyOptional({ description: 'Si requiere validación de DNI' })
  requiereDni?: boolean;

  @ApiPropertyOptional({ description: 'Datos básicos del consorcio/unidad (sin revelar demasiado)' })
  preview?: {
    consorcioNombre: string;
    unidadCodigo: string;
    rolAsignado: Rol;
  };
}

export class ClaimResultDto {
  @ApiProperty({ description: 'Si el claim fue exitoso' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Mensaje' })
  mensaje?: string;

  @ApiPropertyOptional({ description: 'ID del usuario-consorcio creado' })
  usuarioConsorcioId?: string;

  @ApiPropertyOptional({ description: 'Datos del consorcio' })
  consorcio?: {
    id: string;
    nombre: string;
    direccion: string;
  };

  @ApiPropertyOptional({ description: 'Datos de la unidad' })
  unidad?: {
    id: string;
    codigo: string;
  };
}

export class BulkInvitacionResultDto {
  @ApiProperty({ description: 'Total de invitaciones generadas' })
  totalGeneradas: number;

  @ApiProperty({ description: 'Invitaciones creadas' })
  invitaciones: InvitacionResponseDto[];

  @ApiPropertyOptional({ description: 'Errores si los hubo' })
  errores?: string[];
}
