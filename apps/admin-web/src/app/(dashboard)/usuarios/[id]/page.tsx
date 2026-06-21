'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useConsorcios, useUnidadesFuncionales } from '@/features/consorcios';
import {
  useUsuario,
  useUpdateUsuario,
  useAsignarRol,
  useDeactivateUsuario,
  useReinvitarUsuario,
} from '@/features/usuarios';
import { formatDate } from '@/lib/utils';

import type { Rol, EstadoUsuario } from '@/lib/types';


// Schema para edición
const editUsuarioSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  telefono: z.string().optional(),
});

// Schema para nuevo rol
const nuevoRolSchema = z.object({
  consorcioId: z.string().min(1, 'Seleccioná un consorcio'),
  rol: z.enum([
    'ADMINISTRADOR',
    'ADMIN_STAFF',
    'PROPIETARIO',
    'INQUILINO',
    'ENCARGADO',
    'AUDITOR',
  ] as const),
  unidadFuncionalId: z.string().optional(),
  tipoVinculo: z
    .enum(['TITULAR_VOTANTE', 'COPROPIETARIO', 'INQUILINO_PRINCIPAL'] as const)
    .optional(),
});

type EditFormData = z.infer<typeof editUsuarioSchema>;
type NuevoRolFormData = z.infer<typeof nuevoRolSchema>;

// Helpers para badges
const estadoBadge: Record<EstadoUsuario, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  ACTIVO: { label: 'Activo', variant: 'success' },
  INACTIVO: { label: 'Inactivo', variant: 'default' },
  PENDIENTE_VERIFICACION: { label: 'Pendiente', variant: 'warning' },
  SUSPENDIDO: { label: 'Suspendido', variant: 'error' },
};

const rolLabels: Record<Rol, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMINISTRADOR: 'Administrador',
  ADMIN_STAFF: 'Staff Admin',
  PROPIETARIO: 'Propietario',
  INQUILINO: 'Inquilino',
  ENCARGADO: 'Encargado',
  AUDITOR: 'Auditor',
  PROVEEDOR_EXTERNO: 'Proveedor',
};

const rolesOptions: { value: Rol; label: string }[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador' },
  { value: 'ADMIN_STAFF', label: 'Staff Admin' },
  { value: 'PROPIETARIO', label: 'Propietario' },
  { value: 'INQUILINO', label: 'Inquilino' },
  { value: 'ENCARGADO', label: 'Encargado' },
  { value: 'AUDITOR', label: 'Auditor' },
];

export default function UsuarioDetallePage() {
  const params = useParams();
  const router = useRouter();
  const usuarioId = params.id as string;

  const [showNuevoRol, setShowNuevoRol] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Queries
  const { data: usuario, isLoading, error: queryError } = useUsuario(usuarioId);
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data || [];

  // Mutations
  const updateMutation = useUpdateUsuario();
  const asignarRolMutation = useAsignarRol();
  const deactivateMutation = useDeactivateUsuario();
  const reinvitarMutation = useReinvitarUsuario();

  // Form para edición
  const editForm = useForm<EditFormData>({
    resolver: zodResolver(editUsuarioSchema),
    values: {
      nombre: usuario?.nombre || '',
      apellido: usuario?.apellido || '',
      telefono: usuario?.telefono || '',
    },
  });

  // Form para nuevo rol
  const nuevoRolForm = useForm<NuevoRolFormData>({
    resolver: zodResolver(nuevoRolSchema),
  });

  const selectedConsorcioForRol = nuevoRolForm.watch('consorcioId');
  const selectedRolForNew = nuevoRolForm.watch('rol');
  const requiresUF = ['PROPIETARIO', 'INQUILINO'].includes(selectedRolForNew || '');

  const { data: ufsData } = useUnidadesFuncionales(selectedConsorcioForRol || '');
  const unidades = ufsData?.data || [];

  // Handlers
  const onUpdateSubmit = async (data: EditFormData) => {
    setError(null);
    setSuccess(null);
    try {
      await updateMutation.mutateAsync({ id: usuarioId, data });
      setSuccess('Usuario actualizado correctamente');
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      setError(error?.data?.message || 'Error al actualizar');
    }
  };

  const onNuevoRolSubmit = async (data: NuevoRolFormData) => {
    setError(null);
    setSuccess(null);
    try {
      await asignarRolMutation.mutateAsync({
        usuarioId: usuarioId,
        data: {
          consorcioId: data.consorcioId,
          rol: data.rol,
          unidadFuncionalId: requiresUF ? data.unidadFuncionalId : undefined,
          tipoVinculo: requiresUF ? data.tipoVinculo : undefined,
        },
      });
      setSuccess('Rol asignado correctamente');
      setShowNuevoRol(false);
      nuevoRolForm.reset();
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      setError(error?.data?.message || 'Error al asignar rol');
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    setError(null);
    try {
      await deactivateMutation.mutateAsync(usuarioId);
      router.push('/usuarios');
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      setError(error?.data?.message || 'Error al desactivar');
    }
  };

  const handleReinvitar = async () => {
    setError(null);
    setSuccess(null);
    try {
      await reinvitarMutation.mutateAsync(usuarioId);
      setSuccess('Invitación reenviada');
    } catch (e: unknown) {
      const error = e as { data?: { message?: string } };
      setError(error?.data?.message || 'Error al reenviar');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (queryError || !usuario) {
    return (
      <div className="max-w-2xl mx-auto">
        <AlertBanner
          title="Error al cargar usuario"
          variant="error"
        >
          {queryError?.message || 'Usuario no encontrado'}
        </AlertBanner>
        <Link className="mt-4 inline-block" href="/usuarios">
          <Button variant="secondary">← Volver a usuarios</Button>
        </Link>
      </div>
    );
  }

  const estado = usuario.estado as EstadoUsuario;
  const badgeInfo = estadoBadge[estado];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/usuarios">
            <Button size="sm" variant="ghost">
              ← Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {usuario.nombre} {usuario.apellido}
              </h1>
              <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
            </div>
            <p className="text-muted-foreground">{usuario.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {estado === 'PENDIENTE_VERIFICACION' && (
            <Button
              disabled={reinvitarMutation.isPending}
              variant="secondary"
              onClick={handleReinvitar}
            >
              {reinvitarMutation.isPending ? <Spinner size="sm" /> : 'Reenviar Invitación'}
            </Button>
          )}
          {estado !== 'INACTIVO' && (
            <Button
              disabled={deactivateMutation.isPending}
              variant="danger"
              onClick={handleDeactivate}
            >
              Desactivar
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <AlertBanner title="Error" variant="error">{error}</AlertBanner>
      )}
      {success && (
        <AlertBanner title="Éxito" variant="success">{success}</AlertBanner>
      )}

      {/* Información del usuario */}
      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>Datos básicos del usuario</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={editForm.handleSubmit(onUpdateSubmit)}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" {...editForm.register('nombre')} />
                {editForm.formState.errors.nombre && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.nombre.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido</Label>
                <Input id="apellido" {...editForm.register('apellido')} />
                {editForm.formState.errors.apellido && (
                  <p className="text-sm text-destructive">
                    {editForm.formState.errors.apellido.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input disabled value={usuario.email} />
              <p className="text-xs text-muted-foreground">
                El email no se puede modificar
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" {...editForm.register('telefono')} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <span className="font-medium">Registrado:</span>{' '}
                {formatDate(usuario.createdAt)}
              </div>
              {usuario.ultimoAcceso && (
                <div>
                  <span className="font-medium">Último acceso:</span>{' '}
                  {formatDate(usuario.ultimoAcceso)}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                disabled={
                  updateMutation.isPending || !editForm.formState.isDirty
                }
                type="submit"
              >
                {updateMutation.isPending ? <Spinner size="sm" /> : 'Guardar Cambios'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Roles y Consorcios */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Roles y Consorcios</CardTitle>
            <CardDescription>
              Accesos del usuario en cada consorcio
            </CardDescription>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowNuevoRol(!showNuevoRol)}
          >
            {showNuevoRol ? 'Cancelar' : '+ Asignar Rol'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Form nuevo rol */}
          {showNuevoRol && (
            <form
              className="p-4 border rounded-lg bg-muted/50 space-y-4"
              onSubmit={nuevoRolForm.handleSubmit(onNuevoRolSubmit)}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Consorcio</Label>
                  <select
                    {...nuevoRolForm.register('consorcioId')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Seleccionar...</option>
                    {consorcios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Rol</Label>
                  <select
                    {...nuevoRolForm.register('rol')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Seleccionar...</option>
                    {rolesOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {requiresUF && selectedConsorcioForRol && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidad Funcional</Label>
                    <select
                      {...nuevoRolForm.register('unidadFuncionalId')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Seleccionar...</option>
                      {unidades.map((uf) => (
                        <option key={uf.id} value={uf.id}>
                          {uf.codigo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo Vínculo</Label>
                    <select
                      {...nuevoRolForm.register('tipoVinculo')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="TITULAR_VOTANTE">Titular Votante</option>
                      <option value="COPROPIETARIO">Copropietario</option>
                      <option value="INQUILINO_PRINCIPAL">Inquilino Principal</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button disabled={asignarRolMutation.isPending} type="submit">
                  {asignarRolMutation.isPending ? <Spinner size="sm" /> : 'Asignar Rol'}
                </Button>
              </div>
            </form>
          )}

          {/* Lista de roles actuales */}
          {usuario.rolesConsorcio && usuario.rolesConsorcio.length > 0 ? (
            <div className="divide-y">
              {usuario.rolesConsorcio.map((rc) => (
                <div
                  className="py-3 flex items-center justify-between"
                  key={rc.id}
                >
                  <div>
                    <div className="font-medium">
                      {rc.consorcioNombre || 'Consorcio'}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Badge variant="info">{rolLabels[rc.rol as Rol]}</Badge>
                      {rc.unidadFuncionalCodigo && (
                        <span>• UF: {rc.unidadFuncionalCodigo}</span>
                      )}
                      {rc.tipoVinculo && <span>• {rc.tipoVinculo}</span>}
                      {!rc.activo && (
                        <Badge variant="error">Inactivo</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No tiene roles asignados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preferencias */}
      <Card>
        <CardHeader>
          <CardTitle>Preferencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Modo:</span>{' '}
              <span className="font-medium">{usuario.preferenciasModo}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tema:</span>{' '}
              <span className="font-medium">{usuario.preferenciasTema}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Texto:</span>{' '}
              <span className="font-medium">{usuario.preferenciasTexto}px</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
