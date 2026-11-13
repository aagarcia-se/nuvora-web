import { useEffect, useId, useRef } from 'react';
import { useBlocker } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import styles from '../client.module.css';

export function PurchaseDraftGuard({
  dirty,
  pending,
  onDiscard,
}: {
  dirty: boolean;
  pending: boolean;
  onDiscard: () => void;
}) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || pending) &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  useEffect(() => {
    if (!dirty && !pending) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty, pending]);
  return blocker.state === 'blocked' ? (
    <DiscardDialog
      pending={pending}
      dirty={dirty}
      onStay={() => blocker.reset()}
      onDiscard={() => {
        onDiscard();
        blocker.proceed();
      }}
    />
  ) : null;
}
function DiscardDialog({
  dirty,
  pending,
  onStay,
  onDiscard,
}: {
  dirty: boolean;
  pending: boolean;
  onStay: () => void;
  onDiscard: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className={styles.confirmDialog}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        onStay();
      }}
    >
      <h2 id={id}>
        {pending
          ? 'Estamos guardando tu comprobante'
          : dirty
            ? '¿Salir sin guardar los cambios?'
            : 'Puedes continuar'}
      </h2>
      <p>
        {pending
          ? 'Espera a que termine la operación antes de salir.'
          : dirty
            ? 'Los cambios que no has guardado se perderán. Los borradores ya guardados se conservan.'
            : 'El comprobante ya está guardado.'}
      </p>
      <div className={styles.formActions}>
        <Button type="button" variant="secondary" autoFocus onClick={onStay}>
          Continuar aquí
        </Button>
        {!pending && (
          <Button
            type="button"
            variant={dirty ? 'danger' : 'primary'}
            onClick={onDiscard}
          >
            {dirty ? 'Descartar cambios y salir' : 'Continuar'}
          </Button>
        )}
      </div>
    </dialog>
  );
}
