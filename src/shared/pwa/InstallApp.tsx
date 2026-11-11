import { useState } from 'react';
import { env } from '@/shared/config/env';
import { Icon } from '@/shared/ui/components/Icon';
import { usePwaInstall } from './usePwaInstall';

// New promotion semantics: old dismissals applied to the instructions/direct-only banner.
const dismissKey = 'nuvora-install-promotion-v2-dismissed-at';
function recentlyDismissed() {
  try {
    const time = Number(localStorage.getItem(dismissKey));
    return time > 0 && Date.now() - time < 14 * 24 * 60 * 60 * 1000;
  } catch { return false; }
}
export function InstallApp() {
  const { canInstall, installed, installing, error, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState(recentlyDismissed);
  if (installed || dismissed) return null;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const availability = import.meta.env.DEV
    ? 'Modo desarrollo · instalación disponible en la versión compilada.'
    : !window.isSecureContext
      ? 'La instalación requiere una conexión HTTPS.'
      : ios
        ? 'La instalación directa no está disponible en iOS.'
        : !('onbeforeinstallprompt' in window)
          ? 'Este navegador no ofrece instalación directa.'
          : 'El navegador aún no ha habilitado la instalación.';
  function dismiss() {
    try { localStorage.setItem(dismissKey, String(Date.now())); } catch { /* Dismiss for this visit when storage is blocked. */ }
    setDismissed(true);
  }
  return <aside aria-label="Instalar aplicación" className="install-banner rounded-2xl border p-3 text-left shadow-lg">
    <div className="grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center gap-3 sm:grid-cols-[3rem_minmax(0,1fr)_auto_3rem]">
      <span className="install-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"><Icon name="download" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">Instala {env.appName}</p>
        <p className="install-description mt-1 text-xs leading-relaxed">Acceso desde tu pantalla de inicio.</p>
        {!canInstall && !installing && <p role="status" className="install-description mt-1 text-xs leading-relaxed">{availability}</p>}
        {error && <p role="alert" className="field-error">No se pudo abrir la instalación. Podrás reintentar cuando el navegador vuelva a ofrecerla.</p>}
      </div>
      <button type="button" aria-label={`Instalar ${env.appName}`} className="btn-primary col-start-2 row-start-2 justify-self-start sm:col-start-3 sm:row-start-1" disabled={!canInstall || installing} onClick={() => void install()}>{installing ? 'Abriendo…' : 'Instalar'}</button>
      <button type="button" aria-label="Cerrar aviso de instalación" title="No mostrar durante 14 días" onClick={dismiss} className="install-close col-start-3 row-start-1 flex min-h-12 min-w-12 items-center justify-center rounded-xl sm:col-start-4"><Icon name="close" /></button>
    </div>
  </aside>;
}
