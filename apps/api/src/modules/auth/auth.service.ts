import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/database/prisma.service";
import { LoginDto, VerifyMagicLinkDto } from "./dto/auth.dto";
import crypto from "node:crypto";
import { EmailService } from "../email/email.service";
import { EmailTemplateService } from "../email/email-template.service";

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
   */
  async verifyMagicLink(verifyDto: VerifyMagicLinkDto) {
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

    // Generar JWT
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });

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
   * Refrescar JWT
   */
  async refreshToken(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });

    if (!usuario || usuario.estado !== "ACTIVO") {
      throw new UnauthorizedException("Usuario no disponible");
    }

    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });

    return { accessToken };
  }
}
