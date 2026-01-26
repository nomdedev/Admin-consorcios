import { Module } from '@nestjs/common';
import { ProveedoresController } from './proveedores.controller';
import { ProveedoresService } from './proveedores.service';
import { DatabaseModule } from '../../database/database.module';
import { AuditModule } from '../audit/audit.module';

/**
 * ProveedoresModule
 * 
 * Gestión de proveedores y marketplace:
 * - CRUD de proveedores con validación de CUIT
 * - Asociación proveedor-consorcio (favoritos, notas)
 * - Sistema de trabajos para autogestión de facturas
 * - Aprobación/rechazo con conversión automática a Gasto
 * - Verificación de proveedores (badge de confianza)
 * 
 * Reglas de negocio:
 * - CUIT validado algorítmicamente (dígito verificador)
 * - Proveedor solo puede cargar trabajos en consorcios asociados
 * - Al aprobar trabajo, se genera Gasto automáticamente
 * - Soft delete (activo: false) para mantener historial
 */
@Module({
  imports: [DatabaseModule, AuditModule],
  controllers: [ProveedoresController],
  providers: [ProveedoresService],
  exports: [ProveedoresService],
})
export class ProveedoresModule {}
