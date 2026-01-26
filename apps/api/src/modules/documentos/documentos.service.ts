/**
 * DocumentosService
 * Gestión de documentos del consorcio (reglamento, actas, contratos, planos)
 * 
 * Funcionalidades:
 * - CRUD de documentos
 * - Filtrado por categoría
 * - Control de visibilidad (público/privado)
 * - Estadísticas de almacenamiento
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, Rol, Documento } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateDocumentoDto,
  UpdateDocumentoDto,
  FiltrosDocumentoDto,
  DocumentoResponseDto,
  DocumentoListResponseDto,
  DocumentosStatsResponseDto,
  CATEGORIAS_DOCUMENTO,
} from './dto';

// Dominios permitidos para archivos
const DOMINIOS_PERMITIDOS = [
  'cdn.vecinosimple.com',
  'storage.googleapis.com',
  's3.amazonaws.com',
  'res.cloudinary.com',
];

// Tipos MIME permitidos
const TIPOS_MIME_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Roles que pueden gestionar documentos
const ROLES_GESTION: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
];

// Roles que pueden ver documentos privados
const ROLES_VER_PRIVADOS: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
  Rol.AUDITOR,
];

// Roles que pueden eliminar
const ROLES_ELIMINAR: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sanitiza texto para prevenir XSS
 */
function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Valida que la URL sea de un dominio permitido
 */
function validarDominioUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  try {
    const urlObj = new URL(url);
    return DOMINIOS_PERMITIDOS.some(
      (d) => urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

@Injectable()
export class DocumentosService {
  private readonly logger = new Logger(DocumentosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================================================
  // CRUD DE DOCUMENTOS
  // ==========================================================================

  /**
   * Lista documentos de un consorcio con filtros
   */
  async listarDocumentos(
    consorcioId: string,
    filtros: FiltrosDocumentoDto,
    usuarioRol: Rol,
  ): Promise<DocumentoListResponseDto> {
    const page = filtros.page || 1;
    const limit = filtros.limit || 20;
    const skip = (page - 1) * limit;

    // Construir where
    const where: Prisma.DocumentoWhereInput = {
      consorcioId,
    };

    // Filtro de búsqueda
    if (filtros.busqueda) {
      where.nombre = {
        contains: filtros.busqueda,
        mode: 'insensitive',
      };
    }

    // Filtro de categoría
    if (filtros.categoria) {
      where.categoria = filtros.categoria;
    }

    // Filtro de visibilidad
    // Si el usuario no tiene rol para ver privados, solo ve públicos
    if (!ROLES_VER_PRIVADOS.includes(usuarioRol) || filtros.soloPublicos) {
      where.esPublico = true;
    }

    const [documentos, total] = await Promise.all([
      this.prisma.documento.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { categoria: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      this.prisma.documento.count({ where }),
    ]);

    return {
      data: documentos.map(this.mapDocumentoResponse),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene detalle de un documento
   */
  async obtenerDocumento(
    documentoId: string,
    consorcioId: string,
    usuarioRol: Rol,
  ): Promise<DocumentoResponseDto> {
    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Validar consorcio
    if (documento.consorcioId !== consorcioId) {
      throw new ForbiddenException('No tiene acceso a este documento');
    }

    // Validar visibilidad
    if (!documento.esPublico && !ROLES_VER_PRIVADOS.includes(usuarioRol)) {
      throw new ForbiddenException('No tiene acceso a este documento privado');
    }

    return this.mapDocumentoResponse(documento);
  }

  /**
   * Crea un nuevo documento
   */
  async crearDocumento(
    dto: CreateDocumentoDto,
    usuarioId: string,
    usuarioRol: Rol,
  ): Promise<DocumentoResponseDto> {
    // Validar rol
    if (!ROLES_GESTION.includes(usuarioRol)) {
      throw new ForbiddenException('No tiene permisos para crear documentos');
    }

    // Validar acceso al consorcio
    await this.validarAccesoConsorcio(usuarioId, dto.consorcioId, usuarioRol);

    // Validar dominio de URL
    if (!validarDominioUrl(dto.archivoUrl)) {
      throw new BadRequestException(
        'La URL del archivo debe ser de un dominio permitido'
      );
    }

    // Validar tipo MIME
    if (!TIPOS_MIME_PERMITIDOS.includes(dto.archivoTipo)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Permitidos: ${TIPOS_MIME_PERMITIDOS.join(', ')}`
      );
    }

    // Crear documento
    const documento = await this.prisma.documento.create({
      data: {
        consorcioId: dto.consorcioId,
        nombre: sanitizeText(dto.nombre),
        descripcion: dto.descripcion ? sanitizeText(dto.descripcion) : null,
        categoria: dto.categoria,
        archivoUrl: dto.archivoUrl,
        archivoNombre: sanitizeText(dto.archivoNombre),
        archivoTipo: dto.archivoTipo,
        archivoTamano: dto.archivoTamano,
        esPublico: dto.esPublico ?? true,
      },
    });

    // Audit log
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Documento',
      entidadId: documento.id,
      datosNuevos: documento,
    });

    this.logger.log(`Documento creado: ${documento.id} en consorcio ${dto.consorcioId}`);

    return this.mapDocumentoResponse(documento);
  }

  /**
   * Actualiza un documento
   */
  async actualizarDocumento(
    documentoId: string,
    dto: UpdateDocumentoDto,
    usuarioId: string,
    usuarioRol: Rol,
  ): Promise<DocumentoResponseDto> {
    // Validar rol
    if (!ROLES_GESTION.includes(usuarioRol)) {
      throw new ForbiddenException('No tiene permisos para editar documentos');
    }

    // Obtener documento actual
    const documentoActual = await this.prisma.documento.findUnique({
      where: { id: documentoId },
    });

    if (!documentoActual) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Validar acceso al consorcio
    await this.validarAccesoConsorcio(usuarioId, documentoActual.consorcioId, usuarioRol);

    // Validar dominio de URL si se está actualizando
    if (dto.archivoUrl && !validarDominioUrl(dto.archivoUrl)) {
      throw new BadRequestException(
        'La URL del archivo debe ser de un dominio permitido'
      );
    }

    // Validar tipo MIME si se está actualizando
    if (dto.archivoTipo && !TIPOS_MIME_PERMITIDOS.includes(dto.archivoTipo)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Permitidos: ${TIPOS_MIME_PERMITIDOS.join(', ')}`
      );
    }

    // Preparar datos de actualización
    const updateData: Prisma.DocumentoUpdateInput = {};

    if (dto.nombre !== undefined) {
      updateData.nombre = sanitizeText(dto.nombre);
    }
    if (dto.descripcion !== undefined) {
      updateData.descripcion = dto.descripcion ? sanitizeText(dto.descripcion) : null;
    }
    if (dto.categoria !== undefined) {
      updateData.categoria = dto.categoria;
    }
    if (dto.archivoUrl !== undefined) {
      updateData.archivoUrl = dto.archivoUrl;
    }
    if (dto.archivoNombre !== undefined) {
      updateData.archivoNombre = sanitizeText(dto.archivoNombre);
    }
    if (dto.archivoTipo !== undefined) {
      updateData.archivoTipo = dto.archivoTipo;
    }
    if (dto.archivoTamano !== undefined) {
      updateData.archivoTamano = dto.archivoTamano;
    }
    if (dto.esPublico !== undefined) {
      updateData.esPublico = dto.esPublico;
    }

    // Actualizar
    const documento = await this.prisma.documento.update({
      where: { id: documentoId },
      data: updateData,
    });

    // Audit log
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Documento',
      entidadId: documento.id,
      datosAnteriores: documentoActual,
      datosNuevos: documento,
    });

    this.logger.log(`Documento actualizado: ${documentoId}`);

    return this.mapDocumentoResponse(documento);
  }

  /**
   * Elimina un documento
   */
  async eliminarDocumento(
    documentoId: string,
    usuarioId: string,
    usuarioRol: Rol,
  ): Promise<{ mensaje: string }> {
    // Solo ADMINISTRADOR y SUPER_ADMIN pueden eliminar
    if (!ROLES_ELIMINAR.includes(usuarioRol)) {
      throw new ForbiddenException('No tiene permisos para eliminar documentos');
    }

    // Obtener documento
    const documento = await this.prisma.documento.findUnique({
      where: { id: documentoId },
    });

    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    // Validar acceso al consorcio
    await this.validarAccesoConsorcio(usuarioId, documento.consorcioId, usuarioRol);

    // Eliminar
    await this.prisma.documento.delete({
      where: { id: documentoId },
    });

    // Audit log
    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'Documento',
      entidadId: documentoId,
      datosAnteriores: documento,
    });

    this.logger.log(`Documento eliminado: ${documentoId}`);

    return { mensaje: 'Documento eliminado correctamente' };
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtiene estadísticas de documentos del consorcio
   */
  async obtenerEstadisticas(
    consorcioId: string,
    usuarioRol: Rol,
  ): Promise<DocumentosStatsResponseDto> {
    // Validar rol
    if (!ROLES_VER_PRIVADOS.includes(usuarioRol)) {
      throw new ForbiddenException('No tiene permisos para ver estadísticas');
    }

    // Obtener todos los documentos del consorcio
    const documentos = await this.prisma.documento.findMany({
      where: { consorcioId },
      select: {
        categoria: true,
        archivoTamano: true,
      },
    });

    // Calcular estadísticas por categoría
    const statsPorCategoria: Record<string, { cantidad: number; tamanoTotal: number }> = {};

    for (const cat of CATEGORIAS_DOCUMENTO) {
      statsPorCategoria[cat] = { cantidad: 0, tamanoTotal: 0 };
    }

    let tamanoTotal = 0;

    for (const doc of documentos) {
      const cat = doc.categoria;
      if (statsPorCategoria[cat]) {
        statsPorCategoria[cat].cantidad++;
        statsPorCategoria[cat].tamanoTotal += doc.archivoTamano;
      }
      tamanoTotal += doc.archivoTamano;
    }

    return {
      totalDocumentos: documentos.length,
      tamanoTotal,
      porCategoria: Object.entries(statsPorCategoria).map(([categoria, stats]) => ({
        categoria,
        cantidad: stats.cantidad,
        tamanoTotal: stats.tamanoTotal,
      })),
    };
  }

  /**
   * Lista categorías disponibles
   */
  obtenerCategorias(): { categorias: string[] } {
    return { categorias: [...CATEGORIAS_DOCUMENTO] };
  }

  // ==========================================================================
  // HELPERS PRIVADOS
  // ==========================================================================

  /**
   * Valida que el usuario tenga acceso al consorcio
   */
  private async validarAccesoConsorcio(
    usuarioId: string,
    consorcioId: string,
    rol: Rol,
  ): Promise<void> {
    // SUPER_ADMIN tiene acceso a todo
    if (rol === Rol.SUPER_ADMIN) return;

    const usuarioConsorcio = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        activo: true,
      },
    });

    if (!usuarioConsorcio) {
      throw new ForbiddenException('No tiene acceso a este consorcio');
    }
  }

  /**
   * Mapea documento a DTO de respuesta
   */
  private mapDocumentoResponse(documento: Documento): DocumentoResponseDto {
    return {
      id: documento.id,
      consorcioId: documento.consorcioId,
      nombre: documento.nombre,
      descripcion: documento.descripcion || undefined,
      categoria: documento.categoria,
      archivoUrl: documento.archivoUrl,
      archivoNombre: documento.archivoNombre,
      archivoTipo: documento.archivoTipo,
      archivoTamano: documento.archivoTamano,
      esPublico: documento.esPublico,
      createdAt: documento.createdAt,
      updatedAt: documento.updatedAt,
    };
  }
}
