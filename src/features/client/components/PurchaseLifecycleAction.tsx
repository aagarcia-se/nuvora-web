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
import type {
  PurchaseDocument,
  PurchaseLifecycleActionKind,
} from '../types/purchaseDocument.types';
import { PurchaseDiscardDialog } from './PurchaseDiscardDialog';
import styles from '../client.module.css';

export function PurchaseLifecycleAction({
  document,
  writer,
  canUpload,
  canReview,
  canDecide,
  onRefresh,
}: {
  document: PurchaseDocument;
  writer: ReturnType<typeof usePurchaseDocuments>['mutate'];
  canUpload: boolean;
  canReview: boolean;
  canDecide: boolean;
  onRefresh: () => void;
}) {
  const action =
    (canReview || canDecide) && document.status === 'pending_review'
      ? 'return-to-draft'
      : 'discard';
  const eligible =
    action === 'return-to-draft' || (canUpload && document.status === 'draft');
  const [opened, setOpened] = useState<PurchaseLifecycleActionKind | null>(
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
    if ((opened === 'approve' || opened === 'reject') && !canDecide) return;
    if (opened === 'return-to-draft' && !canReview) return;
    if (opened === 'discard' && !canUpload) return;
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
      const target = {
        discard: 'discarded',
        'return-to-draft': 'needs_correction',
        approve: 'approved',
        reject: 'rejected',
      }[opened];
      if (current.status !== target) {
        const expected = opened === 'discard' ? 'draft' : 'pending_review';
        if (current.status !== expected)
          throw new ApiRequestError(409, 'PURCHASE_STATE_CHANGED');
        setPhase('changing');
        wrote = true;
        const result = await writer.mutateAsync(
          opened === 'approve'
            ? { kind: 'approve', id: document.id }
            : opened === 'reject'
              ? { kind: 'reject', id: document.id, reason: observation }
              : opened === 'discard'
                ? { kind: 'discard', id: document.id }
                : { kind: 'return-to-draft', id: document.id, observation },
        );
        if (result.status !== target)
          throw new ApiRequestError(502, 'INVALID_PURCHASE_TRANSITION');
      }
      if (!active.current) return;
      setOpened(null);
      setFeedback(
        opened === 'approve'
          ? 'El comprobante está aprobado internamente en Nuvora. Esta decisión no implica validación SAT, pago ni registro automático en libros.'
          : opened === 'reject'
            ? 'El comprobante está rechazado y se conserva en el historial.'
            : opened === 'discard'
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
              {action === 'discard' ? 'Retirar del flujo' : 'Revisión interna'}
            </h2>
            <p>
              {action === 'discard'
                ? 'Descarta este borrador si ya no debe continuar. Sus datos se conservan en el historial.'
                : 'Revisa los datos antes de decidir. Puedes solicitar una corrección si el cliente debe completar o ajustar la información.'}
            </p>
          </div>
          <div className={styles.reviewButtons}>
            {canDecide && action === 'return-to-draft' && (
              <Button
                type="button"
                disabled={writer.isPending || phase !== 'idle'}
                onClick={(event) => {
                  setTrigger(event.currentTarget);
                  setFeedback('');
                  setError('');
                  setBlocked(false);
                  setOpened('approve');
                }}
              >
                <Icon name="check" />
                Aprobar
              </Button>
            )}
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
            {canDecide && action === 'return-to-draft' && (
              <Button
                type="button"
                variant="danger"
                disabled={writer.isPending || phase !== 'idle'}
                onClick={(event) => {
                  setTrigger(event.currentTarget);
                  setFeedback('');
                  setError('');
                  setBlocked(false);
                  setOpened('reject');
                }}
              >
                <Icon name="close" />
                Rechazar
              </Button>
            )}
          </div>
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
              : opened === 'approve'
                ? 'Aprobando…'
                : opened === 'reject'
                  ? 'Rechazando…'
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
