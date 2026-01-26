import { Request } from 'express';

/**
 * Tipos de rol del sistema (compatible con Prisma y DTO)
 * Los valores son iguales al enum Rol tanto de Prisma como del DTO
 */
export type RolUsuario = 
  | 'SUPER_ADMIN'
  | 'ADMINISTRADOR'
  | 'ADMIN_STAFF'
  | 'PROPIETARIO'
  | 'INQUILINO'
  | 'ENCARGADO'
  | 'AUDITOR'
  | 'PROVEEDOR_EXTERNO';

/**
 * Payload del JWT decodificado
 * Usado en todo el sistema para acceder a datos del usuario autenticado
 */
export interface JwtPayload {
  /** ID del usuario (cuid) - alias de sub para compatibilidad */
  id: string;
  
  /** ID del usuario (cuid) - campo estándar JWT */
  sub: string;
  
  /** Email del usuario */
  email: string;
  
  /** ID del consorcio activo (para RLS) */
  consorcioId: string;
  
  /** Rol del usuario en el consorcio activo */
  rol: RolUsuario;
  
  /** ID de la organización (para admins) */
  organizacionId?: string;
  
  /** ID de la unidad funcional (para propietarios/inquilinos) */
  unidadFuncionalId?: string;
  
  /** Timestamp de emisión del token */
  iat?: number;
  
  /** Timestamp de expiración */
  exp?: number;
}

/**
 * Request extendido con datos del usuario autenticado
 * Usar en lugar de `req: any` en controllers
 * 
 * @example
 * ```typescript
 * @Get()
 * findAll(@Request() req: RequestWithUser) {
 *   const { consorcioId, rol } = req.user;
 *   return this.service.findAll(consorcioId);
 * }
 * ```
 */
export interface RequestWithUser extends Request {
  user: JwtPayload;
}

/**
 * Request con usuario opcional (para rutas públicas con auth opcional)
 */
export interface RequestWithOptionalUser extends Request {
  user?: JwtPayload;
}
