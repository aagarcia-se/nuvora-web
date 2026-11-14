import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CanceledError } from 'axios';
import { useAuth } from '@/features/auth/store/authStore';
import { isRequestCanceled } from '@/shared/api/authenticatedRequest';
import { Button } from '@/shared/ui/components/Button';
import { Icon } from '@/shared/ui/components/Icon';
import {
  confirmPurchasePhoto,
  deletePurchasePhoto,
  getPurchasePhoto,
  photoMaxBytes,
  photoMessage,
  photoTypes,
  requestPhotoUpload,
  uploadPhotoBinary,
  type PhotoMetadata,
} from '../api/purchasePhotoApi';
import { PurchaseDraftGuard } from './PurchaseDraftGuard';
import styles from '../client.module.css';

export type PhotoActivity = { busy: boolean; dirty: boolean };
const size = (bytes: number) =>
  `${new Intl.NumberFormat('es-GT', { maximumFractionDigits: 1 }).format(bytes / 1024 / 1024)} MiB`;

export function PurchasePhoto({
  workspaceId,
  entityId,
  documentId,
  editable,
  disabled = false,
  onActivity,
  guard = false,
}: {
  workspaceId: string;
  entityId: string;
  documentId: string;
  editable: boolean;
  disabled?: boolean;
  onActivity?: (activity: PhotoActivity) => void;
  guard?: boolean;
}) {
  const { user, logout } = useAuth();
  const userId = user?.id ?? '';
  const scope = { userId, workspaceId, entityId, documentId };
  const key = [
    'purchase-photo',
    userId,
    workspaceId,
    entityId,
    documentId,
  ] as const;
  const cache = useQueryClient();
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const photoHeading = useRef<HTMLHeadingElement>(null);
  const alive = useRef(true);
  const controller = useRef<AbortController | null>(null);
  const lock = useRef(false);
  const attemptedId = useRef<string | null>(null);
  const [remote, setRemote] = useState<{
    url: string;
    expiresAt: number;
  } | null>(null);
  const [selected, setSelected] = useState<{ file: File; url: string } | null>(
    null,
  );
  const [phase, setPhase] = useState<
    'idle' | 'checking' | 'uploading' | 'confirming' | 'deleting'
  >('idle');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [confirmation, setConfirmation] = useState<{
    kind: 'replace' | 'delete';
    trigger: HTMLElement;
  } | null>(null);
  const busy = phase !== 'idle';
  const query = useQuery<PhotoMetadata | null>({
    queryKey: key,
    queryFn: async ({ signal, queryKey }) => {
      const entry = cache.getQueryCache().find({ queryKey, exact: true });
      const result = await getPurchasePhoto(scope, signal);
      if (
        signal.aborted ||
        !alive.current ||
        cache.getQueryCache().find({ queryKey, exact: true }) !== entry
      )
        throw new CanceledError();
      setRemote(
        result
          ? { url: result.url, expiresAt: Date.now() + result.expiresIn * 1000 }
          : null,
      );
      // Only non-sensitive metadata enters Query. Signed URLs remain in local memory.
      return result?.metadata ?? null;
    },
    enabled: Boolean(userId && documentId),
    gcTime: 0,
    staleTime: Infinity,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      controller.current?.abort();
    };
  }, [userId, workspaceId, entityId, documentId]);
  useEffect(
    () => () => {
      if (selected) URL.revokeObjectURL(selected.url);
    },
    [selected],
  );
  useEffect(() => {
    if (!remote) return;
    const timer = window.setTimeout(
      () => setRemote(null),
      Math.max(0, remote.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timer);
  }, [remote]);
  useEffect(() => {
    onActivity?.({ busy, dirty: Boolean(selected) || uncertain });
  }, [busy, selected, uncertain, onActivity]);

  function choose(file?: File) {
    if (!file || busy || disabled || !editable || uncertain) return;
    setMessage('');
    if (
      !photoTypes.includes(file.type) ||
      !/\.(jpe?g|png|webp)$/i.test(file.name)
    ) {
      setError(
        'Elige una foto JPEG, PNG o WebP. No se admiten PDF ni otros archivos.',
      );
      return;
    }
    if (file.size <= 0 || file.size > photoMaxBytes) {
      setError('La foto debe contener datos y pesar como máximo 10 MiB.');
      return;
    }
    attemptedId.current = null;
    setSelected({ file, url: URL.createObjectURL(file) });
    setError('');
  }
  async function run(kind: 'upload' | 'delete' | 'check') {
    if (
      lock.current ||
      disabled ||
      (kind !== 'check' && (!editable || uncertain))
    )
      return;
    if (kind === 'upload' && !selected) return;
    lock.current = true;
    const request = new AbortController();
    controller.current = request;
    const entry = cache.getQueryCache().find({ queryKey: key, exact: true });
    const current = () => {
      if (
        !alive.current ||
        request.signal.aborted ||
        cache.getQueryCache().find({ queryKey: key, exact: true }) !== entry
      )
        throw new CanceledError();
    };
    setError('');
    setMessage('');
    setPhase('checking');
    try {
      await cache.cancelQueries({ queryKey: key, exact: true });
      const latest = await getPurchasePhoto(scope, request.signal);
      current();
      if (kind === 'upload') {
        if ((latest?.metadata.id ?? null) !== (query.data?.id ?? null))
          throw new Error('changed');
        const ticket = await requestPhotoUpload(
          scope,
          selected!.file,
          request.signal,
        );
        current();
        attemptedId.current = ticket.fileId;
        setPhase('uploading');
        setProgress(0);
        await uploadPhotoBinary(
          ticket.url,
          selected!.file,
          request.signal,
          (value) => {
            if (alive.current && !request.signal.aborted) setProgress(value);
          },
        );
        current();
        setPhase('confirming');
        await confirmPurchasePhoto(
          scope,
          ticket.fileId,
          selected!.file,
          request.signal,
        );
        current();
      } else if (kind === 'delete') {
        if ((latest?.metadata.id ?? null) !== (query.data?.id ?? null))
          throw new Error('changed');
        if (latest) {
          setPhase('deleting');
          await deletePurchasePhoto(scope, request.signal);
          current();
        }
      }
      await cache.invalidateQueries({
        queryKey: key,
        exact: true,
        refetchType: 'none',
      });
      const result = await query.refetch();
      current();
      if (result.isError) throw result.error;
      if (kind === 'upload' && result.data?.id !== attemptedId.current)
        throw new Error('unconfirmed');
      if (kind === 'delete' && result.data !== null)
        throw new Error('unconfirmed');
      const recovered = Boolean(
        attemptedId.current && result.data?.id === attemptedId.current,
      );
      if (kind === 'upload' || recovered) {
        setSelected(null);
        attemptedId.current = null;
      }
      setUncertain(false);
      setMessage(
        kind === 'delete'
          ? 'Foto eliminada del comprobante.'
          : kind === 'upload' || recovered
            ? 'Foto adjunta y confirmada.'
            : 'Estado de la foto actualizado.',
      );
      setConfirmation(null);
    } catch (failure) {
      if (
        !isRequestCanceled(failure) &&
        alive.current &&
        !request.signal.aborted
      ) {
        setError(photoMessage(failure));
        if (kind !== 'check') setUncertain(true);
        setConfirmation(null);
      }
    } finally {
      lock.current = false;
      if (alive.current && !request.signal.aborted) setPhase('idle');
    }
  }
  const blocked =
    busy || disabled || query.isPending || query.isError || uncertain;
  return (
    <section
      className={styles.photoSection}
      aria-labelledby={`${id}-title`}
      aria-busy={busy || undefined}
    >
      <div className={styles.photoHeading}>
        <div>
          <h2
            ref={photoHeading}
            tabIndex={-1}
            id={`${id}-title`}
            className={styles.sectionTitle}
          >
            <Icon name="image" /> Foto del comprobante{' '}
            <span className={styles.photoOptional}>Opcional</span>
          </h2>
          <p className={styles.fieldHint}>
            Una imagen de respaldo. Los datos de la compra se ingresan
            manualmente.
          </p>
        </div>
      </div>
      {query.isPending ? (
        <p role="status">Consultando foto…</p>
      ) : query.isError ? (
        <p className="alert" role="alert">
          {photoMessage(query.error)}
        </p>
      ) : query.data ? (
        <div className={styles.photoPreview}>
          {remote ? (
            <a
              href={remote.url}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label="Abrir foto adjunta en tamaño completo"
            >
              <img
                src={remote.url}
                alt="Foto adjunta al comprobante"
                referrerPolicy="no-referrer"
                onError={() => setRemote(null)}
              />
            </a>
          ) : (
            <p>
              La vista previa caducó. Actualiza la foto para volver a verla.
            </p>
          )}
          <p>
            Foto adjunta ·{' '}
            {query.data.mimeType.replace('image/', '').toUpperCase()} ·{' '}
            {size(query.data.byteSize)}
          </p>
        </div>
      ) : (
        <p className={styles.fieldHint}>
          Este comprobante no tiene foto. Puedes continuar sin adjuntar una.
        </p>
      )}
      {!editable && (
        <p className={styles.fieldHint}>
          La foto está disponible solo para consulta en este estado o con tu
          permiso actual.
        </p>
      )}
      {selected && (
        <div className={styles.photoSelection}>
          <img
            src={selected.url}
            alt="Vista previa de la foto seleccionada, aún sin confirmar"
          />
          <div>
            <strong className={styles.photoFileName}>
              {selected.file.name}
            </strong>
            <p>
              {selected.file.type.replace('image/', '').toUpperCase()} ·{' '}
              {size(selected.file.size)}
            </p>
            <p className={styles.fieldHint}>
              Seleccionada · Todavía no está adjunta
            </p>
          </div>
        </div>
      )}
      {busy && (
        <div role="status" className={styles.photoProgress}>
          <p>
            {phase === 'uploading'
              ? `Subiendo foto… ${progress}%`
              : phase === 'confirming'
                ? 'Confirmando la foto con el servidor…'
                : phase === 'deleting'
                  ? 'Eliminando foto…'
                  : 'Comprobando el estado de la foto…'}
          </p>
          {phase === 'uploading' && (
            <progress
              value={progress}
              max={100}
              aria-label="Progreso de subida de la foto"
            />
          )}
        </div>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-alert" role="status">
          <Icon name="check" /> {message}
        </p>
      )}
      <div className={styles.formActions}>
        {editable && (
          <>
            <input
              ref={fileInput}
              type="file"
              className="sr-only"
              tabIndex={-1}
              aria-label="Elegir foto del comprobante"
              accept="image/jpeg,image/png,image/webp"
              disabled={blocked}
              onChange={(event) => {
                choose(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <input
              ref={cameraInput}
              type="file"
              className="sr-only"
              tabIndex={-1}
              aria-label="Tomar foto del comprobante"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              disabled={blocked}
              onChange={(event) => {
                choose(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={blocked}
              onClick={() => fileInput.current?.click()}
            >
              <Icon name="plus" />{' '}
              {selected ? 'Elegir otra foto' : 'Agregar foto'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={blocked}
              onClick={() => cameraInput.current?.click()}
            >
              <Icon name="camera" /> Tomar foto
            </Button>
            {selected && (
              <>
                <Button
                  type="button"
                  disabled={blocked}
                  onClick={(event) =>
                    query.data
                      ? setConfirmation({
                          kind: 'replace',
                          trigger: event.currentTarget,
                        })
                      : void run('upload')
                  }
                >
                  <Icon name="upload" />{' '}
                  {query.data ? 'Reemplazar foto' : 'Adjuntar foto'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy || disabled || uncertain}
                  onClick={() => {
                    setSelected(null);
                    setError('');
                  }}
                >
                  Quitar selección
                </Button>
              </>
            )}
            {query.data && !selected && (
              <Button
                type="button"
                variant="danger"
                disabled={blocked}
                onClick={(event) =>
                  setConfirmation({
                    kind: 'delete',
                    trigger: event.currentTarget,
                  })
                }
              >
                Eliminar foto
              </Button>
            )}
          </>
        )}
        {(query.data || query.isError || uncertain) && (
          <Button
            type="button"
            variant="secondary"
            disabled={busy || disabled}
            onClick={() => void run('check')}
          >
            {uncertain ? 'Comprobar estado de la foto' : 'Actualizar foto'}
          </Button>
        )}
        {((query.isError &&
          photoMessage(query.error).startsWith('Tu sesión')) ||
          error.startsWith('Tu sesión')) && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void logout()}
          >
            Volver a iniciar sesión
          </Button>
        )}
      </div>
      {editable && (
        <p className={styles.fieldHint}>
          JPEG, PNG o WebP · Máximo 10 MiB · Cámara según disponibilidad del
          dispositivo.
        </p>
      )}
      {confirmation && (
        <PhotoConfirmation
          kind={confirmation.kind}
          trigger={confirmation.trigger}
          fallback={photoHeading}
          busy={busy}
          onCancel={() => setConfirmation(null)}
          onConfirm={() =>
            void run(confirmation.kind === 'delete' ? 'delete' : 'upload')
          }
        />
      )}
      {guard && (
        <PurchaseDraftGuard
          dirty={Boolean(selected) || uncertain}
          pending={busy}
          onDiscard={() => setSelected(null)}
        />
      )}
    </section>
  );
}

function PhotoConfirmation({
  kind,
  trigger,
  fallback,
  busy,
  onCancel,
  onConfirm,
}: {
  kind: 'replace' | 'delete';
  trigger: HTMLElement;
  fallback: RefObject<HTMLHeadingElement | null>;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = dialog.current;
    const fallbackElement = fallback.current;
    element?.showModal();
    return () => {
      element?.close();
      (trigger.isConnected ? trigger : fallbackElement)?.focus({
        preventScroll: true,
      });
    };
  }, [trigger, fallback]);
  return (
    <dialog
      ref={dialog}
      className={styles.confirmDialog}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id={`${id}-title`}>
        {kind === 'delete'
          ? '¿Eliminar la foto adjunta?'
          : '¿Reemplazar la foto adjunta?'}
      </h2>
      <p id={`${id}-description`}>
        {kind === 'delete'
          ? 'Se quitará la imagen de este comprobante. Los datos de la compra y su historial se conservan.'
          : 'La nueva foto sustituirá a la actual después de confirmarse. El historial de la operación se conserva.'}
      </p>
      <div className={styles.formActions}>
        <Button
          type="button"
          variant="secondary"
          autoFocus
          disabled={busy}
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant={kind === 'delete' ? 'danger' : 'primary'}
          loading={busy}
          loadingLabel="Procesando…"
          onClick={onConfirm}
        >
          {kind === 'delete' ? 'Eliminar foto' : 'Reemplazar foto'}
        </Button>
      </div>
    </dialog>
  );
}
