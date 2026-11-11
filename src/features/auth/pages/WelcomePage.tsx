import { useAuth } from '../store/authStore';
import { Button } from '@/shared/ui/components/Button';
export function WelcomePage() {
  const { user, logout } = useAuth();
  return (
    <>
      <p className="mb-3 text-sm text-muted">Sesión iniciada</p>
      <h1 className="text-3xl font-semibold tracking-tight">
        Te damos la bienvenida
      </h1>
      <p className="mt-5 text-muted">Has accedido con tu cuenta:</p>
      <p className="mt-2 break-words font-medium">{user?.email || user?.id}</p>
      <Button
        className="mt-8 w-full"
        variant="secondary"
        onClick={() => void logout()}
      >
        Cerrar sesión
      </Button>
    </>
  );
}
