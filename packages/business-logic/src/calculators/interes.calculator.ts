// =============================================================================
// Calculador de Intereses por Mora
// =============================================================================

export interface ConfiguracionInteres {
  tasaMensual: number; // Porcentaje (ej: 3.5 = 3.5%)
  periodoGracia: number; // Días sin interés después del vencimiento
}

export interface CalculoInteresInput {
  montoOriginal: number;
  fechaVencimiento: Date;
  fechaCalculo: Date;
  configuracion: ConfiguracionInteres;
}

export interface CalculoInteresOutput {
  diasMora: number;
  interes: number;
  montoTotal: number;
  detalle: string;
}

/**
 * Calcula intereses por mora (interés simple)
 * Fórmula: Capital × Tasa × (Días / 30)
 */
export function calcularInteresMora(
  input: CalculoInteresInput
): CalculoInteresOutput {
  const { montoOriginal, fechaVencimiento, fechaCalculo, configuracion } =
    input;

  // Calcular días transcurridos
  const diffTime = fechaCalculo.getTime() - fechaVencimiento.getTime();
  const diasTranscurridos = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Restar período de gracia
  const diasMora = Math.max(0, diasTranscurridos - configuracion.periodoGracia);

  if (diasMora === 0) {
    return {
      diasMora: 0,
      interes: 0,
      montoTotal: montoOriginal,
      detalle: "Sin mora",
    };
  }

  // Calcular interés simple
  // Tasa mensual / 100 para convertir a decimal
  // Dividir por 30 para tasa diaria
  const tasaDiaria = configuracion.tasaMensual / 100 / 30;
  const interes = redondear(montoOriginal * tasaDiaria * diasMora);
  const montoTotal = montoOriginal + interes;

  return {
    diasMora,
    interes,
    montoTotal,
    detalle: `${diasMora} días de mora al ${configuracion.tasaMensual}% mensual`,
  };
}

/**
 * Clasifica el estado de mora para el semáforo de morosos
 */
export function clasificarMora(diasMora: number): {
  estado: "alDia" | "leve" | "moderado" | "grave";
  color: string;
  descripcion: string;
} {
  if (diasMora === 0) {
    return { estado: "alDia", color: "green", descripcion: "Al día" };
  }
  if (diasMora <= 30) {
    return { estado: "leve", color: "yellow", descripcion: "1-30 días" };
  }
  if (diasMora <= 60) {
    return { estado: "moderado", color: "orange", descripcion: "31-60 días" };
  }
  return { estado: "grave", color: "red", descripcion: "Más de 60 días" };
}

function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
