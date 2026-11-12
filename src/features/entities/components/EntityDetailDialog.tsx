import { useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { displayDate } from '@/features/workspace/utils/workspacePresentation';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { useEntity, useEntityWrite } from '../api/useEntityQueries';
import { entityTaxLabel } from '../utils/entityPresentation';
import type { Entity, PatchEntityInput } from '../types/entity.types';
import { EntityDialog } from './EntityDialog';
import { EntityFeedback } from './EntityFeedback';
import { EntityForm } from './EntityForm';
import styles from '../entities.module.css';

export function EntityDetailDialog({
  workspaceId,
  workspaceName,
  entityId,
  onClose,
  onUpdated,
}: {
  workspaceId: string;
  workspaceName: string;
  entityId: string;
  onClose: () => void;
  onUpdated: (entity: Entity) => void;
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
    <EntityDialog
      title={editingAllowed ? 'Editar cliente' : 'Detalle del cliente'}
      description="Consulta la información disponible para tu cuenta."
      workspaceName={workspaceName}
      busy={write.isPending}
      onClose={onClose}
    >
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
                  const result = await write.mutateAsync({
                    kind: 'patch',
                    entityId,
                    input: patch,
                  });
                  onUpdated(result);
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
                <h3 ref={heading} tabIndex={-1} className={styles.clientName}>
                  {entity.legal_name}
                </h3>
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
                  <Button type="button" variant="secondary" onClick={onClose}>
                    Cerrar detalle
                  </Button>
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
    </EntityDialog>
  );
}
