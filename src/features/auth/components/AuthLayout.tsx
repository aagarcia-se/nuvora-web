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
          <span className="brand-mark" aria-hidden="true" />
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
        className="auth-main mx-auto flex w-full min-w-0 max-w-6xl flex-1 items-center justify-center"
      >
        <section className="auth-form mx-auto w-full max-w-md px-2 py-4 sm:px-8 sm:py-8">
          {children}
        </section>
      </main>
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-3 py-4 text-sm text-muted sm:flex-row">
        <p>{env.appName} · Contadores</p>
      </footer>
    </div>
  );
}
