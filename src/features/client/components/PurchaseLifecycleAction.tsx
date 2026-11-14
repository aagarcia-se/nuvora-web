import { useEffect, useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import {
  ApiRequestError,
  errorStatus,
  isRequestCanceled,
} from '@/shared/api/authenticatedRequest';
import type { usePurchaseDocuments } from '../api/usePurchaseDocuments';
import { purchaseDocumentMessage } from '../api/purchaseDocumentsApi';
import type { PurchaseDocument } from '../types/purchaseDocument.types';
import { PurchaseDiscardDialog } from './PurchaseDiscardDialog';
import styles from '../client.module.css';

export function PurchaseLifecycleAction({
  document,
  writer,
  canUpload,
  canReview,
  onRefresh,
}: {
  document: PurchaseDocument;
  writer: ReturnType<typeof usePurchaseDocuments>['mutate'];
  canUpload: boolean;
  canReview: boolean;
  onRefresh: () => void;
}) {
  const action =
    canReview && document.status === 'pending_review'
      ? 'return-to-draft'
      : 'discard';
  const eligible =
    action === 'return-to-draft' || (canUpload && document.status === 'draft');
  const [opened, setOpened] = useState<'discard' | 'return-to-draft' | null>(
    null,
  );
  const [phase, setPhase] = useState<'idle' | 'checking' | 'changing'>('idle');
  const [error, setError] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [feedback, setFeedback] = useState('');
  const result = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (feedback) result.current?.focus({ preventScroll: true });
  }, [feedback]);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  const busy = useRef(false);
  const active = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  async function confirm(observation: string) {
    if (!opened || busy.current || writer.isPending || blocked) return;
    busy.current = true;
    setError('');
    setPhase('checking');
    let wrote = false;
    try {
      const current = await writer.mutateAsync({
        kind: 'check',
        id: document.id,
      });
      if (!active.current) return;
      const target = opened === 'discard' ? 'discarded' : 'needs_correction';
      if (current.status !== target) {
        const expected = opened === 'discard' ? 'draft' : 'pending_review';
        if (current.status !== expected)
          throw new ApiRequestError(409, 'PURCHASE_STATE_CHANGED');
        setPhase('changing');
        wrote = true;
        const result = await writer.mutateAsync(
          opened === 'discard'
            ? { kind: 'discard', id: document.id }
            : { kind: 'return-to-draft', id: document.id, observation },
        );
        if (result.status !== target)
          throw new ApiRequestError(502, 'INVALID_PURCHASE_TRANSITION');
      }
      if (!active.current) return;
      setOpened(null);
      setFeedback(
        opened === 'discard'
          ? 'El comprobante está descartado y se conserva en el historial.'
          : 'El comprobante requiere corrección. El cliente puede revisar la observación y actualizar sus datos.',
      );
      onRefresh();
    } catch (cause) {
      if (!active.current || isRequestCanceled(cause)) return;
      const status = errorStatus(cause);
      setBlocked([401, 403, 404, 409].includes(status));
      setError(
        wrote && (status === 0 || status >= 500)
          ? 'No pudimos confirmar la acción. Al volver a confirmar comprobaremos primero el estado del mismo comprobante, sin repetir la operación si ya se realizó.'
          : purchaseDocumentMessage(cause, 'write'),
      );
    } finally {
      busy.current = false;
      if (active.current) setPhase('idle');
    }
  }
  return (
    <>
      {feedback && (
        <p ref={result} tabIndex={-1} className="success-alert" role="status">
          {feedback}
        </p>
      )}
      {eligible && (
        <section
          className={
            action === 'discard'
              ? styles.detailDangerAction
              : styles.reviewAction
          }
          aria-label={
            action === 'discard'
              ? 'Descarte del comprobante'
              : 'Revisión del contador'
          }
        >
          <div>
            <h2>
              {action === 'discard'
                ? 'Retirar del flujo'
                : '¿Hay datos por corregir?'}
            </h2>
            <p>
              {action === 'discard'
                ? 'Descarta este borrador si ya no debe continuar. Sus datos se conservan en el historial.'
                : 'Envía una observación clara para que el cliente pueda corregir el comprobante.'}
            </p>
          </div>
          <Button
            type="button"
            variant={action === 'discard' ? 'danger' : 'secondary'}
            disabled={writer.isPending || phase !== 'idle'}
            onClick={(event) => {
              setTrigger(event.currentTarget);
              setFeedback('');
              setError('');
              setBlocked(false);
              setOpened(action);
            }}
          >
            <Icon name={action === 'discard' ? 'alert' : 'message'} />
            {action === 'discard'
              ? 'Descartar comprobante'
              : 'Solicitar corrección'}
          </Button>
        </section>
      )}
      {opened && (
        <PurchaseDiscardDialog
          trigger={trigger}
          document={document}
          action={opened}
          busy={phase !== 'idle'}
          busyLabel={
            phase === 'checking'
              ? 'Comprobando…'
              : opened === 'discard'
                ? 'Descartando…'
                : 'Enviando observación…'
          }
          error={error}
          blocked={blocked}
          onCancel={() => {
            setOpened(null);
            if (blocked) onRefresh();
          }}
          onConfirm={(observation) => void confirm(observation)}
        />
      )}
    </>
  );
}
