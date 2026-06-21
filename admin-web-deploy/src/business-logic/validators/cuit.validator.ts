import { z } from "zod";

// =============================================================================
// Validador de CUIT/CUIL Argentino
// =============================================================================

/**
 * Valida formato y dígito verificador de CUIT/CUIL
 * Formato: XX-XXXXXXXX-X
 */
export function validarCuit(cuit: string): boolean {
  // Limpiar caracteres no numéricos
  const cuitLimpio = cuit.replace(/\D/g, "");

  if (cuitLimpio.length !== 11) {
    return false;
  }

  // Validar tipo (primeros 2 dígitos)
  const tipo = parseInt(cuitLimpio.substring(0, 2));
  const tiposValidos = [20, 23, 24, 27, 30, 33, 34];

  if (!tiposValidos.includes(tipo)) {
    return false;
  }

  // Calcular dígito verificador
  const multiplicadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let suma = 0;

  for (let i = 0; i < 10; i++) {
    suma += parseInt(cuitLimpio[i]!) * multiplicadores[i]!;
  }

  const resto = suma % 11;
  const digitoCalculado = resto === 0 ? 0 : resto === 1 ? 9 : 11 - resto;
  const digitoIngresado = parseInt(cuitLimpio[10]!);

  return digitoCalculado === digitoIngresado;
}

/**
 * Formatea CUIT a XX-XXXXXXXX-X
 */
export function formatearCuit(cuit: string): string {
  const cuitLimpio = cuit.replace(/\D/g, "");

  if (cuitLimpio.length !== 11) {
    return cuit;
  }

  return `${cuitLimpio.substring(0, 2)}-${cuitLimpio.substring(2, 10)}-${cuitLimpio.substring(10)}`;
}

// Schema Zod para CUIT
export const cuitSchema = z
  .string()
  .min(11, "El CUIT debe tener 11 dígitos")
  .max(13, "El CUIT no es válido") // 11 dígitos + 2 guiones
  .refine((val) => validarCuit(val), {
    message: "El CUIT no es válido",
  });
