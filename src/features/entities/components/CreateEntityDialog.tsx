import { useEntityWrite } from '../api/useEntityQueries';
import { EntityDialog } from './EntityDialog';
import { EntityForm } from './EntityForm';
import type { Entity } from '../types/entity.types';

export function CreateEntityDialog({
  workspaceId,
  workspaceName,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  workspaceName: string;
  onClose: () => void;
  onCreated: (entity: Entity) => void;
}) {
  const write = useEntityWrite(workspaceId);
  return (
    <EntityDialog
      title="Un nuevo cliente en tu espacio."
      description="Guarda su nombre legal y, si lo tienes, su NIT."
      workspaceName={workspaceName}
      busy={write.isPending}
      onClose={onClose}
    >
      <EntityForm
        pending={write.isPending}
        error={write.error}
        onCancel={onClose}
        onClearError={() => write.reset()}
        onSave={async (input) => {
          const entity = await write.mutateAsync({
            kind: 'create',
            input: {
              legalName: input.legalName,
              ...(typeof input.taxId === 'string'
                ? { taxId: input.taxId }
                : {}),
            },
          });
          onCreated(entity);
          onClose();
        }}
      />
    </EntityDialog>
  );
}
