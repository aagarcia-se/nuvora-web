import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { WorkspaceAccount } from '@/features/workspace/components/WorkspaceAccount';
import { InstallApp } from '@/shared/pwa/InstallApp';
import { Icon } from '@/shared/ui/components/Icon';
import { Button } from '@/shared/ui/components/Button';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { isUuid } from '@/shared/utils/identifiers';
import { clientRoles } from '@/features/access/types/access.types';
import { initials } from '@/features/workspace/utils/workspacePresentation';
import { useClientEntity } from '../api/useClientEntity';
import styles from '../client.module.css';

export function ClientEntityPage() {
  const { entityId = '' } = useParams();
  const [search] = useSearchParams();
  const workspaceId = search.get('workspaceId') ?? '';
  const { user } = useAuth();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
  }, [workspaceId, entityId]);
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#client-content">
        Ir al contenido
      </a>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Icon name="shield" />
          <span>Espacio del cliente</span>
        </div>
        <WorkspaceAccount
          name={user?.email || 'Mi cuenta'}
          showProfileLink={false}
        />
      </header>
      <div className={styles.install}>
        <InstallApp />
      </div>
      <main
        ref={main}
        id="client-content"
        tabIndex={-1}
        className={styles.content}
      >
        {isUuid(entityId) && isUuid(workspaceId) ? (
          <ClientEntityContent
            key={`${user?.id}:${workspaceId}:${entityId}`}
            entityId={entityId}
            workspaceId={workspaceId}
          />
        ) : (
          <>
            <h1>Enlace de acceso incompleto</h1>
            <p className={styles.intro}>
              Abre el enlace original compartido por tu contador para continuar.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
function ClientEntityContent({
  entityId,
  workspaceId,
}: {
  entityId: string;
  workspaceId: string;
}) {
  const { logout } = useAuth();
  const { detail, entry } = useClientEntity(workspaceId, entityId);
  const acceptedHere =
    entry?.entityId === entityId && entry.workspaceId === workspaceId;
  const acceptedRole = acceptedHere ? clientRoles[entry.role] : null;
  const status = errorStatus(detail.error);
  return (
    <>
      <p className={styles.eyebrow}>Tu empresa · Tu información</p>
      <h1>
        {detail.isSuccess ? detail.data.legalName : 'Tu espacio de cliente'}
      </h1>
      <p className={styles.intro}>
        {acceptedHere
          ? 'Tu invitación fue aceptada. Este espacio se limita a la empresa que compartieron contigo.'
          : 'Consulta únicamente la información autorizada para tu cuenta.'}
      </p>
      {acceptedRole && (
        <p className={styles.role}>Rol aceptado: {acceptedRole}</p>
      )}
      {detail.isPending ? (
        <div role="status" className={styles.state}>
          <Icon name="clock" />
          <p>Comprobando el acceso a la empresa…</p>
        </div>
      ) : detail.isError ? (
        <section className={styles.state} aria-labelledby="client-state-title">
          <Icon name="alert" />
          <div>
            <h2 id="client-state-title">
              {status === 401
                ? 'Inicia sesión de nuevo'
                : status === 403 || status === 404
                  ? 'La empresa no está disponible para esta cuenta'
                  : 'No pudimos abrir tu empresa'}
            </h2>
            <p role="alert">
              {status === 401
                ? 'Tu sesión ya no es válida.'
                : status === 403 || status === 404
                  ? 'No podemos confirmar el acceso actual a sus datos. Vuelve a intentarlo o contacta a tu contador.'
                  : 'Comprueba tu conexión y vuelve a intentarlo.'}
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={
                status === 401
                  ? () => void logout()
                  : () => void detail.refetch()
              }
            >
              {status === 401 ? 'Volver a iniciar sesión' : 'Reintentar acceso'}
            </Button>
          </div>
        </section>
      ) : (
        <>
          <section className={styles.company} aria-label="Empresa autorizada">
            <span className={styles.avatar} aria-hidden="true">
              {initials(detail.data.legalName)}
            </span>
            <div>
              <p className={styles.access}>
                <Icon name="check" />
                Consulta autorizada
              </p>
              <h2>Acceso a la empresa</h2>
              <p>{acceptedRole || 'Acceso confirmado para tu cuenta'}</p>
            </div>
          </section>
          <section
            className={styles.documents}
            aria-labelledby="client-documents-title"
          >
            <Icon name="file" />
            <div>
              <h2 id="client-documents-title">
                Tus comprobantes, en un solo lugar
              </h2>
              <p>
                La carga de XML, PDF, fotografías y el registro de gastos se
                habilitarán en una siguiente fase.
              </p>
            </div>
          </section>
        </>
      )}
      <details className={styles.context}>
        <summary>Detalles del acceso</summary>
        <dl>
          {acceptedRole && (
            <div>
              <dt>Rol de la invitación aceptada</dt>
              <dd>{acceptedRole}</dd>
            </div>
          )}
          <div>
            <dt>Identificador de la empresa</dt>
            <dd>{entityId}</dd>
          </div>
          <div>
            <dt>Despacho de referencia</dt>
            <dd>{workspaceId}</dd>
          </div>
        </dl>
        <p>
          Esta referencia no te incorpora al equipo del despacho ni da acceso a
          su cartera.
        </p>
      </details>
    </>
  );
}
