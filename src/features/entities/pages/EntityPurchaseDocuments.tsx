import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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
}: {
  workspaceId: string;
  entityId: string;
  canReview: boolean;
}) {
  const [search] = useSearchParams();
  const documentId = search.get('document');
  const [filter, setFilter] = useState('all');
  const returnPosition = useRef<PurchaseListPosition | null>(null);
  const { list, mutate } = usePurchaseDocuments(
    workspaceId,
    entityId,
    !documentId,
  );
  const path = `/workspaces/${workspaceId}/clients/${entityId}/documents`;
  if (documentId !== null && !isUuid(documentId))
    return (
      <div className="alert" role="alert">
        El enlace del comprobante no es válido.{' '}
        <Link to={path}>Volver a comprobantes</Link>
      </div>
    );
  return documentId ? (
    <PurchaseDocumentDetail
      key={documentId}
      workspaceId={workspaceId}
      entityId={entityId}
      documentId={documentId}
      canUpload={false}
      canReview={canReview}
      writer={mutate}
      documentsPath={path}
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
    />
  );
}
