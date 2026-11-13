import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import type { Acceptance } from '@/features/access/types/access.types';
import { useProfileEntities } from '@/features/access/hooks/useProfileEntities';

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
  const discovery = useProfileEntities();
  const membership = discovery.data?.find(
    (item) => item.workspaceId === workspaceId && item.entityId === entityId,
  );
  const detail = {
    ...discovery,
    data: membership
      ? { id: membership.entity.id, legalName: membership.entity.legalName, role: membership.role }
      : undefined,
    isPending: discovery.isPending,
    isError: discovery.isError || (discovery.isSuccess && !membership),
    error: discovery.error,
    isSuccess: discovery.isSuccess && Boolean(membership),
    refetch: discovery.refetch,
  };
  return { detail, entry: entry.data };
}
