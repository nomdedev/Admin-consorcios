import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateGastoDto,
  UpdateGastoDto,
  FilterGastosDto,
  CreateCategoriaGastoDto,
  UpdateCategoriaGastoDto,
} from './dto';
import { Prisma, Rol } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class GastosService {
  private readonly logger = new Logger(GastosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ===========================================================================
  // VALIDACIONES DE SEGURIDAD
  // ===========================================================================

  /**
   * Valida que el usuario tenga acceso al consorcio
   * CRÍTICO: Previene acceso no autorizado a datos de otros consorcios
   */
  private async validarAccesoConsorcio(
    usuarioId: string,
    consorcioId: string,
    rolesPermitidos: Rol[] = [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF],
  ): Promise<void> {
    const usuarioConsorcio = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        consorcioId,
        rol: { in: rolesPermitidos },
        activo: true,
      },
    });

    // Verificar si es SUPER_ADMIN global
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: {
        usuarioId,
        rol: Rol.SUPER_ADMIN,
        activo: true,
      },
    });

    if (!usuarioConsorcio && !esSuperAdmin) {
      this.logger.warn(
        `Acceso denegado: Usuario ${usuarioId} intentó acceder al consorcio ${consorcioId}`,
      );
      throw new ForbiddenException('No tiene permisos para acceder a este consorcio');
    }
  }

  /**
   * Valida que la URL del archivo sea de un dominio permitido
   * SEGURIDAD: Previene ataques SSRF y almacenamiento de URLs maliciosas
   */
  private validarArchivoUrl(url?: string): void {
    if (!url) return;

    // Dominios permitidos para archivos (configurar según entorno)
    const dominiosPermitidos = [
      'storage.vecinosimple.com',
      'cdn.vecinosimple.com',
      'uploads.vecinosimple.com',
      // Desarrollo
      'localhost',
      '127.0.0.1',
    ];

    try {
      const urlObj = new URL(url);
      const dominioPermitido = dominiosPermitidos.some(d => 
        urlObj.hostname === d || urlObj.hostname.endsWith(`.${d}`)
      );

      if (!dominioPermitido) {
        this.logger.warn(`URL de archivo rechazada: ${url}`);
        throw new BadRequestException(
          'La URL del archivo debe ser de un dominio autorizado',
        );
      }

      // Validar protocolo
      if (!['https:', 'http:'].includes(urlObj.protocol)) {
        throw new BadRequestException('Protocolo de URL no permitido');
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('URL de archivo inválida');
    }
  }

  /**
   * Valida la fecha del gasto
   * SEGURIDAD: Previene manipulación de fechas para fraude
   */
  private validarFechaGasto(fecha: string): void {
    const fechaGasto = new Date(fecha);
    
    // No puede ser futura
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999);
    if (fechaGasto > hoy) {
      throw new BadRequestException('La fecha del gasto no puede ser futura');
    }

    // No puede ser mayor a 2 años
    const dosAniosAtras = new Date();
    dosAniosAtras.setFullYear(dosAniosAtras.getFullYear() - 2);
    if (fechaGasto < dosAniosAtras) {
      throw new BadRequestException(
        'La fecha del gasto no puede ser anterior a 2 años',
      );
    }
  }

  /**
   * Valida que el gasto pueda ser modificado
   * Los gastos asignados a expensas CERRADAS no pueden modificarse
   */
  private async validarGastoModificable(gastoId: string): Promise<void> {
    const gasto = await this.prisma.gasto.findUnique({
      where: { id: gastoId },
      include: {
        expensa: { select: { estado: true, periodo: true } },
      },
    });

    if (!gasto) {
      throw new NotFoundException('Gasto no encontrado');
    }

    if (gasto.expensa?.estado === 'CERRADA') {
      throw new BadRequestException(
        `No se puede modificar un gasto asignado a una expensa cerrada (${gasto.expensa.periodo})`,
      );
    }

    if (gasto.expensa?.estado === 'PUBLICADA') {
      throw new BadRequestException(
        `No se puede modificar un gasto asignado a una expensa publicada (${gasto.expensa.periodo})`,
      );
    }
  }

  // ===========================================================================
  // CRUD DE GASTOS
  // ===========================================================================

  async create(dto: CreateGastoDto, usuarioId: string) {
    // Validar acceso al consorcio
    await this.validarAccesoConsorcio(usuarioId, dto.consorcioId);

    // Validar que el consorcio exista y esté activo
    const consorcio = await this.prisma.consorcio.findUnique({
      where: { id: dto.consorcioId },
    });

    if (!consorcio || !consorcio.activo) {
      throw new NotFoundException('Consorcio no encontrado o inactivo');
    }

    // Validar fecha usando método centralizado
    this.validarFechaGasto(dto.fechaGasto);

    // Validar URL del archivo si se proporciona
    this.validarArchivoUrl(dto.archivoUrl);

    // Si se especifica expensa, validar que exista y sea del mismo consorcio
    if (dto.expensaId) {
      const expensa = await this.prisma.expensa.findUnique({
        where: { id: dto.expensaId },
      });

      if (!expensa) {
        throw new NotFoundException('Expensa no encontrada');
      }

      if (expensa.consorcioId !== dto.consorcioId) {
        throw new BadRequestException(
          'La expensa debe pertenecer al mismo consorcio',
        );
      }

      if (expensa.estado === 'CERRADA' || expensa.estado === 'PUBLICADA') {
        throw new BadRequestException(
          'No se pueden asignar gastos a una expensa cerrada o publicada',
        );
      }
    }

    // Validar categoría si se especifica
    if (dto.categoriaId) {
      const categoria = await this.prisma.categoriaGasto.findUnique({
        where: { id: dto.categoriaId },
      });
      if (!categoria) {
        throw new NotFoundException('Categoría no encontrada');
      }
    }

    // Validar proveedor si se especifica
    if (dto.proveedorId) {
      const proveedor = await this.prisma.proveedor.findUnique({
        where: { id: dto.proveedorId },
      });
      if (!proveedor) {
        throw new NotFoundException('Proveedor no encontrado');
      }
    }

    // Crear el gasto
    const gasto = await this.prisma.gasto.create({
      data: {
        consorcioId: dto.consorcioId,
        expensaId: dto.expensaId || null,
        concepto: this.sanitizarTexto(dto.concepto) ?? dto.concepto,
        descripcion: this.sanitizarTexto(dto.descripcion),
        monto: new Decimal(dto.monto),
        categoriaId: dto.categoriaId || null,
        esExtraordinario: dto.esExtraordinario ?? false,
        esProrrateable: dto.esProrrateable ?? true,
        tipoComprobante: dto.tipoComprobante || null,
        numeroComprobante: dto.numeroComprobante || null,
        caeAfip: dto.caeAfip || null,
        fechaComprobante: dto.fechaComprobante
          ? new Date(dto.fechaComprobante)
          : null,
        proveedorId: dto.proveedorId || null,
        archivoUrl: dto.archivoUrl || null,
        archivoNombre: dto.archivoNombre || null,
        fechaGasto: new Date(dto.fechaGasto),
      },
      include: {
        categoria: true,
        proveedor: { select: { id: true, razonSocial: true, cuit: true } },
      },
    });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'Gasto',
      entidadId: gasto.id,
      datosNuevos: gasto,
    });

    this.logger.log(
      `Gasto creado: ${gasto.id} - ${gasto.concepto} ($${gasto.monto})`,
    );

    return gasto;
  }

  async findAll(filtros: FilterGastosDto, usuarioId: string) {
    const {
      consorcioId,
      expensaId,
      sinExpensa,
      categoriaId,
      proveedorId,
      esExtraordinario,
      fechaDesde,
      fechaHasta,
      busqueda,
      montoMin,
      montoMax,
      page = 1,
      limit = 20,
      ordenarPor = 'fechaGasto',
      ordenDireccion = 'desc',
    } = filtros;

    // Si se especifica consorcioId, validar acceso
    if (consorcioId) {
      await this.validarAccesoConsorcio(usuarioId, consorcioId, [
        Rol.SUPER_ADMIN,
        Rol.ADMINISTRADOR,
        Rol.ADMIN_STAFF,
        Rol.AUDITOR,
      ]);
    }

    // Construir filtros
    const where: Prisma.GastoWhereInput = {};

    if (consorcioId) {
      where.consorcioId = consorcioId;
    } else {
      // Filtrar solo consorcios accesibles si no se especifica
      const consorciosAccesibles = await this.obtenerConsorciosAccesibles(usuarioId);
      where.consorcioId = { in: consorciosAccesibles };
    }

    if (expensaId) {
      where.expensaId = expensaId;
    }

    if (sinExpensa === true) {
      where.expensaId = null;
    }

    if (categoriaId) {
      where.categoriaId = categoriaId;
    }

    if (proveedorId) {
      where.proveedorId = proveedorId;
    }

    if (esExtraordinario !== undefined) {
      where.esExtraordinario = esExtraordinario;
    }

    if (fechaDesde || fechaHasta) {
      where.fechaGasto = {};
      if (fechaDesde) {
        where.fechaGasto.gte = new Date(fechaDesde);
      }
      if (fechaHasta) {
        where.fechaGasto.lte = new Date(fechaHasta);
      }
    }

    if (busqueda) {
      where.OR = [
        { concepto: { contains: busqueda, mode: 'insensitive' } },
        { descripcion: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (montoMin !== undefined || montoMax !== undefined) {
      where.monto = {};
      if (montoMin !== undefined) {
        where.monto.gte = new Decimal(montoMin);
      }
      if (montoMax !== undefined) {
        where.monto.lte = new Decimal(montoMax);
      }
    }

    // Ejecutar consultas en paralelo
    const [gastos, total, agregado] = await Promise.all([
      this.prisma.gasto.findMany({
        where,
        include: {
          categoria: true,
          proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          consorcio: { select: { nombre: true } },
          expensa: { select: { periodo: true, estado: true } },
        },
        orderBy: { [ordenarPor]: ordenDireccion },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.gasto.count({ where }),
      this.prisma.gasto.aggregate({
        where,
        _sum: { monto: true },
      }),
    ]);

    const sumaPagina = gastos.reduce((sum, g) => sum + Number(g.monto), 0);

    return {
      data: gastos,
      total,
      page,
      limit,
      sumaPagina,
      sumaTotal: agregado._sum.monto ? Number(agregado._sum.monto) : 0,
    };
  }

  async findOne(id: string, usuarioId: string) {
    const gasto = await this.prisma.gasto.findUnique({
      where: { id },
      include: {
        categoria: true,
        proveedor: true,
        consorcio: { select: { id: true, nombre: true, direccion: true } },
        expensa: { select: { id: true, periodo: true, estado: true } },
      },
    });

    if (!gasto) {
      throw new NotFoundException('Gasto no encontrado');
    }

    // Validar acceso al consorcio
    await this.validarAccesoConsorcio(usuarioId, gasto.consorcioId, [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
      Rol.ADMIN_STAFF,
      Rol.AUDITOR,
    ]);

    return gasto;
  }

  async update(id: string, dto: UpdateGastoDto, usuarioId: string) {
    const gasto = await this.findOne(id, usuarioId);

    // Validar que se pueda modificar
    await this.validarGastoModificable(id);

    // No permitir cambiar consorcio
    if (dto.consorcioId && dto.consorcioId !== gasto.consorcioId) {
      throw new BadRequestException('No se puede cambiar el consorcio del gasto');
    }

    // SEGURIDAD: Validar fecha si se actualiza
    if (dto.fechaGasto) {
      this.validarFechaGasto(dto.fechaGasto);
    }

    // SEGURIDAD: Validar URL del archivo si se actualiza
    if (dto.archivoUrl) {
      this.validarArchivoUrl(dto.archivoUrl);
    }

    // SEGURIDAD: Validar rango de monto si se actualiza
    if (dto.monto !== undefined) {
      if (dto.monto <= 0 || dto.monto > 1000000000) {
        throw new BadRequestException(
          'El monto debe estar entre $0.01 y $1.000.000.000',
        );
      }
    }

    // Si se cambia expensa, validar
    if (dto.expensaId && dto.expensaId !== gasto.expensaId) {
      const expensa = await this.prisma.expensa.findUnique({
        where: { id: dto.expensaId },
      });

      if (!expensa) {
        throw new NotFoundException('Expensa no encontrada');
      }

      if (expensa.consorcioId !== gasto.consorcioId) {
        throw new BadRequestException(
          'La expensa debe pertenecer al mismo consorcio',
        );
      }

      if (expensa.estado === 'CERRADA' || expensa.estado === 'PUBLICADA') {
        throw new BadRequestException(
          'No se pueden asignar gastos a una expensa cerrada o publicada',
        );
      }
    }

    const datosAnteriores = { ...gasto };

    const gastoActualizado = await this.prisma.gasto.update({
      where: { id },
      data: {
        concepto: dto.concepto ? this.sanitizarTexto(dto.concepto) : undefined,
        descripcion: dto.descripcion !== undefined
          ? this.sanitizarTexto(dto.descripcion)
          : undefined,
        monto: dto.monto !== undefined ? new Decimal(dto.monto) : undefined,
        categoriaId: dto.categoriaId !== undefined ? dto.categoriaId : undefined,
        esExtraordinario: dto.esExtraordinario,
        esProrrateable: dto.esProrrateable,
        tipoComprobante: dto.tipoComprobante,
        numeroComprobante: dto.numeroComprobante,
        caeAfip: dto.caeAfip,
        fechaComprobante: dto.fechaComprobante
          ? new Date(dto.fechaComprobante)
          : undefined,
        proveedorId: dto.proveedorId !== undefined ? dto.proveedorId : undefined,
        archivoUrl: dto.archivoUrl,
        archivoNombre: dto.archivoNombre,
        fechaGasto: dto.fechaGasto ? new Date(dto.fechaGasto) : undefined,
        expensaId: dto.expensaId !== undefined ? dto.expensaId : undefined,
      },
      include: {
        categoria: true,
        proveedor: { select: { id: true, razonSocial: true, cuit: true } },
      },
    });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'Gasto',
      entidadId: id,
      datosAnteriores,
      datosNuevos: gastoActualizado,
    });

    return gastoActualizado;
  }

  async delete(id: string, usuarioId: string) {
    const gasto = await this.findOne(id, usuarioId);

    // Validar que se pueda modificar
    await this.validarGastoModificable(id);

    // SEGURIDAD: Solo ADMINISTRADOR o SUPER_ADMIN pueden eliminar
    await this.validarAccesoConsorcio(usuarioId, gasto.consorcioId, [
      Rol.SUPER_ADMIN,
      Rol.ADMINISTRADOR,
    ]);

    await this.prisma.gasto.delete({ where: { id } });

    // Auditar
    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'Gasto',
      entidadId: id,
      datosAnteriores: gasto,
    });

    this.logger.log(`Gasto eliminado: ${id} - ${gasto.concepto}`);

    return { success: true, message: 'Gasto eliminado correctamente' };
  }

  // ===========================================================================
  // CATEGORÍAS DE GASTOS
  // ===========================================================================

  async findAllCategorias() {
    return this.prisma.categoriaGasto.findMany({
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });
  }

  async createCategoria(dto: CreateCategoriaGastoDto, usuarioId: string) {
    // Solo SUPER_ADMIN puede crear categorías globales
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: { usuarioId, rol: Rol.SUPER_ADMIN, activo: true },
    });

    if (!esSuperAdmin) {
      throw new ForbiddenException('Solo administradores globales pueden crear categorías');
    }

    const categoria = await this.prisma.categoriaGasto.create({
      data: {
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        icono: dto.icono,
        orden: dto.orden ?? 0,
      },
    });

    await this.auditService.log({
      usuarioId,
      accion: 'CREATE',
      entidad: 'CategoriaGasto',
      entidadId: categoria.id,
      datosNuevos: categoria,
    });

    return categoria;
  }

  async updateCategoria(id: string, dto: UpdateCategoriaGastoDto, usuarioId: string) {
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: { usuarioId, rol: Rol.SUPER_ADMIN, activo: true },
    });

    if (!esSuperAdmin) {
      throw new ForbiddenException('Solo administradores globales pueden modificar categorías');
    }

    const categoriaExistente = await this.prisma.categoriaGasto.findUnique({
      where: { id },
    });

    if (!categoriaExistente) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const categoria = await this.prisma.categoriaGasto.update({
      where: { id },
      data: dto,
    });

    await this.auditService.log({
      usuarioId,
      accion: 'UPDATE',
      entidad: 'CategoriaGasto',
      entidadId: id,
      datosAnteriores: categoriaExistente,
      datosNuevos: categoria,
    });

    return categoria;
  }

  async deleteCategoria(id: string, usuarioId: string) {
    const esSuperAdmin = await this.prisma.usuarioConsorcio.findFirst({
      where: { usuarioId, rol: Rol.SUPER_ADMIN, activo: true },
    });

    if (!esSuperAdmin) {
      throw new ForbiddenException('Solo administradores globales pueden eliminar categorías');
    }

    // Verificar que no haya gastos usando esta categoría
    const gastosConCategoria = await this.prisma.gasto.count({
      where: { categoriaId: id },
    });

    if (gastosConCategoria > 0) {
      throw new BadRequestException(
        `No se puede eliminar la categoría porque tiene ${gastosConCategoria} gastos asociados`,
      );
    }

    const categoria = await this.prisma.categoriaGasto.findUnique({
      where: { id },
    });

    if (!categoria) {
      throw new NotFoundException('Categoría no encontrada');
    }

    await this.prisma.categoriaGasto.delete({ where: { id } });

    await this.auditService.log({
      usuarioId,
      accion: 'DELETE',
      entidad: 'CategoriaGasto',
      entidadId: id,
      datosAnteriores: categoria,
    });

    return { success: true, message: 'Categoría eliminada correctamente' };
  }

  // ===========================================================================
  // UTILIDADES
  // ===========================================================================

  private async obtenerConsorciosAccesibles(usuarioId: string): Promise<string[]> {
    const rolesUsuario = await this.prisma.usuarioConsorcio.findMany({
      where: {
        usuarioId,
        activo: true,
        rol: { in: [Rol.SUPER_ADMIN, Rol.ADMINISTRADOR, Rol.ADMIN_STAFF, Rol.AUDITOR] },
      },
      select: { consorcioId: true, rol: true },
    });

    // Si es SUPER_ADMIN, tiene acceso a todos
    const esSuperAdmin = rolesUsuario.some(r => r.rol === Rol.SUPER_ADMIN);
    if (esSuperAdmin) {
      const todosConsorcios = await this.prisma.consorcio.findMany({
        where: { activo: true },
        select: { id: true },
      });
      return todosConsorcios.map(c => c.id);
    }

    return rolesUsuario.map(r => r.consorcioId);
  }

  /**
   * Sanitiza texto para prevenir XSS almacenado
   */
  private sanitizarTexto(texto?: string): string | undefined {
    if (!texto) return texto;
    
    return texto
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
}
