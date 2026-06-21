import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/database/prisma.service";
import { LoginDto, VerifyMagicLinkDto } from "./dto/auth.dto";
import crypto from "node:crypto";
import { EmailService } from "../email/email.service";
import { EmailTemplateService } from "../email/email-template.service";
import { Response } from "express";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly emailTemplateService: EmailTemplateService,
  ) {}

  /**
   * Envía un Magic Link al email del usuario
   * 
   * SEGURIDAD:
   * - Rate limited en controller (5 req/5min)
   * - Token aleatorio de 32 bytes
   * - Expira en 15 minutos
   * - No revela si el email existe o no
   */
  async requestMagicLink(loginDto: LoginDto) {
    const { email } = loginDto;

    // Verificar si el usuario existe
    let usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    // Si no existe, crear usuario pendiente de verificación
    if (!usuario) {
      usuario = await this.prisma.usuario.create({
        data: {
          email,
          nombre: "Usuario",
          apellido: "Pendiente",
          estado: "PENDIENTE_VERIFICACION",
        },
      });
    }

    // Generar token criptográficamente seguro
    const magicLinkToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        magicLinkToken,
        magicLinkExpira: expiresAt,
      },
    });

    // Construir el magic link
    const baseUrl = this.configService.get<string>("APP_URL") || 
                    this.configService.get<string>("NEXTAUTH_URL") || 
                    "http://localhost:3000";
    const magicLink = `${baseUrl}/auth/verify?token=${magicLinkToken}`;
    
    // Enviar email con el magic link
    const template = this.emailTemplateService.magicLink({
      nombre: usuario.nombre || 'Usuario',
      link: magicLink,
      expiresIn: '15 minutos',
    });

    const emailResult = await this.emailService.send({
      to: email,
      subject: `Iniciá sesión en VecinoSimple`,
      html: template.html,
      text: template.text,
    });

    if (emailResult.success) {
      this.logger.log(`Magic link enviado a ${email.substring(0, 3)}***`);
    } else {
      this.logger.warn(`No se pudo enviar magic link: ${emailResult.error}`);
    }
    
    // ✅ SEGURIDAD: Solo loguear en desarrollo con flag específico
    const nodeEnv = this.configService.get<string>("NODE_ENV");
    const debugAuth = this.configService.get<string>("DEBUG_AUTH");
    
    if (nodeEnv === "development" && debugAuth === "true") {
      // Solo mostrar parte del email para debugging
      const maskedEmail = email.substring(0, 3) + "***@" + email.split("@")[1];
      this.logger.debug(`Magic Link generado para: ${maskedEmail}`);
    }

    // ✅ SEGURIDAD: Respuesta genérica (no revela si el email existe)
    const response: Record<string, unknown> = {
      success: true,
      message: "Si el email está registrado, recibirás un enlace de acceso",
    };

    // Solo en desarrollo devolver el link (para testing)
    if (nodeEnv === "development") {
      response.magicLink = magicLink;
    }

    return response;
  }

  /**
   * Verifica el Magic Link y retorna tokens JWT
   * Ahora establece refresh token en cookie httpOnly
   */
  async verifyMagicLink(verifyDto: VerifyMagicLinkDto, response?: Response) {
    const { token } = verifyDto;

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpira: {
          gt: new Date(), // Mayor que ahora
        },
      },
    });

    if (!usuario) {
      throw new UnauthorizedException(
        "Token inválido o expirado"
      );
    }

    // Marcar como verificado
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        emailVerificado: true,
        estado: "ACTIVO",
        magicLinkToken: null,
        magicLinkExpira: null,
      },
    });

    // Generar access token (15 minutos)
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });

    // Generar refresh token criptográficamente seguro (7 días)
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Guardar hash del refresh token en base de datos
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        refreshTokenHash,
        refreshTokenExpires,
      },
    });

    // Establecer cookie httpOnly con refresh token
    if (response) {
      response.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      });
    }

    // Retornar access token en body (para uso en React)
    return {
      accessToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
      },
    };
  }

  /**
   * Verificar token JWT y retornar usuario
   */
  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: payload.sub },
      });

      if (!usuario) {
        throw new UnauthorizedException("Usuario no encontrado");
      }

      return usuario;
    } catch (error) {
      throw new UnauthorizedException("Token inválido");
    }
  }

  /**
   * Refrescar JWT usando refresh token de cookie
   */
  async refreshToken(refreshToken: string, response?: Response) {
    // Calcular hash del refresh token
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // Buscar usuario con este refresh token
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        refreshTokenHash,
        refreshTokenExpires: {
          gt: new Date(), // No expirado
        },
        estado: "ACTIVO",
      },
    });

    if (!usuario) {
      // Limpiar cookie inválida
      if (response) {
        response.clearCookie('refreshToken', {
          path: '/api/auth/refresh',
        });
      }
      throw new UnauthorizedException("Refresh token inválido o expirado");
    }

    // Generar nuevo access token
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });

    // Rotar refresh token (seguridad: generar uno nuevo)
    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newRefreshTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');
    const newRefreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Actualizar refresh token en base de datos
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        refreshTokenExpires: newRefreshTokenExpires,
      },
    });

    // Establecer nueva cookie
    if (response) {
      response.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: this.configService.get<string>('NODE_ENV') === 'production',
        sameSite: 'strict',
        path: '/api/auth/refresh',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
    }

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
      },
    };
  }

  /**
   * Cerrar sesión (limpiar refresh token)
   */
  async logout(usuarioId: string, response?: Response) {
    // Eliminar refresh token de base de datos
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        refreshTokenHash: null,
        refreshTokenExpires: null,
      },
    });

    // Limpiar cookie
    if (response) {
      response.clearCookie('refreshToken', {
        path: '/api/auth/refresh',
      });
    }

    return { success: true };
  }
}
