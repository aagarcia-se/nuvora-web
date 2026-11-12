import {
  ApiRequestError as WorkspaceApiError,
  authenticatedRequest as authenticated,
  bearerHeaders as headers,
  errorStatus as workspaceStatus,
} from '@/shared/api/authenticatedRequest';
import { isUuid } from '@/shared/utils/identifiers';
import { httpClient } from '@/shared/api/httpClient';
import type {
  CreateWorkspaceInput,
  Profile,
  Workspace,
  WorkspaceDetail,
  WorkspaceRole,
} from '../types/workspace.types';

export {
  ApiRequestError as WorkspaceApiError,
  isRequestCanceled as isWorkspaceCanceled,
  errorStatus as workspaceStatus,
} from '@/shared/api/authenticatedRequest';
const invalidResponse = () => new WorkspaceApiError(502, 'INVALID_RESPONSE');
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const isRole = (value: unknown): value is WorkspaceRole =>
  value === 'owner' || value === 'admin' || value === 'viewer';
export const isWorkspaceId = isUuid;

function parseWorkspace(value: unknown): Workspace {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isWorkspaceId(value.id) ||
    typeof value.owner_id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.slug !== 'string' ||
    typeof value.created_at !== 'string' ||
    typeof value.updated_at !== 'string' ||
    (value.role !== undefined && !isRole(value.role))
  )
    throw invalidResponse();
  return value as unknown as Workspace;
}

export function getProfile(userId: string, signal: AbortSignal) {
  return authenticated(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ profile: unknown }>('profile', {
      signal,
      headers: headers(token),
    });
    const value = data?.profile;
    if (
      !isRecord(value) ||
      value.id !== userId ||
      !(
        value.display_name === null || typeof value.display_name === 'string'
      ) ||
      !(value.avatar_url === null || typeof value.avatar_url === 'string') ||
      !['locale', 'timezone', 'created_at', 'updated_at'].every(
        (key) => typeof value[key] === 'string',
      )
    )
      throw invalidResponse();
    return value as unknown as Profile;
  });
}

export function getWorkspaces(userId: string, signal: AbortSignal) {
  return authenticated(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ workspaces: unknown }>(
      'workspaces',
      { signal, headers: headers(token) },
    );
    if (!Array.isArray(data?.workspaces)) throw invalidResponse();
    return data.workspaces.map(parseWorkspace);
  });
}

export function getWorkspace(userId: string, id: string, signal: AbortSignal) {
  if (!isWorkspaceId(id))
    return Promise.reject(new WorkspaceApiError(400, 'INVALID_WORKSPACE_ID'));
  return authenticated(userId, signal, async (token) => {
    const { data } = await httpClient.get<{
      workspace: unknown;
      role: unknown;
    }>(`workspaces/${encodeURIComponent(id)}`, {
      signal,
      headers: headers(token),
    });
    const workspace = parseWorkspace(data?.workspace);
    if (workspace.id !== id || !isRole(data?.role)) throw invalidResponse();
    return { workspace, role: data.role } satisfies WorkspaceDetail;
  });
}

export function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput,
  signal: AbortSignal,
) {
  return authenticated(userId, signal, async (token) => {
    // Never forward ownership/identity fields from a form.
    const { data } = await httpClient.post<{ workspace: unknown }>(
      'workspaces',
      { name: input.name, slug: input.slug },
      { signal, headers: headers(token) },
    );
    return parseWorkspace(data?.workspace);
  });
}

export function workspaceMessage(
  error: unknown,
  context: 'profile' | 'workspace' | 'create' = 'workspace',
): string {
  const status = workspaceStatus(error);
  if (status === 401)
    return 'Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.';
  if (status === 403) return 'No tienes permiso para realizar esta acción.';
  if (status === 404)
    return context === 'profile'
      ? 'Tu perfil todavía no está disponible. Puedes continuar con tu cuenta.'
      : 'Este espacio ya no está disponible para tu cuenta.';
  if (status === 409)
    return 'Este identificador ya está en uso. Prueba con otro.';
  if (status === 400)
    return 'Revisa el nombre y el identificador antes de continuar.';
  if (status === 429)
    return 'Has realizado varias solicitudes. Espera un momento y vuelve a intentar.';
  if (status === 503)
    return 'El servicio no está disponible por el momento. Inténtalo de nuevo más tarde.';
  if (status === 0 && context === 'create')
    return 'No pudimos confirmar la creación. Actualiza tus espacios antes de volver a intentarlo.';
  if (status === 0)
    return 'No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.';
  return 'No pudimos completar la solicitud. Inténtalo de nuevo.';
}
