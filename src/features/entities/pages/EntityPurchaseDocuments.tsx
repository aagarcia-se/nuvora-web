import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { validPeriod } from '@/features/purchase-periods/api/purchasePeriodsApi';
import { PurchasePeriodSummary } from '@/features/purchase-periods/components/PurchasePeriodSummary';
import { guatemalaDate } from '@/features/client/utils/purchasePresentation';
import styles from '@/features/client/client.module.css';
import { isUuid } from '@/shared/utils/identifiers';
import { usePurchaseDocuments } from '@/features/client/api/usePurchaseDocuments';
import { PurchaseDocumentDetail } from '@/features/client/components/PurchaseDocumentDetail';
import {
  PurchaseDocumentList,
  type PurchaseListPosition,
} from '@/features/client/components/PurchaseDocumentList';

export function EntityPurchaseDocuments({
  workspaceId,
  entityId,
  canReview,
  canDecide,
  canManagePeriod,
  canViewPeriod,
}: {
  workspaceId: string;
  entityId: string;
  canReview: boolean;
  canDecide: boolean;
  canManagePeriod: boolean;
  canViewPeriod: boolean;
}) {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const documentId = search.get('document');
  const view = search.get('view');
  const period = search.get('period') ?? '';
  const summaryPeriod = period || guatemalaDate().slice(0, 7);
  const isSummary = view === 'summary';
  const valid =
    (documentId === null || isUuid(documentId)) &&
    (view === null || isSummary) &&
    !(documentId && view) &&
    (!period || validPeriod(period));
  const [filter, setFilter] = useState('all');
  const returnPosition = useRef<PurchaseListPosition | null>(null);
  const { list, mutate } = usePurchaseDocuments(
    workspaceId,
    entityId,
    valid && !documentId && !isSummary,
  );
  const path = `/workspaces/${workspaceId}/clients/${entityId}/documents`;
  if (!valid)
    return (
      <div className="alert" role="alert">
        El enlace del comprobante no es válido.{' '}
        <Link to={path}>Volver a comprobantes</Link>
      </div>
    );
  const documentsPath = `${path}${period ? `?period=${period}` : ''}`;
  return (
    <>
      <nav
        className={styles.clientNavigation}
        aria-label="Vistas de comprobantes"
      >
        <Link to={documentsPath} aria-current={!isSummary ? 'page' : undefined}>
          Registros
        </Link>
        {canViewPeriod && (
          <Link
            to={`${path}?view=summary&period=${summaryPeriod}`}
            aria-current={isSummary ? 'page' : undefined}
          >
            Resumen mensual
          </Link>
        )}
      </nav>
      {isSummary && !canViewPeriod ? (
        <section
          className={styles.state}
          aria-labelledby="monthly-access-title"
        >
          <h2 id="monthly-access-title">
            No tienes permiso para consultar el resumen mensual
          </h2>
          <p role="alert">
            La consulta requiere ser propietario o administrador del espacio y
            tener permiso para ver o gestionar esta entidad.
          </p>
          <Link to={documentsPath} className="btn-secondary">
            Volver a comprobantes
          </Link>
        </section>
      ) : isSummary ? (
        <PurchasePeriodSummary
          workspaceId={workspaceId}
          entityId={entityId}
          period={summaryPeriod}
          canManage={canManagePeriod}
          headingLevel={2}
          documentsPath={`${path}?period=${summaryPeriod}`}
          onPeriodChange={(next) =>
            navigate(`${path}?view=summary&period=${next}`, { replace: true })
          }
        />
      ) : documentId ? (
        <PurchaseDocumentDetail
          key={documentId}
          workspaceId={workspaceId}
          entityId={entityId}
          documentId={documentId}
          canUpload={false}
          canManagePhoto={canManagePeriod}
          canReview={canReview}
          canDecide={canDecide}
          writer={mutate}
          documentsPath={documentsPath}
          editPath={path}
          headingLevel={2}
        />
      ) : (
        <PurchaseDocumentList
          list={list}
          writer={mutate}
          registerPath={path}
          canUpload={false}
          filter={filter}
          onFilterChange={setFilter}
          returnPosition={returnPosition}
          headingLevel={2}
          documentPath={`${path}?document=`}
          period={period}
        />
      )}
    </>
  );
}
