import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { isUuid } from '@/shared/utils/identifiers';
import { validPeriod } from '@/features/purchase-periods/api/purchasePeriodsApi';
import { useClientEntity } from '../api/useClientEntity';
import { ClientLayout } from '../components/ClientLayout';
import { ClientEntityContext } from '../components/ClientEntityContext';
import { ClientAccessDetails } from '../components/ClientAccessDetails';
import { ClientAccessState } from '../components/ClientAccessState';
import { PurchaseDocuments } from '../components/PurchaseDocuments';
import styles from '../client.module.css';

export function ClientEntityPage() {
  const { entityId = '' } = useParams();
  const [search] = useSearchParams();
  const workspaceId = search.get('workspaceId') ?? '';
  const { user } = useAuth();
  const draft = search.get('draft');
  const view = search.get('view');
  const document = search.get('document');
  const period = search.get('period');
  const valid =
    isUuid(entityId) &&
    isUuid(workspaceId) &&
    (draft === null || isUuid(draft)) &&
    (document === null || isUuid(document)) &&
    (view === null || view === 'documents' || view === 'summary') &&
    (period === null || validPeriod(period)) &&
    !(draft && view) &&
    !(document && (draft || view));
  return (
    <ClientLayout>
      {valid ? (
        <ClientEntityContent
          key={`${user?.id}:${workspaceId}:${entityId}`}
          workspaceId={workspaceId}
          entityId={entityId}
        />
      ) : (
        <div className={styles.state}>
          <h1>Enlace de acceso incompleto</h1>
          <p>
            Abre el enlace original compartido por tu contador para continuar.
          </p>
        </div>
      )}
    </ClientLayout>
  );
}
function ClientEntityContent({
  workspaceId,
  entityId,
}: {
  workspaceId: string;
  entityId: string;
}) {
  const { detail, entry } = useClientEntity(workspaceId, entityId);
  if (!detail.isSuccess || !detail.data)
    return (
      <ClientAccessState
        loading={detail.isPending}
        error={detail.error}
        onRetry={() => void detail.refetch()}
      />
    );
  const entity = detail.data;
  const acceptedRole =
    entry?.entityId === entityId && entry.workspaceId === workspaceId
      ? entry.role
      : undefined;
  return (
    <>
      <ClientEntityContext name={entity.legalName} />
      <PurchaseDocuments
        workspaceId={workspaceId}
        entityId={entityId}
        entityName={entity.legalName}
        canUpload={entity.permissions.canUpload}
      />
      <ClientAccessDetails
        entityName={entity.legalName}
        workspaceId={workspaceId}
        entityId={entityId}
        role={entity.role}
        acceptedRole={acceptedRole}
      />
    </>
  );
}
