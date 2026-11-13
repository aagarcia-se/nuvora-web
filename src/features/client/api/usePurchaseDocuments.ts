import { useEffect, useRef } from 'react';
import { CanceledError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { profileEntityKeys } from '@/features/access/hooks/useProfileEntities';
import {
  errorStatus,
  isRequestCanceled,
} from '@/shared/api/authenticatedRequest';
import {
  createPurchaseDocument,
  getPurchaseDocument,
  listPurchaseDocuments,
  patchPurchaseDocument,
  submitPurchaseDocument,
} from './purchaseDocumentsApi';
import type {
  PurchaseDocumentInput,
  PurchaseDocumentPatch,
} from '../types/purchaseDocument.types';

export const purchaseDocumentKeys = {
  scope: (userId: string, workspaceId: string, entityId: string) =>
    ['purchase-documents', userId, workspaceId, entityId] as const,
  list: (userId: string, workspaceId: string, entityId: string) =>
    [
      ...purchaseDocumentKeys.scope(userId, workspaceId, entityId),
      'list',
    ] as const,
  detail: (
    userId: string,
    workspaceId: string,
    entityId: string,
    documentId: string,
  ) =>
    [
      ...purchaseDocumentKeys.scope(userId, workspaceId, entityId),
      'detail',
      documentId,
    ] as const,
};
const retry = (count: number, error: unknown) =>
  !isRequestCanceled(error) &&
  count < 1 &&
  [0, 503].includes(errorStatus(error));
export function usePurchaseDocument(
  workspaceId: string,
  entityId: string,
  documentId: string,
) {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: purchaseDocumentKeys.detail(
      userId,
      workspaceId,
      entityId,
      documentId,
    ),
    queryFn: ({ signal }) =>
      getPurchaseDocument(userId, workspaceId, entityId, documentId, signal),
    enabled: status === 'authenticated' && Boolean(userId && documentId),
    gcTime: 0,
    staleTime: 0,
    retry,
  });
}
export function usePurchaseDocuments(
  workspaceId: string,
  entityId: string,
  enabled = true,
) {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  const controller = useRef<AbortController | null>(null);
  const active = useRef(false);
  const busy = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
      busy.current = false;
    };
  }, [userId, workspaceId, entityId]);
  const listKey = purchaseDocumentKeys.list(userId, workspaceId, entityId);
  const list = useQuery({
    queryKey: listKey,
    queryFn: ({ signal }) =>
      listPurchaseDocuments(userId, workspaceId, entityId, signal),
    enabled:
      enabled &&
      status === 'authenticated' &&
      Boolean(userId && workspaceId && entityId),
    gcTime: 0,
    retry,
  });
  const mutate = useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: async (
      operation:
        | { kind: 'create'; input: PurchaseDocumentInput }
        | { kind: 'patch'; id: string; input: PurchaseDocumentPatch }
        | { kind: 'submit'; id: string }
        | { kind: 'check'; id: string },
    ) => {
      const scope = client
        .getQueryCache()
        .find({ queryKey: listKey, exact: true });
      if (!active.current || !userId || busy.current || !scope)
        throw new CanceledError();
      const request = new AbortController();
      controller.current = request;
      busy.current = true;
      const current = () =>
        active.current &&
        !request.signal.aborted &&
        controller.current === request &&
        client.getQueryCache().find({ queryKey: listKey, exact: true }) ===
          scope;
      try {
        const document =
          operation.kind === 'create'
            ? await createPurchaseDocument(
                userId,
                workspaceId,
                entityId,
                operation.input,
                request.signal,
              )
            : operation.kind === 'patch'
              ? await patchPurchaseDocument(
                  userId,
                  workspaceId,
                  entityId,
                  operation.id,
                  operation.input,
                  request.signal,
                )
              : operation.kind === 'check'
                ? await getPurchaseDocument(
                    userId,
                    workspaceId,
                    entityId,
                    operation.id,
                    request.signal,
                  )
                : await submitPurchaseDocument(
                    userId,
                    workspaceId,
                    entityId,
                    operation.id,
                    request.signal,
                  );
        if (!current()) throw new CanceledError();
        return document;
      } finally {
        if (controller.current === request) busy.current = false;
      }
    },
    onSuccess: (document, operation) => {
      if (
        active.current &&
        (operation.kind !== 'check' || document.status === 'pending_review')
      )
        void client.invalidateQueries({ queryKey: listKey });
    },
    onError: (error) => {
      if (active.current && [401, 403, 404].includes(errorStatus(error))) {
        void client.invalidateQueries({ queryKey: listKey });
        void client.invalidateQueries({
          queryKey: profileEntityKeys.root(userId),
        });
      }
    },
  });
  return { list, mutate };
}
