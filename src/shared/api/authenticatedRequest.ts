import axios, { CanceledError } from 'axios';
import { env } from '@/shared/config/env';
import { supabase } from '@/shared/lib/supabase';

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
  ) {
    super(code);
    this.name = 'ApiRequestError';
  }
}
export const isRequestCanceled = (error: unknown) => axios.isCancel(error);
export const errorStatus = (error: unknown) =>
  error instanceof ApiRequestError ? error.status : 0;

export async function authenticatedRequest<T>(
  userId: string,
  signal: AbortSignal,
  request: (token: string) => Promise<T>,
): Promise<T> {
  if (!env.apiBaseUrl || !supabase)
    throw new ApiRequestError(0, 'NOT_CONFIGURED');
  try {
    signal.throwIfAborted();
    const { data, error } = await supabase.auth.getSession();
    if (signal.aborted) throw new CanceledError();
    if (error || !data.session) throw new ApiRequestError(401, 'UNAUTHORIZED');
    if (data.session.user.id !== userId) throw new CanceledError();
    const result = await request(data.session.access_token);
    if (signal.aborted) throw new CanceledError();
    return result;
  } catch (error) {
    if (signal.aborted || axios.isCancel(error)) throw new CanceledError();
    if (error instanceof ApiRequestError) throw error;
    if (axios.isAxiosError(error)) {
      const code =
        typeof error.response?.data?.error === 'string'
          ? error.response.data.error
          : 'REQUEST_FAILED';
      throw new ApiRequestError(error.response?.status ?? 0, code);
    }
    throw new ApiRequestError(0, 'NETWORK_ERROR');
  }
}

// Authorization exists only on these relative requests to the configured API.
export const bearerHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  'Cache-Control': 'no-store',
});
