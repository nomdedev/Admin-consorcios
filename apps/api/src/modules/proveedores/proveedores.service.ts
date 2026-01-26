import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Rol, Prisma, Proveedor, TrabajoProveedor } from '@prisma/client';
import {
  CreateProveedorDto,
  UpdateProveedorDto,
  VerificarProveedorDto,
  AsociarProveedorDto,
  UpdateAsociacionDto,
  CreateTrabajoDto,
  UpdateTrabajoDto,
  AprobarTrabajoDto,
  FiltrosProveedorDto,
  FiltrosTrabajosDto,
  ProveedorResponseDto,
  TrabajoResponseDto,
  EstadisticasProveedorDto,
} from './dto';

// Tipo flexible para TrabajoProveedor con proveedor parcial (select)
type TrabajoConProveedor = TrabajoProveedor & {
  proveedor?: { cuit: string; razonSocial: string };
};

// ============================================================================
// ROLES CON PERMISOS
// ============================================================================

const ROLES_GESTION: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
];

const ROLES_PUEDEN_VER: Rol[] = [
  Rol.SUPER_ADMIN,
  Rol.ADMINISTRADOR,
  Rol.ADMIN_STAFF,
  Rol.AUDITOR,
];

// Dominios permitidos para archivos
const DOMINIOS_PERMITIDOS = [
  'cdn.vecinosimple.com',
  'storage.googleapis.com',
  's3.amazonaws.com',
  'res.cloudinary.com',
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Sanitiza texto para prevenir XSS
 */
function sanitizeText(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Valida que la URL sea de un dominio permitido
 */
function validarDominioUrl(url: string | undefined | null): boolean {
  if (!url) return true;
  try {
    const urlObj = new URL(url);
    return DOMINIOS_PERMITIDOS.some(
      (d) => urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`)
    );
  } catch {
    return false;
  }
}

/**
 * Valida CUIT argentino
 */
function validarCuit(cuit: string): boolean {
  if (!/^\d{11}$/.test(cuit)) return false;
  
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = cuit.split('').map(Number);
  let suma = 0;
  
  for (let i = 0; i < 10; i++) {
    suma += (digitos[i] ?? 0) * (multiplicadores[i] ?? 0);
  }
  
  const resto = suma % 11;
  const digitoVerificador = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
  
  return digitos[10] === digitoVerificador;
}

// ============================================================================
// SERVICIO PRINCIPAL
// ============================================================================

@Injectable()
export class ProveedoresService {
  private readonly logger = new Logger(ProveedoresService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ==========================================================================
  // PROVEEDORES CRUD
  // ==========================================================================

  /**
   * Lista proveedores (con filtros)
   */
  async listarProveedores(
    filtros: FiltrosProveedorDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ProveedorResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.ProveedorWhereInput = {};

    if (filtros.busqueda) {
      const busqueda = filtros.busqueda.toLowerCase();
      where.OR = [
        { razonSocial: { contains: busqueda, mode: 'insensitive' } },
        { cuit: { contains: busqueda } },
      ];
    }

    if (filtros.servicio) {
      where.servicios = { has: filtros.servicio.toLowerCase() };
    }

    if (filtros.verificado !== undefined) {
      where.verificado = filtros.verificado;
    }

    if (filtros.activo !== undefined) {
      where.activo = filtros.activo;
    } else {
      where.activo = true; // Por defecto solo activos
    }

    const [proveedores, total] = await Promise.all([
      this.prisma.proveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { verificado: 'desc' },
          { puntuacionPromedio: 'desc' },
          { razonSocial: 'asc' },
        ],
      }),
      this.prisma.proveedor.count({ where }),
    ]);

    return {
      data: proveedores.map((p) => this.mapProveedorResponse(p)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lista proveedores de un consorcio
   */
  async listarProveedoresConsorcio(
    consorcioId: string,
    filtros: FiltrosProveedorDto,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: ProveedorResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const whereAsociacion: Prisma.ProveedorConsorcioWhereInput = {
      consorcioId,
    };

    const whereProveedor: Prisma.ProveedorWhereInput = {};

    if (filtros.busqueda) {
      whereProveedor.OR = [
        { razonSocial: { contains: filtros.busqueda, mode: 'insensitive' } },
        { cuit: { contains: filtros.busqueda } },
      ];
    }

    if (filtros.servicio) {
      whereProveedor.servicios = { has: filtros.servicio.toLowerCase() };
    }

    if (filtros.verificado !== undefined) {
      whereProveedor.verificado = filtros.verificado;
    }

    whereProveedor.activo = filtros.activo ?? true;

    const [asociaciones, total] = await Promise.all([
      this.prisma.proveedorConsorcio.findMany({
        where: {
          ...whereAsociacion,
          proveedor: whereProveedor,
        },
        skip,
        take: limit,
        include: {
          proveedor: true,
        },
        orderBy: [
          { esFavorito: 'desc' },
          { proveedor: { puntuacionPromedio: 'desc' } },
        ],
      }),
      this.prisma.proveedorConsorcio.count({
        where: {
          ...whereAsociacion,
          proveedor: whereProveedor,
        },
      }),
    ]);

    return {
      data: asociaciones.map((a) => ({
        ...this.mapProveedorResponse(a.proveedor),
        esFavorito: a.esFavorito,
        nota: a.nota,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Obtiene detalle de un proveedor
   */
  async obtenerProveedor(
    proveedorId: string,
    consorcioId?: string,
  ): Promise<ProveedorResponseDto> {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const response = this.mapProveedorResponse(proveedor);

    // Si se especifica consorcio, agregar datos de la asociación
    if (consorcioId) {
      const asociacion = await this.prisma.proveedorConsorcio.findUnique({
        where: {
          proveedorId_consorcioId: { proveedorId, consorcioId },
        },
      });

      if (asociacion) {
        response.esFavorito = asociacion.esFavorito;
        response.nota = asociacion.nota || undefined;
      }
    }

    return response;
  }

  /**
   * Crea un nuevo proveedor
   */
  async crearProveedor(
    dto: CreateProveedorDto,
    usuarioId: string,
  ): Promise<ProveedorResponseDto> {
    // Validar CUIT
    if (!validarCuit(dto.cuit)) {
      throw new BadRequestException('El CUIT ingresado no es válido');
    }

    // Verificar que no exista otro proveedor con el mismo CUIT
    const existente = await this.prisma.proveedor.findUnique({
      where: { cuit: dto.cuit },
    });

    if (existente) {
      throw new ConflictException('Ya existe un proveedor con ese CUIT');
    }

    const proveedor = await this.prisma.proveedor.create({
      data: {
        razonSocial: sanitizeText(dto.razonSocial),
        cuit: dto.cuit,
        email: dto.email?.toLowerCase(),
        telefono: dto.telefono ? sanitizeText(dto.telefono) : null,
        direccion: dto.direccion ? sanitizeText(dto.direccion) : null,
        servicios: dto.servicios.map((s) => s.toLowerCase().trim()),
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Proveedor',
      entidadId: proveedor.id,
      datosNuevos: proveedor,
    });

    this.logger.log(`Proveedor creado: ${proveedor.razonSocial} (${proveedor.id})`);

    return this.mapProveedorResponse(proveedor);
  }

  /**
   * Actualiza un proveedor
   */
  async actualizarProveedor(
    proveedorId: string,
    dto: UpdateProveedorDto,
    usuarioId: string,
  ): Promise<ProveedorResponseDto> {
    const proveedorActual = await this.prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });

    if (!proveedorActual) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Si se cambia el CUIT, validar
    if (dto.cuit && dto.cuit !== proveedorActual.cuit) {
      if (!validarCuit(dto.cuit)) {
        throw new BadRequestException('El CUIT ingresado no es válido');
      }

      const existente = await this.prisma.proveedor.findUnique({
        where: { cuit: dto.cuit },
      });

      if (existente) {
        throw new ConflictException('Ya existe un proveedor con ese CUIT');
      }
    }

    const datosUpdate: Prisma.ProveedorUpdateInput = {};

    if (dto.razonSocial !== undefined) {
      datosUpdate.razonSocial = sanitizeText(dto.razonSocial);
    }
    if (dto.cuit !== undefined) datosUpdate.cuit = dto.cuit;
    if (dto.email !== undefined) datosUpdate.email = dto.email?.toLowerCase() || null;
    if (dto.telefono !== undefined) {
      datosUpdate.telefono = dto.telefono ? sanitizeText(dto.telefono) : null;
    }
    if (dto.direccion !== undefined) {
      datosUpdate.direccion = dto.direccion ? sanitizeText(dto.direccion) : null;
    }
    if (dto.servicios !== undefined) {
      datosUpdate.servicios = dto.servicios.map((s) => s.toLowerCase().trim());
    }

    const proveedorActualizado = await this.prisma.proveedor.update({
      where: { id: proveedorId },
      data: datosUpdate,
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Proveedor',
      entidadId: proveedorId,
      datosAnteriores: proveedorActual,
      datosNuevos: proveedorActualizado,
    });

    return this.mapProveedorResponse(proveedorActualizado);
  }

  /**
   * Verifica o desverifica un proveedor (solo SUPER_ADMIN)
   */
  async verificarProveedor(
    proveedorId: string,
    dto: VerificarProveedorDto,
    usuarioId: string,
  ): Promise<ProveedorResponseDto> {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    const proveedorActualizado = await this.prisma.proveedor.update({
      where: { id: proveedorId },
      data: { verificado: dto.verificado },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Proveedor',
      entidadId: proveedorId,
      datosAnteriores: { verificado: proveedor.verificado },
      datosNuevos: { verificado: dto.verificado },
    });

    this.logger.log(
      `Proveedor ${proveedorId} ${dto.verificado ? 'verificado' : 'desverificado'}`
    );

    return this.mapProveedorResponse(proveedorActualizado);
  }

  /**
   * Desactiva un proveedor (soft delete)
   */
  async desactivarProveedor(
    proveedorId: string,
    usuarioId: string,
  ): Promise<void> {
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: proveedorId },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    // Verificar que no tenga trabajos pendientes
    const trabajosPendientes = await this.prisma.trabajoProveedor.count({
      where: { proveedorId, estado: 'pendiente' },
    });

    if (trabajosPendientes > 0) {
      throw new BadRequestException(
        `El proveedor tiene ${trabajosPendientes} trabajo(s) pendiente(s) de aprobación`
      );
    }

    await this.prisma.proveedor.update({
      where: { id: proveedorId },
      data: { activo: false },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'Proveedor',
      entidadId: proveedorId,
      datosAnteriores: proveedor,
    });

    this.logger.log(`Proveedor ${proveedorId} desactivado`);
  }

  // ==========================================================================
  // ASOCIACIONES PROVEEDOR-CONSORCIO
  // ==========================================================================

  /**
   * Asocia un proveedor a un consorcio
   */
  async asociarAConsorcio(
    dto: AsociarProveedorDto,
    usuarioId: string,
  ): Promise<ProveedorResponseDto> {
    // Verificar que el proveedor existe y está activo
    const proveedor = await this.prisma.proveedor.findUnique({
      where: { id: dto.proveedorId },
    });

    if (!proveedor || !proveedor.activo) {
      throw new NotFoundException('Proveedor no encontrado o inactivo');
    }

    // Verificar si ya está asociado
    const asociacionExistente = await this.prisma.proveedorConsorcio.findUnique({
      where: {
        proveedorId_consorcioId: {
          proveedorId: dto.proveedorId,
          consorcioId: dto.consorcioId,
        },
      },
    });

    if (asociacionExistente) {
      throw new ConflictException('El proveedor ya está asociado a este consorcio');
    }

    await this.prisma.proveedorConsorcio.create({
      data: {
        proveedorId: dto.proveedorId,
        consorcioId: dto.consorcioId,
        esFavorito: dto.esFavorito ?? false,
        nota: dto.nota ? sanitizeText(dto.nota) : null,
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'ProveedorConsorcio',
      entidadId: `${dto.proveedorId}-${dto.consorcioId}`,
      datosNuevos: dto,
    });

    return this.obtenerProveedor(dto.proveedorId, dto.consorcioId);
  }

  /**
   * Actualiza la asociación proveedor-consorcio
   */
  async actualizarAsociacion(
    proveedorId: string,
    consorcioId: string,
    dto: UpdateAsociacionDto,
    usuarioId: string,
  ): Promise<ProveedorResponseDto> {
    const asociacion = await this.prisma.proveedorConsorcio.findUnique({
      where: {
        proveedorId_consorcioId: { proveedorId, consorcioId },
      },
    });

    if (!asociacion) {
      throw new NotFoundException('Asociación no encontrada');
    }

    await this.prisma.proveedorConsorcio.update({
      where: {
        proveedorId_consorcioId: { proveedorId, consorcioId },
      },
      data: {
        esFavorito: dto.esFavorito ?? asociacion.esFavorito,
        nota: dto.nota !== undefined ? (dto.nota ? sanitizeText(dto.nota) : null) : asociacion.nota,
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'ProveedorConsorcio',
      entidadId: `${proveedorId}-${consorcioId}`,
      datosNuevos: dto,
    });

    return this.obtenerProveedor(proveedorId, consorcioId);
  }

  /**
   * Desasocia un proveedor de un consorcio
   */
  async desasociarDeConsorcio(
    proveedorId: string,
    consorcioId: string,
    usuarioId: string,
  ): Promise<void> {
    const asociacion = await this.prisma.proveedorConsorcio.findUnique({
      where: {
        proveedorId_consorcioId: { proveedorId, consorcioId },
      },
    });

    if (!asociacion) {
      throw new NotFoundException('Asociación no encontrada');
    }

    // Verificar que no tenga trabajos pendientes en este consorcio
    const trabajosPendientes = await this.prisma.trabajoProveedor.count({
      where: { proveedorId, consorcioId, estado: 'pendiente' },
    });

    if (trabajosPendientes > 0) {
      throw new BadRequestException(
        `El proveedor tiene ${trabajosPendientes} trabajo(s) pendiente(s) en este consorcio`
      );
    }

    await this.prisma.proveedorConsorcio.delete({
      where: {
        proveedorId_consorcioId: { proveedorId, consorcioId },
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'ProveedorConsorcio',
      entidadId: `${proveedorId}-${consorcioId}`,
      datosAnteriores: asociacion,
    });
  }

  // ==========================================================================
  // TRABAJOS DE PROVEEDOR
  // ==========================================================================

  /**
   * Lista trabajos (para admin o proveedor)
   */
  async listarTrabajos(
    filtros: FiltrosTrabajosDto,
    proveedorId?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ data: TrabajoResponseDto[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const where: Prisma.TrabajoProveedorWhereInput = {};

    if (proveedorId) {
      where.proveedorId = proveedorId;
    }

    if (filtros.consorcioId) {
      where.consorcioId = filtros.consorcioId;
    }

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.fechaDesde) {
      where.fechaTrabajo = { gte: new Date(filtros.fechaDesde) };
    }

    if (filtros.fechaHasta) {
      where.fechaTrabajo = {
        ...(where.fechaTrabajo as any || {}),
        lte: new Date(filtros.fechaHasta + 'T23:59:59.999Z'),
      };
    }

    const [trabajos, total] = await Promise.all([
      this.prisma.trabajoProveedor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          proveedor: {
            select: { razonSocial: true, cuit: true },
          },
        },
      }),
      this.prisma.trabajoProveedor.count({ where }),
    ]);

    return {
      data: trabajos.map((t) => this.mapTrabajoResponse(t)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Crea un trabajo (solo proveedor autenticado)
   */
  async crearTrabajo(
    dto: CreateTrabajoDto,
    proveedorId: string,
    usuarioId: string,
  ): Promise<TrabajoResponseDto> {
    // Verificar que el proveedor está asociado al consorcio
    const asociacion = await this.prisma.proveedorConsorcio.findUnique({
      where: {
        proveedorId_consorcioId: {
          proveedorId,
          consorcioId: dto.consorcioId,
        },
      },
    });

    if (!asociacion) {
      throw new ForbiddenException('No está asociado a este consorcio');
    }

    // Validar URLs de archivos
    if (dto.facturaUrl && !validarDominioUrl(dto.facturaUrl)) {
      throw new BadRequestException('URL de factura no permitida');
    }

    if (dto.fotosUrls) {
      for (const url of dto.fotosUrls) {
        if (!validarDominioUrl(url)) {
          throw new BadRequestException('Una de las URLs de foto no está permitida');
        }
      }
    }

    // Validar fecha (no futura, max 6 meses atrás)
    const fechaTrabajo = new Date(dto.fechaTrabajo);
    const ahora = new Date();
    const hace6Meses = new Date();
    hace6Meses.setMonth(hace6Meses.getMonth() - 6);

    if (fechaTrabajo > ahora) {
      throw new BadRequestException('La fecha del trabajo no puede ser futura');
    }

    if (fechaTrabajo < hace6Meses) {
      throw new BadRequestException('La fecha del trabajo no puede ser mayor a 6 meses atrás');
    }

    const trabajo = await this.prisma.trabajoProveedor.create({
      data: {
        proveedorId,
        consorcioId: dto.consorcioId,
        descripcion: sanitizeText(dto.descripcion),
        monto: new Prisma.Decimal(dto.monto),
        facturaUrl: dto.facturaUrl || null,
        fotosUrls: dto.fotosUrls || [],
        fechaTrabajo,
      },
      include: {
        proveedor: {
          select: { razonSocial: true, cuit: true },
        },
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'TrabajoProveedor',
      entidadId: trabajo.id,
      datosNuevos: trabajo,
    });

    this.logger.log(`Trabajo creado por proveedor ${proveedorId}: ${trabajo.id}`);

    return this.mapTrabajoResponse(trabajo);
  }

  /**
   * Actualiza un trabajo (solo si está pendiente)
   */
  async actualizarTrabajo(
    trabajoId: string,
    dto: UpdateTrabajoDto,
    proveedorId: string,
    usuarioId: string,
  ): Promise<TrabajoResponseDto> {
    const trabajo = await this.prisma.trabajoProveedor.findFirst({
      where: { id: trabajoId, proveedorId },
    });

    if (!trabajo) {
      throw new NotFoundException('Trabajo no encontrado');
    }

    if (trabajo.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden editar trabajos pendientes');
    }

    // Validar URLs si se actualizan
    if (dto.facturaUrl && !validarDominioUrl(dto.facturaUrl)) {
      throw new BadRequestException('URL de factura no permitida');
    }

    if (dto.fotosUrls) {
      for (const url of dto.fotosUrls) {
        if (!validarDominioUrl(url)) {
          throw new BadRequestException('Una de las URLs de foto no está permitida');
        }
      }
    }

    const datosUpdate: Prisma.TrabajoProveedorUpdateInput = {};

    if (dto.descripcion !== undefined) {
      datosUpdate.descripcion = sanitizeText(dto.descripcion);
    }
    if (dto.monto !== undefined) {
      datosUpdate.monto = new Prisma.Decimal(dto.monto);
    }
    if (dto.facturaUrl !== undefined) {
      datosUpdate.facturaUrl = dto.facturaUrl || null;
    }
    if (dto.fotosUrls !== undefined) {
      datosUpdate.fotosUrls = dto.fotosUrls;
    }

    const trabajoActualizado = await this.prisma.trabajoProveedor.update({
      where: { id: trabajoId },
      data: datosUpdate,
      include: {
        proveedor: {
          select: { razonSocial: true, cuit: true },
        },
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'TrabajoProveedor',
      entidadId: trabajoId,
      datosAnteriores: trabajo,
      datosNuevos: trabajoActualizado,
    });

    return this.mapTrabajoResponse(trabajoActualizado);
  }

  /**
   * Aprueba o rechaza un trabajo
   */
  async aprobarRechazarTrabajo(
    trabajoId: string,
    dto: AprobarTrabajoDto,
    usuarioId: string,
    consorcioId: string,
  ): Promise<TrabajoResponseDto> {
    const trabajo = await this.prisma.trabajoProveedor.findFirst({
      where: { id: trabajoId, consorcioId },
      include: {
        proveedor: true,
      },
    });

    if (!trabajo) {
      throw new NotFoundException('Trabajo no encontrado');
    }

    if (trabajo.estado !== 'pendiente') {
      throw new BadRequestException('El trabajo ya fue procesado');
    }

    if (dto.accion === 'rechazar' && !dto.motivoRechazo) {
      throw new BadRequestException('Debe indicar el motivo del rechazo');
    }

    const nuevoEstado = dto.accion === 'aprobar' ? 'aprobado' : 'rechazado';

    // Si se aprueba, crear el gasto asociado
    let gastoId: string | null = null;

    if (dto.accion === 'aprobar') {
      // Crear el gasto
      const gasto = await this.prisma.gasto.create({
        data: {
          consorcioId,
          concepto: `Trabajo: ${trabajo.descripcion.slice(0, 100)}`,
          descripcion: trabajo.descripcion,
          monto: trabajo.monto,
          proveedorId: trabajo.proveedorId,
          fechaGasto: trabajo.fechaTrabajo,
          archivoUrl: trabajo.facturaUrl,
          archivoNombre: trabajo.facturaUrl ? 'Factura de proveedor' : null,
        },
      });

      gastoId = gasto.id;

      await this.auditService.log({
        usuarioId,
        accion: 'CREATE',
        entidad: 'Gasto',
        entidadId: gasto.id,
        datosNuevos: { ...gasto, origenTrabajo: trabajoId },
      });
    }

    const trabajoActualizado = await this.prisma.trabajoProveedor.update({
      where: { id: trabajoId },
      data: {
        estado: nuevoEstado,
        aprobadoPor: usuarioId,
        aprobadoAt: new Date(),
        gastoId,
      },
      include: {
        proveedor: {
          select: { razonSocial: true, cuit: true },
        },
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'TrabajoProveedor',
      entidadId: trabajoId,
      datosAnteriores: { estado: 'pendiente' },
      datosNuevos: {
        estado: nuevoEstado,
        motivoRechazo: dto.motivoRechazo,
        gastoId,
      },
    });

    this.logger.log(
      `Trabajo ${trabajoId} ${nuevoEstado} por usuario ${usuarioId}`
    );

    return this.mapTrabajoResponse(trabajoActualizado);
  }

  /**
   * Elimina un trabajo (solo si está pendiente)
   */
  async eliminarTrabajo(
    trabajoId: string,
    proveedorId: string,
    usuarioId: string,
  ): Promise<void> {
    const trabajo = await this.prisma.trabajoProveedor.findFirst({
      where: { id: trabajoId, proveedorId },
    });

    if (!trabajo) {
      throw new NotFoundException('Trabajo no encontrado');
    }

    if (trabajo.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden eliminar trabajos pendientes');
    }

    await this.prisma.trabajoProveedor.delete({
      where: { id: trabajoId },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'TrabajoProveedor',
      entidadId: trabajoId,
      datosAnteriores: trabajo,
    });
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtiene estadísticas del proveedor
   */
  async obtenerEstadisticas(
    proveedorId: string,
  ): Promise<EstadisticasProveedorDto> {
    const [trabajos, aggregados] = await Promise.all([
      this.prisma.trabajoProveedor.groupBy({
        by: ['estado'],
        where: { proveedorId },
        _count: { id: true },
        _sum: { monto: true },
      }),
      this.prisma.trabajoProveedor.aggregate({
        where: { proveedorId },
        _count: { id: true },
      }),
    ]);

    const stats: EstadisticasProveedorDto = {
      totalTrabajos: aggregados._count.id,
      trabajosPendientes: 0,
      trabajosAprobados: 0,
      trabajosRechazados: 0,
      montoTotalAprobado: 0,
      montoTotalPendiente: 0,
    };

    for (const grupo of trabajos) {
      const count = grupo._count.id;
      const monto = grupo._sum.monto ? parseFloat(grupo._sum.monto.toString()) : 0;

      if (grupo.estado === 'pendiente') {
        stats.trabajosPendientes = count;
        stats.montoTotalPendiente = monto;
      } else if (grupo.estado === 'aprobado') {
        stats.trabajosAprobados = count;
        stats.montoTotalAprobado = monto;
      } else if (grupo.estado === 'rechazado') {
        stats.trabajosRechazados = count;
      }
    }

    return stats;
  }

  /**
   * Obtiene servicios disponibles (para filtros)
   */
  async obtenerServiciosDisponibles(): Promise<string[]> {
    const proveedores = await this.prisma.proveedor.findMany({
      where: { activo: true },
      select: { servicios: true },
    });

    const serviciosSet = new Set<string>();
    for (const p of proveedores) {
      for (const s of p.servicios) {
        serviciosSet.add(s);
      }
    }

    return Array.from(serviciosSet).sort();
  }

  // ==========================================================================
  // HELPERS PRIVADOS
  // ==========================================================================

  private mapProveedorResponse(proveedor: Proveedor): ProveedorResponseDto {
    return {
      id: proveedor.id,
      razonSocial: proveedor.razonSocial,
      cuit: proveedor.cuit,
      email: proveedor.email || undefined,
      telefono: proveedor.telefono || undefined,
      direccion: proveedor.direccion || undefined,
      servicios: proveedor.servicios,
      puntuacionPromedio: proveedor.puntuacionPromedio
        ? parseFloat(proveedor.puntuacionPromedio.toString())
        : undefined,
      cantidadResenas: proveedor.cantidadResenas,
      verificado: proveedor.verificado,
      activo: proveedor.activo,
      createdAt: proveedor.createdAt,
    };
  }

  private mapTrabajoResponse(
    trabajo: TrabajoConProveedor,
  ): TrabajoResponseDto {
    return {
      id: trabajo.id,
      proveedorId: trabajo.proveedorId,
      consorcioId: trabajo.consorcioId,
      descripcion: trabajo.descripcion,
      monto: parseFloat(trabajo.monto.toString()),
      facturaUrl: trabajo.facturaUrl || undefined,
      fotosUrls: trabajo.fotosUrls,
      estado: trabajo.estado,
      aprobadoPor: trabajo.aprobadoPor || undefined,
      aprobadoAt: trabajo.aprobadoAt || undefined,
      gastoId: trabajo.gastoId || undefined,
      fechaTrabajo: trabajo.fechaTrabajo,
      createdAt: trabajo.createdAt,
      proveedor: trabajo.proveedor
        ? {
            razonSocial: trabajo.proveedor.razonSocial,
            cuit: trabajo.proveedor.cuit,
          }
        : undefined,
    };
  }
}
