import { z } from "zod";

// =============================================================================
// Validador de Pagos - Schema Zod
// =============================================================================

export const pagoSchema = z.object({
  monto: z
    .number({
      required_error: "El monto es obligatorio",
      invalid_type_error: "El monto debe ser un número",
    })
    .positive("El monto debe ser mayor a 0")
    .max(10_000_000, "El monto no puede superar $10.000.000"),

  metodoPago: z.enum(
    ["MERCADO_PAGO", "TRANSFERENCIA", "EFECTIVO", "DEBITO_AUTOMATICO", "SIRO"],
    {
      required_error: "Seleccioná un método de pago",
    }
  ),

  periodosAbonados: z
    .array(z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)"))
    .min(1, "Seleccioná al menos un período"),

  comentario: z
    .string()
    .max(500, "El comentario no puede superar 500 caracteres")
    .optional(),

  transferenciaRef: z
    .string()
    .max(100, "La referencia no puede superar 100 caracteres")
    .optional(),
});

// Tipo inferido del schema
export type PagoInput = z.infer<typeof pagoSchema>;

// Schema para validar el monto parcial
export const montoParcialSchema = z.object({
  montoTotal: z.number().positive(),
  montoPagado: z.number().min(0),
  montoParcial: z
    .number()
    .positive("El monto debe ser mayor a 0")
    .refine(
      (val) => val <= 10_000_000,
      "El monto no puede superar $10.000.000"
    ),
});
