import { httpClient } from '@/shared/api/httpClient';
import {
  ApiRequestError,
  authenticatedRequest,
  bearerHeaders,
  errorStatus,
} from '@/shared/api/authenticatedRequest';
import { isUuid } from '@/shared/utils/identifiers';
import {
  clientRoles,
  type AccessContext,
  type AccessProfile,
  type Acceptance,
  type ClientRole,
  type Inspection,
  type Invitation,
  type InvitationRecord,
  type InvitationStatus,
  type Membership,
} from '../types/access.types';

const invalid = () => new ApiRequestError(502, 'INVALID_ACCESS_RESPONSE');
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw invalid();
  return value as Record<string, unknown>;
};
const uuid = (value: unknown): string => {
  if (typeof value !== 'string' || !isUuid(value)) throw invalid();
  return value;
};
const date = (value: unknown): string => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value)))
    throw invalid();
  return value;
};
const nullableDate = (value: unknown): string | null =>
  value === null ? null : date(value);
const nullableUuid = (value: unknown): string | null =>
  value === null ? null : uuid(value);
const nullableText = (value: unknown): string | null =>
  value === null ? null : typeof value === 'string' ? value : (() => { throw invalid(); })();
const profile = (value: unknown): AccessProfile | null => {
  if (value === null) return null;
  const row = object(value);
  const avatar = nullableText(row.avatar_url);
  if (avatar !== null) {
    try {
      const url = new URL(avatar);
      if (!['http:', 'https:'].includes(url.protocol)) throw invalid();
    } catch {
      throw invalid();
    }
  }
  return {
    id: uuid(row.id),
    displayName: nullableText(row.display_name),
    avatarUrl: avatar,
  };
};
const role = (value: unknown): ClientRole => {
  if (typeof value !== 'string' || !Object.hasOwn(clientRoles, value))
    throw invalid();
  return value as ClientRole;
};
const status = (value: unknown): InvitationStatus => {
  if (!['pending', 'accepted', 'revoked', 'expired'].includes(String(value)))
    throw invalid();
  return value as InvitationStatus;
};
function endpoint(context: AccessContext) {
  if (!isUuid(context.workspaceId) || !isUuid(context.entityId))
    throw new ApiRequestError(400, 'INVALID_CONTEXT');
  return `workspaces/${context.workspaceId}/entities/${context.entityId}`;
}
export function validInvitationToken(value: string) {
  return /^[A-Za-z0-9_-]{32,256}$/.test(value);
}
function tokenPath(token: string) {
  if (!validInvitationToken(token))
    throw new ApiRequestError(404, 'INVITATION_NOT_FOUND');
  return `invitations/${encodeURIComponent(token)}`;
}
// Never pass token-bearing request errors/responses into Query, console or UI.
async function request<T>(
  userId: string,
  signal: AbortSignal,
  operation: (headers: ReturnType<typeof bearerHeaders>) => Promise<T>,
) {
  try {
    return await authenticatedRequest(userId, signal, (token) =>
      operation(bearerHeaders(token)),
    );
  } catch (error) {
    if (signal.aborted) throw error;
    const code =
      error instanceof ApiRequestError &&
      ['INVITATION_LINK_NOT_CONFIGURED'].includes(error.code)
        ? error.code
        : 'ACCESS_REQUEST_FAILED';
    throw new ApiRequestError(errorStatus(error), code);
  }
}
export function createInvitation(
  userId: string,
  context: AccessContext,
  selectedRole: ClientRole,
  signal: AbortSignal,
): Promise<Invitation> {
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.post(
      `${endpoint(context)}/invitations`,
      { role: selectedRole },
      { headers, signal },
    );
    const row = object(data?.invitation);
    if (row.status !== 'pending') throw invalid();
    return {
      id: uuid(row.id),
      status: status(row.status),
      expiresAt: date(row.expiresAt),
      acceptUrl: safeAcceptUrl(row.acceptUrl),
    };
  });
}
export function listMemberships(
  userId: string,
  context: AccessContext,
  signal: AbortSignal,
): Promise<Membership[]> {
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.get(`${endpoint(context)}/memberships`, {
      headers,
      signal,
    });
    if (!Array.isArray(data?.memberships)) throw invalid();
    return data.memberships.map((value: unknown) => {
      const row = object(value);
      if (
        row.workspace_id !== context.workspaceId ||
        row.entity_id !== context.entityId ||
        typeof row.status !== 'string'
      )
        throw invalid();
      const user = profile(row.user);
      if (user !== null && user.id !== uuid(row.user_id)) throw invalid();
      return {
        id: uuid(row.id),
        userId: uuid(row.user_id),
        role: role(row.role),
        status: row.status,
        joinedAt: row.joined_at === null ? null : date(row.joined_at),
        revokedAt: row.revoked_at === null ? null : date(row.revoked_at),
        user,
      };
    });
  });
}
export function listInvitations(
  userId: string,
  context: AccessContext,
  signal: AbortSignal,
): Promise<InvitationRecord[]> {
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.get(
      `${endpoint(context)}/invitations?limit=100`,
      { headers, signal },
    );
    if (!Array.isArray(data?.invitations)) throw invalid();
    return data.invitations.map((value: unknown) => {
      const row = object(value);
      if (
        row.workspace_id !== context.workspaceId ||
        row.entity_id !== context.entityId
      )
        throw invalid();
      const acceptedBy = nullableUuid(row.accepted_by);
      const acceptedByProfile = profile(row.accepted_by_profile);
      if (
        (acceptedBy === null && acceptedByProfile !== null) ||
        (row.status !== 'accepted' && acceptedByProfile !== null) ||
        (acceptedByProfile !== null && acceptedByProfile.id !== acceptedBy)
      )
        throw invalid();
      return {
        id: uuid(row.id),
        workspaceId: uuid(row.workspace_id),
        entityId: uuid(row.entity_id),
        role: role(row.role),
        status: status(row.status),
        expiresAt: date(row.expires_at),
        createdAt: date(row.created_at),
        acceptedAt: nullableDate(row.accepted_at),
        acceptedBy,
        acceptedByProfile,
        revokedAt: nullableDate(row.revoked_at),
        revocationReason:
          row.revocation_reason === null
            ? null
            : typeof row.revocation_reason === 'string'
              ? row.revocation_reason
              : (() => {
                  throw invalid();
                })(),
      };
    });
  });
}
export function revokeMembership(
  userId: string,
  context: AccessContext,
  membershipId: string,
  signal: AbortSignal,
) {
  if (!isUuid(membershipId)) throw invalid();
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.patch(
      `${endpoint(context)}/memberships/${membershipId}/revoke`,
      {},
      { headers, signal },
    );
    if (data?.revoked !== true) throw invalid();
    return true;
  });
}
export function revokeInvitation(
  userId: string,
  context: AccessContext,
  invitationId: string,
  signal: AbortSignal,
) {
  if (!isUuid(invitationId)) throw invalid();
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.patch(
      `${endpoint(context)}/invitations/${invitationId}/revoke`,
      {},
      { headers, signal },
    );
    if (data?.revoked !== true) throw invalid();
    return true;
  });
}
export function generateShareLink(
  userId: string,
  context: AccessContext,
  invitationId: string,
  signal: AbortSignal,
): Promise<string> {
  if (!isUuid(invitationId)) throw invalid();
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.post(
      `${endpoint(context)}/invitations/${invitationId}/share-link`,
      {},
      { headers, signal },
    );
    const row = object(data?.invitation);
    if (uuid(row.id) !== invitationId || status(row.status) !== 'pending')
      throw invalid();
    date(row.expiresAt);
    return safeAcceptUrl(row.acceptUrl);
  });
}
export function safeAcceptUrl(value: unknown): string {
  if (typeof value !== 'string') throw invalid();
  try {
    const url = new URL(value);
    const local = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (
      (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
      url.username ||
      url.password ||
      url.pathname !== '/invitations/accept' ||
      url.hash ||
      !validInvitationToken(url.searchParams.get('token') ?? '') ||
      url.searchParams.getAll('token').length !== 1 ||
      [...url.searchParams.keys()].some((key) => key !== 'token')
    )
      throw invalid();
    // Only same-origin callback URLs may be shared by this frontend.
    if (url.origin !== window.location.origin) throw invalid();
    return url.toString();
  } catch {
    throw invalid();
  }
}
export function inspectInvitation(
  userId: string,
  token: string,
  signal: AbortSignal,
): Promise<Inspection> {
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.get(tokenPath(token), {
      headers,
      signal,
    });
    const row = object(data?.invitation);
    return {
      status: status(row.status),
      expiresAt: date(row.expiresAt),
      workspaceId: uuid(row.workspaceId),
      entityId: uuid(row.entityId),
      role: role(row.role),
    };
  });
}
export function acceptInvitation(
  userId: string,
  token: string,
  signal: AbortSignal,
): Promise<Acceptance> {
  return request(userId, signal, async (headers) => {
    const { data } = await httpClient.post(
      `${tokenPath(token)}/accept`,
      {},
      { headers, signal },
    );
    const row = object(data?.membership);
    return {
      membershipId: uuid(row.membershipId),
      workspaceId: uuid(row.workspaceId),
      entityId: uuid(row.entityId),
      role: role(row.role),
    };
  });
}
export function accessMessage(error: unknown) {
  if (error instanceof ApiRequestError) {
    if (error.code === 'INVITATION_LINK_NOT_CONFIGURED')
      return 'El servidor todavía no tiene configurado el enlace de invitación.';
  }
  switch (errorStatus(error)) {
    case 400:
      return 'Revisa los datos antes de continuar.';
    case 401:
      return 'Tu sesión ya no es válida. Vuelve a iniciar sesión.';
    case 403:
      return 'No tienes permiso para esta acción.';
    case 404:
      return 'El recurso no está disponible para tu cuenta.';
    case 409:
      return 'Ya existe una invitación o un acceso en conflicto. No se creó otra invitación.';
    case 410:
      return 'La invitación está expirada, revocada o ya utilizada. Solicita una nueva al contador.';
    case 429:
      return 'Demasiadas solicitudes. Espera antes de volver a intentarlo.';
    case 503:
      return 'El servicio de accesos no está disponible. Inténtalo más tarde.';
    case 0:
      return 'No pudimos confirmar el resultado. Comprueba tu conexión antes de repetir la operación.';
    default:
      return 'No pudimos completar la solicitud.';
  }
}
