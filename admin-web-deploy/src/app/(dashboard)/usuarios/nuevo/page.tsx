'use client';

import { useState } from 'react';
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
  AlertBanner,
} from '@vecinosimple/ui';
import { useCreateUsuario, type CreateUsuarioDto } from '@/features/usuarios';
import { useConsorcios, useUnidadesFuncionales } from '@/features/consorcios';
import type { Rol, TipoVinculoUF } from '@/lib/types';

// Schema de validación
const usuarioSchema = z.object({
  email: z.string().email('Email inválido'),
  nombre: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  apellido: z.string().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
  dni: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{7,8}$/.test(val), 'DNI debe tener 7 u 8 dígitos'),
  telefono: z.string().optional(),
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
  puedeCargarGastos: z.boolean().optional(),
  puedeVerConciliacion: z.boolean().optional(),
  puedeEnviarComunicados: z.boolean().optional(),
});

type FormData = z.infer<typeof usuarioSchema>;

const rolesOptions: { value: Rol; label: string; description: string }[] = [
  { value: 'ADMINISTRADOR', label: 'Administrador', description: 'Acceso total a la gestión' },
  { value: 'ADMIN_STAFF', label: 'Staff Admin', description: 'Empleado con permisos limitados' },
  { value: 'PROPIETARIO', label: 'Propietario', description: 'Dueño de unidad funcional' },
  { value: 'INQUILINO', label: 'Inquilino', description: 'Alquila unidad funcional' },
  { value: 'ENCARGADO', label: 'Encargado', description: 'Personal del edificio' },
  { value: 'AUDITOR', label: 'Auditor', description: 'Solo lectura financiera' },
];

const tipoVinculoOptions: { value: TipoVinculoUF; label: string }[] = [
  { value: 'TITULAR_VOTANTE', label: 'Titular Votante (1 por UF)' },
  { value: 'COPROPIETARIO', label: 'Copropietario (ve pero no vota)' },
  { value: 'INQUILINO_PRINCIPAL', label: 'Inquilino Principal' },
];

export default function NuevoUsuarioPage() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Queries
  const { data: consorciosData, isLoading: loadingConsorcios } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data || [];

  // Form
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      puedeCargarGastos: false,
      puedeVerConciliacion: false,
      puedeEnviarComunicados: false,
    },
  });

  const selectedConsorcio = watch('consorcioId');
  const selectedRol = watch('rol');

  // Query de UFs del consorcio seleccionado
  const { data: ufsData, isLoading: loadingUFs } = useUnidadesFuncionales(
    selectedConsorcio || ''
  );
  const unidades = ufsData?.data || [];

  // Mutation
  const createMutation = useCreateUsuario();

  // Determinar si el rol requiere UF
  const requiresUF = ['PROPIETARIO', 'INQUILINO'].includes(selectedRol || '');
  const isAdminStaff = selectedRol === 'ADMIN_STAFF';

  const onSubmit = async (data: FormData) => {
    setSubmitError(null);

    try {
      const dto: CreateUsuarioDto = {
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        dni: data.dni,
        telefono: data.telefono,
        rolConsorcio: {
          consorcioId: data.consorcioId,
          rol: data.rol,
          unidadFuncionalId: requiresUF ? data.unidadFuncionalId : undefined,
          tipoVinculo: requiresUF ? data.tipoVinculo : undefined,
          puedeCargarGastos: isAdminStaff ? data.puedeCargarGastos : undefined,
          puedeVerConciliacion: isAdminStaff ? data.puedeVerConciliacion : undefined,
          puedeEnviarComunicados: isAdminStaff ? data.puedeEnviarComunicados : undefined,
        },
      };

      const result = await createMutation.mutateAsync(dto);
      router.push(`/usuarios/${result.id}`);
    } catch (error: any) {
      const message =
        error?.data?.message || error?.message || 'Error al crear usuario';
      setSubmitError(message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/usuarios">
          <Button variant="ghost" size="sm">
            ← Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Nuevo Usuario</h1>
          <p className="text-muted-foreground">
            Invitá a un nuevo usuario al sistema
          </p>
        </div>
      </div>

      {/* Error */}
      {submitError && (
        <AlertBanner
          variant="error"
          title="Error al crear usuario"
        >
          {submitError}
        </AlertBanner>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Datos personales */}
        <Card>
          <CardHeader>
            <CardTitle>Datos Personales</CardTitle>
            <CardDescription>
              Información básica del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  {...register('nombre')}
                  placeholder="Juan"
                />
                {errors.nombre && (
                  <p className="text-sm text-destructive">{errors.nombre.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido">Apellido *</Label>
                <Input
                  id="apellido"
                  {...register('apellido')}
                  placeholder="Pérez"
                />
                {errors.apellido && (
                  <p className="text-sm text-destructive">{errors.apellido.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="juan@example.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Se enviará una invitación a este email
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  {...register('dni')}
                  placeholder="12345678"
                />
                {errors.dni && (
                  <p className="text-sm text-destructive">{errors.dni.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  {...register('telefono')}
                  placeholder="+5491155551234"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asignación */}
        <Card>
          <CardHeader>
            <CardTitle>Asignación</CardTitle>
            <CardDescription>
              Consorcio y rol del usuario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="consorcioId">Consorcio *</Label>
              {loadingConsorcios ? (
                <Spinner size="sm" />
              ) : (
                <select
                  id="consorcioId"
                  {...register('consorcioId')}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="">Seleccionar consorcio...</option>
                  {consorcios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} - {c.direccion}
                    </option>
                  ))}
                </select>
              )}
              {errors.consorcioId && (
                <p className="text-sm text-destructive">{errors.consorcioId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="rol">Rol *</Label>
              <select
                id="rol"
                {...register('rol')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                <option value="">Seleccionar rol...</option>
                {rolesOptions.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label} - {r.description}
                  </option>
                ))}
              </select>
              {errors.rol && (
                <p className="text-sm text-destructive">{errors.rol.message}</p>
              )}
            </div>

            {/* Campos condicionales para propietario/inquilino */}
            {requiresUF && selectedConsorcio && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="unidadFuncionalId">Unidad Funcional</Label>
                  {loadingUFs ? (
                    <Spinner size="sm" />
                  ) : (
                    <select
                      id="unidadFuncionalId"
                      {...register('unidadFuncionalId')}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="">Seleccionar unidad...</option>
                      {unidades.map((uf) => (
                        <option key={uf.id} value={uf.id}>
                          {uf.codigo} - {uf.tipo}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipoVinculo">Tipo de Vínculo</Label>
                  <select
                    id="tipoVinculo"
                    {...register('tipoVinculo')}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Seleccionar tipo...</option>
                    {tipoVinculoOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Permisos para ADMIN_STAFF */}
            {isAdminStaff && (
              <div className="space-y-3 p-4 bg-muted rounded-lg">
                <p className="font-medium text-sm">Permisos del Staff</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('puedeCargarGastos')}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Puede cargar gastos</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('puedeVerConciliacion')}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Puede ver conciliación bancaria</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register('puedeEnviarComunicados')}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Puede enviar comunicados</span>
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex justify-end gap-4">
          <Link href="/usuarios">
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Creando...
              </>
            ) : (
              'Crear y Enviar Invitación'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
