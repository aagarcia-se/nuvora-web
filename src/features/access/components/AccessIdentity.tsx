import { WorkspaceAvatar } from '@/features/workspace/components/WorkspaceAvatar';
import type { AccessProfile } from '../types/access.types';
import { accessName } from '../utils/accessPresentation';
import styles from '../access.module.css';

export function AccessIdentity({ profile }: { profile: AccessProfile | null }) {
  const name = accessName(profile);
  return (
    <div className={styles.identityLine}>
      <WorkspaceAvatar name={name} url={profile?.avatarUrl} />
      <strong>{name}</strong>
    </div>
  );
}
