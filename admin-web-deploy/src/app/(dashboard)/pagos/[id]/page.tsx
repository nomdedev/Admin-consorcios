'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Spinner,
  Input,
  Label,
  AlertBanner,
} from '@vecinosimple/ui';
import {
  usePago,
  useActualizarEstadoPago,
  useReembolsarPago,
  useGenerarComprobante,
  type EstadoPago,
  type MetodoPago,
} from '@/features/pagos';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatPeriodo,
} from '@/lib/utils';

// Helpers - variantes del Badge de @vecinosimple/ui: default, success, warning, error, info
const estadoBadge: Record<
  EstadoPago,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }
> = {
  PENDIENTE: { label: 'Pendiente', variant: 'warning' },
  PROCESANDO: { label: 'Procesando', variant: 'info' },
  APROBADO: { label: 'Aprobado', variant: 'success' },
  RECHAZADO: { label: 'Rechazado', variant: 'error' },
  REEMBOLSADO: { label: 'Reembolsado', variant: 'info' },
};

const metodoPagoLabels: Record<MetodoPago, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  TRANSFERENCIA: 'Transferencia Bancaria',
  EFECTIVO: 'Efectivo',
  DEBITO_AUTOMATICO: 'Débito Automático',
  SIRO: 'SIRO',
};

export default function PagoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const pagoId = params.id as string;

  const [showActualizarEstado, setShowActualizarEstado] = useState(false);
  const [showReembolsar, setShowReembolsar] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoPago>('APROBADO');
  const [motivoEstado, setMotivoEstado] = useState('');
  const [motivoReembolso, setMotivoReembolso] = useState('');
  const [montoReembolso, setMontoReembolso] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Queries
  const { data: pago, isLoading, error: queryError } = usePago(pagoId);

  // Mutations
  const actualizarEstadoMutation = useActualizarEstadoPago();
  const reembolsarMutation = useReembolsarPago();
  const generarComprobanteMutation = useGenerarComprobante();

  const handleActualizarEstado = async () => {
    if (!motivoEstado.trim()) {
      setError('El motivo es obligatorio');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await actualizarEstadoMutation.mutateAsync({
        id: pagoId,
        data: {
          estado: nuevoEstado,
          motivo: motivoEstado,
        },
      });
      setSuccess('Estado actualizado correctamente');
      setShowActualizarEstado(false);
      setMotivoEstado('');
    } catch (e: any) {
      setError(e?.data?.message || 'Error al actualizar estado');
    }
  };

  const handleReembolsar = async () => {
    if (!motivoReembolso.trim()) {
      setError('El motivo del reembolso es obligatorio');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await reembolsarMutation.mutateAsync({
        id: pagoId,
        data: {
          motivo: motivoReembolso,
          montoReembolso,
        },
      });
      setSuccess('Reembolso registrado correctamente');
      setShowReembolsar(false);
      setMotivoReembolso('');
      setMontoReembolso(undefined);
    } catch (e: any) {
      setError(e?.data?.message || 'Error al procesar reembolso');
    }
  };

  const handleGenerarComprobante = async () => {
    setError(null);
    try {
      const result = await generarComprobanteMutation.mutateAsync(pagoId);
      if (result.url) {
        window.open(result.url, '_blank');
      }
    } catch (e: any) {
      setError(e?.data?.message || 'Error al generar comprobante');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (queryError || !pago) {
    return (
      <div className="max-w-2xl mx-auto">
        <AlertBanner
          variant="error"
          title="Error al cargar pago"
        >
          {queryError?.message || 'Pago no encontrado'}
        </AlertBanner>
        <Link href="/pagos" className="mt-4 inline-block">
          <Button variant="secondary">← Volver a pagos</Button>
        </Link>
      </div>
    );
  }

  const estadoInfo = estadoBadge[pago.estado];
  const puedeActualizarEstado = ['PENDIENTE', 'PROCESANDO'].includes(pago.estado);
  const puedeReembolsar = pago.estado === 'APROBADO';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/pagos">
            <Button variant="ghost" size="sm">
              ← Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">Pago #{pago.id.slice(-8)}</h1>
              <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              {formatDateTime(pago.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleGenerarComprobante}
            disabled={generarComprobanteMutation.isPending || pago.estado !== 'APROBADO'}
          >
            {generarComprobanteMutation.isPending ? (
              <Spinner size="sm" />
            ) : (
              '📄 Comprobante'
            )}
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <AlertBanner variant="error" title="Error">{error}</AlertBanner>
      )}
      {success && (
        <AlertBanner variant="success" title="Éxito">{success}</AlertBanner>
      )}

      {/* Información principal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Detalle del pago */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle del Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="text-lg font-medium">Monto:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(pago.monto)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Método:</span>
                <span className="font-medium">
                  {metodoPagoLabels[pago.metodoPago]}
                </span>
              </div>

              {pago.transferenciaRef && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Referencia:</span>
                  <span className="font-mono">{pago.transferenciaRef}</span>
                </div>
              )}

              {pago.mercadoPagoId && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Mercado Pago:</span>
                  <span className="font-mono text-sm">{pago.mercadoPagoId}</span>
                </div>
              )}

              {pago.fechaPago && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fecha de pago:</span>
                  <span>{formatDate(pago.fechaPago)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-muted-foreground">Registrado:</span>
                <span>{formatDateTime(pago.createdAt)}</span>
              </div>
            </div>

            {pago.concepto && (
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Concepto:</p>
                <p>{pago.concepto}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usuario y UF */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Pagador</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pago.usuario && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Usuario:</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">
                    {pago.usuario.nombre} {pago.usuario.apellido}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pago.usuario.email}
                  </p>
                </div>
              </div>
            )}

            {pago.unidadFuncional && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Unidad Funcional:</p>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="font-medium">{pago.unidadFuncional.codigo}</p>
                  {pago.unidadFuncional.consorcio && (
                    <p className="text-sm text-muted-foreground">
                      {pago.unidadFuncional.consorcio.nombre}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Períodos abonados:</p>
              <div className="flex flex-wrap gap-2">
                {pago.periodosAbonados.map((p) => (
                  <Badge key={p} variant="default">
                    {formatPeriodo(p)}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprobante */}
      {pago.comprobanteUrl && (
        <Card>
          <CardHeader>
            <CardTitle>Comprobante</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={pago.comprobanteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              📄 Descargar comprobante
            </a>
          </CardContent>
        </Card>
      )}

      {/* Acciones de administración */}
      {(puedeActualizarEstado || puedeReembolsar) && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones</CardTitle>
            <CardDescription>
              Operaciones administrativas sobre el pago
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Actualizar estado */}
            {puedeActualizarEstado && (
              <div className="space-y-4">
                {!showActualizarEstado ? (
                  <Button
                    variant="secondary"
                    onClick={() => setShowActualizarEstado(true)}
                  >
                    Cambiar Estado
                  </Button>
                ) : (
                  <div className="p-4 border rounded-lg space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nuevo estado</Label>
                        <select
                          value={nuevoEstado}
                          onChange={(e) =>
                            setNuevoEstado(e.target.value as EstadoPago)
                          }
                          className="w-full h-10 px-3 rounded-md border border-input bg-background"
                        >
                          <option value="APROBADO">Aprobado</option>
                          <option value="RECHAZADO">Rechazado</option>
                          <option value="PROCESANDO">Procesando</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Motivo *</Label>
                        <Input
                          value={motivoEstado}
                          onChange={(e) => setMotivoEstado(e.target.value)}
                          placeholder="Motivo del cambio"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleActualizarEstado}
                        disabled={actualizarEstadoMutation.isPending}
                      >
                        {actualizarEstadoMutation.isPending ? (
                          <Spinner size="sm" />
                        ) : (
                          'Confirmar'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowActualizarEstado(false);
                          setMotivoEstado('');
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reembolsar */}
            {puedeReembolsar && (
              <div className="space-y-4">
                {!showReembolsar ? (
                  <Button
                    variant="danger"
                    onClick={() => setShowReembolsar(true)}
                  >
                    Reembolsar Pago
                  </Button>
                ) : (
                  <div className="p-4 border border-destructive rounded-lg space-y-4">
                    <p className="text-sm text-destructive font-medium">
                      ⚠️ Esta acción marcará el pago como reembolsado
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Motivo *</Label>
                        <Input
                          value={motivoReembolso}
                          onChange={(e) => setMotivoReembolso(e.target.value)}
                          placeholder="Motivo del reembolso"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Monto (opcional, si es parcial)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={montoReembolso || ''}
                          onChange={(e) =>
                            setMontoReembolso(
                              e.target.value ? parseFloat(e.target.value) : undefined
                            )
                          }
                          placeholder={`Total: ${formatCurrency(pago.monto)}`}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="danger"
                        onClick={handleReembolsar}
                        disabled={reembolsarMutation.isPending}
                      >
                        {reembolsarMutation.isPending ? (
                          <Spinner size="sm" />
                        ) : (
                          'Confirmar Reembolso'
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setShowReembolsar(false);
                          setMotivoReembolso('');
                          setMontoReembolso(undefined);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
