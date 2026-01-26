import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsArray,
  MaxLength,
  MinLength,
  IsUrl,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { EstadoTicket, PrioridadTicket } from '@prisma/client';

// ============================================================================
// CREAR TICKET
// ============================================================================

export class CreateTicketDto {
  @ApiProperty({
    description: 'ID del consorcio donde se crea el ticket',
    example: 'clxyz123...',
  })
  @IsUUID()
  consorcioId: string;

  @ApiProperty({
    description: 'Título descriptivo del problema',
    example: 'Pérdida de agua en el hall',
    minLength: 5,
    maxLength: 200,
  })
  @IsString()
  @MinLength(5, { message: 'El título debe tener al menos 5 caracteres' })
  @MaxLength(200, { message: 'El título no puede superar 200 caracteres' })
  titulo: string;

  @ApiProperty({
    description: 'Descripción detallada del problema',
    example: 'Hay una pérdida de agua en el techo del hall de entrada, cerca del ascensor...',
    minLength: 10,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(10, { message: 'La descripción debe tener al menos 10 caracteres' })
  @MaxLength(2000, { message: 'La descripción no puede superar 2000 caracteres' })
  descripcion: string;

  @ApiPropertyOptional({
    description: 'Ubicación específica del problema dentro del edificio',
    example: 'Hall de entrada, piso PB',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ubicacion?: string;

  @ApiPropertyOptional({
    description: 'Prioridad del ticket',
    enum: PrioridadTicket,
    default: 'MEDIA',
  })
  @IsOptional()
  @IsEnum(PrioridadTicket)
  prioridad?: PrioridadTicket;
}

// ============================================================================
// ACTUALIZAR TICKET
// ============================================================================

export class UpdateTicketDto extends PartialType(CreateTicketDto) {
  @ApiPropertyOptional({
    description: 'Estado del ticket',
    enum: EstadoTicket,
  })
  @IsOptional()
  @IsEnum(EstadoTicket)
  estado?: EstadoTicket;

  @ApiPropertyOptional({
    description: 'ID del usuario asignado para resolver el ticket',
    example: 'clxyz123...',
  })
  @IsOptional()
  @IsUUID()
  asignadoId?: string;
}

// ============================================================================
// CAMBIAR ESTADO
// ============================================================================

export class CambiarEstadoTicketDto {
  @ApiProperty({
    description: 'Nuevo estado del ticket',
    enum: EstadoTicket,
  })
  @IsEnum(EstadoTicket)
  estado: EstadoTicket;

  @ApiPropertyOptional({
    description: 'Comentario explicando el cambio de estado',
    example: 'Se contactó al plomero, vendrá mañana a las 10',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;
}

// ============================================================================
// ASIGNAR TICKET
// ============================================================================

export class AsignarTicketDto {
  @ApiProperty({
    description: 'ID del usuario a asignar',
    example: 'clxyz123...',
  })
  @IsUUID()
  usuarioId: string;

  @ApiPropertyOptional({
    description: 'Comentario sobre la asignación',
    example: 'Asignado al encargado para revisión inicial',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}

// ============================================================================
// AGREGAR COMENTARIO
// ============================================================================

export class CreateComentarioTicketDto {
  @ApiProperty({
    description: 'Contenido del comentario',
    example: 'Ya se contactó al proveedor, vendrá el lunes',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @MinLength(1, { message: 'El comentario no puede estar vacío' })
  @MaxLength(2000, { message: 'El comentario no puede superar 2000 caracteres' })
  contenido: string;

  @ApiPropertyOptional({
    description: 'Si es true, el comentario solo es visible para administradores',
    default: false,
  })
  @IsOptional()
  esInterno?: boolean;
}

// ============================================================================
// SUBIR ARCHIVO
// ============================================================================

export class CreateArchivoTicketDto {
  @ApiProperty({
    description: 'URL del archivo subido',
    example: 'https://storage.vecinosimple.com/tickets/abc123/foto1.jpg',
  })
  @IsUrl({}, { message: 'La URL del archivo no es válida' })
  url: string;

  @ApiProperty({
    description: 'Nombre original del archivo',
    example: 'foto_perdida_agua.jpg',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  nombre: string;

  @ApiProperty({
    description: 'Tipo MIME del archivo',
    example: 'image/jpeg',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  tipo: string;

  @ApiProperty({
    description: 'Tamaño del archivo en bytes',
    example: 1024000,
    minimum: 1,
    maximum: 10485760, // 10MB
  })
  @IsInt()
  @Min(1)
  @Max(10485760, { message: 'El archivo no puede superar 10MB' })
  tamano: number;
}

// ============================================================================
// FILTROS Y QUERIES
// ============================================================================

export class FiltroTicketsDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: EstadoTicket,
  })
  @IsOptional()
  @IsEnum(EstadoTicket)
  estado?: EstadoTicket;

  @ApiPropertyOptional({
    description: 'Filtrar por prioridad',
    enum: PrioridadTicket,
  })
  @IsOptional()
  @IsEnum(PrioridadTicket)
  prioridad?: PrioridadTicket;

  @ApiPropertyOptional({
    description: 'Filtrar por usuario asignado',
  })
  @IsOptional()
  @IsUUID()
  asignadoId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por creador del ticket',
  })
  @IsOptional()
  @IsUUID()
  creadorId?: string;

  @ApiPropertyOptional({
    description: 'Buscar en título y descripción',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  busqueda?: string;

  @ApiPropertyOptional({
    description: 'Número de página',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad por página',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  porPagina?: number = 20;
}

// ============================================================================
// RESPUESTAS
// ============================================================================

export class ArchivoTicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  nombre: string;

  @ApiProperty()
  tipo: string;

  @ApiProperty()
  tamano: number;

  @ApiProperty()
  createdAt: Date;
}

export class ComentarioTicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contenido: string;

  @ApiProperty()
  esInterno: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  usuario: {
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl?: string;
  };
}

export class TicketResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  consorcioId: string;

  @ApiProperty()
  titulo: string;

  @ApiProperty()
  descripcion: string;

  @ApiPropertyOptional()
  ubicacion?: string;

  @ApiProperty({ enum: PrioridadTicket })
  prioridad: PrioridadTicket;

  @ApiProperty({ enum: EstadoTicket })
  estado: EstadoTicket;

  @ApiPropertyOptional()
  fechaResolucion?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  creador: {
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl?: string;
  };

  @ApiPropertyOptional()
  asignado?: {
    id: string;
    nombre: string;
    apellido: string;
    avatarUrl?: string;
  };

  @ApiProperty({ type: [ArchivoTicketResponseDto] })
  archivos: ArchivoTicketResponseDto[];

  @ApiProperty()
  _count: {
    comentarios: number;
  };
}

export class TicketDetalleResponseDto extends TicketResponseDto {
  @ApiProperty({ type: [ComentarioTicketResponseDto] })
  comentarios: ComentarioTicketResponseDto[];
}

export class ListaTicketsResponseDto {
  @ApiProperty({ type: [TicketResponseDto] })
  items: TicketResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  pagina: number;

  @ApiProperty()
  porPagina: number;

  @ApiProperty()
  totalPaginas: number;
}

export class EstadisticasTicketsDto {
  @ApiProperty({ description: 'Total de tickets' })
  total: number;

  @ApiProperty({ description: 'Tickets abiertos' })
  abiertos: number;

  @ApiProperty({ description: 'Tickets en progreso' })
  enProgreso: number;

  @ApiProperty({ description: 'Tickets esperando respuesta' })
  esperandoRespuesta: number;

  @ApiProperty({ description: 'Tickets resueltos' })
  resueltos: number;

  @ApiProperty({ description: 'Tickets cerrados' })
  cerrados: number;

  @ApiProperty({ description: 'Tickets urgentes abiertos' })
  urgentesAbiertos: number;

  @ApiProperty({ description: 'Tiempo promedio de resolución en horas' })
  tiempoPromedioResolucion?: number;
}
