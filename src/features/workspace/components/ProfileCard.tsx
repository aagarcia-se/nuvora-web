import { useAuth } from '@/features/auth/store/authStore';
import { Icon } from '@/shared/ui/components/Icon';
import type { Profile } from '../types/workspace.types';
import { workspaceStatus, workspaceMessage } from '../api/workspaceApi';
import { WorkspaceAvatar } from './WorkspaceAvatar';
import { WorkspaceFeedback } from './WorkspaceFeedback';
import styles from '../workspace.module.css';

export function ProfileCard({
  profile,
  pending,
  error,
  onRetry,
}: {
  profile?: Profile;
  pending: boolean;
  error: unknown;
  onRetry: () => void;
}) {
  const { user } = useAuth();
  const name = profile?.display_name?.trim() || 'Tu cuenta';
  return (
    <aside className={styles.profileCard} aria-labelledby="profile-heading">
      <div className={styles.cardHeading}>
        <h2 id="profile-heading">Tu perfil</h2>
        <Icon name="user" />
      </div>
      <div className={styles.profileBody}>
        {pending ? (
          <div role="status" aria-busy="true" className={styles.profileLoading}>
            <span className="sr-only">Cargando tu perfil…</span>
            <span className={styles.skeletonIcon} />
            <span className={styles.skeletonText} />
          </div>
        ) : (
          <>
            <WorkspaceAvatar
              name={profile?.display_name || user?.email || 'N'}
              url={profile?.avatar_url}
              large
            />
            <h3 className={styles.profileName}>{name}</h3>
            {user?.email && <p className={styles.profileEmail}>{user.email}</p>}
            {Boolean(error) && workspaceStatus(error) === 404 && (
              <p role="status" className={styles.profileNote}>
                {workspaceMessage(error, 'profile')}
              </p>
            )}
            {Boolean(error) && workspaceStatus(error) !== 404 && (
              <WorkspaceFeedback
                error={error}
                context="profile"
                onRetry={onRetry}
              />
            )}
            {profile && (
              <dl className={styles.profileDetails}>
                <div>
                  <dt>Idioma</dt>
                  <dd>
                    {profile.locale === 'es-GT'
                      ? 'Español · Guatemala'
                      : profile.locale}
                  </dd>
                </div>
                <div>
                  <dt>Zona horaria</dt>
                  <dd>{profile.timezone}</dd>
                </div>
              </dl>
            )}
          </>
        )}
        <p className={styles.profileFootnote}>
          <Icon name="shield" />
          <span>Tus accesos dependen de la membresía en cada espacio.</span>
        </p>
      </div>
    </aside>
  );
}
