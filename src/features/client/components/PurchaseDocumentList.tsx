import { useEffect, useRef, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { purchaseDocumentMessage } from '../api/purchaseDocumentsApi';
import type { usePurchaseDocuments } from '../api/usePurchaseDocuments';
import { PurchaseDocumentRow } from './PurchaseDocumentRow';
import styles from '../client.module.css';

export type PurchaseListPosition = { documentId: string; scrollY: number };

export function PurchaseDocumentList({
  list,
  writer,
  registerPath,
  canUpload,
  filter,
  onFilterChange,
  returnPosition,
  headingLevel = 1,
  documentPath = `${registerPath}&document=`,
  period = '',
}: {
  list: ReturnType<typeof usePurchaseDocuments>['list'];
  writer: ReturnType<typeof usePurchaseDocuments>['mutate'];
  registerPath: string;
  canUpload: boolean;
  filter: string;
  onFilterChange: (value: string) => void;
  returnPosition: RefObject<PurchaseListPosition | null>;
  headingLevel?: 1 | 2;
  documentPath?: string;
  period?: string;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  const collection = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!list.isSuccess || list.isFetching || !returnPosition.current) return;
    const frame = requestAnimationFrame(() => {
      const point = returnPosition.current;
      if (!point) return;
      const link = Array.from(
        collection.current?.querySelectorAll<HTMLAnchorElement>(
          '[data-document-id]',
        ) ?? [],
      ).find((element) => element.dataset.documentId === point.documentId);
      if (link) {
        link.focus({ preventScroll: true });
        window.scrollTo({ top: point.scrollY, behavior: 'instant' });
      }
      returnPosition.current = null;
    });
    return () => cancelAnimationFrame(frame);
  }, [list.isSuccess, list.isFetching, returnPosition]);
  const { logout } = useAuth();
  const items = (list.data ?? []).filter(
    (item) => !period || item.issueDate.slice(0, 7) === period,
  );
  const filtered = items.filter((item) =>
    filter === 'all'
      ? item.status !== 'discarded'
      : filter === 'history' || item.status === filter,
  );
  return (
    <>
      <header className={styles.listPageHeading}>
        <div className={styles.pageHeading}>
          <Heading>Comprobantes</Heading>
          {period && (
            <p>Mes seleccionado: {period} · Según fecha del comprobante</p>
          )}
          <p>
            {canUpload
              ? 'Consulta los registros disponibles para tu cuenta y continúa los borradores que puedas editar.'
              : 'Consulta los comprobantes, su estado y las observaciones disponibles para tu cuenta.'}
          </p>
        </div>
        {canUpload && (
          <Link className="btn-primary" to={registerPath}>
            <Icon name="plus" />
            Registrar factura
          </Link>
        )}
      </header>
      <section
        ref={collection}
        className={styles.documentCollection}
        aria-label="Comprobantes de la empresa"
      >
        <div className={styles.listToolbar}>
          <label htmlFor="purchase-filter">Mostrar</label>
          <select
            id="purchase-filter"
            className="input"
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
          >
            <option value="all">Sin descartar</option>
            <option value="history">Todos, incluido el historial</option>
            <option value="draft">Borradores</option>
            <option value="pending_review">Pendientes de revisión</option>
            <option value="needs_correction">Requieren corrección</option>
            <option value="approved">Aprobados</option>
            <option value="rejected">Rechazados</option>
            <option value="discarded">Historial: descartados</option>
          </select>
          <Button
            type="button"
            variant="secondary"
            loading={list.isFetching}
            loadingLabel="Actualizando…"
            onClick={() => void list.refetch()}
          >
            Actualizar
          </Button>
        </div>
        {list.isPending ? (
          <div className={styles.state} role="status">
            <p>Cargando comprobantes…</p>
          </div>
        ) : list.isError ? (
          <div className={styles.state}>
            <div className="alert" role="alert">
              {purchaseDocumentMessage(list.error)}
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={
                errorStatus(list.error) === 401
                  ? () => void logout()
                  : () => void list.refetch()
              }
            >
              {errorStatus(list.error) === 401
                ? 'Volver a iniciar sesión'
                : 'Reintentar'}
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>
              <Icon name="file" />
            </span>
            <h2>
              {items.length === 0
                ? 'Todavía no hay comprobantes'
                : filter === 'all'
                  ? 'No hay comprobantes sin descartar'
                  : 'No hay comprobantes con este estado'}
            </h2>
            <p>
              {items.length === 0
                ? 'Aquí aparecerán los borradores y los comprobantes enviados a revisión.'
                : filter === 'all'
                  ? 'Los comprobantes descartados se conservan en el historial y puedes consultarlos.'
                  : 'Prueba con otro estado para encontrar tus comprobantes.'}
            </p>
            {items.length === 0 && canUpload ? (
              <Link className="btn-primary" to={registerPath}>
                Registrar primera factura
              </Link>
            ) : items.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  onFilterChange(filter === 'all' ? 'history' : 'all')
                }
              >
                {filter === 'all' ? 'Ver historial' : 'Ver sin descartar'}
              </Button>
            ) : null}
          </div>
        ) : (
          <ul className={styles.purchaseList}>
            {filtered.map((document) => (
              <PurchaseDocumentRow
                key={document.id}
                document={document}
                canUpload={canUpload}
                writer={writer}
                editPath={`${registerPath}&draft=${document.id}${period ? `&period=${period}` : ''}`}
                detailPath={`${documentPath}${document.id}${period ? `&period=${period}` : ''}`}
                onOpenDetail={() => {
                  returnPosition.current = {
                    documentId: document.id,
                    scrollY: window.scrollY,
                  };
                }}
              />
            ))}
          </ul>
        )}
        {list.isSuccess && (
          <p className={styles.listSummary} role="status">
            {filtered.length} de {items.length} comprobantes en este listado
          </p>
        )}
      </section>
    </>
  );
}
