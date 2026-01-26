import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Rol, EstadoUsuario } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PrismaService } from '../../../database/prisma.service';

/**
 * Guard que verifica si el usuario tiene uno de los roles requeridos.
 * 
 * IMPORTANTE: Los roles se verifican contra los roles del usuario en CUALQUIER
 * consorcio o contra su rol global (SUPER_ADMIN).
 * 
 * La validación específica por consorcio se hace en el servicio.
 * 
 * SEGURIDAD:
 * - Valida que el usuario esté ACTIVO
 * - Verifica roles activos únicamente
 * - SUPER_ADMIN tiene acceso completo
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener roles requeridos del decorador
    const requiredRoles = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener usuario del request (ya autenticado por JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.sub) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // ✅ SEGURIDAD: Verificar que el usuario existe y está activo
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: user.sub },
      select: { 
        id: true, 
        estado: true,
        email: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    // ✅ SEGURIDAD: Validar estado del usuario
    if (usuario.estado !== EstadoUsuario.ACTIVO) {
      const mensajes: Record<EstadoUsuario, string> = {
        [EstadoUsuario.SUSPENDIDO]: 'Tu cuenta ha sido suspendida',
        [EstadoUsuario.INACTIVO]: 'Tu cuenta está inactiva',
        [EstadoUsuario.PENDIENTE_VERIFICACION]: 'Verifica tu email para continuar',
        [EstadoUsuario.ACTIVO]: '', // No debería llegar aquí
      };
      throw new UnauthorizedException(
        mensajes[usuario.estado] || 'Cuenta no disponible'
      );
    }

    // Verificar si el usuario tiene alguno de los roles requeridos
    const usuarioConRoles = await this.prisma.usuarioConsorcio.findMany({
      where: {
        usuarioId: user.sub,
        activo: true,
        rol: { in: requiredRoles },
      },
      select: { rol: true },
    });

    // Si el usuario tiene alguno de los roles requeridos, permitir acceso
    if (usuarioConRoles.length > 0) {
      return true;
    }

    // ✅ SEGURIDAD: Verificar si es SUPER_ADMIN (tiene acceso a todo)
    // SUPER_ADMIN siempre puede acceder, incluso si no está en requiredRoles
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId: user.sub,
        rol: Rol.SUPER_ADMIN,
        activo: true,
      },
    });

    if (esSuperAdmin) {
      return true;
    }

    throw new ForbiddenException(
      `Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
    );
  }
}
