import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { getEntity } from '@/features/entities/api/entityApi';
import type { Acceptance } from '@/features/access/types/access.types';

export const clientEntityKeys = {
  scope: (userId: string, workspaceId: string, entityId: string) =>
    ['client-entity', userId, workspaceId, entityId] as const,
  detail: (userId: string, workspaceId: string, entityId: string) =>
    [
      ...clientEntityKeys.scope(userId, workspaceId, entityId),
      'detail',
    ] as const,
  entry: (userId: string, workspaceId: string, entityId: string) =>
    [
      ...clientEntityKeys.scope(userId, workspaceId, entityId),
      'accepted-invitation',
    ] as const,
};
export function clientEntityPath(entityId: string, workspaceId: string) {
  return `/client/entities/${encodeURIComponent(entityId)}?workspaceId=${encodeURIComponent(workspaceId)}`;
}
export function useClientEntity(workspaceId: string, entityId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  // Only successful POST acceptance metadata; not a session or authorization flag.
  const entry = useQuery<Acceptance | null>({
    queryKey: clientEntityKeys.entry(userId, workspaceId, entityId),
    queryFn: () => null,
    enabled: false,
    gcTime: 0,
  });
  const detail = useQuery({
    queryKey: clientEntityKeys.detail(userId, workspaceId, entityId),
    queryFn: async ({ signal }) => {
      const entity = await getEntity(userId, workspaceId, entityId, signal);
      return { id: entity.id, legalName: entity.legal_name };
    },
    enabled: Boolean(userId),
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
  return { detail, entry: entry.data };
}
