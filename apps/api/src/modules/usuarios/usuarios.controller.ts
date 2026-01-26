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
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import {
  CreateUsuarioConRolDto,
  UpdateUsuarioDto,
  AsignarRolConsorcioDto,
  UpdateRolConsorcioDto,
  ListUsuariosQueryDto,
  UsuarioResponseDto,
  UsuarioListResponseDto,
  Rol,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestWithUser } from '../../common/interfaces';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  // ============================================================================
  // LISTADO Y CONSULTA
  // ============================================================================

  @Get()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ 
    summary: 'Listar usuarios',
    description: 'Lista usuarios con filtros y paginación. SUPER_ADMIN ve todos, otros solo su organización.'
  })
  @ApiResponse({ status: 200, type: UsuarioListResponseDto })
  async findAll(
    @Query() query: ListUsuariosQueryDto,
    @Request() req: RequestWithUser,
  ): Promise<UsuarioListResponseDto> {
    return this.usuariosService.findAll(
      query,
      req.user.id,
      req.user.rol as Rol,
      req.user.organizacionId,
    );
  }

  @Get('consorcio/:consorcioId')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR)
  @ApiOperation({ 
    summary: 'Usuarios de un consorcio',
    description: 'Lista todos los usuarios que tienen algún rol en el consorcio especificado.'
  })
  @ApiParam({ name: 'consorcioId', description: 'ID del consorcio' })
  @ApiResponse({ status: 200, type: [UsuarioResponseDto] })
  async findByConsorcio(
    @Param('consorcioId') consorcioId: string,
    @Request() req: RequestWithUser,
  ): Promise<UsuarioResponseDto[]> {
    return this.usuariosService.findByConsorcio(consorcioId, req.user.id);
  }

  @Get(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ summary: 'Obtener usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async findOne(@Param('id') id: string): Promise<UsuarioResponseDto> {
    return this.usuariosService.findOne(id);
  }

  // ============================================================================
  // CREACIÓN Y ACTUALIZACIÓN
  // ============================================================================

  @Post()
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ 
    summary: 'Crear usuario',
    description: 'Crea un usuario y lo asigna a un consorcio con el rol especificado. Envía invitación por email.'
  })
  @ApiResponse({ status: 201, type: UsuarioResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email ya registrado' })
  async create(
    @Body() dto: CreateUsuarioConRolDto,
    @Request() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.create(dto, req.user.id, req.user.rol as Rol);
  }

  @Patch(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ summary: 'Actualizar datos de usuario' })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUsuarioDto,
    @Request() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.update(id, dto, req.user.id);
  }

  // ============================================================================
  // GESTIÓN DE ROLES
  // ============================================================================

  @Post(':id/roles')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ 
    summary: 'Asignar rol en consorcio',
    description: 'Asigna un nuevo rol al usuario en un consorcio específico.'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({ status: 409, description: 'Ya tiene este rol en el consorcio' })
  async asignarRol(
    @Param('id') id: string,
    @Body() dto: AsignarRolConsorcioDto,
    @Request() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.asignarRolConsorcio(id, dto, req.user.id, req.user.rol as Rol);
  }

  @Patch('roles/:usuarioConsorcioId')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Actualizar rol de usuario',
    description: 'Actualiza el rol, permisos o estado de un usuario en un consorcio.'
  })
  @ApiParam({ name: 'usuarioConsorcioId', description: 'ID de la relación usuario-consorcio' })
  @ApiResponse({ status: 200, type: UsuarioResponseDto })
  async updateRol(
    @Param('usuarioConsorcioId') usuarioConsorcioId: string,
    @Body() dto: UpdateRolConsorcioDto,
    @Request() req: RequestWithUser,
  ): Promise<UsuarioResponseDto> {
    return this.usuariosService.updateRolConsorcio(usuarioConsorcioId, dto, req.user.id);
  }

  // ============================================================================
  // ACCIONES ESPECIALES
  // ============================================================================

  @Delete(':id')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR)
  @ApiOperation({ 
    summary: 'Desactivar usuario',
    description: 'Desactiva un usuario y todos sus roles. No elimina datos (soft delete).'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Usuario desactivado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  async deactivate(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ mensaje: string }> {
    return this.usuariosService.deactivate(id, req.user.id);
  }

  @Post(':id/reinvitar')
  @Roles(Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF)
  @ApiOperation({ 
    summary: 'Reenviar invitación',
    description: 'Reenvía el email de invitación a un usuario que no ha verificado su cuenta.'
  })
  @ApiParam({ name: 'id', description: 'ID del usuario' })
  @ApiResponse({ status: 200, description: 'Invitación reenviada' })
  @ApiResponse({ status: 400, description: 'Usuario ya verificado' })
  async reinvitar(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ): Promise<{ mensaje: string }> {
    return this.usuariosService.reinvitar(id, req.user.id);
  }
}
