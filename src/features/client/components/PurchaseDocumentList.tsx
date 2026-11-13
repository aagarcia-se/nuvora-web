import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import { errorStatus } from '@/shared/api/authenticatedRequest';
import { purchaseDocumentMessage } from '../api/purchaseDocumentsApi';
import type { usePurchaseDocuments } from '../api/usePurchaseDocuments';
import { PurchaseDocumentRow } from './PurchaseDocumentRow';
import styles from '../client.module.css';

export function PurchaseDocumentList({
  list,
  writer,
  registerPath,
  canUpload,
}: {
  list: ReturnType<typeof usePurchaseDocuments>['list'];
  writer: ReturnType<typeof usePurchaseDocuments>['mutate'];
  registerPath: string;
  canUpload: boolean;
}) {
  const [filter, setFilter] = useState('all');
  const { logout } = useAuth();
  const items = list.data ?? [];
  const filtered = items.filter(
    (item) => filter === 'all' || item.status === filter,
  );
  return (
    <>
      <header className={styles.listPageHeading}>
        <div className={styles.pageHeading}>
          <h1>Comprobantes</h1>
          <p>
            Consulta los registros disponibles para tu cuenta y continúa los
            borradores que puedas editar.
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
        className={styles.documentCollection}
        aria-label="Comprobantes de la empresa"
      >
        <div className={styles.listToolbar}>
          <label htmlFor="purchase-filter">Mostrar</label>
          <select
            id="purchase-filter"
            className="input"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="all">Todos los estados</option>
            <option value="draft">Borradores</option>
            <option value="pending_review">Pendientes de revisión</option>
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
                : 'No hay comprobantes con este estado'}
            </h2>
            <p>
              {items.length === 0
                ? 'Aquí aparecerán los borradores y los comprobantes enviados a revisión.'
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
                onClick={() => setFilter('all')}
              >
                Ver todos
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
                editPath={`${registerPath}&draft=${document.id}`}
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
