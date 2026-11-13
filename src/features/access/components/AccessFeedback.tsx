import { useAuth } from '@/features/auth/store/authStore';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { Button } from '@/shared/ui/components/Button';
import { accessMessage } from '../api/accessApi';
export function AccessFeedback({ error }: { error: unknown }) {
  const { logout } = useAuth();
  if (!error) return null;
  return (
    <div className="alert" role="alert">
      <p>{accessMessage(error)}</p>
      {errorStatus(error) === 401 && (
        <Button
          type="button"
          variant="secondary"
          className="mt-3"
          onClick={() => void logout()}
        >
          Volver a iniciar sesión
        </Button>
      )}
    </div>
  );
}
