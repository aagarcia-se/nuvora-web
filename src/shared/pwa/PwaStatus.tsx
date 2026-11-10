import { useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaStatus() {
  const [error, setError] = useState(false);
  const [updating, setUpdating] = useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({ onRegisterError: () => setError(true) });

  async function update() {
    setUpdating(true);
    try {
      await updateServiceWorker(true);
    } catch {
      setError(true);
    } finally {
      setUpdating(false);
    }
  }

  if (!offlineReady && !needRefresh && !error) return null;

  return (
    <aside
      aria-label="Estado de la aplicación"
      className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl border border-line bg-surface p-4 shadow-lg"
    >
      <p role="status" className="text-sm text-ink">
        {error
          ? 'No se pudo preparar o actualizar el modo sin conexión. Recarga la página para reintentar.'
          : needRefresh
            ? 'Hay una nueva versión disponible. Guarda tu trabajo antes de actualizar.'
            : 'La interfaz está lista para abrirse sin conexión. Los datos y operaciones requieren internet.'}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {needRefresh && (
          <button
            type="button"
            className="btn-secondary min-h-11"
            disabled={updating}
            onClick={() => void update()}
          >
            {updating ? 'Actualizando…' : 'Actualizar'}
          </button>
        )}
        <button
          type="button"
          className="btn-secondary min-h-11"
          onClick={() => {
            setOfflineReady(false);
            setNeedRefresh(false);
            setError(false);
          }}
        >
          Cerrar
        </button>
      </div>
    </aside>
  );
}
