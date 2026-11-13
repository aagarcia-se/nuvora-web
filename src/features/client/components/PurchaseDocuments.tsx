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
import { PurchaseDocumentList } from './PurchaseDocumentList';
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
  const view =
    canUpload && search.get('view') !== 'documents' ? 'register' : 'documents';
  const draftId = search.get('draft');
  const { list, mutate } = usePurchaseDocuments(
    workspaceId,
    entityId,
    view === 'documents',
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
      {view === 'documents' || denied ? (
        <PurchaseDocumentList
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
        <Link className="btn-secondary" to={props.documentsPath}>
          Ver comprobantes
        </Link>
      </div>
    );
  return <ManualPurchaseForm document={detail.data} {...props} />;
}
