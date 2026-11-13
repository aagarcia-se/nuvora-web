export const clientRoles = {
  client_owner: 'Titular del cliente',
  client_contributor: 'Colaborador',
  client_viewer: 'Solo lectura',
} as const;
export type ClientRole = keyof typeof clientRoles;
export type InvitationStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export type Invitation = {
  id: string;
  status: InvitationStatus;
  expiresAt: string;
  acceptUrl: string;
};
export type Inspection = {
  workspaceId: string;
  entityId: string;
  status: InvitationStatus;
  expiresAt: string;
  role: ClientRole;
};
export type Acceptance = {
  membershipId: string;
  workspaceId: string;
  entityId: string;
  role: ClientRole;
};
export type Membership = {
  id: string;
  userId: string;
  role: ClientRole;
  status: string;
  joinedAt: string | null;
  revokedAt: string | null;
};
export type AccessContext = { workspaceId: string; entityId: string };
