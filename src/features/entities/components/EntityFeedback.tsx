import { useAuth } from '@/features/auth/store/authStore';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { entityMessage } from '../api/entityApi';

export function EntityFeedback({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const { logout } = useAuth();
  const unauthorized = errorStatus(error) === 401;
  return (
    <div className={workspaceStyles.feedback} role="alert">
      <span className={workspaceStyles.feedbackIcon}>
        <Icon name="alert" />
      </span>
      <div>
        <p className="text-sm leading-relaxed">{entityMessage(error)}</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={unauthorized ? () => void logout() : onRetry}
        >
          {unauthorized ? 'Volver a iniciar sesión' : 'Reintentar clientes'}
        </Button>
      </div>
    </div>
  );
}
