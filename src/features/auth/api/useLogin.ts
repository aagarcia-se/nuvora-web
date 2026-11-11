import { useRef, useState } from 'react';
import { useAuth } from '../store/authStore';
import type { LoginRequest } from '../types/auth.types';

// Unlike the reference's JWT mutation, credentials/tokens never enter Query cache.
export function useLogin() {
  const { login } = useAuth();
  const [isPending, setPending] = useState(false);
  const busy = useRef(false);
  async function mutateAsync({ email, password }: LoginRequest) {
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      await login(email, password);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }
  return { mutateAsync, isPending };
}
