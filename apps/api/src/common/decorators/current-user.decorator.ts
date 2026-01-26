import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para obtener el usuario actual o una propiedad específica
 * 
 * @example
 * // Obtener el usuario completo
 * @CurrentUser() user: JwtPayload
 * 
 * // Obtener solo el ID
 * @CurrentUser('id') userId: string
 * 
 * // Obtener la organización
 * @CurrentUser('organizacionId') orgId: string
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
