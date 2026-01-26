/**
 * Hooks de React Query para Usuarios
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/api-client';
import type {
  Usuario,
  PaginatedResponse,
  MessageResponse,
  Rol,
  EstadoUsuario,
  TipoVinculoUF,
} from '../../lib/types';

// ============================================================================
// TIPOS ESPECÍFICOS DE USUARIOS
// ============================================================================

export interface UsuarioConsorcioResponse {
  id: string;
  consorcioId: string;
  consorcioNombre: string;
  rol: Rol;
  unidadFuncionalId?: string;
  unidadFuncionalCodigo?: string;
  tipoVinculo?: TipoVinculoUF;
  puedeCargarGastos: boolean;
  puedeVerConciliacion: boolean;
  puedeEnviarComunicados: boolean;
  activo: boolean;
}

export interface UsuarioResponse {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  avatarUrl?: string;
  estado: EstadoUsuario;
  emailVerificado: boolean;
  ultimoAcceso?: string;
  createdAt: string;
  rolesConsorcio: UsuarioConsorcioResponse[];
  // Preferencias de accesibilidad
  preferenciasModo?: string;
  preferenciasTema?: string;
  preferenciasTexto?: number;
}

export interface ListUsuariosParams {
  search?: string;
  consorcioId?: string;
  rol?: Rol;
  estado?: EstadoUsuario;
  page?: number;
  limit?: number;
}

export interface CreateUsuarioDto {
  email: string;
  nombre: string;
  apellido: string;
  dni?: string;
  telefono?: string;
  rolConsorcio: {
    consorcioId: string;
    rol: Rol;
    unidadFuncionalId?: string;
    tipoVinculo?: TipoVinculoUF;
    puedeCargarGastos?: boolean;
    puedeVerConciliacion?: boolean;
    puedeEnviarComunicados?: boolean;
  };
}

export interface UpdateUsuarioDto {
  nombre?: string;
  apellido?: string;
  dni?: string;
  telefono?: string;
  estado?: EstadoUsuario;
}

export interface AsignarRolDto {
  consorcioId: string;
  rol: Rol;
  unidadFuncionalId?: string;
  tipoVinculo?: TipoVinculoUF;
  puedeCargarGastos?: boolean;
  puedeVerConciliacion?: boolean;
  puedeEnviarComunicados?: boolean;
}

export interface UpdateRolDto {
  rol?: Rol;
  unidadFuncionalId?: string;
  tipoVinculo?: TipoVinculoUF;
  puedeCargarGastos?: boolean;
  puedeVerConciliacion?: boolean;
  puedeEnviarComunicados?: boolean;
  activo?: boolean;
}

// ============================================================================
// QUERY KEYS
// ============================================================================

export const usuariosKeys = {
  all: ['usuarios'] as const,
  lists: () => [...usuariosKeys.all, 'list'] as const,
  list: (params: ListUsuariosParams) => [...usuariosKeys.lists(), params] as const,
  byConsorcio: (consorcioId: string) => [...usuariosKeys.all, 'consorcio', consorcioId] as const,
  details: () => [...usuariosKeys.all, 'detail'] as const,
  detail: (id: string) => [...usuariosKeys.details(), id] as const,
};

// ============================================================================
// HOOKS DE CONSULTA
// ============================================================================

/**
 * Lista usuarios con filtros y paginación
 */
export function useUsuarios(params: ListUsuariosParams = {}) {
  return useQuery({
    queryKey: usuariosKeys.list(params),
    queryFn: () =>
      apiClient.get<PaginatedResponse<UsuarioResponse>>('/usuarios', {
        search: params.search,
        consorcioId: params.consorcioId,
        rol: params.rol,
        estado: params.estado,
        page: params.page,
        limit: params.limit,
      }),
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Lista usuarios de un consorcio específico
 */
export function useUsuariosByConsorcio(consorcioId: string) {
  return useQuery({
    queryKey: usuariosKeys.byConsorcio(consorcioId),
    queryFn: () =>
      apiClient.get<UsuarioResponse[]>(`/usuarios/consorcio/${consorcioId}`),
    enabled: !!consorcioId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Obtiene detalle de un usuario
 */
export function useUsuario(id: string) {
  return useQuery({
    queryKey: usuariosKeys.detail(id),
    queryFn: () => apiClient.get<UsuarioResponse>(`/usuarios/${id}`),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

// ============================================================================
// HOOKS DE MUTACIÓN
// ============================================================================

/**
 * Crea un nuevo usuario con rol asignado
 */
export function useCreateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateUsuarioDto) =>
      apiClient.post<UsuarioResponse>('/usuarios', data),
    onSuccess: (_, variables) => {
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() });
      // Invalidar usuarios del consorcio
      if (variables.rolConsorcio.consorcioId) {
        queryClient.invalidateQueries({
          queryKey: usuariosKeys.byConsorcio(variables.rolConsorcio.consorcioId),
        });
      }
    },
  });
}

/**
 * Actualiza datos de un usuario
 */
export function useUpdateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUsuarioDto }) =>
      apiClient.patch<UsuarioResponse>(`/usuarios/${id}`, data),
    onSuccess: (result) => {
      // Actualizar cache del detalle
      queryClient.setQueryData(usuariosKeys.detail(result.id), result);
      // Invalidar listas
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() });
    },
  });
}

/**
 * Asigna un nuevo rol al usuario en un consorcio
 */
export function useAsignarRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ usuarioId, data }: { usuarioId: string; data: AsignarRolDto }) =>
      apiClient.post<UsuarioResponse>(`/usuarios/${usuarioId}/roles`, data),
    onSuccess: (result, variables) => {
      queryClient.setQueryData(usuariosKeys.detail(result.id), result);
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: usuariosKeys.byConsorcio(variables.data.consorcioId),
      });
    },
  });
}

/**
 * Actualiza el rol de un usuario en un consorcio
 */
export function useUpdateRol() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      usuarioConsorcioId,
      data,
    }: {
      usuarioConsorcioId: string;
      data: UpdateRolDto;
    }) =>
      apiClient.patch<UsuarioResponse>(`/usuarios/roles/${usuarioConsorcioId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    },
  });
}

/**
 * Desactiva un usuario (soft delete)
 */
export function useDeactivateUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<MessageResponse>(`/usuarios/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.lists() });
      queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(id) });
    },
  });
}

/**
 * Reenvía invitación a usuario no verificado
 */
export function useReinvitarUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<MessageResponse>(`/usuarios/${id}/reinvitar`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: usuariosKeys.detail(id) });
    },
  });
}
