import { Button } from '@/shared/ui/components/Button';
import { useAuth } from '@/features/auth/store/authStore';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import styles from '../client.module.css';

export function ClientAccessState({
  loading,
  error,
  onRetry,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const { logout } = useAuth();
  const status = errorStatus(error);
  if (loading)
    return (
      <div role="status" className={styles.state}>
        <h1>Preparando tu espacio</h1>
        <p>Comprobando el acceso a la empresa…</p>
      </div>
    );
  return (
    <section className={styles.state}>
      <h1>
        {status === 401
          ? 'Inicia sesión de nuevo'
          : status === 403 || status === 404
            ? 'La empresa no está disponible para esta cuenta'
            : 'No pudimos abrir tu empresa'}
      </h1>
      <p role="alert">
        {status === 401
          ? 'Tu sesión ya no es válida.'
          : 'No podemos confirmar el acceso actual. Vuelve a intentarlo o contacta a tu contador.'}
      </p>
      <Button
        type="button"
        variant="secondary"
        onClick={status === 401 ? () => void logout() : onRetry}
      >
        {status === 401 ? 'Volver a iniciar sesión' : 'Reintentar acceso'}
      </Button>
    </section>
  );
}
