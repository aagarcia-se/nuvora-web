import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import axios from 'axios';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';
import { queryClient } from '@/shared/api/queryClient';
import { authMessage, currentUser, signIn, signUp } from '../api/authApi';
import { AuthContext } from './authStore';
import type { AuthState } from '../types/auth.types';
import { clearInvitationContinuation } from '@/features/access/invitationToken';
const anonymous: AuthState = { status: 'anonymous', user: null, error: null };
export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    ...anonymous,
    status: supabase ? 'loading' : 'anonymous',
  });
  const [initializing, setInitializing] = useState(Boolean(supabase));
  const request = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const sessionRef = useRef<Session | null>(null);
  const verifiedUserId = useRef<string | null>(null);
  const busy = useRef(false);
  const signingOut = useRef(false);
  const clear = useCallback(() => {
    verifiedUserId.current = null;
    generation.current++;
    request.current?.abort();
    void queryClient.cancelQueries();
    queryClient.clear();
  }, []);
  const resolve = useCallback(
    async (session: Session | null) => {
      if (
        session &&
        verifiedUserId.current &&
        verifiedUserId.current !== session.user.id
      )
        clearInvitationContinuation();
      clear();
      const version = generation.current;
      if (!session) {
        sessionRef.current = null;
        setInitializing(false);
        setState(anonymous);
        return;
      }
      sessionRef.current = session;
      const controller = new AbortController();
      request.current = controller;
      setState({ ...anonymous, status: 'loading' });
      try {
        const user = await currentUser(session.access_token, controller.signal);
        if (version !== generation.current || controller.signal.aborted) return;
        verifiedUserId.current = user.id;
        setState({ status: 'authenticated', user, error: null });
        setInitializing(false);
      } catch (error) {
        if (version !== generation.current || controller.signal.aborted) return;
        // A stale /me (or provider) failure must not replace a newer, valid
        // session delivered by the SDK.
        if (sessionRef.current?.access_token !== session.access_token) return;
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          const result = await supabase!.auth.signOut({ scope: 'local' });
          if (result.error)
            setState({
              ...anonymous,
              status: 'error',
              error:
                'Tu sesión fue rechazada. Intenta cerrar sesión para continuar.',
            });
          else
            setState({
              ...anonymous,
              error: 'El servidor rechazó la sesión. Inicia sesión de nuevo.',
            });
          setInitializing(false);
        } else
          setState({
            ...anonymous,
            status: 'error',
            error: authMessage(error),
          });
        setInitializing(false);
      }
    },
    [clear],
  );
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    // Synchronous callback; SDK methods run outside its auth lock.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active || signingOut.current) return;
      // The SDK re-emits SIGNED_IN on focus and refreshes tokens itself.
      // Keep the mounted UI/cache for an already verified identity. Initial
      // sessions, identity changes, recovery and sign-out still resolve fully.
      if (
        session &&
        (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
        verifiedUserId.current === session.user.id &&
        sessionRef.current?.user.id === session.user.id
      ) {
        sessionRef.current = session;
        return;
      }
      void resolve(session);
    });
    void supabase.auth.getSession().then(({ error }) => {
      // getSession can finish after SIGNED_IN. In that case its error is no
      // longer authoritative and must not paint an error over a valid session.
      if (active && error && !sessionRef.current)
        setState({ ...anonymous, status: 'error', error: authMessage(error) });
    });
    return () => {
      active = false;
      subscription.unsubscribe();
      clear();
    };
  }, [resolve, clear]);
  async function login(email: string, password: string) {
    if (!supabase || busy.current) return;
    busy.current = true;
    clear();
    const version = generation.current;
    const controller = new AbortController();
    request.current = controller;
    try {
      const tokens = await signIn(email, password, controller.signal);
      if (version !== generation.current) return;
      const { error } = await supabase.auth.setSession(tokens);
      if (error) throw error;
    } finally {
      busy.current = false;
    }
  }
  async function register(email: string, password: string) {
    if (!supabase || busy.current) return false;
    busy.current = true;
    clear();
    const version = generation.current;
    const controller = new AbortController();
    request.current = controller;
    try {
      const tokens = await signUp(email, password, controller.signal);
      if (version !== generation.current) return false;
      if (!tokens) return false;
      const { error } = await supabase.auth.setSession(tokens);
      if (error) throw error;
      return true;
    } finally {
      busy.current = false;
    }
  }
  async function logout() {
    if (!supabase || signingOut.current) return;
    signingOut.current = true;
    clearInvitationContinuation();
    clear();
    setState({ ...anonymous, status: 'loading' });
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setState(anonymous);
    } catch {
      setState({
        ...anonymous,
        status: 'error',
        error:
          'No se pudo cerrar la sesión. Comprueba tu conexión y vuelve a intentarlo.',
      });
    } finally {
      signingOut.current = false;
    }
  }
  function retry() {
    if (!supabase) return;
    clear();
    const version = generation.current;
    setState({ ...anonymous, status: 'loading' });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (version !== generation.current) return;
      if (error)
        setState({ ...anonymous, status: 'error', error: authMessage(error) });
      else void resolve(data.session);
    });
  }
  return (
    <AuthContext.Provider
      value={{ ...state, initializing, login, register, logout, retry }}
    >
      {children}
    </AuthContext.Provider>
  );
}
