import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

@Module({
  imports: [
    PassportModule,
    // ✅ SEGURO: JWT configurado asíncronamente con validación
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>("JWT_SECRET");
        const nodeEnv = configService.get<string>("NODE_ENV");
        
        // ⚠️ CRÍTICO: Validar que el secret existe y es seguro
        if (!secret) {
          throw new Error(
            "JWT_SECRET must be defined in environment variables"
          );
        }
        
        if (secret.length < 32) {
          throw new Error(
            "JWT_SECRET must be at least 32 characters for security"
          );
        }
        
        // En producción, no permitir secrets conocidos
        const knownInsecureSecrets = [
          "dev-secret-change-in-production",
          "secret",
          "password",
          "123456",
        ];
        
        if (
          nodeEnv === "production" &&
          knownInsecureSecrets.some((s) => secret.toLowerCase().includes(s))
        ) {
          throw new Error(
            "JWT_SECRET contains insecure patterns. Use a cryptographically random secret in production."
          );
        }
        
        return {
          secret,
          signOptions: {
            expiresIn: "15m", // Access token corto (15 minutos)
            issuer: "vecinosimple",
            audience: "vecinosimple-api",
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
