import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import type { PurchaseDocument } from '../types/purchaseDocument.types';
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
  action: 'discard' | 'return-to-draft';
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
  const destructive = action === 'discard';
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
        <Icon name={destructive ? 'alert' : 'message'} />
        {destructive
          ? '¿Descartar este comprobante?'
          : 'Solicitar una corrección'}
      </h2>
      <p id={`${id}-description`}>
        {destructive
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
          if (!destructive && !observation.trim()) {
            setInvalid(true);
            input.current?.focus();
            return;
          }
          if (!busy && !blocked) onConfirm(observation.trim());
        }}
      >
        {!destructive && (
          <div className={styles.field}>
            <label htmlFor={`${id}-observation`}>
              Observación para el cliente
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
              aria-describedby={invalid ? `${id}-invalid` : undefined}
              placeholder="Explica qué dato debe corregirse y cómo revisarlo."
            />
            {invalid && (
              <p id={`${id}-invalid`} className={styles.fieldError}>
                Escribe la observación antes de continuar.
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
            {destructive ? 'Conservar borrador' : 'Cancelar'}
          </Button>
          <Button
            type="submit"
            variant={destructive ? 'danger' : 'primary'}
            loading={busy}
            loadingLabel={busyLabel}
            disabled={blocked}
          >
            <Icon name={destructive ? 'alert' : 'message'} />
            {destructive ? 'Descartar comprobante' : 'Solicitar corrección'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
