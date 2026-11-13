import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { displayDate } from '@/features/workspace/utils/workspacePresentation';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { useMemberships } from '../hooks/useAccess';
import {
  clientRoles,
  type AccessContext,
  type Membership,
} from '../types/access.types';
import { AccessFeedback } from '../components/AccessFeedback';
import { AccessIdentity } from '../components/AccessIdentity';
import { accessName } from '../utils/accessPresentation';
import { RevokeAccessDialog } from '../components/RevokeAccessDialog';
import styles from '../access.module.css';

export function EntityMembersPage({
  context,
  workspaceName,
  entityName,
  invitationsPath,
}: {
  context: AccessContext;
  workspaceName: string;
  entityName: string;
  invitationsPath: string;
}) {
  const members = useMemberships(context);
  const [filter, setFilter] = useState('active');
  const [search, setSearch] = useState('');
  const [revoking, setRevoking] = useState<Membership | null>(null);
  const [notice, setNotice] = useState('');
  const trigger = useRef<HTMLButtonElement | null>(null);
  const confirmation = useRef<HTMLParagraphElement>(null);
  const items = members.data ?? [];
  const query = search.trim().toLocaleLowerCase('es');
  const filtered = items.filter(
    (item) =>
      (filter === 'all' || item.status === filter) &&
      `${accessName(item.user)} ${clientRoles[item.role]}`
        .toLocaleLowerCase('es')
        .includes(query),
  );
  function reset() {
    setFilter('all');
    setSearch('');
    document.getElementById('member-search')?.focus();
  }
  return (
    <section
      className={styles.accessPage}
      aria-labelledby="entity-people-heading"
    >
      <header className={styles.pageHeading}>
        <div>
          <h2 id="entity-people-heading">Personas y accesos</h2>
          <p>Consulta quién tiene acceso a {entityName} y con qué rol.</p>
        </div>
        <Link className="btn-primary" to={invitationsPath}>
          <Icon name="plus" /> Invitar persona
        </Link>
      </header>
      {notice && (
        <p
          ref={confirmation}
          tabIndex={-1}
          className="success-alert"
          role="status"
        >
          {notice}
        </p>
      )}
      <div className={styles.collection}>
        {items.length > 0 && !members.isError && (
          <div className={workspaceStyles.listToolbar}>
            <div className={workspaceStyles.search}>
              <Icon name="search" />
              <label htmlFor="member-search" className="sr-only">
                Buscar personas por nombre o rol
              </label>
              <input
                id="member-search"
                type="search"
                placeholder="Buscar por nombre o rol…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className={workspaceStyles.searchClear}
                  aria-label="Limpiar búsqueda de personas"
                  onClick={() => {
                    setSearch('');
                    document.getElementById('member-search')?.focus();
                  }}
                >
                  <Icon name="close" />
                </button>
              )}
            </div>
            <div className={workspaceStyles.filterControl}>
              <label className="sr-only" htmlFor="member-status">
                Filtrar personas por estado
              </label>
              <select
                className="input"
                id="member-status"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              >
                <option value="active">Accesos activos</option>
                <option value="all">Todos los accesos</option>
                <option value="revoked">Accesos revocados</option>
              </select>
            </div>
          </div>
        )}
        {members.isPending ? (
          <div role="status" className={styles.collectionState}>
            <Icon name="user" />
            <p>Cargando personas con acceso…</p>
          </div>
        ) : members.isError ? (
          <div className={styles.collectionState}>
            <AccessFeedback error={members.error} />
            <Button
              type="button"
              variant="secondary"
              disabled={members.isFetching}
              onClick={() => void members.refetch()}
            >
              Reintentar personas
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={workspaceStyles.empty}>
            <span className={workspaceStyles.emptyIcon}>
              <Icon name="user" />
            </span>
            <h3>
              {items.length === 0
                ? 'Todavía no hay personas con acceso'
                : filter === 'active' && !query
                  ? 'No hay accesos activos'
                  : 'No encontramos personas con esos filtros'}
            </h3>
            <p>
              {items.length === 0
                ? 'Crea una invitación. La persona aparecerá aquí cuando acepte el acceso a este cliente.'
                : 'Puedes consultar el historial de accesos o cambiar la búsqueda.'}
            </p>
            {items.length > 0 ? (
              <Button type="button" variant="secondary" onClick={reset}>
                Ver todos los accesos
              </Button>
            ) : (
              <Link className="btn-secondary" to={invitationsPath}>
                Crear una invitación
              </Link>
            )}
          </div>
        ) : (
          <ul
            className={styles.recordList}
            aria-label="Personas de este cliente"
          >
            {filtered.map((member) => (
              <li key={member.id} className={styles.record}>
                <div className={styles.recordMain}>
                  <AccessIdentity profile={member.user} />
                  <span className={styles.recordRole}>
                    {clientRoles[member.role]}
                  </span>
                  <span
                    className={styles.statusLine}
                    data-state={member.status}
                  >
                    <Icon
                      name={member.status === 'active' ? 'check' : 'alert'}
                    />
                    {member.status === 'active'
                      ? 'Acceso activo'
                      : member.status === 'revoked'
                        ? 'Acceso revocado'
                        : 'Estado no disponible'}
                  </span>
                  {member.status === 'active' && (
                    <Button
                      type="button"
                      variant="danger"
                      aria-label={`Revocar acceso de ${accessName(member.user)}`}
                      onClick={(event) => {
                        trigger.current = event.currentTarget;
                        setRevoking(member);
                      }}
                    >
                      Revocar acceso
                    </Button>
                  )}
                </div>
                <details className={styles.recordDetails}>
                  <summary>Detalles del acceso</summary>
                  <dl>
                    <div>
                      <dt>Usuario</dt>
                      <dd>{member.userId}</dd>
                    </div>
                    <div>
                      <dt>Ingreso</dt>
                      <dd>
                        {member.joinedAt
                          ? displayDate(member.joinedAt)
                          : 'Sin ingreso confirmado'}
                      </dd>
                    </div>
                    {member.revokedAt && (
                      <div>
                        <dt>Revocación</dt>
                        <dd>{displayDate(member.revokedAt)}</dd>
                      </div>
                    )}
                  </dl>
                </details>
              </li>
            ))}
          </ul>
        )}
        {members.isSuccess && items.length > 0 && (
          <p className={workspaceStyles.listSummary} role="status">
            {filtered.length} de {items.length} personas en este listado
          </p>
        )}
      </div>
      {revoking && (
        <RevokeAccessDialog
          context={context}
          workspaceName={workspaceName}
          entityName={entityName}
          target={{ kind: 'person', record: revoking }}
          onCancel={() => {
            setRevoking(null);
            requestAnimationFrame(() => trigger.current?.focus());
          }}
          onRevoked={() => {
            setRevoking(null);
            setNotice('Acceso revocado. El historial se conserva.');
            requestAnimationFrame(() => confirmation.current?.focus());
          }}
        />
      )}
    </section>
  );
}
