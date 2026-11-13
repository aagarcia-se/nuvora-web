import { EntityAccessPanel } from '@/features/access/components/EntityAccessPanel';
import type { WorkspaceRole } from '@/features/workspace/types/workspace.types';
import { useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import {
  displayDate,
  initials,
} from '@/features/workspace/utils/workspacePresentation';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { useEntity, useEntityWrite } from '../api/useEntityQueries';
import { entityTaxLabel } from '../utils/entityPresentation';
import type { PatchEntityInput } from '../types/entity.types';
import { Link } from 'react-router-dom';
import { EntityFeedback } from '../components/EntityFeedback';
import { EntityForm } from '../components/EntityForm';
import styles from '../entities.module.css';

export function EntityDetailPage({
  workspaceId,
  workspaceName,
  workspaceRole,
  entityId,
}: {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: WorkspaceRole;
  entityId: string;
}) {
  const detail = useEntity(workspaceId, entityId);
  const write = useEntityWrite(workspaceId);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const entity = detail.isSuccess ? detail.data : undefined;
  const canEdit = Boolean(entity?.permissions.canManage);
  const editingAllowed = editing && canEdit;
  function cancelEdit() {
    setEditing(false);
    write.reset();
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <section className={styles.detailPage}>
      <header className={workspaceStyles.pageHeading}>
        <div>
          <p className={workspaceStyles.eyebrow}>
            Espacio activo: {workspaceName}
          </p>
          <h1>{editingAllowed ? 'Editar cliente' : 'Detalle del cliente'}</h1>
          <p className={workspaceStyles.intro}>
            {editingAllowed
              ? 'Actualiza los datos. Solo se guardarán los cambios que realices.'
              : 'Información del cliente y opciones de acceso en un mismo lugar.'}
          </p>
        </div>
        <Link
          className={workspaceStyles.backLink}
          to={`/workspaces/${workspaceId}/clients`}
        >
          <Icon name="arrow-right" /> Volver a clientes
        </Link>
      </header>
      {detail.isPending ? (
        <p role="status" className={styles.detailLoading}>
          Cargando información del cliente…
        </p>
      ) : detail.isError ? (
        <div className={styles.detailLoading}>
          <EntityFeedback
            error={detail.error}
            onRetry={() => void detail.refetch()}
          />
        </div>
      ) : (
        entity && (
          <>
            {editingAllowed ? (
              <div className={styles.editCard}>
                <EntityForm
                  entity={entity}
                  pending={write.isPending}
                  error={write.error}
                  onCancel={cancelEdit}
                  onClearError={() => write.reset()}
                  onSave={async (input) => {
                    const patch: PatchEntityInput = {};
                    if (input.legalNameChanged)
                      patch.legalName = input.legalName;
                    if (input.taxId !== undefined) patch.taxId = input.taxId;
                    await write.mutateAsync({
                      kind: 'patch',
                      entityId,
                      input: patch,
                    });
                    setEditing(false);
                    setMessage('Cambios guardados.');
                    requestAnimationFrame(() => heading.current?.focus());
                  }}
                />
              </div>
            ) : (
              <div className={styles.detailBody}>
                {message && (
                  <p className={styles.saved} role="status">
                    <Icon name="check" />
                    {message}
                  </p>
                )}
                <div className={styles.detailIdentity}>
                  <span className={styles.detailAvatar} aria-hidden="true">
                    {initials(entity.legal_name)}
                  </span>
                  <div className={styles.detailIdentityCopy}>
                    <p className={styles.detailKicker}>Ficha del cliente</p>
                    <h2
                      ref={heading}
                      tabIndex={-1}
                      className={styles.clientName}
                    >
                      {entity.legal_name}
                    </h2>
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setMessage('');
                        write.reset();
                      }}
                    >
                      <Icon name="pencil" />
                      Editar cliente
                    </Button>
                  )}
                </div>
                <dl className={styles.details}>
                  <div>
                    <dt>
                      <Icon name="id-card" />
                      {canEdit ? 'NIT' : 'NIT protegido'}
                    </dt>
                    <dd>{entityTaxLabel(entity)}</dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="shield" />
                      Tu acceso
                    </dt>
                    <dd>
                      <span className={styles.accessValue}>
                        {canEdit ? 'Consulta y edición' : 'Consulta'}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="calendar" />
                      Registrado el
                    </dt>
                    <dd>{displayDate(entity.created_at)}</dd>
                  </div>
                  <div>
                    <dt>
                      <Icon name="clock" />
                      Última actualización
                    </dt>
                    <dd>{displayDate(entity.updated_at)}</dd>
                  </div>
                </dl>
                <div className={styles.detailActions}>
                  <p className={styles.actionHint}>
                    La información y la edición disponibles dependen de tus
                    permisos en este espacio.
                  </p>
                </div>
              </div>
            )}
            {canEdit &&
              (workspaceRole === 'owner' || workspaceRole === 'admin') && (
                <EntityAccessPanel
                  key={`${workspaceId}:${entityId}`}
                  context={{ workspaceId, entityId }}
                  workspaceName={workspaceName}
                  entityName={entity.legal_name}
                />
              )}
          </>
        )
      )}
    </section>
  );
}
