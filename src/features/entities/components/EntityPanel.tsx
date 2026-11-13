import { useState } from 'react';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { initials } from '@/features/workspace/utils/workspacePresentation';
import type {
  Workspace,
  WorkspaceRole,
} from '@/features/workspace/types/workspace.types';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { useEntities } from '../api/useEntityQueries';
import { entityTaxLabel } from '../utils/entityPresentation';
import { EntityFeedback } from './EntityFeedback';
import { CreateEntityDialog } from './CreateEntityDialog';
import { Link } from 'react-router-dom';
import styles from '../entities.module.css';

type Props = { workspace: Workspace; role: WorkspaceRole };
export function EntityPanel({ workspace, role }: Props) {
  const list = useEntities(workspace.id);
  const denied =
    list.isError && [401, 403, 404].includes(errorStatus(list.error));
  // A denial destroys dialogs/drafts; recovery cannot silently reopen old client data.
  return (
    <EntityPortfolio
      key={denied ? 'denied' : 'accessible'}
      workspace={workspace}
      role={role}
      list={list}
      denied={denied}
    />
  );
}

function EntityPortfolio({
  workspace,
  role,
  list,
  denied,
}: Props & { list: ReturnType<typeof useEntities>; denied: boolean }) {
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');
  const [success, setSuccess] = useState('');
  const items = list.data ?? [];
  const canCreate = !denied && (role === 'owner' || role === 'admin');
  const filtered = items.filter(
    (item) =>
      (accessFilter === 'all' ||
        (accessFilter === 'manage'
          ? item.permissions.canManage
          : !item.permissions.canManage)) &&
      item.legal_name
        .toLocaleLowerCase('es')
        .includes(search.trim().toLocaleLowerCase('es')),
  );
  return (
    <section
      id="workspace-clients"
      className={styles.section}
      aria-labelledby="clients-heading"
    >
      <div className={styles.heading}>
        <div>
          <p className={workspaceStyles.eyebrow}>{workspace.name}</p>
          <h1 id="clients-heading" aria-label={`Clientes de ${workspace.name}`}>
            Clientes
          </h1>
          <p className={styles.description}>
            Encuentra un cliente, consulta su información o administra su
            acceso.
          </p>
        </div>
        {canCreate && (
          <Button
            type="button"
            onClick={() => setCreating(true)}
            disabled={list.isPending}
          >
            <Icon name="plus" />
            Crear cliente
          </Button>
        )}
      </div>
      {success && (
        <div role="status" className={workspaceStyles.success}>
          <Icon name="check" />
          <p>{success}</p>
          <button
            type="button"
            className={workspaceStyles.iconButton}
            aria-label="Cerrar confirmación de cliente"
            onClick={() => setSuccess('')}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      <div className={workspaceStyles.spacesCard}>
        <div className={workspaceStyles.cardHeading}>
          <div>
            <h2>Cartera del espacio</h2>
            <p>Solo los clientes disponibles para tu cuenta.</p>
          </div>
          {list.isSuccess && (
            <span
              className={workspaceStyles.count}
              aria-label={`${items.length} clientes`}
            >
              {items.length}
            </span>
          )}
        </div>
        {items.length > 0 && !list.isError && (
          <div className={workspaceStyles.listToolbar}>
            <div className={workspaceStyles.search}>
              <Icon name="search" />
              <label htmlFor="client-search" className="sr-only">
                Buscar clientes por nombre
              </label>
              <input
                id="client-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente por nombre…"
              />
              {search && (
                <button
                  type="button"
                  className={workspaceStyles.searchClear}
                  aria-label="Limpiar búsqueda de clientes"
                  onClick={() => {
                    setSearch('');
                    document.getElementById('client-search')?.focus();
                  }}
                >
                  <Icon name="close" />
                </button>
              )}
            </div>
            <div className={workspaceStyles.filterControl}>
              <label htmlFor="client-access-filter" className="sr-only">
                Filtrar clientes por tu acceso
              </label>
              <select
                id="client-access-filter"
                className="input"
                value={accessFilter}
                onChange={(event) => setAccessFilter(event.target.value)}
              >
                <option value="all">Todos los accesos</option>
                <option value="manage">Con edición</option>
                <option value="view">Solo consulta</option>
              </select>
            </div>
          </div>
        )}
        <div className={workspaceStyles.spacesBody}>
          {list.isPending ? (
            <div
              role="status"
              aria-busy="true"
              className={workspaceStyles.skeletonList}
            >
              <span className="sr-only">
                Cargando clientes de {workspace.name}…
              </span>
              {[1, 2, 3].map((item) => (
                <div key={item} className={workspaceStyles.skeletonRow}>
                  <span className={workspaceStyles.skeletonIcon} />
                  <span className={workspaceStyles.skeletonText} />
                </div>
              ))}
            </div>
          ) : list.isError ? (
            <EntityFeedback
              error={list.error}
              onRetry={() => void list.refetch()}
            />
          ) : items.length === 0 ? (
            <div className={workspaceStyles.empty}>
              <span className={workspaceStyles.emptyIcon}>
                <Icon name="user" />
              </span>
              <h3>Aún no hay clientes en este espacio.</h3>
              <p>
                {canCreate
                  ? 'Agrega tu primer cliente con su nombre legal y, si lo tienes, su NIT.'
                  : 'Aquí aparecerán los clientes que estén disponibles para tu cuenta.'}
              </p>
              {canCreate && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setCreating(true)}
                >
                  <Icon name="plus" />
                  Agregar primer cliente
                </Button>
              )}
            </div>
          ) : filtered.length === 0 ? (
            <div className={workspaceStyles.empty}>
              <span className={workspaceStyles.emptyIcon}>
                <Icon name="search" />
              </span>
              <h3>No encontramos ese cliente.</h3>
              <p>Prueba con otro nombre o restablece los filtros.</p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setAccessFilter('all');
                  document.getElementById('client-search')?.focus();
                }}
              >
                Restablecer filtros
              </Button>
            </div>
          ) : (
            <>
              <div className={styles.listLabels} aria-hidden="true">
                <span>Cliente</span>
                <span>NIT</span>
                <span>Acceso</span>
                <span />
              </div>
              <ul
                className={styles.list}
                aria-label="Clientes del espacio activo"
              >
                {filtered.map((entity) => (
                  <li key={entity.id}>
                    <Link
                      className={styles.row}
                      aria-label={`Ver cliente ${entity.legal_name}`}
                      to={`/workspaces/${workspace.id}/clients/${entity.id}`}
                    >
                      <span className={styles.identity}>
                        <span
                          className={`${workspaceStyles.spaceInitials} ${styles.clientAvatar}`}
                          aria-hidden="true"
                        >
                          {initials(entity.legal_name)}
                        </span>
                        <span className={styles.legalName}>
                          {entity.legal_name}
                        </span>
                      </span>
                      <span className={styles.tax}>
                        <span className="sr-only">NIT: </span>
                        {entityTaxLabel(entity)}
                      </span>
                      <span className={workspaceStyles.role}>
                        {entity.permissions.canManage
                          ? 'Edición permitida'
                          : 'Consulta'}
                      </span>
                      <Icon name="arrow-right" />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
        {list.isSuccess && items.length > 0 && (
          <p className={workspaceStyles.listSummary} role="status">
            {filtered.length} de {items.length}{' '}
            {items.length === 1 ? 'cliente' : 'clientes'}
          </p>
        )}
      </div>
      {!canCreate && !denied && (
        <p className={styles.note}>
          Puedes consultar los clientes disponibles. Crear clientes requiere un
          rol de propietario o administrador.
        </p>
      )}
      {creating && canCreate && (
        <CreateEntityDialog
          workspaceId={workspace.id}
          workspaceName={workspace.name}
          onClose={() => setCreating(false)}
          onCreated={(entity) => {
            setSearch('');
            setAccessFilter('all');
            setSuccess(`Se creó «${entity.legal_name}» correctamente.`);
          }}
        />
      )}
    </section>
  );
}
