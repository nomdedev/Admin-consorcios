import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina clases de Tailwind de forma inteligente
 * Resuelve conflictos y merge correctamente
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
