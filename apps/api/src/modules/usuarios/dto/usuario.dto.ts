import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  IsArray,
} from 'class-validator';

// Enum de roles (debe coincidir con Prisma)
export enum Rol {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMINISTRADOR = 'ADMINISTRADOR',
  ADMIN_STAFF = 'ADMIN_STAFF',
  PROPIETARIO = 'PROPIETARIO',
  INQUILINO = 'INQUILINO',
  ENCARGADO = 'ENCARGADO',
  AUDITOR = 'AUDITOR',
  PROVEEDOR_EXTERNO = 'PROVEEDOR_EXTERNO',
}

export enum TipoVinculoUF {
  TITULAR_VOTANTE = 'TITULAR_VOTANTE',
  COPROPIETARIO = 'COPROPIETARIO',
  INQUILINO_PRINCIPAL = 'INQUILINO_PRINCIPAL',
}

export enum EstadoUsuario {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
  PENDIENTE_VERIFICACION = 'PENDIENTE_VERIFICACION',
  SUSPENDIDO = 'SUSPENDIDO',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateUsuarioDto {
  @ApiProperty({ example: 'juan@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede superar 50 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede superar 50 caracteres' })
  apellido: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{7,8}$/, { message: 'DNI debe tener 7 u 8 dígitos' })
  dni?: string;

  @ApiPropertyOptional({ example: '+5491155551234' })
  @IsOptional()
  @IsString()
  telefono?: string;
}

export class AsignarRolConsorcioDto {
  @ApiProperty({ description: 'ID del consorcio' })
  @IsString()
  consorcioId: string;

  @ApiProperty({ enum: Rol, description: 'Rol a asignar' })
  @IsEnum(Rol, { message: 'Rol inválido' })
  rol: Rol;

  @ApiPropertyOptional({ description: 'ID de la unidad funcional (para PROPIETARIO/INQUILINO)' })
  @IsOptional()
  @IsString()
  unidadFuncionalId?: string;

  @ApiPropertyOptional({ enum: TipoVinculoUF })
  @IsOptional()
  @IsEnum(TipoVinculoUF)
  tipoVinculo?: TipoVinculoUF;

  // Permisos granulares para ADMIN_STAFF
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  puedeCargarGastos?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  puedeVerConciliacion?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  puedeEnviarComunicados?: boolean;
}

export class CreateUsuarioConRolDto extends CreateUsuarioDto {
  @ApiProperty({ type: AsignarRolConsorcioDto })
  rolConsorcio: AsignarRolConsorcioDto;
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateUsuarioDto {
  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  nombre?: string;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  apellido?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{7,8}$/, { message: 'DNI debe tener 7 u 8 dígitos' })
  dni?: string;

  @ApiPropertyOptional({ example: '+5491155551234' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ enum: EstadoUsuario })
  @IsOptional()
  @IsEnum(EstadoUsuario)
  estado?: EstadoUsuario;
}

export class UpdateRolConsorcioDto {
  @ApiPropertyOptional({ enum: Rol })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unidadFuncionalId?: string;

  @ApiPropertyOptional({ enum: TipoVinculoUF })
  @IsOptional()
  @IsEnum(TipoVinculoUF)
  tipoVinculo?: TipoVinculoUF;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  puedeCargarGastos?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  puedeVerConciliacion?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  puedeEnviarComunicados?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

// ============================================================================
// QUERY DTOs
// ============================================================================

export class ListUsuariosQueryDto {
  @ApiPropertyOptional({ description: 'Buscar por nombre, apellido o email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por consorcio' })
  @IsOptional()
  @IsString()
  consorcioId?: string;

  @ApiPropertyOptional({ enum: Rol, description: 'Filtrar por rol' })
  @IsOptional()
  @IsEnum(Rol)
  rol?: Rol;

  @ApiPropertyOptional({ enum: EstadoUsuario })
  @IsOptional()
  @IsEnum(EstadoUsuario)
  estado?: EstadoUsuario;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class UsuarioConsorcioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  consorcioNombre: string;

  @ApiProperty({ enum: Rol })
  rol: Rol;

  @ApiPropertyOptional()
  unidadFuncionalId?: string;

  @ApiPropertyOptional()
  unidadFuncionalCodigo?: string;

  @ApiPropertyOptional({ enum: TipoVinculoUF })
  tipoVinculo?: TipoVinculoUF;

  @ApiProperty()
  puedeCargarGastos: boolean;

  @ApiProperty()
  puedeVerConciliacion: boolean;

  @ApiProperty()
  puedeEnviarComunicados: boolean;

  @ApiProperty()
  activo: boolean;
}

export class UsuarioResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  apellido: string;

  @ApiPropertyOptional()
  telefono?: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty({ enum: EstadoUsuario })
  estado: EstadoUsuario;

  @ApiProperty()
  emailVerificado: boolean;

  @ApiPropertyOptional()
  ultimoAcceso?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ type: [UsuarioConsorcioResponseDto] })
  rolesConsorcio: UsuarioConsorcioResponseDto[];
}

export class UsuarioListResponseDto {
  @ApiProperty({ type: [UsuarioResponseDto] })
  data: UsuarioResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  totalPages: number;
}

export class InvitacionEnviadaDto {
  @ApiProperty()
  usuarioId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  mensaje: string;
}
