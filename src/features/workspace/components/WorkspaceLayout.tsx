import type { PropsWithChildren } from 'react';
import { InstallApp } from '@/shared/pwa/InstallApp';
import { Icon } from '@/shared/ui/components/Icon';
import { WorkspaceAccount } from './WorkspaceAccount';
import styles from '../workspace.module.css';

export function WorkspaceLayout({
  children,
  name,
  avatar,
}: PropsWithChildren<{ name: string; avatar?: string | null }>) {
  return (
    <div className={styles.shell}>
      <a className="skip-link" href="#workspace-content">
        Ir al contenido
      </a>
      <header className={styles.topbar}>
        <div className={styles.breadcrumb}>
          <span className={styles.contextIcon}>
            <Icon name="layers" />
          </span>
          <span className={styles.breadcrumbParent}>Inicio</span>
          <span aria-hidden="true" className={styles.slash}>
            /
          </span>
          <span>Espacios de trabajo</span>
        </div>
        <WorkspaceAccount name={name} avatar={avatar} />
      </header>
      <div className={styles.install}>
        <InstallApp />
      </div>
      <main id="workspace-content" tabIndex={-1} className={styles.content}>
        {children}
      </main>
    </div>
  );
}
