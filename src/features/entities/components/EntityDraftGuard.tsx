import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';
import { Button } from '@/shared/ui/components/Button';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { EntityDialog } from './EntityDialog';

export function EntityDraftGuard({
  dirty,
  pending,
  workspaceName,
  onDiscard,
}: {
  dirty: boolean;
  pending: boolean;
  workspaceName: string;
  onDiscard: () => void;
}) {
  const protectDraft = dirty || pending;
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      protectDraft &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  useEffect(() => {
    if (!protectDraft) return;
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', beforeUnload);
    return () => window.removeEventListener('beforeunload', beforeUnload);
  }, [protectDraft]);
  if (blocker.state !== 'blocked') return null;
  function stay() {
    if (blocker.state === 'blocked') blocker.reset();
    requestAnimationFrame(() => {
      const input = document.querySelector<HTMLInputElement>(
        'input[name="legalName"]',
      );
      if (input && !input.disabled) input.focus();
      else document.getElementById('workspace-content')?.focus();
    });
  }
  return (
    <EntityDialog
      title={
        pending
          ? 'Guardando los cambios'
          : dirty
            ? '¿Descartar los cambios?'
            : 'Puedes continuar'
      }
      description={
        pending
          ? 'Espera a que termine el guardado antes de salir de esta sección.'
          : dirty
            ? 'Los cambios de los datos del cliente todavía no se han guardado.'
            : 'Los datos del cliente ya se guardaron.'
      }
      workspaceName={workspaceName}
      onClose={stay}
    >
      <div className={workspaceStyles.dialogActions}>
        <Button type="button" variant="secondary" autoFocus onClick={stay}>
          {dirty || pending ? 'Seguir editando' : 'Permanecer aquí'}
        </Button>
        {!pending && (
          <Button
            type="button"
            variant={dirty ? 'danger' : 'primary'}
            onClick={() => {
              onDiscard();
              blocker.proceed();
            }}
          >
            {dirty ? 'Descartar y continuar' : 'Continuar'}
          </Button>
        )}
      </div>
    </EntityDialog>
  );
}
