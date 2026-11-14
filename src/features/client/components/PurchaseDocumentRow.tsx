import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { isRequestCanceled } from '@/shared/api/authenticatedRequest';
import type { usePurchaseDocuments } from '../api/usePurchaseDocuments';
import { purchaseDocumentMessage } from '../api/purchaseDocumentsApi';
import {
  purchaseDocumentTypes,
  type PurchaseDocument,
} from '../types/purchaseDocument.types';
import {
  formatPurchaseDate,
  formatPurchaseTotal,
} from '../utils/purchasePresentation';
import { PurchaseStatus } from './PurchaseStatus';
import styles from '../client.module.css';

export function PurchaseDocumentRow({
  document,
  canUpload,
  editPath,
  detailPath,
  onOpenDetail,
  writer,
}: {
  document: PurchaseDocument;
  canUpload: boolean;
  editPath: string;
  detailPath: string;
  onOpenDetail: () => void;
  writer: ReturnType<typeof usePurchaseDocuments>['mutate'];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const active = useRef(false);
  const busy = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function send() {
    if (busy.current || writer.isPending) return;
    busy.current = true;
    setPending(true);
    setError('');
    try {
      const current = await writer.mutateAsync({
        kind: 'check',
        id: document.id,
      });
      if (!active.current) return;
      if (current.status === 'draft')
        await writer.mutateAsync({ kind: 'submit', id: document.id });
    } catch (cause) {
      if (active.current && !isRequestCanceled(cause))
        setError(purchaseDocumentMessage(cause, 'write'));
    } finally {
      busy.current = false;
      if (active.current) setPending(false);
    }
  }
  return (
    <li className={styles.purchaseRow}>
      <div className={styles.purchaseRowMain}>
        <div>
          <div className={styles.purchaseMeta}>
            <PurchaseStatus status={document.status} />
            <span>{formatPurchaseDate(document.issueDate)}</span>
          </div>
          <h2>{document.issuerName}</h2>
          <p>
            {document.category} · {purchaseDocumentTypes[document.documentType]}
          </p>
          {document.status === 'needs_correction' && (
            <p className={styles.correctionHint}>
              Consulta la observación del contador antes de corregir.
            </p>
          )}
        </div>
        <strong>{formatPurchaseTotal(document.total)}</strong>
      </div>
      <div className={styles.rowActions}>
        <Link
          className={styles.detailAction}
          to={detailPath}
          data-document-id={document.id}
          aria-label={`Ver detalle de ${document.issuerName}`}
          aria-disabled={pending}
          onClick={(event) => {
            if (pending) event.preventDefault();
            else if (
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              event.button === 0
            )
              onOpenDetail();
          }}
        >
          Ver detalle
          <Icon name="arrow-right" />
        </Link>
        {canUpload &&
          ['draft', 'needs_correction'].includes(document.status) && (
            <Link
              className="btn-secondary"
              to={editPath}
              aria-disabled={writer.isPending || pending}
              onClick={(event) => {
                if (writer.isPending || pending) event.preventDefault();
              }}
            >
              {document.status === 'needs_correction'
                ? 'Corregir comprobante'
                : 'Continuar borrador'}
            </Link>
          )}
        {canUpload && document.status === 'draft' && (
          <Button
            type="button"
            loading={pending}
            loadingLabel="Enviando…"
            disabled={writer.isPending && !pending}
            onClick={() => void send()}
          >
            Enviar a revisión
          </Button>
        )}
      </div>
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
