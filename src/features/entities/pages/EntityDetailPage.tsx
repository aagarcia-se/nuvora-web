import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { WorkspaceRole } from '@/features/workspace/types/workspace.types';
import { EntityMembersPage } from '@/features/access/pages/EntityMembersPage';
import { EntityInvitationsPage } from '@/features/access/pages/EntityInvitationsPage';
import { useEntity, useEntityWrite } from '../api/useEntityQueries';
import type { PatchEntityInput } from '../types/entity.types';
import { EntityFeedback } from '../components/EntityFeedback';
import { EntityDraftGuard } from '../components/EntityDraftGuard';
import { EntityHeader, type EntitySection } from '../components/EntityHeader';
import { EntityDataSection } from '../components/EntityDataSection';
import { EntityPurchaseDocuments } from './EntityPurchaseDocuments';
import styles from '../entities.module.css';

export function EntityDetailPage({
  workspaceId,
  workspaceName,
  workspaceRole,
  entityId,
  section = 'data',
}: {
  workspaceId: string;
  workspaceName: string;
  workspaceRole: WorkspaceRole;
  entityId: string;
  section?: EntitySection;
}) {
  const detail = useEntity(workspaceId, entityId);
  const write = useEntityWrite(workspaceId);
  const [editing, setEditing] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const entity = detail.isSuccess ? detail.data : undefined;
  const canEdit = Boolean(entity?.permissions.canManage);
  const canManageAccess =
    canEdit && (workspaceRole === 'owner' || workspaceRole === 'admin');
  const basePath = `/workspaces/${workspaceId}/clients/${entityId}`;
  function cancelEdit() {
    setEditing(false);
    setDirty(false);
    write.reset();
    requestAnimationFrame(() => heading.current?.focus());
  }
  return (
    <section className={styles.detailPage}>
      {detail.isPending ? (
        <div role="status" className={styles.dataSection}>
          <h1>Cargando cliente</h1>
          <p className={styles.detailLoading}>
            Comprobando la información disponible para tu cuenta…
          </p>
        </div>
      ) : detail.isError ? (
        <>
          <h1 className="mb-6 text-2xl font-semibold">
            No pudimos abrir este cliente
          </h1>
          <EntityFeedback
            error={detail.error}
            onRetry={() => void detail.refetch()}
          />
        </>
      ) : (
        entity && (
          <>
            <EntityHeader
              name={entity.legal_name}
              workspaceName={workspaceName}
              basePath={basePath}
              section={section}
              canManageAccess={canManageAccess}
              headingRef={heading}
            />
            {section === 'data' ? (
              <EntityDataSection
                entity={entity}
                editing={editing && canEdit}
                pending={write.isPending}
                error={write.error}
                message={message}
                onEdit={() => {
                  setEditing(true);
                  setDirty(false);
                  setMessage('');
                  write.reset();
                }}
                onCancel={cancelEdit}
                onClearError={() => write.reset()}
                onDirtyChange={setDirty}
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
                  setDirty(false);
                  setMessage('Cambios guardados.');
                  requestAnimationFrame(() => heading.current?.focus());
                }}
              />
            ) : section === 'documents' ? (
              <EntityPurchaseDocuments
                workspaceId={workspaceId}
                entityId={entityId}
                canReview={
                  entity.permissions.canReview || entity.permissions.canManage
                }
              />
            ) : !canManageAccess ? (
              <div className={styles.dataSection}>
                <h2>No tienes permisos para administrar accesos</h2>
                <p className={styles.note}>
                  Puedes consultar los datos que estén disponibles para tu
                  cuenta.
                </p>
                <Link className="btn-secondary" to={basePath}>
                  Ver datos del cliente
                </Link>
              </div>
            ) : section === 'people' ? (
              <EntityMembersPage
                context={{ workspaceId, entityId }}
                workspaceName={workspaceName}
                entityName={entity.legal_name}
                invitationsPath={`${basePath}/invitations`}
              />
            ) : null}
            {canManageAccess && (
              <EntityInvitationsPage
                context={{ workspaceId, entityId }}
                workspaceName={workspaceName}
                entityName={entity.legal_name}
                active={section === 'invitations'}
              />
            )}
            {canEdit && (
              <EntityDraftGuard
                dirty={editing && dirty}
                pending={editing && write.isPending}
                workspaceName={workspaceName}
                onDiscard={() => {
                  setEditing(false);
                  setDirty(false);
                }}
              />
            )}
          </>
        )
      )}
    </section>
  );
}
