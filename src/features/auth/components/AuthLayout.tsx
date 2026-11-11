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
        <div className="auth-theme"><ThemeSelector /></div>
      </header>
      <main
        id="main"
        className="auth-main mx-auto grid min-w-0 w-full max-w-6xl flex-1 items-start gap-10 lg:grid-cols-2 lg:gap-24"
      >
        <aside className="hidden lg:block">
          <p className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted">
            Para contadores y despachos
          </p>
          <h2 className="max-w-lg text-5xl font-semibold leading-tight tracking-tight">
            Tus finanzas,
            <br />
            <span className="brand-highlight">bajo control.</span>
          </h2>
          <p className="mt-6 max-w-sm text-lg leading-relaxed text-muted">
            Un lugar para dar claridad a tu trabajo contable. Empieza por entrar
            a tu cuenta.
          </p>
          <div aria-hidden="true" className="mt-12 flex gap-3">
            <span className="h-2 w-20 rounded-full bg-brand-600" />
            <span className="h-2 w-8 rounded-full bg-line" />
            <span className="h-2 w-3 rounded-full bg-line" />
          </div>
        </aside>
        <section className="card mx-auto w-full max-w-md p-6 sm:p-10">
          {children}
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 py-4 text-sm text-muted sm:flex-row">
        <p>{env.appName} · Contadores</p>
      </footer>
    </div>
  );
}
