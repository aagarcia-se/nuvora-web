import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { getProfileEntities } from '../api/profileAccessApi';
import { errorStatus, isRequestCanceled } from '@/shared/api/authenticatedRequest';

export const profileEntityKeys = {
  root: (userId: string) => ['profile-entities', userId] as const,
};

const retry = (count: number, error: unknown) =>
  !isRequestCanceled(error) && count < 1 && [0, 503].includes(errorStatus(error));

export function useProfileEntities() {
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  return useQuery({
    queryKey: profileEntityKeys.root(userId),
    queryFn: ({ signal }) => getProfileEntities(userId, signal),
    enabled: status === 'authenticated' && Boolean(userId),
    retry,
    gcTime: 0,
  });
}
