'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Spinner,
  Badge,
  AlertBanner,
} from '@vecinosimple/ui';
import {
  useRegistrarPagoManual,
  useCuentaCorriente,
  type RegistrarPagoManualDto,
} from '@/features/pagos';
import { useConsorcios, useUnidadesFuncionales } from '@/features/consorcios';
import { formatCurrency, formatPeriodo } from '@/lib/utils';

// Schema de validación
const pagoManualSchema = z.object({
  consorcioId: z.string().min(1, 'Seleccioná un consorcio'),
  unidadFuncionalId: z.string().min(1, 'Seleccioná una unidad funcional'),
  monto: z
    .number({ required_error: 'El monto es obligatorio' })
    .positive('El monto debe ser mayor a 0')
    .max(100000000, 'El monto no puede superar $100.000.000'),
  metodoPago: z.enum(['EFECTIVO', 'TRANSFERENCIA'] as const, {
    required_error: 'Seleccioná un método de pago',
  }),
  periodosAbonados: z
    .array(z.string())
    .min(1, 'Seleccioná al menos un período'),
  transferenciaRef: z.string().optional(),
  fechaPago: z.string().min(1, 'La fecha de pago es obligatoria'),
  concepto: z.string().max(500).optional(),
});

type FormData = z.infer<typeof pagoManualSchema>;

// Generar lista de períodos disponibles (12 meses atrás + 2 adelante)
function getPeriodosDisponibles(): string[] {
  const periodos: string[] = [];
  const now = new Date();

  for (let i = -12; i <= 2; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const periodo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    periodos.push(periodo);
  }

  return periodos;
}

export default function NuevoPagoPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const periodosDisponibles = useMemo(() => getPeriodosDisponibles(), []);

  // Form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(pagoManualSchema),
    defaultValues: {
      metodoPago: 'TRANSFERENCIA',
      periodosAbonados: [],
      fechaPago: new Date().toISOString().split('T')[0],
    },
  });

  const selectedConsorcio = watch('consorcioId');
  const selectedUF = watch('unidadFuncionalId');
  const selectedMetodo = watch('metodoPago');
  const selectedPeriodos = watch('periodosAbonados');

  // Queries
  const { data: consorciosData, isLoading: loadingConsorcios } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data || [];

  const { data: ufsData, isLoading: loadingUFs } = useUnidadesFuncionales(
    selectedConsorcio || ''
  );
  const unidades = ufsData?.data ?? [];

  const { data: cuentaCorriente, isLoading: loadingCC } = useCuentaCorriente(
    selectedUF || ''
  );

  // Mutation
  const registrarMutation = useRegistrarPagoManual();

  // Calcular monto sugerido basado en períodos seleccionados
  const montoSugerido = useMemo(() => {
    if (!cuentaCorriente?.expensasPendientes?.length || !selectedPeriodos?.length) {
      return 0;
    }

    return cuentaCorriente.expensasPendientes
      .filter((exp) => selectedPeriodos.includes(exp.periodo))
      .reduce((sum, exp) => sum + exp.totalAPagar, 0);
  }, [cuentaCorriente, selectedPeriodos]);

  // Toggle período seleccionado
  const togglePeriodo = (periodo: string) => {
    const current = selectedPeriodos || [];
    if (current.includes(periodo)) {
      setValue(
        'periodosAbonados',
        current.filter((p) => p !== periodo)
      );
    } else {
      setValue('periodosAbonados', [...current, periodo].sort());
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);

    try {
      const dto: RegistrarPagoManualDto = {
        unidadFuncionalId: data.unidadFuncionalId,
        monto: data.monto,
        metodoPago: data.metodoPago,
        periodosAbonados: data.periodosAbonados,
        transferenciaRef: data.transferenciaRef,
        fechaPago: new Date(data.fechaPago).toISOString(),
        concepto: data.concepto,
      };

      const result = await registrarMutation.mutateAsync(dto);
      router.push(`/pagos/${result.id}`);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || 'Error al registrar pago';
      setSubmitError(message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/pagos">
          <Button variant="ghost" size="sm">
            ← Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Registrar Pago Manual</h1>
          <p className="text-muted-foreground">
            Registrá un pago en efectivo o transferencia
          </p>
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <AlertBanner
          variant="error"
          title="Error al registrar pago"
        >
          {submitError}
        </AlertBanner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Selección de UF */}
        <Card>
          <CardHeader>
            <CardTitle>Unidad Funcional</CardTitle>
            <CardDescription>
              Seleccioná el consorcio y la unidad que realizó el pago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="consorcioId">Consorcio *</Label>
                {loadingConsorcios ? (
                  <Spinner size="sm" />
                ) : (
                  <select
                    id="consorcioId"
                    {...register('consorcioId')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    onChange={(e) => {
                      register('consorcioId').onChange(e);
                      setValue('unidadFuncionalId', '');
                      setValue('periodosAbonados', []);
                    }}
                  >
                    <option value="">Seleccionar...</option>
                    {consorcios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} - {c.direccion}
                      </option>
                    ))}
                  </select>
                )}
                {errors.consorcioId && (
                  <p className="text-sm text-destructive">
                    {errors.consorcioId.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidadFuncionalId">Unidad Funcional *</Label>
                {loadingUFs ? (
                  <Spinner size="sm" />
                ) : (
                  <select
                    id="unidadFuncionalId"
                    {...register('unidadFuncionalId')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    disabled={!selectedConsorcio}
                  >
                    <option value="">Seleccionar...</option>
                    {unidades.map((uf) => (
                      <option key={uf.id} value={uf.id}>
                        {uf.codigo} - {uf.tipo}
                      </option>
                    ))}
                  </select>
                )}
                {errors.unidadFuncionalId && (
                  <p className="text-sm text-destructive">
                    {errors.unidadFuncionalId.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cuenta Corriente (si hay UF seleccionada) */}
        {selectedUF && (
          <Card>
            <CardHeader>
              <CardTitle>Estado de Cuenta</CardTitle>
              <CardDescription>
                Deuda actual de la unidad funcional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCC ? (
                <Spinner size="sm" />
              ) : cuentaCorriente ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <span className="font-medium">Saldo actual:</span>
                    <span
                      className={`text-xl font-bold ${
                        cuentaCorriente.saldoActual < 0
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}
                    >
                      {formatCurrency(cuentaCorriente.saldoActual)}
                    </span>
                  </div>

                  {cuentaCorriente.expensasPendientes?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Expensas pendientes:</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {cuentaCorriente.expensasPendientes.map((exp) => (
                          <button
                            key={exp.periodo}
                            type="button"
                            onClick={() => togglePeriodo(exp.periodo)}
                            className={`p-3 rounded-lg border text-left transition-colors ${
                              selectedPeriodos?.includes(exp.periodo)
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="font-medium">
                              {formatPeriodo(exp.periodo)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(exp.totalAPagar)}
                            </div>
                            {exp.intereses > 0 && (
                              <div className="text-xs text-red-500">
                                +{formatCurrency(exp.intereses)} interés
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground">Sin datos de cuenta corriente</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Datos del pago */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Períodos seleccionados */}
            <div className="space-y-2">
              <Label>Períodos a abonar *</Label>
              {selectedPeriodos?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedPeriodos.map((p) => (
                    <Badge
                      key={p}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => togglePeriodo(p)}
                    >
                      {formatPeriodo(p)} ✕
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Seleccioná períodos de la cuenta corriente o agregá manualmente
                </p>
              )}
              {errors.periodosAbonados && (
                <p className="text-sm text-destructive">
                  {errors.periodosAbonados.message}
                </p>
              )}

              {/* Agregar período manual */}
              <div className="flex gap-2 mt-2">
                <select
                  className="flex-1 h-10 px-3 rounded-md border border-input bg-background"
                  onChange={(e) => {
                    if (e.target.value) {
                      togglePeriodo(e.target.value);
                      e.target.value = '';
                    }
                  }}
                >
                  <option value="">Agregar otro período...</option>
                  {periodosDisponibles
                    .filter((p) => !selectedPeriodos?.includes(p))
                    .map((p) => (
                      <option key={p} value={p}>
                        {formatPeriodo(p)}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monto">Monto *</Label>
                <Input
                  id="monto"
                  type="number"
                  step="0.01"
                  {...register('monto', { valueAsNumber: true })}
                  placeholder="0.00"
                />
                {montoSugerido > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setValue('monto', montoSugerido)}
                  >
                    Usar monto sugerido: {formatCurrency(montoSugerido)}
                  </Button>
                )}
                {errors.monto && (
                  <p className="text-sm text-destructive">{errors.monto.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="metodoPago">Método de Pago *</Label>
                <select
                  id="metodoPago"
                  {...register('metodoPago')}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="TRANSFERENCIA">Transferencia Bancaria</option>
                  <option value="EFECTIVO">Efectivo</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fechaPago">Fecha del Pago *</Label>
                <Input id="fechaPago" type="date" {...register('fechaPago')} />
                {errors.fechaPago && (
                  <p className="text-sm text-destructive">
                    {errors.fechaPago.message}
                  </p>
                )}
              </div>

              {selectedMetodo === 'TRANSFERENCIA' && (
                <div className="space-y-2">
                  <Label htmlFor="transferenciaRef">Referencia de Transferencia</Label>
                  <Input
                    id="transferenciaRef"
                    {...register('transferenciaRef')}
                    placeholder="Número de operación"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="concepto">Concepto / Observaciones</Label>
              <Input
                id="concepto"
                {...register('concepto')}
                placeholder="Ej: Pago recibido en oficina"
              />
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-4">
          <Link href="/pagos">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Registrando...
              </>
            ) : (
              'Registrar Pago'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
