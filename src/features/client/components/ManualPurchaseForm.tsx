import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import type { usePurchaseDocuments } from '../api/usePurchaseDocuments';
import { usePurchaseEditor } from '../hooks/usePurchaseEditor';
import {
  purchaseDocumentTypes,
  type PurchaseDocument,
  type PurchaseDocumentInput,
} from '../types/purchaseDocument.types';
import { formatPurchaseTotal } from '../utils/purchasePresentation';
import { PurchaseDraftGuard } from './PurchaseDraftGuard';
import styles from '../client.module.css';

export function ManualPurchaseForm({
  entityName,
  document,
  writer,
  documentsPath,
  registerPath,
}: {
  entityName: string;
  document?: PurchaseDocument;
  writer: ReturnType<typeof usePurchaseDocuments>['mutate'];
  documentsPath: string;
  registerPath: string;
}) {
  const editor = usePurchaseEditor(entityName, document, writer);
  const { logout } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const successHeading = useRef<HTMLHeadingElement>(null);
  const id = useId();
  const [receiverOpen, setReceiverOpen] = useState(false);
  const pending = editor.phase !== 'idle';
  const busyText =
    editor.phase === 'saving'
      ? 'Guardando…'
      : editor.phase === 'checking'
        ? 'Comprobando…'
        : 'Enviando…';
  useEffect(() => {
    if (editor.validationAttempt > 0)
      formRef.current
        ?.querySelector<HTMLElement>('[aria-invalid="true"]')
        ?.focus();
  }, [editor.validationAttempt]);
  useEffect(() => {
    if (editor.completed) successHeading.current?.focus();
  }, [editor.completed]);
  const field = (
    name: keyof PurchaseDocumentInput,
    label: string,
    children: ReactNode,
    hint?: string,
  ) => (
    <div className={styles.field}>
      <label htmlFor={`${id}-${name}`}>{label}</label>
      {children}
      {hint && (
        <p className={styles.fieldHint} id={`${id}-${name}-hint`}>
          {hint}
        </p>
      )}
      {editor.errors[name] && (
        <p className={styles.fieldError} id={`${id}-${name}-error`}>
          {editor.errors[name]}
        </p>
      )}
    </div>
  );
  const attributes = (name: keyof PurchaseDocumentInput) => ({
    id: `${id}-${name}`,
    name,
    'aria-invalid': Boolean(editor.errors[name]),
    'aria-describedby':
      [
        editor.errors[name] ? `${id}-${name}-error` : '',
        name === 'total' || name === 'issuerTaxId' || name === 'receiverTaxId'
          ? `${id}-${name}-hint`
          : '',
      ]
        .filter(Boolean)
        .join(' ') || undefined,
  });
  if (editor.completed)
    return (
      <section
        className={styles.submissionSuccess}
        aria-labelledby={`${id}-success`}
      >
        <span className={styles.successIcon}>
          <Icon name="check" />
        </span>
        <h1 ref={successHeading} id={`${id}-success`} tabIndex={-1}>
          Comprobante enviado a revisión
        </h1>
        <p>
          Tu comprobante está pendiente de revisión. Esto todavía no significa
          que esté aprobado.
        </p>
        {editor.feedback && <p role="status">{editor.feedback.message}</p>}
        <div className={styles.submissionSummary}>
          <span>{editor.completed.issuerName}</span>
          <strong>{formatPurchaseTotal(editor.completed.total)}</strong>
        </div>
        <div className={styles.formActions}>
          <Link
            to={`${registerPath}&document=${editor.completed.id}`}
            className="btn-secondary"
          >
            Ver detalle del comprobante
          </Link>
          <Link
            to={registerPath}
            className="btn-primary"
            onClick={editor.reset}
          >
            Registrar otra factura
          </Link>
        </div>
      </section>
    );
  return (
    <>
      <header className={styles.pageHeading}>
        <p className={styles.eyebrow}>Registro manual</p>
        <h1>{editor.saved ? 'Continuar borrador' : 'Registrar factura'}</h1>
        <p>Ingresa los datos del comprobante de compra.</p>
      </header>
      <form
        ref={formRef}
        className={styles.purchaseForm}
        noValidate
        aria-busy={pending}
        onSubmit={(event) => {
          event.preventDefault();
          void editor.save(true);
        }}
      >
        <div className={styles.documentHeader}>
          <span className={styles.documentLabel}>
            <Icon name="file" />
            Comprobante de compra
          </span>
          <span className={styles.documentMode}>Captura manual · GTQ</span>
        </div>
        {Object.values(editor.errors).some(Boolean) && (
          <p className="alert" role="alert">
            Revisa los campos indicados antes de continuar.
          </p>
        )}
        {editor.feedback && (
          <div
            className={
              editor.feedback.kind === 'error' ? 'alert' : 'success-alert'
            }
            role={editor.feedback.kind === 'error' ? 'alert' : 'status'}
          >
            <p>{editor.feedback.message}</p>
            {editor.recoveryRequired && (
              <Link className="btn-secondary mt-3" to={documentsPath}>
                Revisar comprobantes
              </Link>
            )}
            {editor.unavailable && editor.failureStatus === 401 && (
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={() => void logout()}
              >
                Volver a iniciar sesión
              </Button>
            )}
            {editor.unavailable && editor.failureStatus !== 401 && (
              <Link className="btn-secondary mt-3" to={documentsPath}>
                Ver comprobantes
              </Link>
            )}
          </div>
        )}
        <fieldset
          disabled={pending || editor.unavailable}
          className={styles.formGroup}
        >
          <legend>
            <span className={styles.sectionTitle}>
              <Icon name="file" />
              Datos del comprobante
            </span>
          </legend>
          <div className={styles.formGrid}>
            {field(
              'issueDate',
              'Fecha del comprobante',
              <input
                {...attributes('issueDate')}
                type="date"
                required
                value={editor.form.issueDate}
                onChange={(event) =>
                  editor.change('issueDate', event.target.value)
                }
              />,
            )}
            {field(
              'documentType',
              'Tipo de comprobante',
              <select
                {...attributes('documentType')}
                value={editor.form.documentType}
                onChange={(event) =>
                  editor.change(
                    'documentType',
                    event.target.value as PurchaseDocumentInput['documentType'],
                  )
                }
              >
                {Object.entries(purchaseDocumentTypes).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </select>,
            )}
          </div>
        </fieldset>
        <fieldset
          disabled={pending || editor.unavailable}
          className={styles.formGroup}
        >
          <legend>
            <span className={styles.sectionTitle}>
              <Icon name="id-card" />
              Emisor
            </span>
          </legend>
          <div className={styles.formGrid}>
            {field(
              'issuerName',
              'Nombre del emisor',
              <input
                {...attributes('issuerName')}
                autoComplete="organization"
                required
                value={editor.form.issuerName}
                onChange={(event) =>
                  editor.change('issuerName', event.target.value)
                }
              />,
            )}
            {field(
              'issuerTaxId',
              'NIT del emisor (opcional)',
              <input
                {...attributes('issuerTaxId')}
                autoComplete="off"
                spellCheck={false}
                value={editor.form.issuerTaxId}
                onChange={(event) =>
                  editor.change('issuerTaxId', event.target.value)
                }
              />,
              'Déjalo vacío si el comprobante no lo incluye.',
            )}
          </div>
        </fieldset>
        <fieldset
          disabled={pending || editor.unavailable}
          className={styles.formGroup}
        >
          <legend>
            <span className={styles.sectionTitle}>
              <Icon name="layers" />
              Detalle de la compra
            </span>
          </legend>
          <div className={`${styles.formGrid} ${styles.purchaseDetailGrid}`}>
            <div className={styles.fullWidth}>
              {field(
                'description',
                'Descripción de la compra',
                <textarea
                  {...attributes('description')}
                  required
                  rows={3}
                  placeholder="¿Qué compraste?"
                  value={editor.form.description}
                  onChange={(event) =>
                    editor.change('description', event.target.value)
                  }
                />,
              )}
            </div>
            {field(
              'category',
              'Categoría',
              <input
                {...attributes('category')}
                required
                value={editor.form.category}
                placeholder="Ej. suministros"
                onChange={(event) =>
                  editor.change('category', event.target.value)
                }
              />,
            )}
          </div>
        </fieldset>
        <fieldset
          disabled={pending || editor.unavailable}
          className={styles.amountSection}
        >
          <legend className={styles.amountLegend}>
            Importe del comprobante
          </legend>
          <div className={styles.amountLayout}>
            <p className={styles.amountHint}>
              Ingresa el total que aparece en tu comprobante, incluidos los
              impuestos que indique.
            </p>
            <div className={styles.amountField}>
              {field(
                'total',
                'Total',
                <div className={styles.totalInput}>
                  <input
                    {...attributes('total')}
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={editor.form.total}
                    onChange={(event) =>
                      editor.change('total', event.target.value)
                    }
                  />
                  <span aria-hidden="true">GTQ</span>
                </div>,
                'GTQ · mayor que cero y hasta dos decimales.',
              )}
            </div>
          </div>
        </fieldset>
        <details
          className={styles.receiverDetails}
          open={receiverOpen || Boolean(editor.errors.receiverName)}
          onToggle={(event) => setReceiverOpen(event.currentTarget.open)}
        >
          <summary>
            <span>
              <span className={styles.receiverLabel}>
                <Icon name="user" />
                Receptor
              </span>
              <strong>{editor.form.receiverName || entityName}</strong>
              <span className={styles.receiverTaxId}>
                NIT capturado: {editor.form.receiverTaxId?.trim() || 'C/F'}
              </span>
            </span>
            <span className={styles.receiverAction}>
              {receiverOpen ? 'Ocultar datos' : 'Ver datos'}{' '}
              <Icon name="chevron-down" />
            </span>
          </summary>
          <p className={styles.fieldHint}>
            Estos son los datos capturados del receptor. La empresa de destino
            sigue siendo {entityName}.
          </p>
          <fieldset
            disabled={pending || editor.unavailable}
            className={styles.formGrid}
          >
            {field(
              'receiverName',
              'Nombre del receptor',
              <input
                {...attributes('receiverName')}
                required
                value={editor.form.receiverName}
                onChange={(event) =>
                  editor.change('receiverName', event.target.value)
                }
              />,
            )}
            {field(
              'receiverTaxId',
              'NIT del receptor',
              <input
                {...attributes('receiverTaxId')}
                autoComplete="off"
                spellCheck={false}
                value={editor.form.receiverTaxId}
                onChange={(event) =>
                  editor.change('receiverTaxId', event.target.value)
                }
              />,
              'C/F significa consumidor final. No se deriva el NIT de la empresa automáticamente.',
            )}
          </fieldset>
        </details>
        <footer className={styles.formFooter}>
          <p>
            Guardar conserva un borrador. Enviar solicita la revisión de tu
            comprobante.
          </p>
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              disabled={
                pending ||
                editor.recoveryRequired ||
                editor.unavailable ||
                Boolean(editor.saved && !editor.dirty)
              }
              onClick={() => void editor.save(false)}
            >
              <Icon name="file" />
              Guardar borrador
            </Button>
            <Button
              type="submit"
              loading={pending}
              loadingLabel={busyText}
              disabled={editor.recoveryRequired || editor.unavailable}
            >
              {editor.sendNeedsCheck && !editor.dirty
                ? 'Reintentar envío'
                : 'Enviar a revisión'}
              <Icon name="arrow-right" />
            </Button>
          </div>
        </footer>
      </form>
      <PurchaseDraftGuard
        dirty={editor.dirty}
        pending={pending}
        onDiscard={editor.reset}
      />
    </>
  );
}
