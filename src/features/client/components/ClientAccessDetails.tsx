import {
  clientRoles,
  type ClientRole,
} from '@/features/access/types/access.types';
import styles from '../client.module.css';

export function ClientAccessDetails({
  entityName,
  workspaceId,
  entityId,
  role,
  acceptedRole,
}: {
  entityName: string;
  workspaceId: string;
  entityId: string;
  role: ClientRole;
  acceptedRole?: ClientRole;
}) {
  return (
    <details className={styles.accessDetails}>
      <summary>Información del acceso</summary>
      <dl>
        <div>
          <dt>Empresa</dt>
          <dd>{entityName}</dd>
        </div>
        <div>
          <dt>Rol actual</dt>
          <dd>{clientRoles[role]}</dd>
        </div>
        {acceptedRole && (
          <div>
            <dt>Rol de la invitación aceptada</dt>
            <dd>{clientRoles[acceptedRole]}</dd>
          </div>
        )}
        <div>
          <dt>Identificador de la empresa</dt>
          <dd>{entityId}</dd>
        </div>
        <div>
          <dt>Despacho de referencia</dt>
          <dd>{workspaceId}</dd>
        </div>
      </dl>
      <p>
        Este acceso corresponde únicamente a esta empresa y no te incorpora al
        equipo del despacho.
      </p>
    </details>
  );
}
