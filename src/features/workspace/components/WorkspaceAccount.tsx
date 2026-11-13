import { Link } from 'react-router-dom';
import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '@/features/auth/store/authStore';
import { ThemeSelector } from '@/shared/theme/ThemeSelector';
import { Icon } from '@/shared/ui/components/Icon';
import { WorkspaceAvatar } from './WorkspaceAvatar';
import styles from '../workspace.module.css';

export function WorkspaceAccount({
  name,
  avatar,
  showProfileLink = true,
}: {
  name: string;
  avatar?: string | null;
  showProfileLink?: boolean;
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  async function signOut() {
    if (pending) return;
    setPending(true);
    try {
      await logout();
    } finally {
      setPending(false);
    }
  }
  return (
    <div className={styles.account} ref={container}>
      <button
        type="button"
        ref={trigger}
        className={styles.accountTrigger}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Opciones de cuenta"
        onClick={() => setOpen((value) => !value)}
      >
        <WorkspaceAvatar name={name} url={avatar} />
        <span className={styles.accountName}>{name}</span>
        <Icon name="chevron-down" />
      </button>
      <div id={panelId} className={styles.accountPanel} hidden={!open}>
        {open && (
          <>
            <div className={styles.accountIdentity}>
              <p className="text-sm font-semibold">{name}</p>
              <p className="mt-1 text-xs text-muted">{user?.email}</p>
            </div>
            {showProfileLink ? (
              <Link
                to="/account"
                className={styles.accountLink}
                onClick={() => setOpen(false)}
              >
                <Icon name="user" /> Mi cuenta
              </Link>
            ) : (
              <p className={styles.accountLink}>Mi cuenta</p>
            )}
          </>
        )}
        <div className={styles.preference}>
          <span className="text-sm text-muted">Apariencia</span>
          <ThemeSelector />
        </div>
        <button
          type="button"
          className={styles.signOut}
          disabled={pending}
          onClick={() => void signOut()}
        >
          <Icon name="log-out" />
          {pending ? 'Cerrando sesión…' : 'Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}
