import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { displayDate } from '@/features/workspace/utils/workspacePresentation';
import type { Entity, EntityDraft } from '../types/entity.types';
import { entityTaxLabel } from '../utils/entityPresentation';
import { EntityForm } from './EntityForm';
import styles from '../entities.module.css';

export function EntityDataSection({
  entity,
  editing,
  pending,
  error,
  message,
  onEdit,
  onCancel,
  onSave,
  onClearError,
  onDirtyChange,
}: {
  entity: Entity;
  editing: boolean;
  pending: boolean;
  error: unknown;
  message: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (input: EntityDraft) => Promise<void>;
  onClearError: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  return (
    <section
      className={styles.dataSection}
      aria-labelledby="entity-data-heading"
    >
      <div className={styles.sectionHeading}>
        <div>
          <h2 id="entity-data-heading">
            {editing ? 'Editar cliente' : 'Datos del cliente'}
          </h2>
          <p>
            {editing
              ? 'Actualiza los datos y guarda los cambios al terminar.'
              : 'Información de la entidad en este espacio de trabajo.'}
          </p>
        </div>
        {!editing && entity.permissions.canManage && (
          <Button type="button" onClick={onEdit}>
            <Icon name="pencil" /> Editar cliente
          </Button>
        )}
      </div>
      {message && (
        <p className={styles.saved} role="status">
          <Icon name="check" />
          {message}
        </p>
      )}
      {editing ? (
        <EntityForm
          entity={entity}
          pending={pending}
          error={error}
          onCancel={onCancel}
          onSave={onSave}
          onClearError={onClearError}
          onDirtyChange={onDirtyChange}
        />
      ) : (
        <>
          <dl className={styles.details}>
            <div>
              <dt>
                <Icon name="id-card" />
                {entity.permissions.canManage ? 'NIT' : 'NIT protegido'}
              </dt>
              <dd>{entityTaxLabel(entity)}</dd>
            </div>
            <div>
              <dt>
                <Icon name="shield" />
                Tu acceso
              </dt>
              <dd>
                <span className={styles.accessValue}>
                  {entity.permissions.canManage
                    ? 'Consulta y edición'
                    : 'Consulta'}
                </span>
              </dd>
            </div>
          </dl>
          <details className={styles.registrationDetails}>
            <summary>Información de registro</summary>
            <dl className={styles.details}>
              <div>
                <dt>
                  <Icon name="calendar" />
                  Registrado el
                </dt>
                <dd>{displayDate(entity.created_at)}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="clock" />
                  Última actualización
                </dt>
                <dd>{displayDate(entity.updated_at)}</dd>
              </div>
            </dl>
          </details>
        </>
      )}
    </section>
  );
}
