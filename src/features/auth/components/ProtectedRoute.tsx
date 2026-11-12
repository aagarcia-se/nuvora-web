import type { PropsWithChildren } from 'react';
import { safeReturnPath } from '@/shared/utils/returnPath';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';
export function ProtectedRoute({
  children,
  publicOnly = false,
}: PropsWithChildren<{ publicOnly?: boolean }>) {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'loading')
    return (
      <>
        <h1 className="text-2xl font-semibold">Preparando sesión</h1>
        <p role="status" className="mt-4 text-muted">
          Comprobando tu sesión…
        </p>
      </>
    );
  if (auth.status === 'error')
    return (
      <>
        <h1 className="mb-6 text-2xl font-semibold">
          No pudimos verificar tu sesión
        </h1>
        <InlineAlert>{auth.error}</InlineAlert>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={auth.retry}>Reintentar</Button>
          <Button variant="secondary" onClick={() => void auth.logout()}>
            Cerrar sesión
          </Button>
        </div>
      </>
    );
  if (publicOnly && auth.status === 'authenticated')
    return (
      <Navigate
        to={safeReturnPath((location.state as { from?: unknown } | null)?.from)}
        replace
      />
    );
  if (!publicOnly && auth.status === 'anonymous')
    return (
      <Navigate
        to="/login"
        state={{ from: safeReturnPath(location.pathname) }}
        replace
      />
    );
  return children;
}
