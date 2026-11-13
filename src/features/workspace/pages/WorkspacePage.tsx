import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { useWorkspaceQueries } from '../api/useWorkspaceQueries';

import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog';
import {
  WorkspaceFeedback,
  WorkspaceSkeleton,
} from '../components/WorkspaceFeedback';
import { initials } from '../utils/workspacePresentation';
import type { Workspace } from '../types/workspace.types';
import { workspaceRoles } from '../utils/workspacePresentation';
import styles from '../workspace.module.css';
import { useProfileEntities } from '@/features/access/hooks/useProfileEntities';
import {
  clientRoles,
  type ProfileEntityMembership,
} from '@/features/access/types/access.types';
import { errorStatus } from '@/shared/api/authenticatedRequest';

export function WorkspacePage() {
  const { logout } = useAuth();
  const access = useProfileEntities();
  const { list } = useWorkspaceQueries();
  const entities = access.data ?? [];
  const workspaces = list.data ?? [];
  const [choice, setChoice] = useState<'undecided' | 'workspace'>('undecided');

  if (access.isPending || list.isPending)
    return (
      <div role="status" className={styles.entryState}>
        <h1>Preparando tu espacio</h1>
        <p>Estamos comprobando tus áreas de acceso…</p>
      </div>
    );
  if (access.isError || list.isError)
    return (
      <div className={styles.entryState}>
        <h1>No pudimos comprobar tus accesos</h1>
        <p role="alert">
          {errorStatus(access.error) === 401 || errorStatus(list.error) === 401
            ? 'Tu sesión ya no es válida. Vuelve a iniciar sesión.'
            : 'El servicio no está disponible por el momento. Inténtalo de nuevo más tarde.'}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            type="button"
            onClick={() => {
              void access.refetch();
              void list.refetch();
            }}
          >
            Reintentar
          </Button>
          {(errorStatus(access.error) === 401 ||
            errorStatus(list.error) === 401) && (
            <Button
              variant="secondary"
              type="button"
              onClick={() => void logout()}
            >
              Volver a iniciar sesión
            </Button>
          )}
        </div>
      </div>
    );
  if (workspaces.length === 0 && entities.length === 1)
    return (
      <Navigate
        replace
        to={`/client/entities/${entities[0].entityId}?workspaceId=${entities[0].workspaceId}`}
      />
    );
  if (workspaces.length === 0 && entities.length > 1)
    return (
      <AccessChoice
        entities={entities}
        hasWorkspace={false}
        onWorkspace={() => setChoice('workspace')}
      />
    );
  if (workspaces.length > 0 && entities.length > 0 && choice !== 'workspace')
    return (
      <AccessChoice
        entities={entities}
        hasWorkspace
        onWorkspace={() => setChoice('workspace')}
      />
    );
  return <WorkspaceHome />;
}

function AccessChoice({
  entities,
  hasWorkspace,
  onWorkspace,
}: {
  entities: ProfileEntityMembership[];
  hasWorkspace: boolean;
  onWorkspace: () => void;
}) {
  const first = entities.length === 1 ? entities[0] : null;
  return (
    <>
      <header className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Elige dónde continuar</p>
          <h1>
            {hasWorkspace ? 'Tienes dos áreas de acceso' : 'Elige tu empresa'}
          </h1>
          <p className={styles.intro}>
            {hasWorkspace
              ? 'Selecciona el área que quieres abrir. Tu acceso al despacho y al portal cliente se mantienen separados.'
              : 'Selecciona la empresa cuyo portal quieres abrir.'}
          </p>
        </div>
      </header>
      <section
        className={styles.contextChoices}
        aria-labelledby="access-choice-heading"
      >
        <h2 id="access-choice-heading" className="sr-only">
          Áreas disponibles
        </h2>
        {hasWorkspace && (
          <button
            type="button"
            className={styles.contextChoice}
            onClick={onWorkspace}
          >
            <Icon name="layers" />
            <span>
              <strong>Área del despacho</strong>
              <small>Gestiona tus espacios y clientes.</small>
            </span>
            <Icon name="arrow-right" />
          </button>
        )}
        {first ? (
          <Link
            className={styles.contextChoice}
            to={`/client/entities/${first.entityId}?workspaceId=${first.workspaceId}`}
          >
            <Icon name="shield" />
            <span>
              <strong>Portal cliente</strong>
              <small>
                {first.entity.legalName} · {clientRoles[first.role]}
              </small>
            </span>
            <Icon name="arrow-right" />
          </Link>
        ) : (
          <div className={styles.contextChoiceList}>
            <p className={styles.choiceLabel}>Portal cliente</p>
            {entities.map((item) => (
              <Link
                className={styles.contextChoice}
                key={`${item.workspaceId}:${item.entityId}`}
                to={`/client/entities/${item.entityId}?workspaceId=${item.workspaceId}`}
              >
                <Icon name="shield" />
                <span>
                  <strong>{item.entity.legalName}</strong>
                  <small>{clientRoles[item.role]}</small>
                </span>
                <Icon name="arrow-right" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function WorkspaceHome() {
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const { profile, list } = useWorkspaceQueries();
  const displayName = profile.data?.display_name?.trim();
  const items = list.data ?? [];
  const showSearch = items.length > 0;
  const filtered = showSearch
    ? items.filter((item) =>
        `${item.name} ${item.slug}`
          .toLocaleLowerCase('es')
          .includes(search.trim().toLocaleLowerCase('es')),
      )
    : items;
  function created(workspace: Workspace) {
    setSearch('');
    setSuccess(`Se creó «${workspace.name}» correctamente.`);
  }
  return (
    <>
      <header className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Tu área de trabajo</p>
          <h1>Tus espacios de trabajo</h1>
          <p className={styles.intro}>
            {displayName
              ? `Hola, ${displayName}. `
              : 'Te damos la bienvenida. '}
            Elige un espacio para trabajar con sus clientes.
          </p>
        </div>
        <Button type="button" onClick={() => setCreating(true)}>
          <Icon name="plus" />
          Crear espacio
        </Button>
      </header>

      {success && (
        <div className={styles.success} role="status">
          <Icon name="check" />
          <p>{success}</p>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="Cerrar confirmación"
            onClick={() => setSuccess('')}
          >
            <Icon name="close" />
          </button>
        </div>
      )}

      <div>
        <div className={styles.primaryColumn}>
          <section
            className={styles.spacesCard}
            aria-labelledby="spaces-heading"
          >
            <div className={styles.cardHeading}>
              <div>
                <h2 id="spaces-heading">Espacios disponibles</h2>
                <p>Cada espacio mantiene su equipo y cartera separados.</p>
              </div>
              {list.isSuccess && (
                <span
                  className={styles.count}
                  aria-label={`${items.length} espacios`}
                >
                  {items.length}
                </span>
              )}
            </div>
            {showSearch && !list.isError && (
              <div className={styles.listToolbar}>
                <div className={styles.search}>
                  <Icon name="search" />
                  <label className="sr-only" htmlFor="workspace-search">
                    Buscar en mis espacios
                  </label>
                  <input
                    id="workspace-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por nombre o identificador…"
                  />
                  {search && (
                    <button
                      type="button"
                      className={styles.searchClear}
                      aria-label="Limpiar búsqueda de espacios"
                      onClick={() => {
                        setSearch('');
                        document.getElementById('workspace-search')?.focus();
                      }}
                    >
                      <Icon name="close" />
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className={styles.spacesBody}>
              {list.isPending ? (
                <WorkspaceSkeleton />
              ) : list.isError ? (
                <WorkspaceFeedback
                  error={list.error}
                  onRetry={() => void list.refetch()}
                />
              ) : items.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>
                    <Icon name="layers" />
                  </span>
                  <h3>Todo empieza con un espacio.</h3>
                  <p>
                    Crea el espacio de tu despacho o equipo y dale un lugar a tu
                    trabajo.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setCreating(true)}
                  >
                    <Icon name="plus" />
                    Crear mi primer espacio
                  </Button>
                </div>
              ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                  <h3>No encontramos ese espacio.</h3>
                  <p>Prueba otro nombre o limpia la búsqueda.</p>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      document.getElementById('workspace-search')?.focus();
                    }}
                  >
                    Limpiar búsqueda
                  </Button>
                </div>
              ) : (
                <ul
                  className={styles.spaceList}
                  aria-label="Mis espacios de trabajo"
                >
                  {filtered.map((workspace) => {
                    return (
                      <li key={workspace.id}>
                        <Link
                          className={styles.spaceOption}
                          aria-label={`Abrir ${workspace.name}`}
                          to={`/workspaces/${workspace.id}/clients`}
                        >
                          <span
                            className={styles.spaceInitials}
                            aria-hidden="true"
                          >
                            {initials(workspace.name)}
                          </span>
                          <span className={styles.spaceCopy}>
                            <span className={styles.spaceName}>
                              {workspace.name}
                            </span>
                            <span className={styles.spaceSlug}>
                              {workspace.slug}
                            </span>
                          </span>
                          <span className={styles.spaceMeta}>
                            <span className={styles.role}>
                              {workspace.role
                                ? workspaceRoles[workspace.role]
                                : 'Acceso disponible'}
                            </span>
                            <span className={styles.selectLabel}>
                              Abrir espacio <Icon name="arrow-right" />
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {list.isSuccess && items.length > 0 && (
              <p className={styles.listSummary} role="status">
                {search.trim()
                  ? `${filtered.length} de ${items.length} espacios`
                  : `${items.length} ${items.length === 1 ? 'espacio disponible' : 'espacios disponibles'}`}
              </p>
            )}
          </section>
        </div>
      </div>
      <CreateWorkspaceDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={created}
        onRefresh={() => void list.refetch()}
      />
      <footer className={styles.footer}>
        <span className="brand-mark" aria-hidden="true" />
        <span>Tu trabajo, en orden.</span>
        <span className="sr-only">{user?.id ? 'Sesión iniciada' : ''}</span>
      </footer>
    </>
  );
}
