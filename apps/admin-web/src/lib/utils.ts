import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind de forma segura
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda argentina
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '$0';
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '$0';

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formatea una fecha ISO a formato legible
 */
export function formatDate(
  date: string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  }).format(d);
}

/**
 * Formatea una fecha con hora
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formatea un período YYYY-MM a formato legible
 */
export function formatPeriodo(periodo: string): string {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return periodo;

  const [year, month] = periodo.split('-');
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const monthIndex = parseInt(month ?? '0', 10) - 1;
  return `${monthNames[monthIndex]} ${year}`;
}

/**
 * Formatea un período YYYY-MM a formato corto (Ene 2024)
 */
export function formatPeriodoCorto(periodo: string): string {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return periodo;

  const [year, month] = periodo.split('-');
  const monthNames = [
    'Ene',
    'Feb',
    'Mar',
    'Abr',
    'May',
    'Jun',
    'Jul',
    'Ago',
    'Sep',
    'Oct',
    'Nov',
    'Dic',
  ];

  const monthIndex = parseInt(month ?? '0', 10) - 1;
  return `${monthNames[monthIndex]} ${year}`;
}

/**
 * Genera el período actual en formato YYYY-MM
 */
export function getCurrentPeriodo(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calcula la diferencia en días entre dos fechas
 */
export function daysDifference(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica si una fecha está vencida
 */
export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Trunca un texto a N caracteres
 */
export function truncate(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Capitaliza la primera letra de cada palabra
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Genera iniciales de un nombre completo
 */
export function getInitials(name: string, maxInitials = 2): string {
  if (!name) return '';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, maxInitials)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

/**
 * Formatea un número de teléfono argentino
 */
export function formatPhoneAR(phone: string | null | undefined): string {
  if (!phone) return '-';
  // Remove non-digits
  const digits = phone.replace(/\D/g, '');

  // Si tiene código de país
  if (digits.startsWith('54')) {
    const rest = digits.slice(2);
    if (rest.length === 10) {
      return `+54 ${rest.slice(0, 2)} ${rest.slice(2, 6)}-${rest.slice(6)}`;
    }
  }

  // Formato local
  if (digits.length === 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

/**
 * Valida un CUIT/CUIL argentino
 */
export function isValidCUIT(cuit: string): boolean {
  const cleaned = cuit.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i] ?? '0', 10) * multipliers[i]!;
  }

  const remainder = sum % 11;
  const checkDigit = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;

  return checkDigit === parseInt(cleaned[10] ?? '0', 10);
}

/**
 * Formatea un CUIT/CUIL con guiones
 */
export function formatCUIT(cuit: string | null | undefined): string {
  if (!cuit) return '-';
  const cleaned = cuit.replace(/\D/g, '');
  if (cleaned.length !== 11) return cuit;
  return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
}
