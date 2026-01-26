import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Decorador para especificar los roles permitidos para un endpoint
 * @param roles Lista de roles que pueden acceder al endpoint
 */
export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_KEY, roles);
