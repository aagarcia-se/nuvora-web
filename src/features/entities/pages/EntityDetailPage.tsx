import { useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { displayDate } from '@/features/workspace/utils/workspacePresentation';
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
  entityId,
}: {
  workspaceId: string;
  workspaceName: string;
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
            Consulta la información disponible para tu cuenta.
          </p>
        </div>
        <Link
          className="btn-secondary"
          to={`/workspaces/${workspaceId}/clients`}
        >
          Volver a clientes
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
              <EntityForm
                entity={entity}
                pending={write.isPending}
                error={write.error}
                onCancel={cancelEdit}
                onClearError={() => write.reset()}
                onSave={async (input) => {
                  const patch: PatchEntityInput = {};
                  if (input.legalNameChanged) patch.legalName = input.legalName;
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
            ) : (
              <div className={styles.detailBody}>
                {message && (
                  <p className={styles.saved} role="status">
                    <Icon name="check" />
                    {message}
                  </p>
                )}
                <h2 ref={heading} tabIndex={-1} className={styles.clientName}>
                  {entity.legal_name}
                </h2>
                <dl className={styles.details}>
                  <div>
                    <dt>{canEdit ? 'NIT' : 'NIT protegido'}</dt>
                    <dd>{entityTaxLabel(entity)}</dd>
                  </div>
                  <div>
                    <dt>Tu acceso</dt>
                    <dd>{canEdit ? 'Consulta y edición' : 'Consulta'}</dd>
                  </div>
                  <div>
                    <dt>Registrado el</dt>
                    <dd>{displayDate(entity.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Última actualización</dt>
                    <dd>{displayDate(entity.updated_at)}</dd>
                  </div>
                </dl>
                {!canEdit && (
                  <p className={styles.note}>
                    Los datos disponibles y la edición dependen de tus permisos
                    en este espacio.
                  </p>
                )}
                <div className={workspaceStyles.dialogActions}>
                  {canEdit && (
                    <Button
                      type="button"
                      onClick={() => {
                        setEditing(true);
                        setMessage('');
                        write.reset();
                      }}
                    >
                      Editar cliente
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )
      )}
    </section>
  );
}
