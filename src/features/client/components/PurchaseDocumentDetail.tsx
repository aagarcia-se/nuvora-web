import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { usePurchaseDocument } from '../api/usePurchaseDocuments';
import { purchaseDocumentMessage } from '../api/purchaseDocumentsApi';
import { purchaseDocumentTypes } from '../types/purchaseDocument.types';
import {
  formatPurchaseDate,
  formatPurchaseTotal,
} from '../utils/purchasePresentation';
import styles from '../client.module.css';

function timestamp(value: string) {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('es-GT', {
        timeZone: 'America/Guatemala',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date)
    : 'Fecha no disponible';
}

export function PurchaseDocumentDetail({
  workspaceId,
  entityId,
  documentId,
  canUpload,
  documentsPath,
  editPath,
}: {
  workspaceId: string;
  entityId: string;
  documentId: string;
  canUpload: boolean;
  documentsPath: string;
  editPath: string;
}) {
  const detail = usePurchaseDocument(workspaceId, entityId, documentId);
  const { logout } = useAuth();
  const id = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (detail.isSuccess) heading.current?.focus({ preventScroll: true });
  }, [detail.isSuccess]);
  const document = detail.data;
  return (
    <>
      <Link to={documentsPath} className={`btn-secondary ${styles.detailBack}`}>
        <span aria-hidden="true">←</span> Volver a comprobantes
      </Link>
      {detail.isPending ? (
        <div className={styles.state} role="status">
          <h1>Abriendo comprobante</h1>
          <p>Cargando los datos registrados…</p>
        </div>
      ) : detail.isError ? (
        <div className={styles.state}>
          <h1>No pudimos abrir el comprobante</h1>
          <p className="alert" role="alert">
            {purchaseDocumentMessage(detail.error)}
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={
              errorStatus(detail.error) === 401
                ? () => void logout()
                : () => void detail.refetch()
            }
          >
            {errorStatus(detail.error) === 401
              ? 'Volver a iniciar sesión'
              : 'Reintentar'}
          </Button>
        </div>
      ) : (
        document && (
          <>
            <header className={styles.listPageHeading}>
              <div className={styles.pageHeading}>
                <p className={styles.eyebrow}>Consulta del comprobante</p>
                <h1 ref={heading} tabIndex={-1}>
                  Detalle de{' '}
                  {purchaseDocumentTypes[
                    document.documentType
                  ].toLocaleLowerCase('es')}
                </h1>
                <p>Todos los datos guardados de este comprobante.</p>
              </div>
              {canUpload && document.status === 'draft' && (
                <Link className="btn-primary" to={editPath}>
                  <Icon name="pencil" />
                  Editar borrador
                </Link>
              )}
            </header>
            <article
              className={styles.invoiceDetail}
              aria-label="Datos del comprobante"
            >
              <header className={styles.invoiceSummary}>
                <div>
                  <span className={styles.documentLabel}>
                    <Icon name="file" />
                    {purchaseDocumentTypes[document.documentType]}
                  </span>
                  <h2>{document.issuerName}</h2>
                  <p>
                    Fecha del comprobante ·{' '}
                    {formatPurchaseDate(document.issueDate)}
                  </p>
                </div>
                <span
                  className={
                    document.status === 'draft'
                      ? styles.statusDraft
                      : styles.statusReview
                  }
                >
                  {document.status === 'draft'
                    ? 'Borrador'
                    : 'Pendiente de revisión'}
                </span>
              </header>
              <p className={styles.detailStatusNote}>
                {document.status === 'draft'
                  ? 'Este comprobante está guardado como borrador; todavía no se ha enviado a revisión.'
                  : 'Enviado a revisión. Este estado no significa que esté aprobado. Los datos se muestran en modo de consulta.'}
              </p>
              <div className={styles.invoiceParties}>
                <section aria-labelledby={`${id}-issuer`}>
                  <h2 id={`${id}-issuer`} className={styles.sectionTitle}>
                    <Icon name="id-card" />
                    Emisor
                  </h2>
                  <dl className={styles.detailFields}>
                    <div>
                      <dt>Nombre del emisor</dt>
                      <dd>{document.issuerName}</dd>
                    </div>
                    <div>
                      <dt>NIT del emisor</dt>
                      <dd>{document.issuerTaxId || 'No registrado'}</dd>
                    </div>
                  </dl>
                </section>
                <section aria-labelledby={`${id}-receiver`}>
                  <h2 id={`${id}-receiver`} className={styles.sectionTitle}>
                    <Icon name="user" />
                    Receptor
                  </h2>
                  <dl className={styles.detailFields}>
                    <div>
                      <dt>Nombre del receptor</dt>
                      <dd>{document.receiverName}</dd>
                    </div>
                    <div>
                      <dt>NIT del receptor</dt>
                      <dd>{document.receiverTaxId}</dd>
                    </div>
                  </dl>
                </section>
              </div>
              <section
                className={styles.invoiceDescription}
                aria-labelledby={`${id}-purchase`}
              >
                <h2 id={`${id}-purchase`} className={styles.sectionTitle}>
                  <Icon name="layers" />
                  Detalle de la compra
                </h2>
                <dl className={styles.detailFields}>
                  <div>
                    <dt>Descripción de la compra</dt>
                    <dd className={styles.preservedText}>
                      {document.description}
                    </dd>
                  </div>
                  <div>
                    <dt>Categoría</dt>
                    <dd>{document.category}</dd>
                  </div>
                </dl>
              </section>
              <dl className={styles.invoiceTotal}>
                <div>
                  <dt>Total del comprobante</dt>
                  <dd>{formatPurchaseTotal(document.total)}</dd>
                </div>
                <div>
                  <dt>Moneda</dt>
                  <dd>{document.currency} · Quetzales</dd>
                </div>
              </dl>
              <details className={styles.recordDetails}>
                <summary>Información del registro</summary>
                <dl className={styles.detailFields}>
                  <div>
                    <dt>Identificador del comprobante</dt>
                    <dd>{document.id}</dd>
                  </div>
                  <div>
                    <dt>Creado</dt>
                    <dd>{timestamp(document.createdAt)}</dd>
                  </div>
                  <div>
                    <dt>Última actualización</dt>
                    <dd>{timestamp(document.updatedAt)}</dd>
                  </div>
                </dl>
                <p>
                  Horarios de Guatemala. Datos capturados; no constituyen una
                  verificación fiscal.
                </p>
              </details>
            </article>
            <footer className={styles.detailFooter}>
              <Link to={documentsPath} className="btn-secondary">
                <span aria-hidden="true">←</span> Volver a comprobantes
              </Link>
            </footer>
          </>
        )
      )}
    </>
  );
}
