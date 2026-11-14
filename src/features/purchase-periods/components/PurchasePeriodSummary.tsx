import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import {
  errorStatus,
  isRequestCanceled,
} from '@/shared/api/authenticatedRequest';
import { PurchaseDraftGuard } from '@/features/client/components/PurchaseDraftGuard';
import { formatPurchaseTotal } from '@/features/client/utils/purchasePresentation';
import { normalizeInitialAmount, validPeriod } from '../api/purchasePeriodsApi';
import { usePurchasePeriod } from '../api/usePurchasePeriod';
import styles from '../purchasePeriods.module.css';

function message(error: unknown) {
  switch (errorStatus(error)) {
    case 401:
      return 'Tu sesión ya no es válida. Vuelve a iniciar sesión.';
    case 403:
      return 'No tienes permiso para consultar o configurar el resumen de esta empresa.';
    case 404:
      return 'El resumen no está disponible para este contexto.';
    case 409:
      return 'El monto cambió o existe un conflicto. Actualiza el resumen antes de volver a guardar.';
    case 400:
    case 422:
      return 'Revisa el mes y el monto inicial antes de continuar.';
    case 503:
      return 'El resumen no está disponible por el momento. Puedes reintentar la consulta.';
    default:
      return 'No pudimos completar la consulta. Revisa tu conexión e inténtalo de nuevo.';
  }
}
export function PurchasePeriodSummary({
  workspaceId,
  entityId,
  period,
  canManage,
  documentsPath,
  onPeriodChange,
  headingLevel = 1,
}: {
  workspaceId: string;
  entityId: string;
  period: string;
  canManage: boolean;
  documentsPath: string;
  onPeriodChange: (period: string) => void;
  headingLevel?: 1 | 2;
}) {
  const id = useId();
  const [invalid, setInvalid] = useState(false);
  const Heading = headingLevel === 2 ? 'h2' : 'h1';
  return (
    <section className={styles.page} aria-labelledby={`${id}-title`}>
      <header className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>Compras de la empresa · GTQ</p>
          <Heading id={`${id}-title`}>Resumen mensual</Heading>
          <p>
            Consulta las compras aprobadas del mes y el disponible estimado.
          </p>
        </div>
        <div className={styles.field}>
          <label htmlFor={`${id}-period`}>Mes y año</label>
          <input
            id={`${id}-period`}
            type="month"
            value={period}
            min="0001-01"
            max="9999-12"
            aria-invalid={invalid}
            aria-describedby={invalid ? `${id}-error` : undefined}
            onChange={(event) => {
              const valid = validPeriod(event.target.value);
              setInvalid(!valid);
              if (valid) onPeriodChange(event.target.value);
            }}
          />
          {invalid && (
            <p id={`${id}-error`} className={styles.error}>
              Selecciona un mes y un año válidos.
            </p>
          )}
        </div>
      </header>
      <PeriodContent
        key={`${workspaceId}:${entityId}:${period}`}
        workspaceId={workspaceId}
        entityId={entityId}
        period={period}
        canManage={canManage}
        documentsPath={documentsPath}
      />
    </section>
  );
}
function PeriodContent({
  workspaceId,
  entityId,
  period,
  canManage,
  documentsPath,
}: {
  workspaceId: string;
  entityId: string;
  period: string;
  canManage: boolean;
  documentsPath: string;
}) {
  const { summary, write } = usePurchasePeriod(workspaceId, entityId, period);
  const { logout } = useAuth();
  const id = useId();
  const amountInput = useRef<HTMLInputElement>(null);
  const saving = useRef(false);
  const configure = useRef<HTMLButtonElement>(null);
  const notice = useRef<HTMLParagraphElement>(null);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [failure, setFailure] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    if (feedback) notice.current?.focus({ preventScroll: true });
  }, [feedback]);
  const normalized = normalizeInitialAmount(amount);
  const dirty =
    editing &&
    normalized !== normalizeInitialAmount(summary.data?.initialAmount ?? '0');
  async function refresh() {
    if (write.isPending) return;
    const response = await summary.refetch();
    if (response.isSuccess) {
      setRecovery(false);
      setBlocked(false);
      setFailure('');
      const alreadySaved =
        normalizeInitialAmount(response.data.initialAmount) === normalized;
      if (alreadySaved) setEditing(false);
      setFeedback(
        alreadySaved
          ? 'El monto inicial ya está guardado para este mes.'
          : 'Resumen actualizado. Revisa el monto antes de guardar nuevamente.',
      );
    }
  }
  async function save() {
    if (!canManage || write.isPending || saving.current || blocked || recovery)
      return;
    if (normalized === null) {
      setFieldError(
        'Usa un monto igual o mayor que cero, con hasta 16 dígitos enteros y dos decimales.',
      );
      amountInput.current?.focus();
      return;
    }
    setFieldError('');
    setFeedback('');
    setFailure('');
    saving.current = true;
    try {
      await write.mutateAsync(normalized);
      setEditing(false);
      setFeedback('Monto inicial guardado para este mes.');
    } catch (error) {
      if (isRequestCanceled(error)) return;
      const status = errorStatus(error);
      const uncertain = status === 0 || status >= 500;
      setRecovery(uncertain || status === 409);
      setBlocked([401, 403, 404].includes(status));
      setFailure(
        uncertain
          ? 'No pudimos confirmar el guardado. Actualiza el resumen para comprobar el monto antes de repetirlo.'
          : message(error),
      );
    } finally {
      saving.current = false;
    }
  }
  const data = summary.data;
  const negative =
    !!data?.remainingAmount.startsWith('-') &&
    /[1-9]/.test(data.remainingAmount);
  return (
    <>
      {summary.isPending ? (
        <div className={styles.state} role="status">
          Cargando resumen del mes…
        </div>
      ) : summary.isError ? (
        <div className={styles.state}>
          <p className="alert" role="alert">
            {message(summary.error)}
          </p>
          <Button
            type="button"
            variant="secondary"
            loading={summary.isFetching}
            loadingLabel="Consultando…"
            onClick={
              errorStatus(summary.error) === 401
                ? () => void logout()
                : () => void summary.refetch()
            }
          >
            {errorStatus(summary.error) === 401
              ? 'Volver a iniciar sesión'
              : 'Reintentar'}
          </Button>
        </div>
      ) : (
        data && (
          <>
            <div className={styles.toolbar}>
              <span>Período {period}</span>
              <Button
                type="button"
                variant="secondary"
                disabled={editing || write.isPending}
                loading={summary.isFetching}
                loadingLabel="Actualizando…"
                onClick={() => void summary.refetch()}
              >
                Actualizar
              </Button>
            </div>
            {feedback && (
              <p
                ref={notice}
                tabIndex={-1}
                className="success-alert"
                role="status"
              >
                {feedback}
              </p>
            )}
            <div className={styles.sheet}>
              <div className={styles.initial}>
                <div>
                  <h3>
                    <Icon name="calendar" />
                    Monto inicial
                  </h3>
                  <p>Importe de referencia para este mes.</p>
                </div>
                {(!editing || !canManage) && (
                  <div className={styles.initialValue}>
                    <strong>{formatPurchaseTotal(data.initialAmount)}</strong>
                    {canManage && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setAmount(data.initialAmount);
                          setEditing(true);
                          setFailure('');
                          setFeedback('');
                          setFieldError('');
                          setBlocked(false);
                          setRecovery(false);
                        }}
                      >
                        <Icon name="pencil" />
                        Configurar monto
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {canManage && editing && (
                <form
                  className={styles.amountForm}
                  noValidate
                  aria-busy={write.isPending}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void save();
                  }}
                >
                  <div className={styles.field}>
                    <label htmlFor={`${id}-amount`}>Monto inicial en GTQ</label>
                    <input
                      ref={amountInput}
                      autoFocus
                      id={`${id}-amount`}
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      disabled={
                        write.isPending ||
                        blocked ||
                        (recovery && summary.isFetching)
                      }
                      aria-invalid={!!fieldError}
                      aria-describedby={`${id}-hint${fieldError ? ` ${id}-error` : ''}`}
                      onChange={(event) => {
                        setAmount(event.target.value);
                        setFieldError('');
                      }}
                    />
                    <p id={`${id}-hint`} className={styles.hint}>
                      Puedes usar cero. El monto es una referencia informativa;
                      no registra un ingreso ni un pago.
                    </p>
                    {fieldError && (
                      <p id={`${id}-error`} className={styles.error}>
                        {fieldError}
                      </p>
                    )}
                  </div>
                  {failure && (
                    <div className="alert" role="alert">
                      <p>{failure}</p>
                      {recovery && (
                        <Button
                          type="button"
                          variant="secondary"
                          className="mt-3"
                          loading={summary.isFetching}
                          loadingLabel="Comprobando…"
                          onClick={() => void refresh()}
                        >
                          Comprobar monto guardado
                        </Button>
                      )}
                    </div>
                  )}
                  <div className={styles.actions}>
                    <Button
                      ref={configure}
                      type="button"
                      variant="secondary"
                      disabled={write.isPending}
                      onClick={() => {
                        setEditing(false);
                        setFailure('');
                        requestAnimationFrame(() =>
                          configure.current?.focus({ preventScroll: true }),
                        );
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      loading={write.isPending}
                      loadingLabel="Guardando…"
                      disabled={!dirty || recovery || blocked}
                    >
                      Guardar monto inicial
                    </Button>
                  </div>
                </form>
              )}
              <dl className={styles.metrics}>
                <div>
                  <dt>Total de compras aprobadas</dt>
                  <dd>{formatPurchaseTotal(data.purchasesTotal)}</dd>
                </div>
                <div className={negative ? styles.overrun : styles.remaining}>
                  <dt>Disponible estimado</dt>
                  <dd>{formatPurchaseTotal(data.remainingAmount)}</dd>
                </div>
                <div>
                  <dt>Comprobantes aprobados</dt>
                  <dd>{data.purchaseCount}</dd>
                </div>
              </dl>
              {negative && (
                <p className={styles.warning} role="status">
                  <Icon name="alert" />
                  El total de compras aprobadas supera el monto inicial del mes.
                  El disponible estimado es negativo.
                </p>
              )}
              {data.purchaseCount === 0 && (
                <p className={styles.empty}>
                  Aún no hay compras aprobadas en este mes. Los borradores y los
                  pendientes de revisión no reducen el disponible.
                </p>
              )}
              <footer className={styles.explanation}>
                <p>
                  Solo las compras aprobadas se descuentan del monto inicial,
                  según la fecha del comprobante. Borradores, correcciones,
                  pendientes de revisión, rechazados y descartados no se restan
                  del disponible.
                </p>
                <p>
                  Resumen informativo: no representa saldo bancario, caja,
                  pagos, validación SAT ni incorporación automática a libros.
                </p>
                <Link to={documentsPath} className="btn-secondary">
                  <Icon name="file" />
                  Ver comprobantes del mes
                </Link>
              </footer>
            </div>
          </>
        )
      )}
      {canManage && (
        <PurchaseDraftGuard
          dirty={dirty}
          pending={write.isPending}
          onDiscard={() => setEditing(false)}
        />
      )}
    </>
  );
}
