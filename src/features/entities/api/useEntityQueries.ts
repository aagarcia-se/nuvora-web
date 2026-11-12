import { useEffect, useRef } from 'react';
import { CanceledError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import {
  errorStatus,
  isRequestCanceled,
} from '@/shared/api/authenticatedRequest';
import {
  createEntity,
  getEntity,
  listEntities,
  patchEntity,
} from './entityApi';
import type {
  CreateEntityInput,
  Entity,
  PatchEntityInput,
} from '../types/entity.types';

export const entityKeys = {
  user: (userId: string) => ['entities', userId] as const,
  scope: (userId: string, workspaceId: string) =>
    ['entities', userId, workspaceId] as const,
  list: (userId: string, workspaceId: string) =>
    ['entities', userId, workspaceId, 'list'] as const,
  detail: (userId: string, workspaceId: string, id: string) =>
    ['entities', userId, workspaceId, 'detail', id] as const,
};
const retry = (count: number, error: unknown) =>
  !isRequestCanceled(error) &&
  count < 1 &&
  [0, 503].includes(errorStatus(error));
export function useEntities(workspaceId: string) {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: entityKeys.list(userId, workspaceId),
    queryFn: ({ signal }) => listEntities(userId, workspaceId, signal),
    enabled: status === 'authenticated' && Boolean(userId && workspaceId),
    gcTime: 0,
    retry,
  });
}
export function useEntity(workspaceId: string, entityId: string) {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: entityKeys.detail(userId, workspaceId, entityId),
    queryFn: ({ signal }) => getEntity(userId, workspaceId, entityId, signal),
    enabled:
      status === 'authenticated' && Boolean(userId && workspaceId && entityId),
    gcTime: 0,
    staleTime: 0,
    retry,
  });
}
export function useEntityWrite(workspaceId: string) {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  const active = useRef(false);
  const controller = useRef<AbortController | null>(null);
  const scope = useRef<object | undefined>(undefined);
  const scopeKey = useRef<readonly string[]>([]);
  const current = () =>
    active.current &&
    Boolean(scope.current) &&
    client.getQueryCache().find({ queryKey: scopeKey.current, exact: true }) ===
      scope.current;
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, [userId, workspaceId]);
  return useMutation({
    retry: false,
    mutationFn: async (
      operation:
        | { kind: 'create'; input: CreateEntityInput }
        | { kind: 'patch'; entityId: string; input: PatchEntityInput },
    ) => {
      if (!active.current || !userId) throw new CanceledError();
      scopeKey.current =
        operation.kind === 'create'
          ? entityKeys.list(userId, workspaceId)
          : entityKeys.detail(userId, workspaceId, operation.entityId);
      scope.current = client
        .getQueryCache()
        .find({ queryKey: scopeKey.current, exact: true });
      if (!current()) throw new CanceledError();
      const request = new AbortController();
      controller.current = request;
      const entity =
        operation.kind === 'create'
          ? await createEntity(
              userId,
              workspaceId,
              operation.input,
              request.signal,
            )
          : await patchEntity(
              userId,
              workspaceId,
              operation.entityId,
              operation.input,
              request.signal,
            );
      if (!current() || request.signal.aborted) throw new CanceledError();
      return entity;
    },
    onError: (error) => {
      if (current() && [403, 404].includes(errorStatus(error)))
        void client.invalidateQueries({
          queryKey: entityKeys.scope(userId, workspaceId),
        });
    },
    onSuccess: (entity) => {
      if (!current()) return;
      if (client.getQueryState(entityKeys.list(userId, workspaceId)))
        client.setQueryData<Entity[]>(
          entityKeys.list(userId, workspaceId),
          (previous) => {
            const items = (previous ?? []).filter(
              (item) => item.id !== entity.id,
            );
            return entity.permissions.canView ? [...items, entity] : items;
          },
        );
      if (
        client.getQueryState(entityKeys.detail(userId, workspaceId, entity.id))
      ) {
        client.setQueryData(
          entityKeys.detail(userId, workspaceId, entity.id),
          entity,
        );
      }
      void client.invalidateQueries({
        queryKey: entityKeys.scope(userId, workspaceId),
      });
    },
  });
}
