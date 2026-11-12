import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';

const SESSION_WAIT_MS = 4000;

function callbackErrorMessage(value: string | null) {
  if (value === 'access_denied' || value === 'user_cancelled_login')
    return 'Cancelaste el acceso con Google. Puedes intentarlo de nuevo cuando quieras.';
  return 'No pudimos completar el acceso con Google. Intenta de nuevo.';
}

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef(false);
  const processingRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    activeRef.current = true;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    const queryError = url.searchParams.get('error');
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    const hashError = hashParams.get('error');

    function cleanCallbackUrl() {
      // Do this only after the SDK has adopted the callback (or after an
      // explicit OAuth error has been acknowledged), never before async work.
      window.history.replaceState(null, document.title, url.pathname);
    }

    function waitForPersistedSession() {
      const client = supabase;
      if (!client) return Promise.resolve(null);

      return (async () => {
        const deadline = Date.now() + SESSION_WAIT_MS;
        do {
          const { data } = await client.auth.getSession();
          if (data.session) return data.session;
          if (Date.now() >= deadline) return null;
          await new Promise<void>((resolve) => {
            window.setTimeout(resolve, 50);
          });
        } while (Date.now() < deadline);
        return null;
      })();
    }

    async function navigateIfSession() {
      const session = await waitForPersistedSession();
      if (session) {
        cleanCallbackUrl();
        if (activeRef.current) navigate('/', { replace: true });
        return true;
      }
      return false;
    }

    async function adoptSession() {
      if (!supabase) {
        cleanCallbackUrl();
        if (activeRef.current)
          setError(
            'El acceso aún no está configurado. Contacta al administrador.',
          );
        return;
      }
      if (queryError || hashError) {
        cleanCallbackUrl();
        if (activeRef.current)
          setError(callbackErrorMessage(queryError || hashError));
        return;
      }

      try {
        if (code) {
          const result = await supabase.auth.exchangeCodeForSession(code);
          if (result.error) throw result.error;
        } else if (accessToken && refreshToken) {
          const result = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (result.error) throw result.error;
        } else {
          // Supabase may have consumed the callback before this page mounted,
          // or AuthProvider may still be handling INITIAL_SESSION. A callback
          // without parameters is not an error until this grace period ends.
          if (await navigateIfSession()) return;
          cleanCallbackUrl();
          if (activeRef.current)
            setError(
              'El enlace de Google no es válido o ya venció. Intenta iniciar sesión de nuevo.',
            );
          return;
        }
        // Adoption emits SIGNED_IN asynchronously. Retrying getSession during
        // this short grace period covers a callback opened twice or reloaded.
        if (!(await navigateIfSession()) && activeRef.current)
          setError(
            'El enlace de Google no es válido o ya venció. Intenta iniciar sesión de nuevo.',
          );
      } catch {
        if (!(await navigateIfSession()) && activeRef.current)
          setError(
            'El enlace de Google no es válido o ya venció. Intenta iniciar sesión de nuevo.',
          );
      }
    }

    if (!processingRef.current) processingRef.current = adoptSession();
    void processingRef.current;
    return () => {
      activeRef.current = false;
    };
  }, [navigate]);

  return (
    <div className="space-y-5 text-center" aria-live="polite">
      <h1 className="text-3xl font-semibold tracking-tight">
        {error ? 'No pudimos completar el acceso' : 'Completando tu acceso'}
      </h1>
      {error ? (
        <>
          <InlineAlert>{error}</InlineAlert>
          <Link className="btn-secondary w-full" to="/login">
            Volver a iniciar sesión
          </Link>
        </>
      ) : (
        <>
          <div
            className="mx-auto h-8 w-8 animate-pulse rounded-full bg-brand-600"
            aria-hidden="true"
          />
          <p className="text-sm text-muted">
            Estamos verificando tu sesión de forma segura.
          </p>
        </>
      )}
    </div>
  );
}
