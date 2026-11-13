import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
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
import styles from '../client.module.css';

export function PurchaseDocumentRow({
  document,
  canUpload,
  editPath,
  writer,
}: {
  document: PurchaseDocument;
  canUpload: boolean;
  editPath: string;
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
            <span
              className={
                document.status === 'draft'
                  ? styles.statusDraft
                  : styles.statusReview
              }
            >
              {document.status === 'draft'
                ? 'Borrador'
                : 'Pendiente de revisión'}
            </span>
            <span>{formatPurchaseDate(document.issueDate)}</span>
          </div>
          <h2>{document.issuerName}</h2>
          <p>
            {document.category} · {purchaseDocumentTypes[document.documentType]}
          </p>
        </div>
        <strong>{formatPurchaseTotal(document.total)}</strong>
      </div>
      {canUpload && document.status === 'draft' && (
        <div className={styles.rowActions}>
          <Link
            className="btn-secondary"
            to={editPath}
            aria-disabled={writer.isPending}
            onClick={(event) => {
              if (writer.isPending) event.preventDefault();
            }}
          >
            Continuar borrador
          </Link>
          <Button
            type="button"
            loading={pending}
            loadingLabel="Enviando…"
            disabled={writer.isPending && !pending}
            onClick={() => void send()}
          >
            Enviar a revisión
          </Button>
        </div>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
