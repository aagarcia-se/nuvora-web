import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { useAuth } from '@/features/auth/store/authStore';
import { clientEntityPath } from '../api/useClientEntity';
import {
  usePurchaseDocument,
  usePurchaseDocuments,
} from '../api/usePurchaseDocuments';
import { purchaseDocumentMessage } from '../api/purchaseDocumentsApi';
import { ManualPurchaseForm } from './ManualPurchaseForm';
import {
  PurchaseDocumentList,
  type PurchaseListPosition,
} from './PurchaseDocumentList';
import { PurchaseDocumentDetail } from './PurchaseDocumentDetail';
import styles from '../client.module.css';

export function PurchaseDocuments({
  workspaceId,
  entityId,
  entityName,
  canUpload,
}: {
  workspaceId: string;
  entityId: string;
  entityName: string;
  canUpload: boolean;
}) {
  const [search] = useSearchParams();
  const [filter, setFilter] = useState('all');
  const returnPosition = useRef<PurchaseListPosition | null>(null);
  const documentId = search.get('document');
  const view =
    canUpload && !documentId && search.get('view') !== 'documents'
      ? 'register'
      : 'documents';
  const draftId = search.get('draft');
  useEffect(() => {
    if (view === 'register') returnPosition.current = null;
  }, [view]);
  const { list, mutate } = usePurchaseDocuments(
    workspaceId,
    entityId,
    view === 'documents' && !documentId,
  );
  const basePath = clientEntityPath(entityId, workspaceId);
  const documentsPath = `${basePath}&view=documents`;
  const denied =
    list.isError && [401, 403, 404].includes(errorStatus(list.error));
  return (
    <>
      <nav
        className={styles.clientNavigation}
        aria-label="Navegación de comprobantes"
      >
        {canUpload && (
          <Link
            to={basePath}
            aria-current={view === 'register' ? 'page' : undefined}
          >
            Registrar factura
          </Link>
        )}
        <Link
          to={documentsPath}
          aria-current={view === 'documents' ? 'page' : undefined}
        >
          Comprobantes
        </Link>
      </nav>
      {documentId ? (
        <PurchaseDocumentDetail
          key={documentId}
          workspaceId={workspaceId}
          entityId={entityId}
          documentId={documentId}
          canUpload={canUpload}
          documentsPath={documentsPath}
          editPath={`${basePath}&draft=${documentId}`}
        />
      ) : view === 'documents' || denied ? (
        <PurchaseDocumentList
          filter={filter}
          onFilterChange={setFilter}
          returnPosition={returnPosition}
          list={list}
          writer={mutate}
          registerPath={basePath}
          canUpload={canUpload && !denied}
        />
      ) : draftId ? (
        <DraftEditor
          key={draftId}
          workspaceId={workspaceId}
          entityId={entityId}
          documentId={draftId}
          entityName={entityName}
          writer={mutate}
          documentsPath={documentsPath}
          registerPath={basePath}
        />
      ) : (
        <ManualPurchaseForm
          entityName={entityName}
          writer={mutate}
          documentsPath={documentsPath}
          registerPath={basePath}
        />
      )}
    </>
  );
}
function DraftEditor({
  workspaceId,
  entityId,
  documentId,
  ...props
}: { workspaceId: string; entityId: string; documentId: string } & Omit<
  Parameters<typeof ManualPurchaseForm>[0],
  'document'
>) {
  const detail = usePurchaseDocument(workspaceId, entityId, documentId);
  const { logout } = useAuth();
  if (detail.isPending)
    return (
      <div className={styles.state} role="status">
        <h1>Abriendo borrador</h1>
        <p>Cargando el comprobante autorizado…</p>
      </div>
    );
  if (detail.isError)
    return (
      <div className={styles.state}>
        <h1>No pudimos abrir el borrador</h1>
        <p className="alert" role="alert">
          {purchaseDocumentMessage(detail.error)}
        </p>
        <Button
          type="button"
          variant="secondary"
          onClick={
            errorStatus(detail.error) === 401
              ? () => void logout()
              : () => void detail.refetch()
          }
        >
          {errorStatus(detail.error) === 401
            ? 'Volver a iniciar sesión'
            : 'Reintentar'}
        </Button>
      </div>
    );
  if (detail.data.status !== 'draft')
    return (
      <div className={styles.state}>
        <h1>Este comprobante ya está en revisión</h1>
        <p>Los datos enviados no se pueden editar desde este formulario.</p>
        <Link
          className="btn-primary"
          to={`${props.registerPath}&document=${documentId}`}
        >
          Ver detalle del comprobante
        </Link>
        <Link className="btn-secondary" to={props.documentsPath}>
          Ver comprobantes
        </Link>
      </div>
    );
  return <ManualPurchaseForm document={detail.data} {...props} />;
}
