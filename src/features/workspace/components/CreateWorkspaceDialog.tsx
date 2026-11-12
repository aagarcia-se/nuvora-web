import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { useCreateWorkspace } from '../api/useWorkspaceQueries';
import {
  isWorkspaceCanceled,
  workspaceMessage,
  workspaceStatus,
} from '../api/workspaceApi';
import {
  validateWorkspace,
  workspaceSlug,
} from '../utils/workspacePresentation';
import type { Workspace } from '../types/workspace.types';
import styles from '../workspace.module.css';

export function CreateWorkspaceDialog({
  open,
  onClose,
  onCreated,
  onRefresh,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
  onRefresh: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [edited, setEdited] = useState(false);
  const [errors, setErrors] = useState({ name: '', slug: '' });
  const [error, setError] = useState<unknown>(null);
  const create = useCreateWorkspace();
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const next = validateWorkspace(name, slug);
    setErrors(next);
    setError(null);
    if (next.name || next.slug) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    busy.current = true;
    try {
      const workspace = await create.mutateAsync({ name: name.trim(), slug });
      setName('');
      setSlug('');
      setEdited(false);
      onCreated(workspace);
      onClose();
    } catch (cause) {
      if (!isWorkspaceCanceled(cause)) {
        setError(cause);
        if (workspaceStatus(cause) === 409)
          setErrors({ name: '', slug: workspaceMessage(cause, 'create') });
        requestAnimationFrame(() => summary.current?.focus());
      }
    } finally {
      busy.current = false;
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="create-workspace-heading"
      aria-describedby="create-workspace-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy.current) onClose();
      }}
    >
      <div className={styles.dialogHeading}>
        <span className={styles.dialogIcon}>
          <Icon name="layers" />
        </span>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Cerrar creación de espacio"
          disabled={create.isPending}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <h2 id="create-workspace-heading" className={styles.dialogTitle}>
        Un nuevo espacio para tu trabajo.
      </h2>
      <p id="create-workspace-description" className={styles.dialogDescription}>
        Dale un nombre a tu despacho o equipo. Podrás seleccionarlo al terminar.
      </p>
      <form
        onSubmit={submit}
        noValidate
        aria-busy={create.isPending}
        className={styles.createForm}
      >
        <div
          ref={summary}
          tabIndex={-1}
          hidden={!error && !errors.name && !errors.slug}
        >
          <div className="alert" role="alert">
            {Boolean(error) && <p>{workspaceMessage(error, 'create')}</p>}
            {(errors.name || errors.slug) && (
              <>
                <p>Revisa los siguientes datos:</p>
                {errors.name && (
                  <a className="block underline" href="#new-workspace-name">
                    {errors.name}
                  </a>
                )}
                {errors.slug && (
                  <a className="block underline" href="#new-workspace-slug">
                    {errors.slug}
                  </a>
                )}
              </>
            )}
            {Boolean(error) && workspaceStatus(error) === 0 && (
              <button
                type="button"
                onClick={onRefresh}
                className="mt-2 min-h-11 underline"
              >
                Actualizar mis espacios
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="new-workspace-name">
            Nombre del espacio
          </label>
          <input
            id="new-workspace-name"
            name="name"
            className="input"
            placeholder="Ej. Despacho Central"
            autoComplete="organization"
            autoFocus
            required
            maxLength={160}
            disabled={create.isPending}
            value={name}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'new-name-error' : undefined}
            onChange={(event) => {
              setName(event.target.value);
              if (!edited) setSlug(workspaceSlug(event.target.value));
            }}
          />
          {errors.name && (
            <p id="new-name-error" className="field-error">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label className="field-label" htmlFor="new-workspace-slug">
            Identificador
          </label>
          <input
            id="new-workspace-slug"
            name="slug"
            className="input"
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none"
            required
            maxLength={160}
            disabled={create.isPending}
            value={slug}
            aria-invalid={Boolean(errors.slug)}
            aria-describedby={errors.slug ? 'new-slug-error' : 'new-slug-hint'}
            onChange={(event) => {
              setEdited(true);
              setSlug(event.target.value.toLowerCase().replace(/\s/g, '-'));
            }}
          />
          {errors.slug ? (
            <p id="new-slug-error" className="field-error">
              {errors.slug}
            </p>
          ) : (
            <p id="new-slug-hint" className={styles.fieldHint}>
              Un nombre único, con minúsculas, números y guiones. Ejemplo:
              despacho-central.
            </p>
          )}
        </div>
        <div className={styles.dialogActions}>
          <Button
            type="button"
            variant="secondary"
            disabled={create.isPending}
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Creando espacio…' : 'Crear espacio'}
          </Button>
        </div>
      </form>
    </dialog>
  );
}
