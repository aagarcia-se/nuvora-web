import { useCallback, useEffect, useRef, useState } from 'react';
import { CanceledError } from 'axios';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { entityKeys } from '@/features/entities/api/useEntityQueries';
import { listMemberships } from '../api/accessApi';
import type { AccessContext } from '../types/access.types';
export const membershipKey = (userId: string, context: AccessContext) =>
  [
    ...entityKeys.scope(userId, context.workspaceId),
    'access',
    context.entityId,
    'memberships',
  ] as const;
export function useMemberships(context: AccessContext, enabled = true) {
  const { user } = useAuth();
  return useQuery({
    queryKey: membershipKey(user?.id ?? '', context),
    queryFn: ({ signal }) => listMemberships(user!.id, context, signal),
    enabled: Boolean(user) && enabled,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
}
// Secret-bearing operations deliberately use local state, never mutations/Query cache.
export function useAccessAction(context?: AccessContext) {
  const { user } = useAuth();
  const client = useQueryClient();
  const active = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const userId = user?.id ?? '';
  useQuery({
    queryKey: ['access-session', userId],
    queryFn: () => true,
    enabled: Boolean(userId),
    staleTime: Infinity,
    gcTime: 0,
  });
  const workspaceId = context?.workspaceId;
  const entityId = context?.entityId;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
      busy.current = false;
    };
  }, [userId, workspaceId, entityId]);
  const run = useCallback(
    async function run<T>(
      operation: (id: string, signal: AbortSignal) => Promise<T>,
    ): Promise<T | undefined> {
      if (busy.current || !userId || !active.current) return;
      const key =
        entityId && workspaceId
          ? entityKeys.detail(userId, workspaceId, entityId)
          : ['access-session', userId];
      const scope = client.getQueryCache().find({ queryKey: key, exact: true });
      if (!scope) return;
      const isCurrent = () =>
        active.current &&
        controller.current === request &&
        !request.signal.aborted &&
        scope === client.getQueryCache().find({ queryKey: key, exact: true });
      const request = new AbortController();
      controller.current = request;
      busy.current = true;
      setPending(true);
      setError(null);
      try {
        const result = await operation(userId, request.signal);
        if (!isCurrent()) throw new CanceledError();
        return result;
      } catch (cause) {
        if (isCurrent()) setError(cause);
        return undefined;
      } finally {
        if (controller.current === request) {
          busy.current = false;
          if (isCurrent()) setPending(false);
        }
      }
    },
    [client, entityId, userId, workspaceId],
  );
  return { run, pending, error, clearError: () => setError(null) };
}
