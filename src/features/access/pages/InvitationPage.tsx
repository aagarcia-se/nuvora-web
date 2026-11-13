import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { displayDate } from '@/features/workspace/utils/workspacePresentation';
import {
  clientEntityKeys,
  clientEntityPath,
} from '@/features/client/api/useClientEntity';
import { acceptInvitation, inspectInvitation } from '../api/accessApi';
import { useAccessAction } from '../hooks/useAccess';
import {
  clearPendingInvitationMemory,
  clearInvitationToken,
  pendingInvitationToken,
} from '../invitationToken';
import { clientRoles, type Inspection } from '../types/access.types';
import { AccessFeedback } from '../components/AccessFeedback';
import styles from '../access.module.css';

export function InvitationPage() {
  const auth = useAuth();
  const [registering, setRegistering] = useState(false);
  const [token, setToken] = useState(pendingInvitationToken);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      queueMicrotask(() => {
        if (!mounted.current) {
           clearPendingInvitationMemory();
        }
      });
    };
  }, []);
  if (!token)
    return (
      <>
        <h1 className="text-2xl font-semibold">Vuelve a abrir la invitación</h1>
        <p className="mt-4 text-muted">
          Por seguridad el enlace solo se usa durante esta visita. Abre de nuevo
          el enlace original compartido por el contador.
        </p>
        <Link to="/" className="btn-secondary mt-6">
          Volver al inicio
        </Link>
      </>
    );
  if (auth.status === 'loading')
    return <p role="status">Comprobando tu sesión…</p>;
  if (auth.status === 'error')
    return (
      <>
        <h1 className="text-2xl font-semibold">
          No pudimos comprobar tu sesión
        </h1>
        <p role="alert" className="mt-3">
          {auth.error}
        </p>
        <Button type="button" className="mt-4" onClick={auth.retry}>
          Reintentar sesión
        </Button>
      </>
    );
  if (auth.status !== 'authenticated' || !auth.user)
    return (
      <>
        <div className={styles.callbackIntro}>
          <Icon name="shield" />
          <p>
            Has abierto una invitación. Inicia sesión o crea una cuenta para
            revisar el acceso y decidir si quieres aceptarlo.
          </p>
        </div>
        <p className={styles.hint}>
           Si usas Google, el contexto se conserva solo durante unos minutos en
           esta pestaña para volver aquí. Si cancelas o cambias de cuenta,
           vuelve a abrir el enlace original.
        </p>
        {registering ? (
          <RegisterPage onLogin={() => setRegistering(false)} />
        ) : (
          <LoginPage onRegister={() => setRegistering(true)} />
        )}
      </>
    );
  return (
    <InvitationSession
      key={auth.user.id}
      token={token}
      onConsumed={() => {
        setToken(null);
        clearInvitationToken();
      }}
    />
  );
}
function InvitationSession({
  token,
  onConsumed,
}: {
  token: string;
  onConsumed: () => void;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const client = useQueryClient();
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [retry, setRetry] = useState(0);
  const inspect = useAccessAction();
  const accept = useAccessAction();
  const inspectRun = inspect.run;
  useEffect(() => {
    let active = true;
    void inspectRun((id, signal) => inspectInvitation(id, token, signal)).then(
      (result) => {
        if (!active) return;
         if (result) {
           setInspection(result);
           if (result.status !== 'pending') clearInvitationToken();
         }
        setLoaded(true);
      },
    );
    return () => {
      active = false;
    };
  }, [token, retry, inspectRun]);
  useEffect(() => {
    if (errorStatus(inspect.error) === 410) clearInvitationToken();
  }, [inspect.error]);
  async function acceptNow() {
    const result = await accept.run((id, signal) =>
      acceptInvitation(id, token, signal),
    );
    if (!result) {
      if (errorStatus(accept.error) === 410) clearInvitationToken();
      return;
    }
    onConsumed();
    if (user)
      client.setQueryData(
        clientEntityKeys.entry(user.id, result.workspaceId, result.entityId),
        result,
      );
    navigate(clientEntityPath(result.entityId, result.workspaceId), {
      replace: true,
    });
  }
  async function leaveInvitation() {
    onConsumed();
    await logout();
  }
  const unavailable =
    (inspection && inspection.status !== 'pending') ||
    errorStatus(accept.error) === 410;
  const stateLabel =
    inspection?.status === 'expired'
      ? 'Invitación expirada'
      : inspection?.status === 'revoked'
        ? 'Invitación revocada'
        : inspection?.status === 'accepted'
          ? 'Invitación ya utilizada'
          : 'Invitación a un cliente';
  return (
    <>
      <div className="auth-heading">
        <p className="auth-eyebrow">Acceso seguro</p>
        <h1 className="text-2xl font-semibold">{stateLabel}</h1>
      </div>
      <p className={styles.hint}>
        Sesión actual: <strong>{user?.email}</strong>
      </p>
      {!loaded ? (
        <p role="status">Consultando invitación…</p>
      ) : (
        <>
          <AccessFeedback error={inspect.error} />
          {!inspection && (
            <Button
              type="button"
              variant="secondary"
              disabled={inspect.pending}
              onClick={() => {
                setLoaded(false);
                setRetry((value) => value + 1);
              }}
            >
              Volver a consultar
            </Button>
          )}
          {inspection && (
            <>
              <dl className={styles.invitationDetails}>
                <div>
                  <dt>Espacio de trabajo</dt>
                  <dd>{inspection.workspaceId}</dd>
                </div>
                <div>
                  <dt>Cliente</dt>
                  <dd>{inspection.entityId}</dd>
                </div>
                <div>
                  <dt>Acceso propuesto</dt>
                  <dd>{clientRoles[inspection.role]}</dd>
                </div>
                <div>
                  <dt>Vencimiento</dt>
                  <dd>{displayDate(inspection.expiresAt)}</dd>
                </div>
              </dl>
              {errorStatus(accept.error) === 410 && (
                <AccessFeedback error={accept.error} />
              )}
              {unavailable ? (
                <p className={styles.hint}>
                  Este enlace ya no permite aceptar la invitación. Solicita una
                  nueva al contador.
                </p>
              ) : (
                <>
                  <p className={styles.hint}>
                    Aceptar concede el rol indicado únicamente para este
                    cliente, no la administración del despacho. Puedes usar la
                    cuenta con la que has iniciado sesión.
                  </p>
                  <AccessFeedback error={accept.error} />
                  <Button
                    type="button"
                    disabled={accept.pending}
                    className="mt-4 w-full"
                    onClick={() => void acceptNow()}
                  >
                    {accept.pending ? 'Aceptando…' : 'Aceptar invitación'}
                  </Button>
                </>
              )}
            </>
          )}
        </>
      )}
      <div className={styles.actions}>
        <Button
          type="button"
          variant="secondary"
          disabled={accept.pending}
           onClick={() => void leaveInvitation()}
        >
          Usar otra cuenta
        </Button>
        <Link to="/" className="auth-link" onClick={onConsumed}>
          Volver al inicio
        </Link>
      </div>
    </>
  );
}
