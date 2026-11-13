import { EntityDialog } from '@/features/entities/components/EntityDialog';
import { Button } from '@/shared/ui/components/Button';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { revokeInvitation, revokeMembership } from '../api/accessApi';
import { useAccessAction } from '../hooks/useAccess';
import { useRefreshEntityAccess } from '../hooks/useRefreshEntityAccess';
import {
  clientRoles,
  type AccessContext,
  type InvitationRecord,
  type Membership,
} from '../types/access.types';
import { accessName } from '../utils/accessPresentation';
import { AccessFeedback } from './AccessFeedback';
import styles from '../access.module.css';

export type RevocationTarget =
  | { kind: 'person'; record: Membership }
  | { kind: 'invitation'; record: InvitationRecord };

export function RevokeAccessDialog({
  context,
  workspaceName,
  entityName,
  target,
  onCancel,
  onRevoked,
}: {
  context: AccessContext;
  workspaceName: string;
  entityName: string;
  target: RevocationTarget;
  onCancel: () => void;
  onRevoked: () => void;
}) {
  const action = useAccessAction(context);
  const refresh = useRefreshEntityAccess(context);
  const isPerson = target.kind === 'person';
  async function confirm() {
    const result = await action.run((id, signal) =>
      isPerson
        ? revokeMembership(id, context, target.record.id, signal)
        : revokeInvitation(id, context, target.record.id, signal),
    );
    if (!result) return;
    // Invalidation runs before the dialog unmounts; the API remains the authority.
    void refresh(isPerson);
    onRevoked();
  }
  return (
    <EntityDialog
      title={isPerson ? 'Revocar acceso' : 'Revocar invitación'}
      closeLabel="Cancelar revocación"
      workspaceName={workspaceName}
      busy={action.pending}
      onClose={onCancel}
      description={
        isPerson
          ? 'Esta persona perderá el acceso a este cliente. La revocación conserva el historial y no elimina la cuenta.'
          : 'Este enlace dejará de poder aceptarse. La revocación conserva el historial de la invitación.'
      }
    >
      <dl className={styles.confirmationDetails}>
        <div>
          <dt>Cliente</dt>
          <dd>{entityName}</dd>
        </div>
        {target.kind === 'person' && (
          <div>
            <dt>Persona</dt>
            <dd>{accessName(target.record.user)}</dd>
          </div>
        )}
        <div>
          <dt>Rol</dt>
          <dd>{clientRoles[target.record.role]}</dd>
        </div>
      </dl>
      <AccessFeedback error={action.error} />
      <div className={workspaceStyles.dialogActions}>
        <Button
          type="button"
          variant="secondary"
          autoFocus
          disabled={action.pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="danger"
          loading={action.pending}
          loadingLabel="Revocando…"
          onClick={() => void confirm()}
        >
          Confirmar revocación
        </Button>
      </div>
    </EntityDialog>
  );
}
