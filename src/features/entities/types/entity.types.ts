export interface EntityPermissions {
  canView: boolean;
  canUpload: boolean;
  canReview: boolean;
  canManage: boolean;
}
export interface Entity {
  id: string;
  kind: 'tax_entity' | 'business' | 'personal';
  legal_name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  taxId?: string | null;
  permissions: EntityPermissions;
}
export interface CreateEntityInput {
  legalName: string;
  taxId?: string;
}
export interface PatchEntityInput {
  legalName?: string;
  taxId?: string | null;
}
export interface EntityDraft {
  legalName: string;
  legalNameChanged: boolean;
  taxId?: string | null;
}
