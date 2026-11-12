import type { PropsWithChildren } from 'react';
import { env } from '@/shared/config/env';
import { ThemeSelector } from '@/shared/theme/ThemeSelector';
import { InstallApp } from '@/shared/pwa/InstallApp';
export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">
        Ir al contenido
      </a>
      <header className="auth-header mx-auto grid w-full max-w-6xl items-center gap-4 py-4">
        <div className="auth-brand flex min-w-0 items-center gap-3">
          <img
            src="/favicon.svg"
            width="40"
            height="40"
            alt=""
            className="rounded-xl"
          />
          <span className="truncate text-xl font-bold tracking-tight">
            {env.appName}
          </span>
        </div>
        <InstallApp />
        <div className="auth-theme">
          <ThemeSelector />
        </div>
      </header>
      <main
        id="main"
        className="auth-main mx-auto grid min-w-0 w-full max-w-6xl flex-1 items-start gap-10 lg:grid-cols-2 lg:gap-16"
      >
        <aside className="auth-story hidden lg:flex">
          <p className="story-eyebrow">Para contadores y despachos</p>
          <h2 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight">
            Tus finanzas,
            <br />
            <span className="brand-highlight">bajo control.</span>
          </h2>
          <p className="story-description">
            Menos ruido. Más claridad. Tu espacio para dar el siguiente paso en
            tu trabajo contable.
          </p>
          <div className="story-note">
            <span className="story-monogram" aria-hidden="true">
              N
            </span>
            <div>
              <p className="font-semibold">Un espacio para enfocarte.</p>
              <p className="mt-1 text-sm">
                Diseñado para contadores y despachos.
              </p>
            </div>
          </div>
        </aside>
        <section className="auth-form card mx-auto w-full max-w-md p-6 sm:p-10">
          {children}
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 py-4 text-sm text-muted sm:flex-row">
        <p>{env.appName} · Contadores</p>
      </footer>
    </div>
  );
}
