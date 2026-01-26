-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('SUPER_ADMIN', 'ADMINISTRADOR', 'ADMIN_STAFF', 'PROPIETARIO', 'INQUILINO', 'ENCARGADO', 'AUDITOR', 'PROVEEDOR_EXTERNO');

-- CreateEnum
CREATE TYPE "TipoVinculoUF" AS ENUM ('TITULAR_VOTANTE', 'COPROPIETARIO', 'INQUILINO_PRINCIPAL');

-- CreateEnum
CREATE TYPE "EstadoUsuario" AS ENUM ('ACTIVO', 'INACTIVO', 'PENDIENTE_VERIFICACION', 'SUSPENDIDO');

-- CreateEnum
CREATE TYPE "TipoUnidadFuncional" AS ENUM ('DEPARTAMENTO', 'COCHERA', 'BAULERA', 'LOCAL_COMERCIAL', 'OFICINA');

-- CreateEnum
CREATE TYPE "EstadoExpensa" AS ENUM ('BORRADOR', 'LIQUIDADA', 'PUBLICADA', 'CERRADA');

-- CreateEnum
CREATE TYPE "EstadoPago" AS ENUM ('PENDIENTE', 'PROCESANDO', 'APROBADO', 'RECHAZADO', 'REEMBOLSADO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('MERCADO_PAGO', 'TRANSFERENCIA', 'EFECTIVO', 'DEBITO_AUTOMATICO', 'SIRO');

-- CreateEnum
CREATE TYPE "EstadoTicket" AS ENUM ('ABIERTO', 'EN_PROGRESO', 'ESPERANDO_RESPUESTA', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "PrioridadTicket" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'URGENTE');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('INGRESO', 'EGRESO', 'AJUSTE');

-- CreateEnum
CREATE TYPE "EstadoAsamblea" AS ENUM ('PROGRAMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoVoto" AS ENUM ('A_FAVOR', 'EN_CONTRA', 'ABSTENCION');

-- CreateTable
CREATE TABLE "organizaciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT,
    "direccion" TEXT,
    "logo" TEXT,
    "planActual" TEXT NOT NULL DEFAULT 'basico',
    "limiteConsorcios" INTEGER NOT NULL DEFAULT 5,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consorcios" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "localidad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL DEFAULT 'Buenos Aires',
    "codigoPostal" TEXT,
    "cuit" TEXT,
    "cbu" TEXT,
    "aliasCbu" TEXT,
    "banco" TEXT,
    "diaVencimiento" INTEGER NOT NULL DEFAULT 10,
    "tasaInteresMora" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "periodoGracia" INTEGER NOT NULL DEFAULT 0,
    "coeficienteTotal" DECIMAL(10,6) NOT NULL DEFAULT 100,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consorcios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "organizacionId" TEXT,
    "email" TEXT NOT NULL,
    "emailVerificado" BOOLEAN NOT NULL DEFAULT false,
    "dni" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT,
    "avatarUrl" TEXT,
    "preferenciasModo" TEXT NOT NULL DEFAULT 'completo',
    "preferenciasTema" TEXT NOT NULL DEFAULT 'auto',
    "preferenciasTexto" INTEGER NOT NULL DEFAULT 16,
    "passwordHash" TEXT,
    "magicLinkToken" TEXT,
    "magicLinkExpira" TIMESTAMP(3),
    "refreshToken" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "estado" "EstadoUsuario" NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
    "ultimoAcceso" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_consorcios" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "unidadFuncionalId" TEXT,
    "tipoVinculo" "TipoVinculoUF",
    "puedeCargarGastos" BOOLEAN NOT NULL DEFAULT false,
    "puedeVerConciliacion" BOOLEAN NOT NULL DEFAULT false,
    "puedeEnviarComunicados" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_consorcios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades_funcionales" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "piso" TEXT,
    "numero" TEXT,
    "tipo" "TipoUnidadFuncional" NOT NULL DEFAULT 'DEPARTAMENTO',
    "coeficiente" DECIMAL(10,6) NOT NULL,
    "superficieM2" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "unidades_funcionales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expensas" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "totalGastosOrdinarios" DECIMAL(12,2) NOT NULL,
    "totalGastosExtraordinarios" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalIngresos" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fondoReserva" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "fechaVencimiento" TIMESTAMP(3) NOT NULL,
    "fechaSegundoVencimiento" TIMESTAMP(3),
    "recargoSegundoVencimiento" DECIMAL(5,2),
    "estado" "EstadoExpensa" NOT NULL DEFAULT 'BORRADOR',
    "observaciones" TEXT,
    "publicadaAt" TIMESTAMP(3),
    "cerradaAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expensas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "detalles_expensa" (
    "id" TEXT NOT NULL,
    "expensaId" TEXT NOT NULL,
    "unidadFuncionalId" TEXT NOT NULL,
    "montoOrdinario" DECIMAL(12,2) NOT NULL,
    "montoExtraordinario" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldoAnterior" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "intereses" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "bonificacion" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "detalles_expensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "expensaId" TEXT,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DECIMAL(12,2) NOT NULL,
    "categoriaId" TEXT,
    "esExtraordinario" BOOLEAN NOT NULL DEFAULT false,
    "esProrrateable" BOOLEAN NOT NULL DEFAULT true,
    "tipoComprobante" TEXT,
    "numeroComprobante" TEXT,
    "caeAfip" TEXT,
    "fechaComprobante" TIMESTAMP(3),
    "proveedorId" TEXT,
    "archivoUrl" TEXT,
    "archivoNombre" TEXT,
    "fechaGasto" TIMESTAMP(3) NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_gasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "icono" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "categorias_gasto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_cuenta_corriente" (
    "id" TEXT NOT NULL,
    "unidadFuncionalId" TEXT NOT NULL,
    "tipo" "TipoMovimiento" NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "saldoResultante" DECIMAL(12,2) NOT NULL,
    "pagoId" TEXT,
    "expensaPeriodo" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_cuenta_corriente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "estado" "EstadoPago" NOT NULL DEFAULT 'PENDIENTE',
    "mercadoPagoId" TEXT,
    "mercadoPagoStatus" TEXT,
    "transferenciaRef" TEXT,
    "concepto" TEXT NOT NULL,
    "periodosAbonados" TEXT[],
    "comprobanteUrl" TEXT,
    "fechaPago" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets_mantenimiento" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "creadorId" TEXT NOT NULL,
    "asignadoId" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ubicacion" TEXT,
    "prioridad" "PrioridadTicket" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoTicket" NOT NULL DEFAULT 'ABIERTO',
    "fechaResolucion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tickets_mantenimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos_ticket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "archivos_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentarios_ticket" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "esInterno" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentarios_ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comunicados" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "importante" BOOLEAN NOT NULL DEFAULT false,
    "publicarDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicarHasta" TIMESTAMP(3),
    "enviarEmail" BOOLEAN NOT NULL DEFAULT false,
    "enviarWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comunicados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asambleas" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "lugar" TEXT,
    "linkVirtual" TEXT,
    "estado" "EstadoAsamblea" NOT NULL DEFAULT 'PROGRAMADA',
    "quorumRequerido" DECIMAL(5,2) NOT NULL,
    "actaUrl" TEXT,
    "actaHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asambleas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "puntos_orden_dia" (
    "id" TEXT NOT NULL,
    "asambleaId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "requiereVotacion" BOOLEAN NOT NULL DEFAULT false,
    "mayoriaRequerida" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "puntos_orden_dia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asistencias_asamblea" (
    "id" TEXT NOT NULL,
    "asambleaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "presente" BOOLEAN NOT NULL DEFAULT false,
    "representadoPor" TEXT,
    "poderUrl" TEXT,
    "horaRegistro" TIMESTAMP(3),

    CONSTRAINT "asistencias_asamblea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votos_asamblea" (
    "id" TEXT NOT NULL,
    "puntoOrdenId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "voto" "TipoVoto" NOT NULL,
    "coeficienteVoto" DECIMAL(10,6) NOT NULL,
    "timestampVoto" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hashVoto" TEXT NOT NULL,

    CONSTRAINT "votos_asamblea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "capacidad" INTEGER,
    "requiereAprobacion" BOOLEAN NOT NULL DEFAULT false,
    "anticipacionMinima" INTEGER NOT NULL DEFAULT 24,
    "anticipacionMaxima" INTEGER NOT NULL DEFAULT 720,
    "duracionMaxima" INTEGER NOT NULL DEFAULT 4,
    "costoReserva" DECIMAL(10,2),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas_amenity" (
    "id" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "fechaFin" TIMESTAMP(3) NOT NULL,
    "motivo" TEXT,
    "aprobada" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservas_amenity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "cuit" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "servicios" TEXT[],
    "puntuacionPromedio" DECIMAL(3,2),
    "cantidadResenas" INTEGER NOT NULL DEFAULT 0,
    "usuarioId" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores_consorcios" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "esFavorito" BOOLEAN NOT NULL DEFAULT false,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proveedores_consorcios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "archivoNombre" TEXT NOT NULL,
    "archivoTipo" TEXT NOT NULL,
    "archivoTamano" INTEGER NOT NULL,
    "esPublico" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "referenciaId" TEXT,
    "referenciaTipo" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "datosAnteriores" JSONB,
    "datosNuevos" JSONB,
    "ip" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_queue" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "operacion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "datos" JSONB NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "procesado" BOOLEAN NOT NULL DEFAULT false,
    "procesadoAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bitacora_seguridad" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "ubicacion" TEXT,
    "visitanteNombre" TEXT,
    "visitanteDni" TEXT,
    "visitanteDestino" TEXT,
    "fotoUrl" TEXT,
    "localId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bitacora_seguridad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recepcion_paquetes" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "destinatarioUF" TEXT NOT NULL,
    "remitente" TEXT NOT NULL,
    "descripcion" TEXT,
    "fotoUrl" TEXT,
    "recibidoAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "entregadoAt" TIMESTAMP(3),
    "entregadoA" TEXT,
    "firmaDni" TEXT,
    "localId" TEXT,
    "syncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recepcion_paquetes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados_consorcio" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "cuil" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "fechaIngreso" TIMESTAMP(3) NOT NULL,
    "fechaEgreso" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "empleados_consorcio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones_sueldo" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "sueldoBruto" DECIMAL(12,2) NOT NULL,
    "deducciones" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sueldoNeto" DECIMAL(12,2) NOT NULL,
    "cargasSociales" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "reciboPdfUrl" TEXT,
    "f931PdfUrl" TEXT,
    "expensaId" TEXT,
    "fechaPago" TIMESTAMP(3),
    "observaciones" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "liquidaciones_sueldo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajos_proveedor" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "facturaUrl" TEXT,
    "fotosUrls" TEXT[],
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "aprobadoPor" TEXT,
    "aprobadoAt" TIMESTAMP(3),
    "gastoId" TEXT,
    "fechaTrabajo" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizaciones_cuit_key" ON "organizaciones"("cuit");

-- CreateIndex
CREATE INDEX "consorcios_organizacionId_idx" ON "consorcios"("organizacionId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_organizacionId_idx" ON "usuarios"("organizacionId");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_consorcios_consorcioId_idx" ON "usuarios_consorcios"("consorcioId");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_consorcios_usuarioId_consorcioId_rol_key" ON "usuarios_consorcios"("usuarioId", "consorcioId", "rol");

-- CreateIndex
CREATE INDEX "unidades_funcionales_consorcioId_idx" ON "unidades_funcionales"("consorcioId");

-- CreateIndex
CREATE UNIQUE INDEX "unidades_funcionales_consorcioId_codigo_key" ON "unidades_funcionales"("consorcioId", "codigo");

-- CreateIndex
CREATE INDEX "expensas_consorcioId_idx" ON "expensas"("consorcioId");

-- CreateIndex
CREATE INDEX "expensas_periodo_idx" ON "expensas"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "expensas_consorcioId_periodo_key" ON "expensas"("consorcioId", "periodo");

-- CreateIndex
CREATE INDEX "detalles_expensa_expensaId_idx" ON "detalles_expensa"("expensaId");

-- CreateIndex
CREATE UNIQUE INDEX "detalles_expensa_expensaId_unidadFuncionalId_key" ON "detalles_expensa"("expensaId", "unidadFuncionalId");

-- CreateIndex
CREATE INDEX "gastos_consorcioId_idx" ON "gastos"("consorcioId");

-- CreateIndex
CREATE INDEX "gastos_expensaId_idx" ON "gastos"("expensaId");

-- CreateIndex
CREATE INDEX "gastos_fechaGasto_idx" ON "gastos"("fechaGasto");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_gasto_nombre_key" ON "categorias_gasto"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "movimientos_cuenta_corriente_pagoId_key" ON "movimientos_cuenta_corriente"("pagoId");

-- CreateIndex
CREATE INDEX "movimientos_cuenta_corriente_unidadFuncionalId_idx" ON "movimientos_cuenta_corriente"("unidadFuncionalId");

-- CreateIndex
CREATE INDEX "movimientos_cuenta_corriente_fecha_idx" ON "movimientos_cuenta_corriente"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "pagos_mercadoPagoId_key" ON "pagos"("mercadoPagoId");

-- CreateIndex
CREATE INDEX "pagos_usuarioId_idx" ON "pagos"("usuarioId");

-- CreateIndex
CREATE INDEX "pagos_estado_idx" ON "pagos"("estado");

-- CreateIndex
CREATE INDEX "tickets_mantenimiento_consorcioId_idx" ON "tickets_mantenimiento"("consorcioId");

-- CreateIndex
CREATE INDEX "tickets_mantenimiento_estado_idx" ON "tickets_mantenimiento"("estado");

-- CreateIndex
CREATE INDEX "comentarios_ticket_ticketId_idx" ON "comentarios_ticket"("ticketId");

-- CreateIndex
CREATE INDEX "comunicados_consorcioId_idx" ON "comunicados"("consorcioId");

-- CreateIndex
CREATE INDEX "comunicados_publicarDesde_idx" ON "comunicados"("publicarDesde");

-- CreateIndex
CREATE INDEX "asambleas_consorcioId_idx" ON "asambleas"("consorcioId");

-- CreateIndex
CREATE INDEX "asambleas_fecha_idx" ON "asambleas"("fecha");

-- CreateIndex
CREATE INDEX "puntos_orden_dia_asambleaId_idx" ON "puntos_orden_dia"("asambleaId");

-- CreateIndex
CREATE UNIQUE INDEX "asistencias_asamblea_asambleaId_usuarioId_key" ON "asistencias_asamblea"("asambleaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "votos_asamblea_puntoOrdenId_usuarioId_key" ON "votos_asamblea"("puntoOrdenId", "usuarioId");

-- CreateIndex
CREATE INDEX "amenities_consorcioId_idx" ON "amenities"("consorcioId");

-- CreateIndex
CREATE INDEX "reservas_amenity_amenityId_idx" ON "reservas_amenity"("amenityId");

-- CreateIndex
CREATE INDEX "reservas_amenity_fechaInicio_idx" ON "reservas_amenity"("fechaInicio");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_cuit_key" ON "proveedores"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_usuarioId_key" ON "proveedores"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "proveedores_consorcios_proveedorId_consorcioId_key" ON "proveedores_consorcios"("proveedorId", "consorcioId");

-- CreateIndex
CREATE INDEX "documentos_consorcioId_idx" ON "documentos"("consorcioId");

-- CreateIndex
CREATE INDEX "documentos_categoria_idx" ON "documentos"("categoria");

-- CreateIndex
CREATE INDEX "notificaciones_usuarioId_idx" ON "notificaciones"("usuarioId");

-- CreateIndex
CREATE INDEX "notificaciones_leida_idx" ON "notificaciones"("leida");

-- CreateIndex
CREATE INDEX "audit_logs_entidad_entidadId_idx" ON "audit_logs"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_usuarioId_idx" ON "audit_logs"("usuarioId");

-- CreateIndex
CREATE INDEX "sync_queue_procesado_idx" ON "sync_queue"("procesado");

-- CreateIndex
CREATE INDEX "sync_queue_deviceId_idx" ON "sync_queue"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "bitacora_seguridad_localId_key" ON "bitacora_seguridad"("localId");

-- CreateIndex
CREATE INDEX "bitacora_seguridad_consorcioId_idx" ON "bitacora_seguridad"("consorcioId");

-- CreateIndex
CREATE INDEX "bitacora_seguridad_timestamp_idx" ON "bitacora_seguridad"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "recepcion_paquetes_localId_key" ON "recepcion_paquetes"("localId");

-- CreateIndex
CREATE INDEX "recepcion_paquetes_consorcioId_idx" ON "recepcion_paquetes"("consorcioId");

-- CreateIndex
CREATE INDEX "recepcion_paquetes_destinatarioUF_idx" ON "recepcion_paquetes"("destinatarioUF");

-- CreateIndex
CREATE INDEX "empleados_consorcio_consorcioId_idx" ON "empleados_consorcio"("consorcioId");

-- CreateIndex
CREATE INDEX "liquidaciones_sueldo_consorcioId_idx" ON "liquidaciones_sueldo"("consorcioId");

-- CreateIndex
CREATE INDEX "liquidaciones_sueldo_periodo_idx" ON "liquidaciones_sueldo"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_sueldo_empleadoId_periodo_key" ON "liquidaciones_sueldo"("empleadoId", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "trabajos_proveedor_gastoId_key" ON "trabajos_proveedor"("gastoId");

-- CreateIndex
CREATE INDEX "trabajos_proveedor_proveedorId_idx" ON "trabajos_proveedor"("proveedorId");

-- CreateIndex
CREATE INDEX "trabajos_proveedor_consorcioId_idx" ON "trabajos_proveedor"("consorcioId");

-- CreateIndex
CREATE INDEX "trabajos_proveedor_estado_idx" ON "trabajos_proveedor"("estado");

-- AddForeignKey
ALTER TABLE "consorcios" ADD CONSTRAINT "consorcios_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_organizacionId_fkey" FOREIGN KEY ("organizacionId") REFERENCES "organizaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_consorcios" ADD CONSTRAINT "usuarios_consorcios_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_consorcios" ADD CONSTRAINT "usuarios_consorcios_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_consorcios" ADD CONSTRAINT "usuarios_consorcios_unidadFuncionalId_fkey" FOREIGN KEY ("unidadFuncionalId") REFERENCES "unidades_funcionales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades_funcionales" ADD CONSTRAINT "unidades_funcionales_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expensas" ADD CONSTRAINT "expensas_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_expensa" ADD CONSTRAINT "detalles_expensa_expensaId_fkey" FOREIGN KEY ("expensaId") REFERENCES "expensas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "detalles_expensa" ADD CONSTRAINT "detalles_expensa_unidadFuncionalId_fkey" FOREIGN KEY ("unidadFuncionalId") REFERENCES "unidades_funcionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_expensaId_fkey" FOREIGN KEY ("expensaId") REFERENCES "expensas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_gasto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta_corriente" ADD CONSTRAINT "movimientos_cuenta_corriente_unidadFuncionalId_fkey" FOREIGN KEY ("unidadFuncionalId") REFERENCES "unidades_funcionales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_cuenta_corriente" ADD CONSTRAINT "movimientos_cuenta_corriente_pagoId_fkey" FOREIGN KEY ("pagoId") REFERENCES "pagos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_mantenimiento" ADD CONSTRAINT "tickets_mantenimiento_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_mantenimiento" ADD CONSTRAINT "tickets_mantenimiento_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets_mantenimiento" ADD CONSTRAINT "tickets_mantenimiento_asignadoId_fkey" FOREIGN KEY ("asignadoId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos_ticket" ADD CONSTRAINT "archivos_ticket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets_mantenimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_ticket" ADD CONSTRAINT "comentarios_ticket_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets_mantenimiento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentarios_ticket" ADD CONSTRAINT "comentarios_ticket_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comunicados" ADD CONSTRAINT "comunicados_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asambleas" ADD CONSTRAINT "asambleas_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "puntos_orden_dia" ADD CONSTRAINT "puntos_orden_dia_asambleaId_fkey" FOREIGN KEY ("asambleaId") REFERENCES "asambleas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asistencias_asamblea" ADD CONSTRAINT "asistencias_asamblea_asambleaId_fkey" FOREIGN KEY ("asambleaId") REFERENCES "asambleas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_asamblea" ADD CONSTRAINT "votos_asamblea_puntoOrdenId_fkey" FOREIGN KEY ("puntoOrdenId") REFERENCES "puntos_orden_dia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votos_asamblea" ADD CONSTRAINT "votos_asamblea_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_amenity" ADD CONSTRAINT "reservas_amenity_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas_amenity" ADD CONSTRAINT "reservas_amenity_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores_consorcios" ADD CONSTRAINT "proveedores_consorcios_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores_consorcios" ADD CONSTRAINT "proveedores_consorcios_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "consorcios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidaciones_sueldo" ADD CONSTRAINT "liquidaciones_sueldo_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados_consorcio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajos_proveedor" ADD CONSTRAINT "trabajos_proveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
