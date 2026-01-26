import { clsx, type ClassValue } from 'clsx';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '-';
  return format(dateObj, 'dd/MM/yyyy', { locale: es });
}

export function formatPeriodo(periodo: string): string {
  if (!periodo || !/^\d{4}-\d{2}$/.test(periodo)) return periodo;
  const [year, month] = periodo.split('-');
  const date = new Date(parseInt(year ?? '2024'), parseInt(month ?? '1') - 1, 1);
  return format(date, 'MMMM yyyy', { locale: es });
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function getEstadoPagoColor(estado: string): string {
  const colores: Record<string, string> = {
    APROBADO: 'bg-green-100 text-green-800',
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    RECHAZADO: 'bg-red-100 text-red-800',
    PROCESANDO: 'bg-blue-100 text-blue-800',
  };
  return colores[estado] || 'bg-gray-100 text-gray-800';
}

export function getEstadoTicketColor(estado: string): string {
  const colores: Record<string, string> = {
    ABIERTO: 'bg-blue-100 text-blue-800',
    EN_PROGRESO: 'bg-yellow-100 text-yellow-800',
    RESUELTO: 'bg-green-100 text-green-800',
    CERRADO: 'bg-gray-100 text-gray-800',
  };
  return colores[estado] || 'bg-gray-100 text-gray-800';
}
