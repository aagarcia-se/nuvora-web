import { useQueryClient } from '@tanstack/react-query';
import { EntityPanel } from '@/features/entities/components/EntityPanel';
import { entityKeys } from '@/features/entities/api/useEntityQueries';
import { useState } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { useWorkspaceQueries } from '../api/useWorkspaceQueries';
import { WorkspaceLayout } from '../components/WorkspaceLayout';
import { ProfileCard } from '../components/ProfileCard';
import { CreateWorkspaceDialog } from '../components/CreateWorkspaceDialog';
import {
  WorkspaceFeedback,
  WorkspaceSkeleton,
} from '../components/WorkspaceFeedback';
import { displayDate, initials } from '../utils/workspacePresentation';
import type { Workspace } from '../types/workspace.types';
import { workspaceRoles } from '../utils/workspacePresentation';
import styles from '../workspace.module.css';

export function WorkspacePage() {
  const { user } = useAuth();
  const client = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const { profile, list, detail, accessibleId } =
    useWorkspaceQueries(selectedId);
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
  const selected = accessibleId && detail.isSuccess ? detail.data : null;
  function selectWorkspace(id: string) {
    if (id !== selectedId && user?.id) {
      void client.cancelQueries({ queryKey: entityKeys.user(user.id) });
      client.removeQueries({ queryKey: entityKeys.user(user.id) });
    }
    setSelectedId(id);
  }
  function created(workspace: Workspace) {
    selectWorkspace(workspace.id);
    setSearch('');
    setSuccess(`Se creó «${workspace.name}» correctamente.`);
  }
  return (
    <WorkspaceLayout
      name={displayName || 'Mi cuenta'}
      avatar={profile.data?.avatar_url}
    >
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

      <div className={styles.columns}>
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
                    const active =
                      workspace.id === accessibleId && detail.isSuccess;
                    const checking =
                      workspace.id === accessibleId && detail.isFetching;
                    return (
                      <li key={workspace.id}>
                        <button
                          type="button"
                          className={`${styles.spaceOption} ${active ? styles.spaceOptionActive : ''}`}
                          aria-pressed={active}
                          aria-label={`Seleccionar ${workspace.name}`}
                          onClick={() => selectWorkspace(workspace.id)}
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
                            <span
                              className={
                                active
                                  ? styles.selectedLabel
                                  : styles.selectLabel
                              }
                            >
                              {checking
                                ? 'Verificando…'
                                : active
                                  ? 'Seleccionado'
                                  : 'Seleccionar'}
                              <Icon name={active ? 'check' : 'arrow-right'} />
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {accessibleId && (
            <section
              className={styles.selectionCard}
              aria-labelledby="selected-heading"
              aria-busy={detail.isFetching}
            >
              <div className={styles.selectionHeading}>
                <Icon name="layers" />
                <h2 id="selected-heading">Tu contexto de trabajo</h2>
              </div>
              {detail.isPending ? (
                <p role="status" className={styles.selectionHint}>
                  Verificando el acceso al espacio…
                </p>
              ) : detail.isError ? (
                <WorkspaceFeedback
                  error={detail.error}
                  onRetry={() => {
                    void list.refetch();
                    void detail.refetch();
                  }}
                />
              ) : (
                selected && (
                  <div role="status">
                    <div className={styles.selectionName}>
                      <h3>{selected.workspace.name}</h3>
                      <span className={styles.role}>
                        {workspaceRoles[selected.role]}
                      </span>
                    </div>
                    <p className={styles.selectionHint}>
                      Espacio seleccionado para esta sesión.
                    </p>
                    <a
                      href="#workspace-clients"
                      className="auth-link mt-3 gap-2"
                    >
                      Ver clientes <Icon name="arrow-right" />
                    </a>
                    <dl className={styles.selectionDetails}>
                      <div>
                        <dt>Identificador</dt>
                        <dd>{selected.workspace.slug}</dd>
                      </div>
                      <div>
                        <dt>Creado el</dt>
                        <dd>{displayDate(selected.workspace.created_at)}</dd>
                      </div>
                    </dl>
                  </div>
                )
              )}
            </section>
          )}
          {selectedId && list.isSuccess && !accessibleId && (
            <p role="status" className={styles.selectionHint}>
              El espacio seleccionado ya no aparece entre tus accesos
              disponibles.
            </p>
          )}
          {!selectedId && list.isSuccess && items.length > 0 && (
            <p className={styles.selectionHelp}>
              <Icon name="shield" />
              Selecciona un espacio para ver su información y tu rol.
            </p>
          )}
        </div>
        <ProfileCard
          profile={profile.data}
          pending={profile.isPending}
          error={profile.error}
          onRetry={() => void profile.refetch()}
        />
      </div>
      {selected && (
        <EntityPanel
          key={`${user?.id}:${selected.workspace.id}`}
          workspace={selected.workspace}
          role={selected.role}
        />
      )}
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
    </WorkspaceLayout>
  );
}
