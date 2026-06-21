/**
 * Tipos compartidos para la API
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface MessageResponse {
  mensaje: string;
}

// ============================================================================
// USUARIO Y AUTENTICACIÓN
// ============================================================================

export type Rol =
  | 'SUPER_ADMIN'
  | 'ADMINISTRADOR'
  | 'ADMIN_STAFF'
  | 'PROPIETARIO'
  | 'INQUILINO'
  | 'ENCARGADO'
  | 'AUDITOR'
  | 'PROVEEDOR_EXTERNO';

export type EstadoUsuario =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'PENDIENTE_VERIFICACION'
  | 'SUSPENDIDO';

export type TipoVinculoUF =
  | 'TITULAR_VOTANTE'
  | 'COPROPIETARIO'
  | 'INQUILINO_PRINCIPAL';

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  avatarUrl?: string;
  rol: Rol;
  consorcioActivo?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: Usuario;
}

// ============================================================================
// CONSORCIO
// ============================================================================

export interface Consorcio {
  id: string;
  nombre: string;
  direccion: string;
  localidad: string;
  provincia: string;
  codigoPostal?: string;
  cuit?: string;
  diaVencimiento: number;
  tasaInteresMora: number;
  periodoGracia: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  // Campos calculados
  totalUnidades?: number;
  morosidad?: number;
  // Prisma _count relations
  _count?: {
    unidadesFuncionales?: number;
    usuariosConsorcio?: number;
    expensas?: number;
    gastos?: number;
  };
}

export interface CreateConsorcioDto {
  nombre: string;
  direccion: string;
  localidad: string;
  provincia?: string;
  codigoPostal?: string;
  cuit?: string;
  diaVencimiento?: number;
  tasaInteresMora?: number;
}

// ============================================================================
// UNIDAD FUNCIONAL
// ============================================================================

export type TipoUnidadFuncional = 
  | 'DEPARTAMENTO'
  | 'COCHERA'
  | 'BAULERA'
  | 'LOCAL_COMERCIAL'
  | 'OFICINA';

export interface UnidadFuncional {
  id: string;
  consorcioId: string;
  codigo: string;
  piso?: string;
  numero?: string;
  tipo: TipoUnidadFuncional;
  coeficiente: number;
  superficieM2?: number;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  propietario?: {
    nombre: string;
    apellido: string;
    email: string;
  };
  saldo?: number;
}

// ============================================================================
// EXPENSA
// ============================================================================

export type EstadoExpensa = 'BORRADOR' | 'LIQUIDADA' | 'PUBLICADA' | 'CERRADA';

export interface Expensa {
  id: string;
  consorcioId: string;
  periodo: string;
  totalGastosOrdinarios: number;
  totalGastosExtraordinarios: number;
  totalIngresos: number;
  fondoReserva: number;
  fechaVencimiento: string;
  fechaSegundoVencimiento?: string;
  recargoSegundoVencimiento?: number;
  estado: EstadoExpensa;
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DetalleExpensa {
  id: string;
  expensaId: string;
  unidadFuncionalId: string;
  montoOrdinario: number;
  montoExtraordinario: number;
  saldoAnterior: number;
  intereses: number;
  bonificacion: number;
  total: number;
  unidadFuncional?: UnidadFuncional;
}

// ============================================================================
// GASTO
// ============================================================================

export interface Gasto {
  id: string;
  consorcioId: string;
  expensaId?: string;
  concepto: string;
  descripcion?: string;
  monto: number;
  categoriaId?: string;
  esExtraordinario: boolean;
  esProrrateable: boolean;
  tipoComprobante?: string;
  numeroComprobante?: string;
  caeAfip?: string;
  fechaComprobante?: string;
  proveedorId?: string;
  archivoUrl?: string;
  archivoNombre?: string;
  fechaGasto: string;
  createdAt: string;
  updatedAt?: string;
  // Relaciones
  categoria?: CategoriaGasto;
  proveedor?: Proveedor;
  expensa?: {
    id: string;
    periodo: string;
    estado: EstadoExpensa;
  };
}

export interface CategoriaGasto {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
}

// ============================================================================
// PAGO
// ============================================================================

export type EstadoPago = 'PENDIENTE' | 'PROCESANDO' | 'APROBADO' | 'RECHAZADO' | 'REEMBOLSADO';
export type MetodoPago = 'MERCADO_PAGO' | 'TRANSFERENCIA' | 'EFECTIVO' | 'DEBITO_AUTOMATICO' | 'SIRO';

export interface Pago {
  id: string;
  usuarioId: string;
  monto: number;
  metodoPago: MetodoPago;
  estado: EstadoPago;
  concepto: string;
  periodosAbonados: string[];
  comprobanteUrl?: string;
  fechaPago?: string;
  createdAt: string;
}

// ============================================================================
// TICKET / RECLAMO
// ============================================================================

export type EstadoTicket = 
  | 'ABIERTO'
  | 'EN_PROGRESO'
  | 'ESPERANDO_RESPUESTA'
  | 'RESUELTO'
  | 'CERRADO';

export type PrioridadTicket = 'BAJA' | 'MEDIA' | 'ALTA' | 'URGENTE';

export interface Ticket {
  id: string;
  consorcioId: string;
  creadorId: string;
  asignadoId?: string;
  titulo: string;
  descripcion: string;
  ubicacion?: string;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  fechaResolucion?: string;
  createdAt: string;
  updatedAt: string;
  // Relaciones
  creador?: {
    nombre: string;
    apellido: string;
  };
  asignado?: {
    nombre: string;
    apellido: string;
  };
  archivos?: ArchivoTicket[];
  comentarios?: ComentarioTicket[];
  // Prisma _count relations
  _count?: {
    comentarios?: number;
    archivos?: number;
  };
}

export interface ArchivoTicket {
  id: string;
  url: string;
  nombre: string;
  tipo: string;
  tamano: number;
}

export interface ComentarioTicket {
  id: string;
  contenido: string;
  esInterno: boolean;
  createdAt: string;
  usuario?: {
    nombre: string;
    apellido: string;
  };
}

// ============================================================================
// COMUNICADO
// ============================================================================

export interface Comunicado {
  id: string;
  consorcioId: string;
  titulo: string;
  contenido: string;
  importante: boolean;
  publicarDesde: string;
  publicarHasta?: string;
  enviarEmail: boolean;
  enviarWhatsapp: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// NOTIFICACIÓN
// ============================================================================

export interface Notificacion {
  id: string;
  usuarioId: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  referenciaId?: string;
  referenciaTipo?: string;
  leida: boolean;
  createdAt: string;
}

// ============================================================================
// PROVEEDOR
// ============================================================================

export interface Proveedor {
  id: string;
  razonSocial: string;
  cuit: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  servicios: string[];
  puntuacionPromedio?: number;
  cantidadResenas: number;
  verificado: boolean;
  activo: boolean;
  createdAt: string;
  // Contexto de consorcio
  esFavorito?: boolean;
  nota?: string;
}

// ============================================================================
// DOCUMENTO
// ============================================================================

export type CategoriaDocumento = 
  | 'reglamento'
  | 'acta'
  | 'contrato'
  | 'plano'
  | 'seguro'
  | 'habilitacion'
  | 'otro';

export interface Documento {
  id: string;
  consorcioId: string;
  nombre: string;
  descripcion?: string;
  categoria: CategoriaDocumento;
  archivoUrl: string;
  archivoNombre: string;
  archivoTipo: string;
  archivoTamano: number;
  esPublico: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// AMENITY
// ============================================================================

export interface Amenity {
  id: string;
  consorcioId: string;
  nombre: string;
  descripcion?: string;
  capacidad?: number;
  requiereAprobacion: boolean;
  anticipacionMinima: number;
  anticipacionMaxima: number;
  duracionMaxima: number;
  costoReserva?: number;
  activo: boolean;
}

export interface ReservaAmenity {
  id: string;
  amenityId: string;
  usuarioId: string;
  fechaInicio: string;
  fechaFin: string;
  motivo?: string;
  aprobada?: boolean;
  createdAt: string;
  amenity?: Amenity;
}

// ============================================================================
// ASAMBLEA
// ============================================================================

export type EstadoAsamblea = 'PROGRAMADA' | 'EN_CURSO' | 'FINALIZADA' | 'CANCELADA';
export type TipoVoto = 'A_FAVOR' | 'EN_CONTRA' | 'ABSTENCION';

export interface Asamblea {
  id: string;
  consorcioId: string;
  titulo: string;
  descripcion?: string;
  fecha: string;
  lugar?: string;
  linkVirtual?: string;
  estado: EstadoAsamblea;
  quorumRequerido: number;
  actaUrl?: string;
  createdAt: string;
}

export interface PuntoOrdenDia {
  id: string;
  asambleaId: string;
  orden: number;
  titulo: string;
  descripcion?: string;
  requiereVotacion: boolean;
  mayoriaRequerida?: number;
  resultado?: {
    aFavor: number;
    enContra: number;
    abstenciones: number;
    aprobado: boolean;
  };
}

// ============================================================================
// DASHBOARD
// ============================================================================

export interface DashboardStats {
  totalConsorcios: number;
  totalUnidades: number;
  recaudacionMes: number;
  morosidad: number;
  ticketsAbiertos: number;
  proximosVencimientos: number;
}

export interface ConsorcioResumen {
  id: string;
  nombre: string;
  direccion: string;
  totalUnidades: number;
  morosidad: number;
  saldoBanco?: number;
}
