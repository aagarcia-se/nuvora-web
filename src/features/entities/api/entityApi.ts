import { httpClient } from '@/shared/api/httpClient';
import {
  ApiRequestError,
  authenticatedRequest,
  bearerHeaders,
  errorStatus,
} from '@/shared/api/authenticatedRequest';
import { isUuid } from '@/shared/utils/identifiers';
import type {
  CreateEntityInput,
  Entity,
  PatchEntityInput,
} from '../types/entity.types';

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const invalid = () => new ApiRequestError(502, 'INVALID_ENTITY_RESPONSE');
function parseEntity(value: unknown): Entity {
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    !isUuid(value.id) ||
    !['legal_name', 'created_by', 'created_at', 'updated_at'].every(
      (key) => typeof value[key] === 'string',
    ) ||
    !['tax_entity', 'business', 'personal'].includes(String(value.kind)) ||
    !record(value.permissions)
  )
    throw invalid();
  const permissions = value.permissions;
  if (
    !['canView', 'canUpload', 'canReview', 'canManage'].every(
      (key) => typeof permissions[key] === 'boolean',
    ) ||
    (permissions.canManage && !permissions.canView) ||
    !(
      value.taxId === undefined ||
      value.taxId === null ||
      typeof value.taxId === 'string'
    )
  )
    throw invalid();
  // Do not place an unexpectedly unmasked NIT in a read-only UI/cache.
  const taxId =
    permissions.canManage ||
    value.taxId === null ||
    (typeof value.taxId === 'string' && value.taxId.includes('*'))
      ? (value.taxId as string | null | undefined)
      : undefined;
  return {
    id: value.id,
    legal_name: value.legal_name as string,
    kind: value.kind as Entity['kind'],
    created_by: value.created_by as string,
    created_at: value.created_at as string,
    updated_at: value.updated_at as string,
    taxId,
    permissions: {
      canView: permissions.canView as boolean,
      canUpload: permissions.canUpload as boolean,
      canReview: permissions.canReview as boolean,
      canManage: permissions.canManage as boolean,
    },
  };
}
function endpoint(workspaceId: string, entityId?: string) {
  if (!isUuid(workspaceId) || (entityId !== undefined && !isUuid(entityId)))
    throw new ApiRequestError(400, 'INVALID_ENTITY_CONTEXT');
  return `workspaces/${encodeURIComponent(workspaceId)}/entities${entityId ? `/${encodeURIComponent(entityId)}` : ''}`;
}
export function listEntities(
  userId: string,
  workspaceId: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ entities: unknown }>(
      endpoint(workspaceId),
      { signal, headers: bearerHeaders(token) },
    );
    if (!Array.isArray(data?.entities)) throw invalid();
    return data.entities
      .map(parseEntity)
      .filter((entity) => entity.permissions.canView);
  });
}
export function getEntity(
  userId: string,
  workspaceId: string,
  entityId: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ entity: unknown }>(
      endpoint(workspaceId, entityId),
      { signal, headers: bearerHeaders(token) },
    );
    const entity = parseEntity(data?.entity);
    if (entity.id !== entityId) throw invalid();
    if (!entity.permissions.canView)
      throw new ApiRequestError(403, 'ENTITY_VIEW_FORBIDDEN');
    return entity;
  });
}
export function createEntity(
  userId: string,
  workspaceId: string,
  input: CreateEntityInput,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const body: CreateEntityInput = { legalName: input.legalName };
    if (input.taxId !== undefined) body.taxId = input.taxId;
    const { data } = await httpClient.post<{ entity: unknown }>(
      endpoint(workspaceId),
      body,
      { signal, headers: bearerHeaders(token) },
    );
    return parseEntity(data?.entity);
  });
}
export function patchEntity(
  userId: string,
  workspaceId: string,
  entityId: string,
  input: PatchEntityInput,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const body: PatchEntityInput = {};
    if (input.legalName !== undefined) body.legalName = input.legalName;
    if (input.taxId !== undefined) body.taxId = input.taxId;
    const { data } = await httpClient.patch<{ entity: unknown }>(
      endpoint(workspaceId, entityId),
      body,
      { signal, headers: bearerHeaders(token) },
    );
    const entity = parseEntity(data?.entity);
    if (entity.id !== entityId) throw invalid();
    return entity;
  });
}
export function entityMessage(
  error: unknown,
  operation: 'read' | 'write' = 'read',
) {
  switch (errorStatus(error)) {
    case 400:
      return 'Revisa el nombre y el formato del NIT antes de continuar.';
    case 401:
      return 'Tu sesión ya no es válida. Vuelve a iniciar sesión para continuar.';
    case 403:
      return 'No tienes permiso para realizar esta acción en este espacio.';
    case 404:
      return 'El cliente o el espacio ya no está disponible para tu cuenta.';
    case 409:
      return 'No se pudo guardar por un conflicto. Actualiza los clientes antes de volver a intentarlo.';
    case 429:
      return 'Espera un momento antes de volver a intentarlo.';
    case 503:
      return 'El servicio de clientes no está disponible por el momento. Inténtalo más tarde.';
    case 0:
      return operation === 'write'
        ? 'No pudimos confirmar el guardado. Actualiza los clientes antes de repetir la operación.'
        : 'No pudimos conectar. Revisa tu conexión y vuelve a intentarlo.';
    default:
      return 'No pudimos completar la solicitud. Inténtalo de nuevo.';
  }
}
