import { env } from '@/shared/config/env';
import { usePwaInstall } from './usePwaInstall';

export function InstallApp() {
  const { canInstall, installed, installing, error, install } = usePwaInstall();

  if (installed)
    return (
      <p className="text-sm text-muted">
        Estás usando la aplicación instalada.
      </p>
    );

  return (
    <div className="w-full max-w-sm space-y-3 text-center">
      {canInstall ? (
        <button
          type="button"
          className="btn-secondary min-h-11"
          disabled={installing}
          onClick={() => void install()}
        >
          {installing ? 'Abriendo instalación…' : `Instalar ${env.appName}`}
        </button>
      ) : (
        <details className="rounded-xl border border-line p-3 text-sm text-muted">
          <summary className="min-h-12 cursor-pointer py-3 text-ink">
            Cómo instalar la aplicación
          </summary>
          <p className="mt-3">
            En iPhone o iPad, abre esta página en Safari y selecciona Compartir
            → Añadir a pantalla de inicio.
          </p>
          <p className="mt-3">
            En Android o escritorio, busca «Instalar aplicación» en el menú del
            navegador. La opción aparece cuando el navegador permite instalarla.
          </p>
        </details>
      )}
      {error && (
        <p role="alert" className="field-error">
          No se pudo abrir la instalación. Intenta desde el menú del navegador.
        </p>
      )}
    </div>
  );
}
