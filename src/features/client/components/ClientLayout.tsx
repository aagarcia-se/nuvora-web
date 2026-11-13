import { useEffect, useRef, type PropsWithChildren } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/store/authStore';
import { WorkspaceAccount } from '@/features/workspace/components/WorkspaceAccount';
import { InstallApp } from '@/shared/pwa/InstallApp';
import { env } from '@/shared/config/env';
import styles from '../client.module.css';

export function ClientLayout({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const { pathname, search } = useLocation();
  const main = useRef<HTMLElement>(null);
  useEffect(() => {
    main.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#client-content">
        Ir al contenido
      </a>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <span className="brand-mark" aria-hidden="true" />
          <span>{env.appName}</span>
        </div>
        <WorkspaceAccount
          name={user?.email || 'Mi cuenta'}
          showProfileLink={false}
        />
      </header>
      <div className={styles.install}>
        <InstallApp />
      </div>
      <main
        id="client-content"
        ref={main}
        tabIndex={-1}
        className={styles.content}
      >
        {children}
      </main>
    </div>
  );
}
