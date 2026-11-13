import {
  ApiRequestError,
  authenticatedRequest,
  bearerHeaders,
} from '@/shared/api/authenticatedRequest';
import { httpClient } from '@/shared/api/httpClient';
import { isUuid } from '@/shared/utils/identifiers';
import { clientRoles, type ProfileEntityMembership } from '../types/access.types';

const invalid = () => new ApiRequestError(502, 'INVALID_PROFILE_ENTITIES_RESPONSE');
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  return value as Record<string, unknown>;
};
const uuid = (value: unknown) => {
  if (typeof value !== 'string' || !isUuid(value)) throw invalid();
  return value;
};
const boolean = (value: unknown) => {
  if (typeof value !== 'boolean') throw invalid();
  return value;
};

function parseMembership(value: unknown): ProfileEntityMembership {
  const row = record(value);
  const entity = record(row.entity);
  const permissions = record(entity.permissions);
  if (typeof entity.kind !== 'string' || typeof entity.legal_name !== 'string')
    throw invalid();
  if (typeof row.role !== 'string' || !Object.hasOwn(clientRoles, row.role))
    throw invalid();
  return {
    workspaceId: uuid(row.workspace_id),
    entityId: uuid(row.entity_id),
    role: row.role as ProfileEntityMembership['role'],
    entity: {
      id: uuid(entity.id),
      kind: entity.kind,
      legalName: entity.legal_name,
      ...(entity.taxId === undefined || typeof entity.taxId === 'string'
        ? { taxId: entity.taxId }
        : {}),
      permissions: {
        canView: boolean(permissions.can_view),
        canUpload: boolean(permissions.can_upload),
        canReview: boolean(permissions.can_review),
        canManage: boolean(permissions.can_manage),
      },
    },
  };
}

export function getProfileEntities(userId: string, signal: AbortSignal) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ entity_memberships: unknown }>(
      'profile/entities',
      { signal, headers: bearerHeaders(token) },
    );
    if (!Array.isArray(data?.entity_memberships)) throw invalid();
    return data.entity_memberships.map(parseMembership);
  });
}
