import { useEffect, useId, useRef, type PropsWithChildren } from 'react';
import { Icon } from '@/shared/ui/components/Icon';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import styles from '../entities.module.css';

export function EntityDialog({
  title,
  description,
  workspaceName,
  busy = false,
  closeLabel = 'Cerrar cliente',
  onClose,
  children,
}: PropsWithChildren<{
  title: string;
  description: string;
  workspaceName: string;
  busy?: boolean;
  closeLabel?: string;
  onClose: () => void;
}>) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.showModal();
    return () => {
      if (element.open) element.close();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={workspaceStyles.dialog}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className={workspaceStyles.dialogHeading}>
        <span className={workspaceStyles.dialogIcon}>
          <Icon name="user" />
        </span>
        <button
          type="button"
          className={workspaceStyles.iconButton}
          aria-label={closeLabel}
          disabled={busy}
          onClick={onClose}
        >
          <Icon name="close" />
        </button>
      </div>
      <h2 id={titleId} className={workspaceStyles.dialogTitle}>
        {title}
      </h2>
      <p id={descriptionId} className={workspaceStyles.dialogDescription}>
        {description}
      </p>
      <p className={styles.dialogContext}>
        <Icon name="layers" />
        <span>
          Espacio: <strong>{workspaceName}</strong>
        </span>
      </p>
      {children}
    </dialog>
  );
}
