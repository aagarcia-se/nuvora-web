import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import type {
  PurchaseDocument,
  PurchaseLifecycleActionKind,
} from '../types/purchaseDocument.types';
import { formatPurchaseTotal } from '../utils/purchasePresentation';
import styles from '../client.module.css';

export function PurchaseDiscardDialog({
  trigger,
  document,
  action,
  busy,
  busyLabel,
  error,
  blocked,
  onCancel,
  onConfirm,
}: {
  trigger: HTMLElement | null;
  document: PurchaseDocument;
  action: PurchaseLifecycleActionKind;
  busy: boolean;
  busyLabel: string;
  error: string;
  blocked: boolean;
  onCancel: () => void;
  onConfirm: (observation: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const id = useId();
  const [observation, setObservation] = useState('');
  const [invalid, setInvalid] = useState(false);
  const destructive = action === 'discard' || action === 'reject';
  const requiresText = action === 'return-to-draft' || action === 'reject';
  const titles = {
    discard: '¿Descartar este comprobante?',
    'return-to-draft': 'Solicitar una corrección',
    approve: '¿Aprobar internamente este comprobante?',
    reject: 'Rechazar el comprobante',
  };
  const labels = {
    discard: 'Descartar comprobante',
    'return-to-draft': 'Solicitar corrección',
    approve: 'Aprobar',
    reject: 'Rechazar',
  };
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [trigger]);
  return (
    <dialog
      ref={dialog}
      className={styles.confirmDialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        <Icon
          name={
            action === 'approve' ? 'check' : destructive ? 'alert' : 'message'
          }
        />
        {titles[action]}
      </h2>
      <p id={`${id}-description`}>
        {action === 'approve'
          ? 'La aprobación es interna de Nuvora. No significa validación SAT, pago ni incorporación automática a libros o declaraciones fiscales. El comprobante quedará bloqueado para edición.'
          : action === 'reject'
            ? 'Explica por qué no procede este comprobante. Se conservará en el historial y quedará bloqueado para edición, reenvío y descarte. Para permitir que el cliente lo corrija, cancela y elige «Solicitar corrección».'
            : action === 'discard'
              ? 'Se retirará del flujo de trabajo, pero no se eliminará físicamente. Quedará conservado en el historial con el estado «Descartado».'
              : 'Indica qué debe corregir el cliente. El comprobante quedará como «Requiere corrección» y podrá editarse y enviarse nuevamente.'}
      </p>
      <div className={styles.submissionSummary}>
        <span>{document.issuerName}</span>
        <strong>{formatPurchaseTotal(document.total)}</strong>
      </div>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (
            requiresText &&
            (!observation.trim() ||
              (action === 'reject' && observation.trim().length > 2000))
          ) {
            setInvalid(true);
            input.current?.focus();
            return;
          }
          if (!busy && !blocked) onConfirm(observation.trim());
        }}
      >
        {requiresText && (
          <div className={styles.field}>
            <label htmlFor={`${id}-observation`}>
              {action === 'reject'
                ? 'Motivo del rechazo'
                : 'Observación para el cliente'}
            </label>
            <textarea
              ref={input}
              id={`${id}-observation`}
              rows={4}
              required
              disabled={busy || blocked}
              value={observation}
              onChange={(event) => {
                setObservation(event.target.value);
                setInvalid(false);
              }}
              aria-invalid={invalid}
              aria-describedby={
                [
                  action === 'reject' ? `${id}-limit` : '',
                  invalid ? `${id}-invalid` : '',
                ]
                  .filter(Boolean)
                  .join(' ') || undefined
              }
              placeholder={
                action === 'reject'
                  ? 'Explica el motivo para dejar constancia de la decisión.'
                  : 'Explica qué dato debe corregirse y cómo revisarlo.'
              }
            />
            {action === 'reject' && (
              <p id={`${id}-limit`} className={styles.fieldHint}>
                Entre 1 y 2000 caracteres, sin contar espacios al inicio o al
                final. {observation.trim().length}/2000
              </p>
            )}
            {invalid && (
              <p id={`${id}-invalid`} className={styles.fieldError}>
                {action === 'reject'
                  ? 'Escribe un motivo de entre 1 y 2000 caracteres.'
                  : 'Escribe la observación antes de continuar.'}
              </p>
            )}
          </div>
        )}
        {error && (
          <p className="alert mt-4" role="alert">
            {error}
          </p>
        )}
        <div className={styles.formActions}>
          <Button
            type="button"
            autoFocus
            variant="secondary"
            disabled={busy}
            onClick={onCancel}
          >
            {action === 'discard' ? 'Conservar borrador' : 'Cancelar'}
          </Button>
          <Button
            type="submit"
            variant={destructive ? 'danger' : 'primary'}
            loading={busy}
            loadingLabel={busyLabel}
            disabled={blocked}
          >
            <Icon
              name={
                action === 'approve'
                  ? 'check'
                  : destructive
                    ? 'alert'
                    : 'message'
              }
            />
            {labels[action]}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
