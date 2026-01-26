import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator para definir qué roles pueden acceder a un endpoint
 * 
 * @example
 * @Roles('ADMINISTRADOR', 'ADMIN_STAFF')
 * @Get()
 * findAll() { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
