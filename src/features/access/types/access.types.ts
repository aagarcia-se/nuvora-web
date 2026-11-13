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
export type InvitationRecord = {
  id: string;
  workspaceId: string;
  entityId: string;
  role: ClientRole;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
  acceptedAt: string | null;
  acceptedBy: string | null;
  acceptedByProfile: AccessProfile | null;
  revokedAt: string | null;
  revocationReason: string | null;
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
  user: AccessProfile | null;
};
export type AccessProfile = {
  id: string;
  displayName: string | null;
  avatarUrl: string | null;
};
export type AccessContext = { workspaceId: string; entityId: string };

export type EntityPermissions = {
  canView: boolean;
  canUpload: boolean;
  canReview: boolean;
  canManage: boolean;
};

export type ProfileEntity = {
  id: string;
  kind: string;
  legalName: string;
  taxId?: string;
  permissions: EntityPermissions;
};

export type ProfileEntityMembership = {
  workspaceId: string;
  entityId: string;
  role: ClientRole;
  entity: ProfileEntity;
};
