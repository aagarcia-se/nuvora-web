import { useState } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { useWorkspaceQueries } from '../api/useWorkspaceQueries';
import { Link } from 'react-router-dom';

import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog';
import {
  WorkspaceFeedback,
  WorkspaceSkeleton,
} from '../components/WorkspaceFeedback';
import { initials } from '../utils/workspacePresentation';
import type { Workspace } from '../types/workspace.types';
import { workspaceRoles } from '../utils/workspacePresentation';
import styles from '../workspace.module.css';

export function WorkspacePage() {
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const { profile, list } = useWorkspaceQueries();
  const displayName = profile.data?.display_name?.trim();
  const items = list.data ?? [];
  const showSearch = items.length > 4;
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
          <p className={styles.eyebrow}>Vista general</p>
          <h1>Tus espacios de trabajo</h1>
          <p className={styles.intro}>
            {displayName
              ? `Hola, ${displayName}. `
              : 'Te damos la bienvenida. '}
            Un lugar para organizar tu despacho y elegir dónde continuar.
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
                <h2 id="spaces-heading">Elige tu espacio</h2>
                <p>Solo los espacios a los que tienes acceso.</p>
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
                  placeholder="Buscar por nombre…"
                />
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
                    onClick={() => setSearch('')}
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
