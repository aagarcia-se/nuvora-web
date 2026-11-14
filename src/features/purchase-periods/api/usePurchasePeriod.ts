import { useEffect, useRef } from 'react';
import { CanceledError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { entityKeys } from '@/features/entities/api/useEntityQueries';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import {
  getPurchasePeriod,
  putPurchasePeriod,
  validPeriod,
} from './purchasePeriodsApi';

export const purchasePeriodKeys = {
  scope: (userId: string, workspaceId: string, entityId: string) =>
    ['purchase-periods', userId, workspaceId, entityId] as const,
  summary: (
    userId: string,
    workspaceId: string,
    entityId: string,
    period: string,
  ) =>
    [
      ...purchasePeriodKeys.scope(userId, workspaceId, entityId),
      period,
    ] as const,
};
export function usePurchasePeriod(
  workspaceId: string,
  entityId: string,
  period: string,
) {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  const client = useQueryClient();
  const active = useRef(false);
  const busy = useRef(false);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      controller.current?.abort();
    };
  }, [userId, workspaceId, entityId, period]);
  const key = purchasePeriodKeys.summary(userId, workspaceId, entityId, period);
  const summary = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      getPurchasePeriod(userId, workspaceId, entityId, period, signal),
    enabled: status === 'authenticated' && !!userId && validPeriod(period),
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });
  const write = useMutation({
    retry: false,
    gcTime: 0,
    mutationFn: async (amount: string) => {
      const scope = client.getQueryCache().find({ queryKey: key, exact: true });
      if (!active.current || busy.current || !scope || !userId)
        throw new CanceledError();
      const request = new AbortController();
      controller.current = request;
      busy.current = true;
      try {
        const result = await putPurchasePeriod(
          userId,
          workspaceId,
          entityId,
          period,
          amount,
          request.signal,
        );
        if (
          !active.current ||
          request.signal.aborted ||
          controller.current !== request ||
          client.getQueryCache().find({ queryKey: key, exact: true }) !== scope
        )
          throw new CanceledError();
        client.setQueryData(key, result);
        void client.invalidateQueries({ queryKey: key });
        return result;
      } finally {
        if (controller.current === request) busy.current = false;
      }
    },
    onError: (error) => {
      if (active.current && [401, 403, 404].includes(errorStatus(error))) {
        void client.invalidateQueries({ queryKey: key });
        void client.invalidateQueries({
          queryKey: entityKeys.detail(userId, workspaceId, entityId),
        });
      }
    },
  });
  return { summary, write };
}
