import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { entityKeys } from '@/features/entities/api/useEntityQueries';
import { invitationKey, membershipKey } from './useAccess';
import type { AccessContext } from '../types/access.types';

export function useRefreshEntityAccess(context: AccessContext) {
  const client = useQueryClient();
  const { user } = useAuth();
  return async (recheckEntity = false) => {
    if (!user) return;
    if (recheckEntity) {
      const detailKey = entityKeys.detail(
        user.id,
        context.workspaceId,
        context.entityId,
      );
      await client.cancelQueries({ queryKey: detailKey });
      client.removeQueries({
        queryKey: entityKeys.list(user.id, context.workspaceId),
      });
      void client.invalidateQueries({ queryKey: detailKey });
    }
    await Promise.all([
      client.invalidateQueries({ queryKey: membershipKey(user.id, context) }),
      client.invalidateQueries({ queryKey: invitationKey(user.id, context) }),
    ]);
  };
}
