import { Module } from '@nestjs/common';
import { AsambleasController } from './asambleas.controller';
import { AsambleasService } from './asambleas.service';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';

/**
 * AsambleasModule
 * 
 * Gestión de asambleas virtuales del consorcio:
 * - CRUD de asambleas
 * - Orden del día con puntos a tratar
 * - Sistema de votación por coeficiente
 * - Control de quórum
 * - Registro de asistencia y poderes
 * - Generación automática de actas
 * 
 * Reglas de negocio:
 * - Solo PROPIETARIO con tipoVinculo TITULAR_VOTANTE puede votar
 * - Quórum se calcula por coeficientes, no por cabezas
 * - Votos son inmutables con hash de integridad
 * - Actas incluyen hash de verificación
 */
@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [AsambleasController],
  providers: [AsambleasService],
  exports: [AsambleasService],
})
export class AsambleasModule {}
