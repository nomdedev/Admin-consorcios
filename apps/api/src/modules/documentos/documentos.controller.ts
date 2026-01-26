/**
 * DocumentosController
 * API REST para gestión de documentos del consorcio
 * 
 * Endpoints:
 * - GET    /documentos                - Listar documentos del consorcio
 * - GET    /documentos/categorias     - Lista de categorías disponibles
 * - GET    /documentos/stats          - Estadísticas de documentos
 * - GET    /documentos/:id            - Detalle de documento
 * - POST   /documentos                - Crear documento
 * - PATCH  /documentos/:id            - Actualizar documento
 * - DELETE /documentos/:id            - Eliminar documento
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { DocumentosService } from './documentos.service';
import {
  CreateDocumentoDto,
  UpdateDocumentoDto,
  FiltrosDocumentoDto,
  DocumentoResponseDto,
  DocumentoListResponseDto,
  DocumentosStatsResponseDto,
} from './dto';

interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
  consorcioActivo?: string;
}

@ApiTags('Documentos')
@ApiBearerAuth()
@Controller('documentos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DocumentosController {
  constructor(private readonly documentosService: DocumentosService) {}

  // ==========================================================================
  // LISTAR Y CONSULTAR
  // ==========================================================================

  @Get()
  @ApiOperation({ summary: 'Listar documentos del consorcio' })
  @ApiResponse({ status: 200, type: DocumentoListResponseDto })
  async listarDocumentos(
    @Query() filtros: FiltrosDocumentoDto,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentoListResponseDto> {
    const consorcio = consorcioId || user.consorcioActivo;
    if (!consorcio) {
      throw new Error('Debe especificar un consorcio');
    }
    return this.documentosService.listarDocumentos(consorcio, filtros, user.rol);
  }

  @Get('categorias')
  @ApiOperation({ summary: 'Obtener lista de categorías de documentos' })
  @ApiResponse({ status: 200 })
  obtenerCategorias(): { categorias: string[] } {
    return this.documentosService.obtenerCategorias();
  }

  @Get('stats')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({ summary: 'Obtener estadísticas de documentos' })
  @ApiResponse({ status: 200, type: DocumentosStatsResponseDto })
  async obtenerEstadisticas(
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentosStatsResponseDto> {
    const consorcio = consorcioId || user.consorcioActivo;
    if (!consorcio) {
      throw new Error('Debe especificar un consorcio');
    }
    return this.documentosService.obtenerEstadisticas(consorcio, user.rol);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de un documento' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, type: DocumentoResponseDto })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async obtenerDocumento(
    @Param('id') id: string,
    @Query('consorcioId') consorcioId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentoResponseDto> {
    const consorcio = consorcioId || user.consorcioActivo;
    if (!consorcio) {
      throw new Error('Debe especificar un consorcio');
    }
    return this.documentosService.obtenerDocumento(id, consorcio, user.rol);
  }

  // ==========================================================================
  // GESTIÓN (CREAR, ACTUALIZAR, ELIMINAR)
  // ==========================================================================

  @Post()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ summary: 'Crear nuevo documento' })
  @ApiResponse({ status: 201, type: DocumentoResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @HttpCode(HttpStatus.CREATED)
  async crearDocumento(
    @Body() dto: CreateDocumentoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentoResponseDto> {
    return this.documentosService.crearDocumento(dto, user.sub, user.rol);
  }

  @Patch(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ summary: 'Actualizar documento' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, type: DocumentoResponseDto })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async actualizarDocumento(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentoDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<DocumentoResponseDto> {
    return this.documentosService.actualizarDocumento(id, dto, user.sub, user.rol);
  }

  @Delete(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar documento' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiResponse({ status: 200, description: 'Documento eliminado' })
  @ApiResponse({ status: 404, description: 'Documento no encontrado' })
  async eliminarDocumento(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ mensaje: string }> {
    return this.documentosService.eliminarDocumento(id, user.sub, user.rol);
  }
}
