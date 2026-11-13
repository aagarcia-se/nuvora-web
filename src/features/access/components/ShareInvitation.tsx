import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/shared/ui/components/Icon';
import { Button } from '@/shared/ui/components/Button';
import { generateShareLink } from '../api/accessApi';
import { useAccessAction } from '../hooks/useAccess';
import type { AccessContext } from '../types/access.types';
import { AccessFeedback } from './AccessFeedback';
import styles from '../access.module.css';

export function ShareInvitation({
  context,
  invitationId,
  initialUrl,
}: {
  context: AccessContext;
  invitationId: string;
  initialUrl: string;
}) {
  const action = useAccessAction(context);
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [notice, setNotice] = useState('');
  const [sharing, setSharing] = useState(false);
  const busy = useRef(false);
  const result = useRef<HTMLDivElement>(null);
  useEffect(() => {
    result.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);
  async function generate() {
    setUrl(null);
    setNotice('');
    const link = await action.run((id, signal) =>
      generateShareLink(id, context, invitationId, signal),
    );
    if (link) {
      setUrl(link);
      requestAnimationFrame(() =>
        result.current?.querySelector<HTMLButtonElement>('button')?.focus(),
      );
    }
  }
  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setNotice('Enlace copiado.');
    } catch {
      setNotice(
        'No se pudo copiar automáticamente. Selecciona y copia el enlace del campo.',
      );
    }
  }
  async function share() {
    if (!url || busy.current) return;
    busy.current = true;
    setSharing(true);
    setNotice('');
    try {
      if (navigator.share)
        await navigator.share({
          title: 'Invitación a Nuvora',
          text: 'Accede a este cliente con tu cuenta de Nuvora y confirma la invitación.',
          url,
        });
      else await copy();
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        await copy();
    } finally {
      busy.current = false;
      setSharing(false);
    }
  }
  return (
    <div className={styles.share}>
      <AccessFeedback error={action.error} />
      {url && (
        <div ref={result} className={styles.shareResult}>
          <label className="sr-only" htmlFor={`share-${invitationId}`}>
            Enlace de invitación
          </label>
          <div className={styles.linkRow}>
            <Icon name="link" />
            <input
              id={`share-${invitationId}`}
              type="text"
              className="input"
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              autoComplete="off"
            />
          </div>
          <div className={styles.actions}>
            <Button type="button" onClick={() => void copy()}>
              <Icon name="copy" />
              Copiar enlace
            </Button>
            <a
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="no-referrer"
              aria-label="Compartir por WhatsApp"
              href={`https://wa.me/?text=${encodeURIComponent('Accede a este cliente con tu cuenta de Nuvora y confirma la invitación.\n' + url)}`}
            >
              <Icon name="message" />
              WhatsApp
            </a>
          </div>
        </div>
      )}
      <p className={styles.linkHint}>
        Quien tenga el enlace podrá aceptar el acceso. Compártelo de forma
        privada.
      </p>
      <details className={styles.linkOptions}>
        <summary>Opciones del enlace</summary>
        {url && (
          <div className={styles.actions}>
            <Button
              type="button"
              variant="secondary"
              disabled={sharing}
              onClick={() => void share()}
            >
              {sharing ? 'Compartiendo…' : 'Compartir'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={sharing}
              onClick={() => {
                setUrl(null);
                setNotice(
                  'Enlace oculto de esta vista. El enlace sigue vigente hasta que expire o se reemplace.',
                );
              }}
            >
              Ocultar enlace
            </Button>
          </div>
        )}
        <p className={styles.hint}>
          Si reemplazas el enlace, el anterior dejará de funcionar.
        </p>
        <Button
          type="button"
          variant="secondary"
          disabled={action.pending || sharing}
          onClick={() => void generate()}
        >
          {action.pending
            ? 'Generando…'
            : url
              ? 'Reemplazar enlace anterior'
              : 'Generar nuevo enlace'}
        </Button>
      </details>
      {notice && (
        <p role="status" className={styles.hint}>
          {notice}
        </p>
      )}
    </div>
  );
}
