/**
 * UploadController
 * API REST para subida de archivos al storage
 *
 * Endpoints:
 * - POST /upload/:folder     - Subir archivo a una carpeta específica
 * - GET  /upload/signed-url  - Obtener URL firmada para un archivo privado
 * - DELETE /upload/:key      - Eliminar archivo del storage
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Rol } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StorageService, UploadResult } from './storage.service';

interface JwtPayload {
  sub: string;
  email: string;
  rol: Rol;
  consorcioActivo?: string;
}

// Carpetas permitidas para upload
const CARPETAS_PERMITIDAS = [
  'documentos',
  'gastos',
  'avatars',
  'trabajos',
  'tickets',
  'expensas',
] as const;

type CarpetaPermitida = (typeof CARPETAS_PERMITIDAS)[number];

// Roles que pueden subir archivos a cada carpeta
const ROLES_POR_CARPETA: Record<CarpetaPermitida, Rol[]> = {
  documentos: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF],
  gastos: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF],
  avatars: [
    Rol.SUPER_ADMIN,
    Rol.ADMINISTRADOR,
    Rol.ADMIN_STAFF,
    Rol.PROPIETARIO,
    Rol.INQUILINO,
    Rol.ENCARGADO,
  ],
  trabajos: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.PROVEEDOR_EXTERNO],
  tickets: [
    Rol.SUPER_ADMIN,
    Rol.ADMINISTRADOR,
    Rol.ADMIN_STAFF,
    Rol.PROPIETARIO,
    Rol.INQUILINO,
    Rol.ENCARGADO,
  ],
  expensas: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF],
};

@ApiTags('Upload')
@ApiBearerAuth()
@Controller('upload')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UploadController {
  private readonly logger = new Logger(UploadController.name);

  constructor(private readonly storageService: StorageService) {}

  /**
   * Subir archivo a una carpeta específica
   */
  @Post(':folder')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Subir archivo al storage' })
  @ApiParam({
    name: 'folder',
    description: 'Carpeta destino',
    enum: CARPETAS_PERMITIDAS,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo a subir',
        },
      },
      required: ['file'],
    },
  })
  @ApiQuery({
    name: 'consorcioId',
    required: false,
    description: 'ID del consorcio (para organización)',
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    description: 'Si el archivo será público',
    type: Boolean,
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string', example: 'https://cdn.vecinosimple.com/...' },
        key: { type: 'string', example: 'documentos/xxx/2024/01/...' },
        filename: { type: 'string', example: 'documento.pdf' },
        size: { type: 'number', example: 1024 },
        contentType: { type: 'string', example: 'application/pdf' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Archivo inválido o carpeta no permitida' })
  @ApiResponse({ status: 403, description: 'Sin permisos para subir a esta carpeta' })
  async uploadFile(
    @Param('folder') folder: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('consorcioId') consorcioId: string,
    @Query('isPublic') isPublic: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<UploadResult> {
    // Validar carpeta
    if (!CARPETAS_PERMITIDAS.includes(folder as CarpetaPermitida)) {
      throw new BadRequestException(
        `Carpeta no permitida. Permitidas: ${CARPETAS_PERMITIDAS.join(', ')}`,
      );
    }

    // Validar archivo
    if (!file) {
      throw new BadRequestException('Debe proporcionar un archivo');
    }

    // Validar permisos del rol
    const rolesPermitidos = ROLES_POR_CARPETA[folder as CarpetaPermitida];
    if (!rolesPermitidos.includes(user.rol)) {
      throw new BadRequestException(
        `No tiene permisos para subir archivos a la carpeta "${folder}"`,
      );
    }

    // Usar consorcio del token si no se especifica
    const consorcio = consorcioId || user.consorcioActivo;

    try {
      const result = await this.storageService.upload({
        content: file.buffer,
        filename: file.originalname,
        contentType: file.mimetype,
        folder,
        consorcioId: consorcio,
        isPublic: isPublic === 'true',
        metadata: {
          uploadedBy: user.sub,
          uploadedAt: new Date().toISOString(),
        },
      });

      this.logger.log(
        `Archivo subido: ${result.key} por usuario ${user.sub.substring(0, 8)}...`,
      );

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error subiendo archivo: ${errorMessage}`);
      throw new BadRequestException(errorMessage);
    }
  }

  /**
   * Obtener URL firmada para acceder a un archivo privado
   */
  @Get('signed-url')
  @ApiOperation({ summary: 'Obtener URL firmada para archivo privado' })
  @ApiQuery({ name: 'key', description: 'Key del archivo en el storage' })
  @ApiQuery({
    name: 'expiresIn',
    required: false,
    description: 'Tiempo de expiración en segundos (default: 3600)',
  })
  @ApiResponse({
    status: 200,
    schema: {
      type: 'object',
      properties: {
        url: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getSignedUrl(
    @Query('key') key: string,
    @Query('expiresIn') expiresIn?: string,
  ): Promise<{ url: string; expiresAt: Date }> {
    if (!key) {
      throw new BadRequestException('Debe proporcionar el key del archivo');
    }

    const expirationSeconds = expiresIn ? parseInt(expiresIn, 10) : 3600;

    const url = await this.storageService.getSignedUrl(key, {
      expiresIn: expirationSeconds,
    });

    return {
      url,
      expiresAt: new Date(Date.now() + expirationSeconds * 1000),
    };
  }

  /**
   * Eliminar archivo del storage
   */
  @Delete()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @ApiOperation({ summary: 'Eliminar archivo del storage' })
  @ApiQuery({ name: 'key', description: 'Key del archivo a eliminar' })
  @ApiResponse({ status: 200, description: 'Archivo eliminado' })
  @ApiResponse({ status: 404, description: 'Archivo no encontrado' })
  async deleteFile(
    @Query('key') key: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<{ mensaje: string }> {
    if (!key) {
      throw new BadRequestException('Debe proporcionar el key del archivo');
    }

    // Verificar que el archivo existe
    const exists = await this.storageService.exists(key);
    if (!exists) {
      throw new BadRequestException('Archivo no encontrado');
    }

    await this.storageService.delete(key);

    this.logger.log(`Archivo eliminado: ${key} por usuario ${user.sub.substring(0, 8)}...`);

    return { mensaje: 'Archivo eliminado exitosamente' };
  }
}
