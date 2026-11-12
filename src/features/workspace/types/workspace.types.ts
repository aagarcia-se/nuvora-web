export type WorkspaceRole = 'owner' | 'admin' | 'viewer';

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
  role?: WorkspaceRole;
}

export interface WorkspaceDetail {
  workspace: Workspace;
  role: WorkspaceRole;
}

export interface CreateWorkspaceInput {
  name: string;
  slug: string;
}
