import { useEffect, useRef } from 'react';
import { CanceledError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import {
  createWorkspace,
  getProfile,
  getWorkspace,
  getWorkspaces,
  workspaceStatus,
  isWorkspaceCanceled,
} from './workspaceApi';
import type { CreateWorkspaceInput, Workspace } from '../types/workspace.types';

export const workspaceKeys = {
  root: (userId: string) => ['workspace', userId] as const,
  profile: (userId: string) =>
    [...workspaceKeys.root(userId), 'profile'] as const,
  list: (userId: string) => [...workspaceKeys.root(userId), 'list'] as const,
  detail: (userId: string, id: string) =>
    [...workspaceKeys.root(userId), 'detail', id] as const,
};
const retry = (count: number, error: unknown) =>
  !isWorkspaceCanceled(error) &&
  count < 1 &&
  [0, 503].includes(workspaceStatus(error));

export function useWorkspaceQueries() {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  const enabled = status === 'authenticated' && Boolean(userId);
  const profile = useProfileQuery();
  const list = useQuery({
    queryKey: workspaceKeys.list(userId),
    queryFn: ({ signal }) => getWorkspaces(userId, signal),
    enabled,
    retry,
  });
  return { profile, list };
}

export function useCreateWorkspace() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  const active = useRef(false);
  const controller = useRef<AbortController | null>(null);
  // Query identity changes immediately when Auth clears the cache, before React unmounts.
  const scope = useRef<object | undefined>(undefined);
  const currentScope = () =>
    active.current &&
    Boolean(scope.current) &&
    client
      .getQueryCache()
      .find({ queryKey: workspaceKeys.list(userId), exact: true }) ===
      scope.current;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, [userId]);
  return useMutation({
    retry: false,
    mutationFn: async (input: CreateWorkspaceInput) => {
      if (!active.current || !userId) throw new CanceledError();
      scope.current = client
        .getQueryCache()
        .find({ queryKey: workspaceKeys.list(userId), exact: true });
      if (!currentScope()) throw new CanceledError();
      const request = new AbortController();
      controller.current = request;
      const workspace = await createWorkspace(userId, input, request.signal);
      if (!currentScope() || request.signal.aborted) throw new CanceledError();
      return workspace;
    },
    onSuccess: (workspace) => {
      if (!currentScope()) return;
      client.setQueryData<Workspace[]>(
        workspaceKeys.list(userId),
        (previous) => [
          ...(previous ?? []).filter((item) => item.id !== workspace.id),
          workspace,
        ],
      );
      void client.invalidateQueries({ queryKey: workspaceKeys.list(userId) });
    },
  });
}

// Direct links revalidate access with the API, independently of the portfolio list.
export function useWorkspaceDetail(id: string) {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: workspaceKeys.detail(userId, id),
    queryFn: ({ signal }) => getWorkspace(userId, id, signal),
    enabled: status === 'authenticated' && Boolean(userId && id),
    gcTime: 0,
    staleTime: 0,
    retry,
  });
}

export function useProfileQuery() {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: workspaceKeys.profile(userId),
    queryFn: ({ signal }) => getProfile(userId, signal),
    enabled: status === 'authenticated' && Boolean(userId),
    retry,
  });
}
