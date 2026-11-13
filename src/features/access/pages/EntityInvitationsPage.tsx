import { useRef, useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { displayDate } from '@/features/workspace/utils/workspacePresentation';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { createInvitation } from '../api/accessApi';
import { useAccessAction, useInvitations } from '../hooks/useAccess';
import { useRefreshEntityAccess } from '../hooks/useRefreshEntityAccess';
import {
  clientRoles,
  type AccessContext,
  type ClientRole,
  type InvitationRecord,
} from '../types/access.types';
import { AccessFeedback } from '../components/AccessFeedback';
import { AccessIdentity } from '../components/AccessIdentity';
import { accessName } from '../utils/accessPresentation';
import { ShareInvitation } from '../components/ShareInvitation';
import { RevokeAccessDialog } from '../components/RevokeAccessDialog';
import styles from '../access.module.css';

type Props = {
  context: AccessContext;
  workspaceName: string;
  entityName: string;
};
type LocalLink = {
  id: string;
  role: ClientRole;
  expiresAt: string;
  url: string | null;
};
const invitationLabels = {
  pending: 'Pendiente',
  accepted: 'Aceptada',
  expired: 'Expirada',
  revoked: 'Revocada',
} as const;

export function EntityInvitationsPage({
  active,
  ...props
}: Props & { active: boolean }) {
  // Leaving this section destroys link-bearing state and aborts pending actions.
  return active ? <InvitationWorkspace {...props} /> : null;
}

function InvitationWorkspace(props: Props) {
  const history = useInvitations(props.context);
  const denied =
    history.isError && [401, 403, 404].includes(errorStatus(history.error));
  return (
    <InvitationContent
      key={denied ? 'denied' : 'accessible'}
      {...props}
      history={history}
      denied={denied}
    />
  );
}

function InvitationContent({
  context,
  workspaceName,
  entityName,
  history,
  denied,
}: Props & { history: ReturnType<typeof useInvitations>; denied: boolean }) {
  const create = useAccessAction(context);
  const refresh = useRefreshEntityAccess(context);
  const [role, setRole] = useState<ClientRole>('client_viewer');
  const [links, setLinks] = useState<LocalLink[]>([]);
  const [filter, setFilter] = useState('all');
  const [revoking, setRevoking] = useState<InvitationRecord | null>(null);
  const [notice, setNotice] = useState('');
  const confirmation = useRef<HTMLParagraphElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const items = [...(history.data ?? [])].sort(
    (a, b) =>
      Number(b.status === 'pending') - Number(a.status === 'pending') ||
      Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
  const filtered = items.filter(
    (item) => filter === 'all' || item.status === filter,
  );
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (create.pending || denied) return;
    const result = await create.run((id, signal) =>
      createInvitation(id, context, role, signal),
    );
    if (!result) return;
    // No result object or acceptUrl is ever written to Query or Mutation cache.
    setLinks((previous) => [
      {
        id: result.id,
        role,
        expiresAt: result.expiresAt,
        url: result.acceptUrl,
      },
      ...previous,
    ]);
    setNotice('Enlace listo para compartir.');
    void refresh();
  }
  if (denied)
    return (
      <section
        className={styles.accessPage}
        aria-label="Invitaciones no disponibles"
      >
        <h2>Invitaciones no disponibles</h2>
        <AccessFeedback error={history.error} />
        <Button
          type="button"
          variant="secondary"
          disabled={history.isFetching}
          onClick={() => void history.refetch()}
        >
          Reintentar invitaciones
        </Button>
      </section>
    );
  return (
    <section
      className={styles.accessPage}
      aria-labelledby="entity-invitations-heading"
    >
      <header className={styles.pageHeading}>
        <div>
          <h2 id="entity-invitations-heading">Invitaciones</h2>
          <p>
            Invita personas a {entityName}. El enlace concede acceso solo a esta
            entidad.
          </p>
        </div>
      </header>
      <section
        className={styles.inviteComposer}
        aria-labelledby="invite-create-heading"
      >
        <h3 id="invite-create-heading">Crear una invitación</h3>
        <p className={styles.hint}>
          Elige un rol y comparte el enlace de forma privada. La persona tendrá
          que aceptar con su cuenta.
        </p>
        <form
          className={styles.compactForm}
          onSubmit={(event) => void invite(event)}
          aria-busy={create.pending}
        >
          <div>
            <label htmlFor="invite-role" className="field-label">
              Permiso del enlace
            </label>
            <select
              id="invite-role"
              className="input"
              value={role}
              disabled={create.pending}
              onChange={(event) => setRole(event.target.value as ClientRole)}
            >
              {Object.entries(clientRoles).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="submit"
            loading={create.pending}
            loadingLabel="Creando enlace…"
          >
            <Icon name="link" />
            Crear enlace
          </Button>
        </form>
        <AccessFeedback error={create.error} />
      </section>
      {notice && (
        <p
          ref={confirmation}
          tabIndex={-1}
          role="status"
          className={
            notice === 'Enlace listo para compartir.'
              ? 'sr-only'
              : 'success-alert'
          }
        >
          {notice}
        </p>
      )}
      {links.length > 0 && (
        <section
          className={styles.linkResults}
          aria-labelledby="new-links-heading"
        >
          <h3 id="new-links-heading">Enlaces listos para compartir</h3>
          <p className={styles.hint}>
            Cópialos antes de salir de esta sección. El historial conserva la
            invitación, pero no su enlace.
          </p>
          {links.map((link) => (
            <article className={styles.invitation} key={link.id}>
              <strong>{clientRoles[link.role]}</strong>
              <p className={styles.hint}>
                Vence el {displayDate(link.expiresAt)}
              </p>
              <ShareInvitation
                context={context}
                invitationId={link.id}
                url={link.url}
                onUrlChange={(url) =>
                  setLinks((previous) =>
                    previous.map((item) =>
                      item.id === link.id ? { ...item, url } : item,
                    ),
                  )
                }
                onClose={() =>
                  setLinks((previous) =>
                    previous.filter((item) => item.id !== link.id),
                  )
                }
              />
            </article>
          ))}
        </section>
      )}
      <section
        className={styles.collection}
        aria-labelledby="invitation-history-heading"
      >
        <div className={styles.collectionHeading}>
          <div>
            <h3 id="invitation-history-heading">Historial de invitaciones</h3>
            <p>
              La aceptación de una invitación no confirma que el acceso siga
              activo.
            </p>
          </div>
          <div className={workspaceStyles.filterControl}>
            <label htmlFor="invitation-status" className="sr-only">
              Filtrar invitaciones por estado
            </label>
            <select
              className="input"
              id="invitation-status"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Todos los estados</option>
              {Object.entries(invitationLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {history.isPending ? (
          <div role="status" className={styles.collectionState}>
            <p>Cargando invitaciones…</p>
          </div>
        ) : history.isError ? (
          <div className={styles.collectionState}>
            <AccessFeedback error={history.error} />
            <Button
              type="button"
              variant="secondary"
              disabled={history.isFetching}
              onClick={() => void history.refetch()}
            >
              Reintentar invitaciones
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={workspaceStyles.empty}>
            <span className={workspaceStyles.emptyIcon}>
              <Icon name="link" />
            </span>
            <h3>
              {items.length === 0
                ? 'Todavía no hay invitaciones'
                : 'No hay invitaciones con este estado'}
            </h3>
            <p>
              {items.length === 0
                ? 'Crea el primer enlace con el formulario de arriba. Cuando se acepte, la persona aparecerá en Personas y accesos.'
                : 'Cambia el filtro para consultar las demás invitaciones.'}
            </p>
            {items.length > 0 && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setFilter('all')}
              >
                Ver todas las invitaciones
              </Button>
            )}
          </div>
        ) : (
          <ul
            className={styles.recordList}
            aria-label="Invitaciones de este cliente"
          >
            {filtered.map((invitation) => (
              <li className={styles.record} key={invitation.id}>
                <div className={styles.recordMain}>
                  {invitation.acceptedBy ? (
                    <AccessIdentity profile={invitation.acceptedByProfile} />
                  ) : (
                    <strong className={styles.invitationIdentity}>
                      {clientRoles[invitation.role]}
                    </strong>
                  )}
                  <span className={styles.recordRole}>
                    {invitation.acceptedBy
                      ? clientRoles[invitation.role]
                      : `Vence el ${displayDate(invitation.expiresAt)}`}
                  </span>
                  <span
                    className={styles.statusLine}
                    data-state={invitation.status}
                  >
                    <Icon
                      name={
                        invitation.status === 'accepted'
                          ? 'check'
                          : invitation.status === 'pending'
                            ? 'clock'
                            : 'alert'
                      }
                    />
                    {invitationLabels[invitation.status]}
                  </span>
                  {invitation.status === 'pending' && (
                    <Button
                      type="button"
                      variant="danger"
                      aria-label={`Revocar invitación para ${clientRoles[invitation.role]}`}
                      onClick={(event) => {
                        trigger.current = event.currentTarget;
                        setRevoking(invitation);
                      }}
                    >
                      Revocar invitación
                    </Button>
                  )}
                </div>
                <details className={styles.recordDetails}>
                  <summary>Detalles de la invitación</summary>
                  <dl>
                    <div>
                      <dt>Invitación</dt>
                      <dd>{invitation.id}</dd>
                    </div>
                    <div>
                      <dt>Creada</dt>
                      <dd>{displayDate(invitation.createdAt)}</dd>
                    </div>
                    <div>
                      <dt>Vencimiento</dt>
                      <dd>{displayDate(invitation.expiresAt)}</dd>
                    </div>
                    {invitation.acceptedBy && (
                      <div>
                        <dt>Usuario que aceptó</dt>
                        <dd>{invitation.acceptedBy}</dd>
                      </div>
                    )}
                    {invitation.acceptedAt && (
                      <div>
                        <dt>Aceptación</dt>
                        <dd>{displayDate(invitation.acceptedAt)}</dd>
                      </div>
                    )}
                    {invitation.revokedAt && (
                      <div>
                        <dt>Revocación</dt>
                        <dd>{displayDate(invitation.revokedAt)}</dd>
                      </div>
                    )}
                  </dl>
                  {invitation.acceptedBy && (
                    <p>
                      La invitación fue aceptada por{' '}
                      {accessName(invitation.acceptedByProfile)}. Consulta
                      Personas y accesos para conocer su acceso actual.
                    </p>
                  )}
                </details>
              </li>
            ))}
          </ul>
        )}
        {history.isSuccess && items.length > 0 && (
          <p className={workspaceStyles.listSummary} role="status">
            {filtered.length} de {items.length} invitaciones en este listado
          </p>
        )}
      </section>
      {revoking && (
        <RevokeAccessDialog
          context={context}
          workspaceName={workspaceName}
          entityName={entityName}
          target={{ kind: 'invitation', record: revoking }}
          onCancel={() => {
            setRevoking(null);
            requestAnimationFrame(() => trigger.current?.focus());
          }}
          onRevoked={() => {
            const id = revoking.id;
            setRevoking(null);
            setLinks((previous) => previous.filter((item) => item.id !== id));
            setNotice('Invitación revocada. El historial se conserva.');
            requestAnimationFrame(() => confirmation.current?.focus());
          }}
        />
      )}
    </section>
  );
}
