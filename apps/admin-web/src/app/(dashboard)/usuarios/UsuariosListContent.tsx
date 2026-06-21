'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';

import { useConsorcios } from '@/features/consorcios';
import {
  useUsuarios,
  useDeactivateUsuario,
  useReinvitarUsuario,
  type UsuarioResponse,
  type ListUsuariosParams,
} from '@/features/usuarios';
import { useDebouncedValue } from '@/lib/hooks/use-debounce';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Spinner,
  AlertBanner,
  EmptyState,
} from 'ui';

import type { Rol, EstadoUsuario } from '@/lib/types';

// Helper para badge de estado
function getEstadoBadge(estado: EstadoUsuario) {
  const config: Record<EstadoUsuario, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
    ACTIVO: { variant: 'success', label: 'Activo' },
    PENDIENTE_VERIFICACION: { variant: 'warning', label: 'Pendiente' },
    INACTIVO: { variant: 'default', label: 'Inactivo' },
    SUSPENDIDO: { variant: 'error', label: 'Suspendido' },
  };
  return config[estado] || { variant: 'default', label: estado };
}

// Helper para badge de rol
function getRolBadge(rol: Rol) {
  const config: Record<Rol, { variant: 'default' | 'success' | 'warning' | 'error' | 'info'; label: string }> = {
    SUPER_ADMIN: { variant: 'error', label: 'Super Admin' },
    ADMINISTRADOR: { variant: 'success', label: 'Administrador' },
    ADMIN_STAFF: { variant: 'info', label: 'Staff Admin' },
    PROPIETARIO: { variant: 'default', label: 'Propietario' },
    INQUILINO: { variant: 'default', label: 'Inquilino' },
    ENCARGADO: { variant: 'info', label: 'Encargado' },
    AUDITOR: { variant: 'default', label: 'Auditor' },
    PROVEEDOR_EXTERNO: { variant: 'default', label: 'Proveedor' },
  };
  return config[rol] || { variant: 'default', label: rol };
}

// Componente de fila de usuario
function UsuarioRow({
  usuario,
  onDeactivate,
  onReinvitar,
}: Readonly<{
  usuario: UsuarioResponse;
  onDeactivate: (id: string) => void;
  onReinvitar: (id: string) => void;
}>) {
  const estadoBadge = getEstadoBadge(usuario.estado);
  const rolPrincipal = usuario.rolesConsorcio[0];

  return (
    <tr className="border-b hover:bg-muted/50">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
            {usuario.nombre[0]}{usuario.apellido[0]}
          </div>
          <div>
            <p className="font-medium">{usuario.nombre} {usuario.apellido}</p>
            <p className="text-sm text-muted-foreground">{usuario.email}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        {rolPrincipal && (
          <div className="space-y-1">
            <Badge variant={getRolBadge(rolPrincipal.rol).variant}>
              {getRolBadge(rolPrincipal.rol).label}
            </Badge>
            {rolPrincipal.consorcioNombre && (
              <p className="text-xs text-muted-foreground">
                {rolPrincipal.consorcioNombre}
              </p>
            )}
          </div>
        )}
        {usuario.rolesConsorcio.length > 1 && (
          <p className="text-xs text-muted-foreground mt-1">
            +{usuario.rolesConsorcio.length - 1} más
          </p>
        )}
      </td>
      <td className="p-4">
        <Badge variant={estadoBadge.variant}>{estadoBadge.label}</Badge>
      </td>
      <td className="p-4 text-sm text-muted-foreground">
        {usuario.ultimoAcceso
          ? new Date(usuario.ultimoAcceso).toLocaleDateString('es-AR')
          : 'Nunca'}
      </td>
      <td className="p-4">
        <div className="flex items-center gap-2">
          <Link href={`/usuarios/${usuario.id}`}>
            <Button size="sm" variant="secondary">Ver</Button>
          </Link>
          {usuario.estado === 'PENDIENTE_VERIFICACION' && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onReinvitar(usuario.id)}
            >
              Reinvitar
            </Button>
          )}
          {usuario.estado === 'ACTIVO' && (
            <Button
              className="text-destructive"
              size="sm"
              variant="ghost"
              onClick={() => onDeactivate(usuario.id)}
            >
              Desactivar
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function UsuariosListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado de filtros
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedConsorcio, setSelectedConsorcio] = useState(
    searchParams.get('consorcioId') || ''
  );
  const [selectedRol, setSelectedRol] = useState<Rol | ''>(
    (searchParams.get('rol') as Rol) || ''
  );
  const [selectedEstado, setSelectedEstado] = useState<EstadoUsuario | ''>(
    (searchParams.get('estado') as EstadoUsuario) || ''
  );
  const [page, setPage] = useState(1);

  const debouncedSearch = useDebouncedValue(search, 300);

  // Query params
  const queryParams: ListUsuariosParams = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      consorcioId: selectedConsorcio || undefined,
      rol: selectedRol || undefined,
      estado: selectedEstado || undefined,
      page,
      limit: 20,
    }),
    [debouncedSearch, selectedConsorcio, selectedRol, selectedEstado, page]
  );

  // Queries
  const { data: usuarios, isLoading, error, refetch } = useUsuarios(queryParams);
  const { data: consorciosData } = useConsorcios({ limit: 100 });
  const consorcios = consorciosData?.data || [];

  // Mutations
  const deactivateMutation = useDeactivateUsuario();
  const reinvitarMutation = useReinvitarUsuario();

  const handleDeactivate = async (id: string) => {
    if (!confirm('¿Estás seguro de desactivar este usuario?')) return;
    try {
      await deactivateMutation.mutateAsync(id);
    } catch (err) {
      console.error('Error al desactivar usuario:', err);
    }
  };

  const handleReinvitar = async (id: string) => {
    try {
      await reinvitarMutation.mutateAsync(id);
      alert('Invitación reenviada correctamente');
    } catch (err) {
      console.error('Error al reenviar invitación:', err);
    }
  };

  // Estadísticas rápidas
  const stats = useMemo(() => {
    if (!usuarios?.data) return { total: 0, activos: 0, pendientes: 0 };
    return {
      total: usuarios.total,
      activos: usuarios.data.filter((u) => u.estado === 'ACTIVO').length,
      pendientes: usuarios.data.filter((u) => u.estado === 'PENDIENTE_VERIFICACION').length,
    };
  }, [usuarios]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">
            Gestiona los usuarios de tu organización
          </p>
        </div>
        <Link href="/usuarios/nuevo">
          <Button>+ Nuevo Usuario</Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Usuarios</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Activos</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.activos}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pendientes}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="buscarUsuario">Buscar</label>
              <Input
                id="buscarUsuario"
                placeholder="Nombre, apellido o email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="filtroConsorcio">Consorcio</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                id="filtroConsorcio"
                value={selectedConsorcio}
                onChange={(e) => {
                  setSelectedConsorcio(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                {consorcios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="filtroRol">Rol</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                id="filtroRol"
                value={selectedRol}
                onChange={(e) => {
                  setSelectedRol(e.target.value as Rol | '');
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="ADMINISTRADOR">Administrador</option>
                <option value="ADMIN_STAFF">Staff Admin</option>
                <option value="PROPIETARIO">Propietario</option>
                <option value="INQUILINO">Inquilino</option>
                <option value="ENCARGADO">Encargado</option>
                <option value="AUDITOR">Auditor</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block" htmlFor="filtroEstado">Estado</label>
              <select
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                id="filtroEstado"
                value={selectedEstado}
                onChange={(e) => {
                  setSelectedEstado(e.target.value as EstadoUsuario | '');
                  setPage(1);
                }}
              >
                <option value="">Todos</option>
                <option value="ACTIVO">Activo</option>
                <option value="PENDIENTE_VERIFICACION">Pendiente</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="SUSPENDIDO">Suspendido</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="space-y-2">
          <AlertBanner
            title="Error al cargar usuarios"
            variant="error"
          >
            {error.message}
          </AlertBanner>
          <Button variant="secondary" onClick={() => refetch()}>Reintentar</Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Lista */}
      {!isLoading && !error && usuarios && (
        <>
          {usuarios.data.length === 0 ? (
            <EmptyState
              action={{
                label: 'Crear Usuario',
                onClick: () => router.push('/usuarios/nuevo'),
              }}
              description={
                search || selectedConsorcio || selectedRol || selectedEstado
                  ? 'Probá ajustando los filtros de búsqueda'
                  : 'Creá el primer usuario para comenzar'
              }
              title="No se encontraron usuarios"
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-medium">Usuario</th>
                        <th className="text-left p-4 font-medium">Rol</th>
                        <th className="text-left p-4 font-medium">Estado</th>
                        <th className="text-left p-4 font-medium">Último acceso</th>
                        <th className="text-left p-4 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.data.map((usuario) => (
                        <UsuarioRow
                          key={usuario.id}
                          usuario={usuario}
                          onDeactivate={handleDeactivate}
                          onReinvitar={handleReinvitar}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Paginación */}
          {usuarios.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Mostrando {usuarios.data.length} de {usuarios.total} usuarios
              </p>
              <div className="flex gap-2">
                <Button
                  disabled={page === 1}
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Anterior
                </Button>
                <span className="flex items-center px-3 text-sm">
                  Página {page} de {usuarios.totalPages}
                </span>
                <Button
                  disabled={page === usuarios.totalPages}
                  size="sm"
                  variant="secondary"
                  onClick={() => setPage((p) => Math.min(usuarios.totalPages, p + 1))}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
