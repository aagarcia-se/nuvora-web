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
      <header className="auth-header mx-auto grid w-full max-w-6xl items-center gap-4">
        <div className="auth-brand flex min-w-0 items-center gap-3">
          <span className="brand-mark" aria-hidden="true" />
          <div className="min-w-0">
            <span className="auth-brand-name block truncate">{env.appName}</span>
            <span className="auth-brand-caption block">Contadores</span>
          </div>
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
        <section className="auth-form mx-auto w-full">
          {children}
        </section>
      </main>
      <footer className="auth-footer mx-auto w-full max-w-6xl text-center text-xs text-muted">
        <p>Tus finanzas, bajo control.</p>
      </footer>
    </div>
  );
}
