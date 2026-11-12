import { initials, safeAvatar } from '../utils/workspacePresentation';
import styles from '../workspace.module.css';

export function WorkspaceAvatar({
  name,
  url,
  large = false,
}: {
  name: string;
  url?: string | null;
  large?: boolean;
}) {
  const source = safeAvatar(url);
  return (
    <span
      className={`${styles.avatar} ${large ? styles.avatarLarge : ''}`}
      aria-hidden="true"
    >
      {initials(name)}
      {source && (
        <img
          key={source}
          src={source}
          alt=""
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      )}
    </span>
  );
}
