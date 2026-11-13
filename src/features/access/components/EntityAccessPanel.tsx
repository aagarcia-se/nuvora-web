import { useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { entityKeys } from '@/features/entities/api/useEntityQueries';
import { EntityDialog } from '@/features/entities/components/EntityDialog';
import { displayDate } from '@/features/workspace/utils/workspacePresentation';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import {
  createInvitation,
  revokeInvitation,
  revokeMembership,
} from '../api/accessApi';
import {
  invitationKey,
  membershipKey,
  useAccessAction,
  useInvitations,
  useMemberships,
} from '../hooks/useAccess';
import {
  clientRoles,
  type AccessContext,
  type ClientRole,
  type Invitation,
  type InvitationRecord,
  type Membership,
  type AccessProfile,
} from '../types/access.types';
import { AccessFeedback } from './AccessFeedback';
import { ShareInvitation } from './ShareInvitation';
import styles from '../access.module.css';

type Props = {
  context: AccessContext;
  workspaceName: string;
  entityName: string;
};
export function EntityAccessPanel(props: Props) {
  const [opened, setOpened] = useState(true);
  return (
    <section className={styles.panel} aria-labelledby="client-access-title">
      <div className={styles.heading}>
        <div>
          <h2 id="client-access-title">
            <Icon name="shield" />
            Compartir acceso
          </h2>
          <p>Invita a este cliente sin compartir tu despacho.</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          aria-expanded={opened}
          aria-controls="client-access-content"
          onClick={() => setOpened((value) => !value)}
        >
          {opened ? 'Cerrar accesos' : 'Administrar accesos'}
        </Button>
      </div>
      {opened && (
        <div id="client-access-content">
          <AccessContent {...props} />
        </div>
      )}
    </section>
  );
}
function AccessContent({ context, workspaceName, entityName }: Props) {
  const { user } = useAuth();
  const client = useQueryClient();
  const [membersOpen, setMembersOpen] = useState(false);
  const [invitationsOpen, setInvitationsOpen] = useState(true);
  const members = useMemberships(context, membersOpen);
  const invitationHistory = useInvitations(context, invitationsOpen);
  const action = useAccessAction(context);
  const [role, setRole] = useState<ClientRole>('client_viewer');
  const [invitations, setInvitations] = useState<
    (Invitation & { role: ClientRole })[]
  >([]);
  const [revoking, setRevoking] = useState<Membership | null>(null);
  const [revokingInvitation, setRevokingInvitation] =
    useState<InvitationRecord | null>(null);
  const [notice, setNotice] = useState('');
  const confirmation = useRef<HTMLParagraphElement>(null);
  const revokeTrigger = useRef<HTMLButtonElement | null>(null);
  const revokeInvitationTrigger = useRef<HTMLButtonElement | null>(null);
  const denied =
    members.isError && [401, 403, 404].includes(errorStatus(members.error));
  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (action.pending) return;
    setNotice('');
    const result = await action.run((id, signal) =>
      createInvitation(id, context, role, signal),
    );
    if (result) {
      setInvitations((previous) => [{ ...result, role }, ...previous]);
      setNotice('Enlace listo para compartir.');
    }
  }
  async function revoke() {
    if (!revoking) return;
    const result = await action.run((id, signal) =>
      revokeMembership(id, context, revoking.id, signal),
    );
    if (result) {
      setRevoking(null);
      setNotice('Membresía revocada. El historial se conserva.');
      requestAnimationFrame(() => confirmation.current?.focus());
      if (user) {
        // Remove stale permissions/data and re-check the active entity.
        void client.cancelQueries({
          queryKey: entityKeys.detail(
            user.id,
            context.workspaceId,
            context.entityId,
          ),
        });
        client.removeQueries({
          queryKey: entityKeys.list(user.id, context.workspaceId),
        });
        void client.invalidateQueries({
          queryKey: entityKeys.detail(
            user.id,
            context.workspaceId,
            context.entityId,
          ),
        });
        void client.invalidateQueries({
          queryKey: membershipKey(user.id, context),
        });
        void client.invalidateQueries({
          queryKey: invitationKey(user.id, context),
        });
      }
    }
  }
  async function revokePendingInvitation() {
    if (!revokingInvitation) return;
    const result = await action.run((id, signal) =>
      revokeInvitation(id, context, revokingInvitation.id, signal),
    );
    if (result) {
      setRevokingInvitation(null);
      setNotice('Invitación revocada. El historial se conserva.');
      requestAnimationFrame(() => confirmation.current?.focus());
      if (user) {
        await client.invalidateQueries({ queryKey: invitationKey(user.id, context) });
        await client.invalidateQueries({ queryKey: membershipKey(user.id, context) });
      }
    }
  }
  if (denied) return <AccessFeedback error={members.error} />;
  return (
    <>
      <form
        onSubmit={(event) => void invite(event)}
        noValidate
        className={styles.compactForm}
        aria-busy={action.pending}
      >
        <div>
          <div>
            <label htmlFor="invite-role" className="field-label">
              Compartir acceso
            </label>
            <select
              id="invite-role"
              className="input"
              value={role}
              disabled={action.pending}
              onChange={(event) => setRole(event.target.value as ClientRole)}
            >
              {Object.entries(clientRoles).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="submit" disabled={action.pending}>
          {action.pending ? 'Creando enlace…' : 'Crear enlace'}
        </Button>
      </form>
      <AccessFeedback error={!revoking ? action.error : null} />
      {notice && (
        <p
          ref={confirmation}
          tabIndex={-1}
          role="status"
          className={
            notice === 'Enlace listo para compartir.'
              ? 'sr-only'
              : 'success-alert mt-4'
          }
        >
          {notice}
        </p>
      )}
      {invitations.length > 0 && (
        <div className={styles.block}>
          <h3>Enlaces de esta visita</h3>
          {invitations.map((invitation) => (
            <div key={invitation.id} className={styles.invitation}>
              <strong>{clientRoles[invitation.role]}</strong>
              <p className={styles.hint}>
                Vence el {displayDate(invitation.expiresAt)}
              </p>
              <ShareInvitation
                context={context}
                invitationId={invitation.id}
                initialUrl={invitation.acceptUrl}
              />
            </div>
          ))}
        </div>
      )}
      <details
        className={styles.block}
        open={invitationsOpen}
        onToggle={(event) => setInvitationsOpen(event.currentTarget.open)}
      >
        <summary
          aria-expanded={invitationsOpen}
          aria-controls="invitation-history-content"
        >
          Historial de invitaciones
        </summary>
        <div id="invitation-history-content">
          <p className={styles.hint}>
            Estados reales del servidor. No se muestran enlaces, tokens ni correos.
          </p>
          {invitationHistory.isPending ? (
            <p role="status">Cargando invitaciones…</p>
          ) : invitationHistory.isError ? (
            <>
              <AccessFeedback error={invitationHistory.error} />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void invitationHistory.refetch()}
              >
                Reintentar invitaciones
              </Button>
            </>
          ) : invitationHistory.data.length === 0 ? (
            <p className={styles.empty}>Aún no hay invitaciones para este cliente.</p>
          ) : (
            <ul className={styles.invitationList}>
              {invitationHistory.data.map((invitation) => {
                const acceptedMember = invitation.acceptedBy
                  ? members.data?.find((member) => member.userId === invitation.acceptedBy)
                  : undefined;
                const statusLabel = invitationStatusLabel(
                  invitation,
                  acceptedMember,
                );
                return (
                  <li key={invitation.id} className={styles.historyItem}>
                    <div className={styles.memberCopy}>
                      <div className={styles.identityLine}>
                        {invitation.acceptedBy ? (
                          <ProfileAvatar profile={invitation.acceptedByProfile} />
                        ) : null}
                        <div>
                          <strong>
                            {invitation.acceptedBy
                              ? invitation.acceptedByProfile?.displayName?.trim() || 'Usuario sin nombre'
                              : clientRoles[invitation.role]}
                          </strong>
                          {invitation.acceptedBy && (
                            <span className={styles.secondaryId}>
                              Usuario: {invitation.acceptedBy}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={styles.statusLine}>
                        <Icon name={invitation.status === 'accepted' ? 'check' : 'alert'} />
                        {statusLabel}
                      </span>
                      {invitation.acceptedBy && <span>Rol: {clientRoles[invitation.role]}</span>}
                      <span>
                        Creada: {displayDate(invitation.createdAt)} · Vence:{' '}
                        {displayDate(invitation.expiresAt)}
                      </span>
                      {invitation.revokedAt && (
                        <span>Revocada: {displayDate(invitation.revokedAt)}</span>
                      )}
                    </div>
                    {invitation.status === 'pending' && (
                      <Button
                        type="button"
                        variant="danger"
                        disabled={action.pending}
                        aria-label={`Revocar invitación ${invitation.id}`}
                        onClick={(event) => {
                          revokeInvitationTrigger.current = event.currentTarget;
                          action.clearError();
                          setRevokingInvitation(invitation);
                        }}
                      >
                        Revocar invitación
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </details>
      <details
        className={styles.block}
        onToggle={(event) => setMembersOpen(event.currentTarget.open)}
      >
        <summary aria-expanded={membersOpen}>Personas con acceso</summary>
        <p className={styles.hint}>
          Incluye membresías aceptadas, activas y revocadas. Se muestra el nombre
          visible cuando existe y el identificador queda como trazabilidad; las
          invitaciones pendientes no representan una persona.
        </p>
        {members.isPending ? (
          <p role="status">Cargando membresías…</p>
        ) : members.isError ? (
          <>
            <AccessFeedback error={members.error} />
            <Button
              type="button"
              variant="secondary"
              onClick={() => void members.refetch()}
            >
              Reintentar membresías
            </Button>
          </>
        ) : members.data.length === 0 ? (
          <p className={styles.empty}>
            Aún no hay membresías para este cliente.
          </p>
        ) : (
          <ul className={styles.memberList}>
            {members.data.map((member) => (
              <li key={member.id}>
                <div className={styles.memberCopy}>
                  <div className={styles.identityLine}>
                    <ProfileAvatar profile={member.user} />
                    <div>
                      <strong>{member.user?.displayName?.trim() || 'Usuario sin nombre'}</strong>
                      <span className={styles.secondaryId}>Usuario: {member.userId}</span>
                    </div>
                  </div>
                  <span className={styles.statusLine}>
                    <Icon name={member.status === 'active' ? 'check' : 'alert'} />
                    {clientRoles[member.role]} ·{' '}
                    {member.status === 'active'
                      ? member.joinedAt
                        ? 'Invitación aceptada · Acceso activo'
                        : 'Acceso activo'
                      : member.status === 'revoked'
                        ? 'Acceso revocado'
                        : 'Estado no disponible'}
                  </span>
                  <span>
                    {member.joinedAt
                      ? `Ingreso: ${displayDate(member.joinedAt)}`
                      : 'Sin ingreso confirmado'}
                    {member.revokedAt
                      ? ` · Revocación: ${displayDate(member.revokedAt)}`
                      : ''}
                  </span>
                </div>
                {member.status === 'active' && (
                  <Button
                    type="button"
                    variant="danger"
                    disabled={action.pending}
                    aria-label={`Revocar acceso de ${member.userId}`}
                    onClick={(event) => {
                      revokeTrigger.current = event.currentTarget;
                      action.clearError();
                      setRevoking(member);
                    }}
                  >
                    Revocar acceso
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </details>
      {revoking && (
        <EntityDialog
          title="Revocar acceso"
          closeLabel="Cancelar revocación"
          description="Esta persona perderá el acceso a este cliente. La revocación conserva el historial y no elimina la cuenta."
          workspaceName={workspaceName}
          busy={action.pending}
          onClose={() => {
            setRevoking(null);
            action.clearError();
            requestAnimationFrame(() => revokeTrigger.current?.focus());
          }}
        >
          <p className={styles.context}>
            Cliente: <strong>{entityName}</strong>
            <br />
            Cuenta: {revoking.userId}
          </p>
          <AccessFeedback error={action.error} />
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              disabled={action.pending}
              onClick={() => setRevoking(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={action.pending}
              onClick={() => void revoke()}
            >
              {action.pending ? 'Revocando…' : 'Confirmar revocación'}
            </Button>
          </div>
        </EntityDialog>
      )}
      {revokingInvitation && (
        <EntityDialog
          title="Revocar invitación"
          closeLabel="Cancelar revocación de invitación"
          description="La invitación dejará de poder aceptarse. El historial se conserva y no se muestra ningún enlace nuevo."
          workspaceName={workspaceName}
          busy={action.pending}
          onClose={() => {
            setRevokingInvitation(null);
            action.clearError();
            requestAnimationFrame(() => revokeInvitationTrigger.current?.focus());
          }}
        >
          <p className={styles.context}>
            Cliente: <strong>{entityName}</strong>
            <br />
            Rol: {clientRoles[revokingInvitation.role]}
            <br />
            Invitación: {revokingInvitation.id}
          </p>
          <AccessFeedback error={action.error} />
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              disabled={action.pending}
              onClick={() => setRevokingInvitation(null)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={action.pending}
              onClick={() => void revokePendingInvitation()}
            >
              {action.pending ? 'Revocando…' : 'Confirmar revocación'}
            </Button>
          </div>
        </EntityDialog>
      )}
    </>
  );
}

function invitationStatusLabel(
  invitation: InvitationRecord,
  acceptedMember: Membership | undefined,
) {
  if (invitation.status === 'pending') return 'Pendiente · aún no aceptada';
  if (invitation.status === 'expired') return 'Expirada · no aceptable';
  if (invitation.status === 'revoked') return 'Revocada · no aceptable';
  if (acceptedMember?.status === 'active')
    return 'Invitación aceptada · acceso activo';
  if (acceptedMember?.status === 'revoked')
    return 'Invitación aceptada · acceso revocado';
  return 'Aceptada · membresía no visible en este listado';
}

function ProfileAvatar({ profile }: { profile: AccessProfile | null }) {
  const name = profile?.displayName?.trim() || 'Usuario sin nombre';
  const initials = name === 'Usuario sin nombre'
    ? 'US'
    : name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  return (
    <span className={styles.avatar} aria-hidden="true">
      {profile?.avatarUrl ? <img src={profile.avatarUrl} alt="" /> : initials}
    </span>
  );
}
