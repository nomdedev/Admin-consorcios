// =============================================================================
// Constantes de Argentina
// =============================================================================

/**
 * Provincias argentinas (para selects)
 */
export const PROVINCIAS_ARGENTINA = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
] as const;

export type Provincia = (typeof PROVINCIAS_ARGENTINA)[number];

/**
 * Tipos de comprobante AFIP
 */
export const TIPOS_COMPROBANTE = {
  FACTURA_A: { codigo: 1, nombre: "Factura A" },
  FACTURA_B: { codigo: 6, nombre: "Factura B" },
  FACTURA_C: { codigo: 11, nombre: "Factura C" },
  NOTA_CREDITO_A: { codigo: 3, nombre: "Nota de Crédito A" },
  NOTA_CREDITO_B: { codigo: 8, nombre: "Nota de Crédito B" },
  NOTA_CREDITO_C: { codigo: 13, nombre: "Nota de Crédito C" },
  RECIBO: { codigo: 0, nombre: "Recibo" },
  TICKET: { codigo: 0, nombre: "Ticket" },
} as const;

/**
 * Categorías de gasto estándar para consorcios
 */
export const CATEGORIAS_GASTO_DEFECTO = [
  { nombre: "Sueldos y Cargas Sociales", icono: "👷", orden: 1 },
  { nombre: "Servicios Públicos", icono: "💡", orden: 2 },
  { nombre: "Mantenimiento", icono: "🔧", orden: 3 },
  { nombre: "Limpieza", icono: "🧹", orden: 4 },
  { nombre: "Seguros", icono: "🛡️", orden: 5 },
  { nombre: "Administración", icono: "📋", orden: 6 },
  { nombre: "Reparaciones Extraordinarias", icono: "🏗️", orden: 7 },
  { nombre: "Fondo de Reserva", icono: "💰", orden: 8 },
  { nombre: "Otros", icono: "📦", orden: 99 },
] as const;

/**
 * Días hábiles para vencimientos
 */
export const FERIADOS_ARGENTINA_2024 = [
  "2024-01-01", // Año Nuevo
  "2024-02-12", // Carnaval
  "2024-02-13", // Carnaval
  "2024-03-24", // Día de la Memoria
  "2024-03-29", // Viernes Santo
  "2024-04-02", // Día del Veterano
  "2024-05-01", // Día del Trabajador
  "2024-05-25", // Revolución de Mayo
  "2024-06-17", // Paso a la Inmortalidad de Güemes
  "2024-06-20", // Día de la Bandera
  "2024-07-09", // Día de la Independencia
  "2024-08-17", // Paso a la Inmortalidad de San Martín
  "2024-10-12", // Día del Respeto a la Diversidad Cultural
  "2024-11-18", // Día de la Soberanía Nacional
  "2024-12-08", // Inmaculada Concepción
  "2024-12-25", // Navidad
] as const;

/**
 * Formato de moneda argentina
 */
export function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(monto);
}

/**
 * Formato de fecha argentina
 */
export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

/**
 * Formato de período (YYYY-MM -> "Enero 2024")
 */
export function formatearPeriodo(periodo: string): string {
  const [year, month] = periodo.split("-");
  const meses = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const monthIndex = parseInt(month!) - 1;
  return `${meses[monthIndex]} ${year}`;
}
