import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { useAuth } from '@/features/auth/store/authStore';
import { workspaceMessage, workspaceStatus } from '../api/workspaceApi';
import styles from '../workspace.module.css';

export function WorkspaceFeedback({
  error,
  context = 'workspace',
  onRetry,
}: {
  error: unknown;
  context?: 'profile' | 'workspace';
  onRetry: () => void;
}) {
  const { logout } = useAuth();
  const unauthorized = workspaceStatus(error) === 401;
  return (
    <div className={styles.feedback} role="alert">
      <span className={styles.feedbackIcon}>
        <Icon name="alert" />
      </span>
      <div>
        <p className="text-sm leading-relaxed">
          {workspaceMessage(error, context)}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={unauthorized ? () => void logout() : onRetry}
        >
          {unauthorized ? 'Volver a iniciar sesión' : 'Reintentar'}
        </Button>
      </div>
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div role="status" aria-busy="true" className={styles.skeletonList}>
      <span className="sr-only">Cargando tus espacios de trabajo…</span>
      {[1, 2, 3].map((item) => (
        <div className={styles.skeletonRow} key={item}>
          <span className={styles.skeletonIcon} />
          <span className={styles.skeletonText} />
        </div>
      ))}
    </div>
  );
}
