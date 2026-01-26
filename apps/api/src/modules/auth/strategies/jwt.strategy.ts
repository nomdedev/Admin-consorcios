import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../database/prisma.service";

/**
 * Interface para el payload del JWT
 */
interface JwtPayload {
  sub: string;
  email: string;
  type?: string;
  iss?: string;
  aud?: string;
  iat: number;
  exp: number;
}

/**
 * Interface para el contexto de usuario validado
 */
export interface UserContext {
  sub: string;
  email: string;
  estado: string;
  roles: Array<{
    rol: string;
    consorcioId: string;
  }>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    const secret = configService.get<string>("JWT_SECRET");
    
    if (!secret) {
      throw new Error("JWT_SECRET must be defined");
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: "vecinosimple",
      audience: "vecinosimple-api",
    });
  }

  /**
   * Valida el payload del JWT y retorna el contexto de usuario
   * Se ejecuta en CADA request autenticado
   */
  async validate(payload: JwtPayload): Promise<UserContext> {
    // Validar campos requeridos del payload
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException("Token inválido: campos faltantes");
    }

    // Validar issuer y audience (configurados en JwtModule)
    if (payload.iss && payload.iss !== "vecinosimple") {
      throw new UnauthorizedException("Token inválido: issuer incorrecto");
    }

    if (payload.aud && payload.aud !== "vecinosimple-api") {
      throw new UnauthorizedException("Token inválido: audience incorrecto");
    }

    // Verificar que el usuario existe y está activo
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        estado: true,
        rolesConsorcio: {
          where: { activo: true },
          select: {
            rol: true,
            consorcioId: true,
          },
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException("Usuario no encontrado");
    }

    // Verificar estado del usuario
    switch (usuario.estado) {
      case "SUSPENDIDO":
        throw new UnauthorizedException(
          "Tu cuenta ha sido suspendida. Contacta al administrador."
        );
      case "INACTIVO":
        throw new UnauthorizedException(
          "Tu cuenta está inactiva. Contacta al administrador."
        );
      case "PENDIENTE_VERIFICACION":
        throw new UnauthorizedException(
          "Por favor verifica tu email antes de continuar."
        );
    }

    // Verificar que el email no haya cambiado (seguridad adicional)
    if (usuario.email !== payload.email) {
      throw new UnauthorizedException(
        "Token inválido: credenciales actualizadas"
      );
    }

    return {
      sub: payload.sub,
      email: payload.email,
      estado: usuario.estado,
      roles: usuario.rolesConsorcio.map((rc) => ({
        rol: rc.rol,
        consorcioId: rc.consorcioId,
      })),
    };
  }
}
