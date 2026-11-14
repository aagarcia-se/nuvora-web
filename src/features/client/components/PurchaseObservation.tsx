import { useId } from 'react';
import { Icon } from '@/shared/ui/components/Icon';
import type { PurchaseDocument } from '../types/purchaseDocument.types';
import styles from '../client.module.css';

export function PurchaseObservation({
  document,
}: {
  document: PurchaseDocument;
}) {
  const id = useId();
  if (!document.reviewObservation && document.status !== 'needs_correction')
    return null;
  const date = document.observedAt ? new Date(document.observedAt) : null;
  return (
    <section className={styles.observation} aria-labelledby={id}>
      <h2 id={id} className={styles.sectionTitle}>
        <Icon name="message" />
        {document.status === 'needs_correction'
          ? 'Corrección solicitada'
          : 'Observación del contador'}
      </h2>
      <p className={styles.preservedText}>
        {document.reviewObservation ||
          'No se recibió el texto de la observación. Consulta con tu contador antes de corregir el comprobante.'}
      </p>
      {(document.observedBy || date) && (
        <details className={styles.observationMeta}>
          <summary>Información de la observación</summary>
          <dl className={styles.detailFields}>
            {document.observedBy && (
              <div>
                <dt>Identificador del revisor</dt>
                <dd>{document.observedBy}</dd>
              </div>
            )}
            {date && Number.isFinite(date.getTime()) && (
              <div>
                <dt>Fecha de la observación · Guatemala</dt>
                <dd>
                  {new Intl.DateTimeFormat('es-GT', {
                    timeZone: 'America/Guatemala',
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(date)}
                </dd>
              </div>
            )}
          </dl>
        </details>
      )}
    </section>
  );
}
