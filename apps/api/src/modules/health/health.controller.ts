import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";

import { PrismaService } from "@/database/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Health check de la API" })
  async check() {
    // Verificar conexión a la base de datos
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        database: "connected",
        version: "1.0.0",
      };
    } catch {
      return {
        status: "error",
        timestamp: new Date().toISOString(),
        database: "disconnected",
        version: "1.0.0",
      };
    }
  }
}
