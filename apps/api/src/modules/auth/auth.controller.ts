import { Controller, Post, Body, UseGuards, Request, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Throttle, SkipThrottle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { LoginDto, VerifyMagicLinkDto, AuthResponseDto } from "./dto/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RequestWithUser } from "../../common/interfaces";

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
    @Body() verifyDto: VerifyMagicLinkDto
  ): Promise<AuthResponseDto> {
    return this.authService.verifyMagicLink(verifyDto);
  }

  @Post("refresh")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Refrescar token JWT" })
  // ✅ SEGURIDAD: Rate limit moderado para refresh
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 por minuto
  async refresh(@Request() req: RequestWithUser) {
    return this.authService.refreshToken(req.user.sub);
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
