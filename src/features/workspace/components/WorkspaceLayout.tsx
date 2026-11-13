import {
  useEffect,
  useId,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react';
import { useLocation } from 'react-router-dom';
import { env } from '@/shared/config/env';
import { InstallApp } from '@/shared/pwa/InstallApp';
import { Icon } from '@/shared/ui/components/Icon';
import { WorkspaceAccount } from './WorkspaceAccount';
import { WorkspaceNavigation } from './WorkspaceNavigation';
import type { Workspace } from '../types/workspace.types';
import styles from '../workspace.module.css';
import navigation from '../navigation.module.css';

export function WorkspaceLayout({
  children,
  name,
  avatar,
  workspace,
  checking = false,
}: PropsWithChildren<{
  name: string;
  avatar?: string | null;
  workspace?: Workspace;
  checking?: boolean;
}>) {
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const dialogId = useId();
  const titleId = useId();
  const { pathname } = useLocation();
  function closeNavigation() {
    dialog.current?.close();
  }
  function navigate() {
    closeNavigation();
    // Native dialog restores trigger focus; route navigation instead lands on content.
    requestAnimationFrame(() =>
      document
        .getElementById('workspace-content')
        ?.focus({ preventScroll: true }),
    );
  }
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);
  useEffect(() => {
    const desktop = matchMedia('(min-width: 1024px)');
    const resize = () => {
      if (desktop.matches && dialog.current?.open) {
        dialog.current.close();
        document
          .getElementById('workspace-content')
          ?.focus({ preventScroll: true });
      }
    };
    desktop.addEventListener('change', resize);
    const drawer = dialog.current;
    return () => {
      desktop.removeEventListener('change', resize);
      drawer?.close();
    };
  }, []);
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);
  return (
    <div className={`${styles.shell} ${navigation.shell}`}>
      <a className="skip-link" href="#workspace-content">
        Ir al contenido
      </a>
      <aside className={navigation.sidebar} aria-label="Panel de navegación">
        <div className={navigation.sidebarHeading}>
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <span className={navigation.brandName}>{env.appName}</span>
            <span className={navigation.brandCaption}>Contadores</span>
          </div>
        </div>
        <WorkspaceNavigation workspace={workspace} checking={checking} />
      </aside>
      <div className={navigation.page}>
        <header className={styles.topbar}>
          <div className={navigation.headerContext}>
            <button
              ref={trigger}
              type="button"
              className={navigation.menuButton}
              aria-label="Abrir menú de navegación"
              aria-haspopup="dialog"
              aria-expanded={open}
              aria-controls={dialogId}
              onClick={() => {
                dialog.current?.showModal();
                setOpen(true);
              }}
            >
              <Icon name="menu" />
            </button>
            <div className={navigation.headerCopy}>
              <span className={navigation.headerTitle}>
                {workspace?.name ?? env.appName}
              </span>
              <span className={navigation.headerSubtitle}>
                {checking
                  ? 'Verificando acceso…'
                  : workspace
                    ? 'Espacio activo'
                    : pathname === '/account'
                      ? 'Mi cuenta'
                      : 'Espacios de trabajo'}
              </span>
            </div>
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
      <dialog
        ref={dialog}
        id={dialogId}
        aria-labelledby={titleId}
        className={navigation.drawer}
        onClose={() => {
          setOpen(false);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeNavigation();
        }}
      >
        <div className={navigation.drawerPanel}>
          <div className={navigation.drawerHeading}>
            <h2 id={titleId}>Navegación</h2>
            <button
              type="button"
              className={navigation.closeButton}
              aria-label="Cerrar menú de navegación"
              onClick={closeNavigation}
            >
              <Icon name="close" />
            </button>
          </div>
          <WorkspaceNavigation
            workspace={workspace}
            checking={checking}
            onNavigate={navigate}
          />
        </div>
      </dialog>
    </div>
  );
}
