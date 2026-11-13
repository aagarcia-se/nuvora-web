import { useId, useRef, useState, type FormEvent } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import {
  errorStatus,
  isRequestCanceled,
} from '@/shared/api/authenticatedRequest';
import { Button } from '@/shared/ui/components/Button';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import { entityMessage } from '../api/entityApi';
import type { Entity, EntityDraft } from '../types/entity.types';
import { normalizeTaxId, validTaxId } from '../utils/entityPresentation';
import styles from '../entities.module.css';

export function EntityForm({
  entity,
  pending,
  error,
  onSave,
  onCancel,
  onClearError,
}: {
  entity?: Entity;
  pending: boolean;
  error: unknown;
  onSave: (input: EntityDraft) => Promise<void>;
  onCancel: () => void;
  onClearError: () => void;
}) {
  const { logout } = useAuth();
  const id = useId();
  const [baseName] = useState(entity?.legal_name ?? '');
  const [legalName, setLegalName] = useState(baseName);
  const [taxId, setTaxId] = useState('');
  const [taxMode, setTaxMode] = useState<'keep' | 'replace' | 'remove'>('keep');
  const [errors, setErrors] = useState({ legalName: '', taxId: '' });
  const busy = useRef(false);
  const summary = useRef<HTMLDivElement>(null);
  const changed =
    !entity || legalName.trim() !== baseName || taxMode !== 'keep';
  const editingTax = !entity || taxMode === 'replace';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || !changed) return;
    const normalized = normalizeTaxId(taxId);
    const next = {
      legalName:
        legalName.trim().length < 2 || legalName.trim().length > 240
          ? 'Usa entre 2 y 240 caracteres para el nombre legal.'
          : '',
      taxId:
        editingTax && (normalized || entity) && !validTaxId(normalized)
          ? 'Usa entre 3 y 64 letras, números o guiones para el NIT.'
          : '',
    };
    setErrors(next);
    onClearError();
    if (next.legalName || next.taxId) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    const input: EntityDraft = {
      legalName: legalName.trim(),
      legalNameChanged: legalName.trim() !== baseName,
    };
    if (entity && taxMode === 'remove') input.taxId = null;
    else if (editingTax && normalized) input.taxId = normalized;
    busy.current = true;
    try {
      await onSave(input);
    } catch (cause) {
      if (!isRequestCanceled(cause))
        requestAnimationFrame(() => summary.current?.focus());
    } finally {
      busy.current = false;
    }
  }
  return (
    <form
      noValidate
      onSubmit={submit}
      aria-busy={pending}
      className={workspaceStyles.createForm}
    >
      <div
        ref={summary}
        tabIndex={-1}
        hidden={!error && !errors.legalName && !errors.taxId}
      >
        <div className="alert" role="alert">
          {Boolean(error) && <p>{entityMessage(error, 'write')}</p>}
          {(errors.legalName || errors.taxId) && (
            <p>Revisa los siguientes datos:</p>
          )}
          {errors.legalName && (
            <a className="block underline" href={`#${id}-name`}>
              {errors.legalName}
            </a>
          )}
          {errors.taxId && (
            <a className="block underline" href={`#${id}-tax`}>
              {errors.taxId}
            </a>
          )}
          {Boolean(error) && errorStatus(error) === 401 && (
            <button
              className={styles.recoveryLink}
              type="button"
              onClick={() => void logout()}
            >
              Volver a iniciar sesión
            </button>
          )}
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor={`${id}-name`}>
          Nombre legal del cliente
        </label>
        <input
          id={`${id}-name`}
          name="legalName"
          className="input"
          autoFocus
          autoComplete="organization"
          placeholder="Ej. Cliente Demo, S. A."
          value={legalName}
          maxLength={240}
          required
          disabled={pending}
          aria-invalid={Boolean(errors.legalName)}
          aria-describedby={errors.legalName ? `${id}-name-error` : undefined}
          onChange={(event) => {
            setLegalName(event.target.value);
            onClearError();
          }}
        />
        {errors.legalName && (
          <p className="field-error" id={`${id}-name-error`}>
            {errors.legalName}
          </p>
        )}
      </div>
      {entity && (
        <div>
          <label className="field-label" htmlFor={`${id}-tax-action`}>
            Acción sobre el NIT
          </label>
          <select
            id={`${id}-tax-action`}
            className="input"
            value={taxMode}
            disabled={pending}
            onChange={(event) => {
              setTaxMode(event.target.value as typeof taxMode);
              setErrors((value) => ({ ...value, taxId: '' }));
              onClearError();
            }}
          >
            <option value="keep">
              {entity.taxId ? 'Mantener el NIT actual' : 'Mantener sin NIT'}
            </option>
            <option value="replace">
              {entity.taxId ? 'Cambiar el NIT' : 'Agregar un NIT'}
            </option>
            {entity.taxId && <option value="remove">Quitar el NIT</option>}
          </select>
          {taxMode === 'remove' && (
            <p role="status" className={styles.note}>
              El NIT se quitará al guardar los cambios.
            </p>
          )}
        </div>
      )}
      {editingTax && (
        <div>
          <label className="field-label" htmlFor={`${id}-tax`}>
            {entity ? 'Nuevo NIT' : 'NIT (opcional)'}
          </label>
          <input
            id={`${id}-tax`}
            name="taxId"
            className="input"
            value={taxId}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="characters"
            maxLength={128}
            disabled={pending}
            aria-invalid={Boolean(errors.taxId)}
            aria-describedby={
              errors.taxId ? `${id}-tax-error` : `${id}-tax-hint`
            }
            onChange={(event) => {
              setTaxId(event.target.value);
              onClearError();
            }}
          />
          {errors.taxId ? (
            <p id={`${id}-tax-error`} className="field-error">
              {errors.taxId}
            </p>
          ) : (
            <p id={`${id}-tax-hint`} className={workspaceStyles.fieldHint}>
              De 3 a 64 letras, números o guiones. Se omiten espacios y se usan
              mayúsculas; no se verifica externamente.
            </p>
          )}
        </div>
      )}
      <div className={workspaceStyles.dialogActions}>
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={pending}
          loadingLabel="Guardando…"
          disabled={pending || !changed || errorStatus(error) === 401}
        >
          {entity ? 'Guardar cambios' : 'Crear cliente'}
        </Button>
      </div>
    </form>
  );
}
