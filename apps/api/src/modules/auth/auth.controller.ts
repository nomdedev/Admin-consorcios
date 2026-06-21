import { Controller, Post, Body, UseGuards, Request, Get, Res, Req, UnauthorizedException } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { LoginDto, VerifyMagicLinkDto, AuthResponseDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RequestWithUser } from "../../common/interfaces";
import { Response, Request as ExpressRequest } from "express";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @ApiOperation({ summary: "Solicitar Magic Link" })
  // ✅ SEGURIDAD: Rate limit estricto para prevenir brute force y spam
  @Throttle({ default: { limit: 5, ttl: 300000 } }) // 5 intentos cada 5 minutos
  async login(@Body() loginDto: LoginDto) {
    return this.authService.requestMagicLink(loginDto);
  }

  @Post("verify")
  @ApiOperation({ summary: "Verificar Magic Link y obtener JWT" })
  // ✅ SEGURIDAD: Rate limit para prevenir adivinación de tokens
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 intentos por minuto
  async verify(
    @Body() verifyDto: VerifyMagicLinkDto,
    @Res({ passthrough: true }) response?: Response
  ): Promise<AuthResponseDto> {
    return this.authService.verifyMagicLink(verifyDto, response);
  }

  @Post("refresh")
  @ApiOperation({ summary: "Refrescar token JWT usando cookie" })
  // ✅ SEGURIDAD: Rate limit moderado para refresh
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 por minuto
  async refresh(
    @Req() request: ExpressRequest,
    @Res({ passthrough: true }) response?: Response
  ): Promise<AuthResponseDto> {
    const refreshToken = request.cookies?.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedException("No refresh token provided");
    }
    return this.authService.refreshToken(refreshToken, response);
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Cerrar sesión y limpiar refresh token" })
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 por minuto
  async logout(
    @Request() req: RequestWithUser,
    @Res({ passthrough: true }) response?: Response
  ) {
    return this.authService.logout(req.user.sub, response);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Obtener datos del usuario actual" })
  @SkipThrottle() // Este endpoint puede ser llamado frecuentemente
  async getCurrentUser(@Request() req: RequestWithUser) {
    return req.user;
  }
}
