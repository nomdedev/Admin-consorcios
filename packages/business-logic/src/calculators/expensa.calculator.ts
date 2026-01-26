// =============================================================================
// Calculador de Expensas - Prorrateo por Coeficiente
// =============================================================================

export interface UnidadFuncionalInput {
  id: string;
  codigo: string;
  coeficiente: number; // Porcentaje (ej: 5.5)
}

export interface GastoInput {
  id: string;
  monto: number;
  esExtraordinario: boolean;
  esProrrateable: boolean;
}

export interface DetalleExpensaOutput {
  unidadFuncionalId: string;
  codigo: string;
  montoOrdinario: number;
  montoExtraordinario: number;
  total: number;
}

export interface LiquidacionOutput {
  totalOrdinario: number;
  totalExtraordinario: number;
  totalGeneral: number;
  detalles: DetalleExpensaOutput[];
}

/**
 * Calcula el prorrateo de gastos por coeficiente de cada UF
 */
export function calcularLiquidacion(
  unidades: UnidadFuncionalInput[],
  gastos: GastoInput[]
): LiquidacionOutput {
  // Calcular totales
  const totalOrdinario = gastos
    .filter((g) => !g.esExtraordinario && g.esProrrateable)
    .reduce((sum, g) => sum + g.monto, 0);

  const totalExtraordinario = gastos
    .filter((g) => g.esExtraordinario && g.esProrrateable)
    .reduce((sum, g) => sum + g.monto, 0);

  // Calcular coeficiente total (debería ser ~100)
  const coeficienteTotal = unidades.reduce((sum, u) => sum + u.coeficiente, 0);

  // Calcular detalle por UF
  const detalles: DetalleExpensaOutput[] = unidades.map((unidad) => {
    const proporcion = unidad.coeficiente / coeficienteTotal;

    const montoOrdinario = redondear(totalOrdinario * proporcion);
    const montoExtraordinario = redondear(totalExtraordinario * proporcion);

    return {
      unidadFuncionalId: unidad.id,
      codigo: unidad.codigo,
      montoOrdinario,
      montoExtraordinario,
      total: montoOrdinario + montoExtraordinario,
    };
  });

  return {
    totalOrdinario,
    totalExtraordinario,
    totalGeneral: totalOrdinario + totalExtraordinario,
    detalles,
  };
}

/**
 * Redondea a 2 decimales
 */
function redondear(valor: number): number {
  return Math.round(valor * 100) / 100;
}
