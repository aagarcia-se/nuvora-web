import { useEffect, useRef } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/store/authStore';
import { WorkspaceLayout } from '@/features/workspace/components/WorkspaceLayout';
import { ProfileCard } from '@/features/workspace/components/ProfileCard';
import {
  useProfileQuery,
  useWorkspaceDetail,
} from '@/features/workspace/api/useWorkspaceQueries';
import { WorkspaceFeedback } from '@/features/workspace/components/WorkspaceFeedback';
import { EntityPanel } from '@/features/entities/components/EntityPanel';
import { EntityDetailPage } from '@/features/entities/pages/EntityDetailPage';
import { entityKeys } from '@/features/entities/api/useEntityQueries';
import { isUuid } from '@/shared/utils/identifiers';
import type {
  Workspace,
  WorkspaceRole,
} from '@/features/workspace/types/workspace.types';
import styles from '@/features/workspace/workspace.module.css';

type Context = { workspace: Workspace; role: WorkspaceRole };
export function PrivateShell() {
  const { user } = useAuth();
  const profile = useProfileQuery();
  const { pathname } = useLocation();
  const client = useQueryClient();
  const previous = useRef<string | null>(null);
  const workspaceId = pathname.match(/^\/workspaces\/([^/]+)/)?.[1] ?? null;
  const activeWorkspace = useWorkspaceDetail(
    workspaceId && isUuid(workspaceId) ? workspaceId : '',
  );
  useEffect(() => {
    if (previous.current && previous.current !== workspaceId && user?.id) {
      const queryKey = entityKeys.scope(user.id, previous.current);
      void client.cancelQueries({ queryKey });
      client.removeQueries({ queryKey });
    }
    previous.current = workspaceId;
    document
      .getElementById('workspace-content')
      ?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [pathname, workspaceId, user?.id, client]);
  return (
    <WorkspaceLayout
      name={profile.data?.display_name || user?.email || 'Mi cuenta'}
      avatar={profile.data?.avatar_url}
      workspace={
        activeWorkspace.isSuccess ? activeWorkspace.data.workspace : undefined
      }
      checking={Boolean(
        workspaceId && isUuid(workspaceId) && activeWorkspace.isPending,
      )}
    >
      <nav className={styles.routeNav} aria-label="Ubicación">
        <Link to="/" aria-current={pathname === '/' ? 'page' : undefined}>
          Espacios
        </Link>
        {workspaceId && (
          <>
            <span aria-hidden="true">/</span>
            <Link
              to={`/workspaces/${workspaceId}/clients`}
              aria-current={!pathname.match(/clients\//) ? 'page' : undefined}
            >
              Clientes
            </Link>
          </>
        )}
        {pathname.match(/clients\//) && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">
              {pathname.endsWith('/people')
                ? 'Personas y accesos'
                : pathname.endsWith('/invitations')
                  ? 'Invitaciones'
                  : pathname.endsWith('/documents')
                    ? 'Comprobantes'
                    : 'Datos del cliente'}
            </span>
          </>
        )}
        {pathname === '/account' && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Mi cuenta</span>
          </>
        )}
      </nav>
      <Outlet />
    </WorkspaceLayout>
  );
}
export function WorkspaceBoundary() {
  const { workspaceId = '' } = useParams();
  return isUuid(workspaceId) ? (
    <WorkspaceAccess key={workspaceId} id={workspaceId} />
  ) : (
    <InvalidResource />
  );
}
function WorkspaceAccess({ id }: { id: string }) {
  const detail = useWorkspaceDetail(id);
  if (detail.isPending)
    return <p role="status">Verificando acceso al espacio…</p>;
  if (detail.isError)
    return (
      <>
        <h1 className="text-2xl font-semibold">
          No pudimos abrir este espacio
        </h1>
        <WorkspaceFeedback
          error={detail.error}
          onRetry={() => void detail.refetch()}
        />
        <Link className="btn-secondary mt-6" to="/">
          Volver a mis espacios
        </Link>
      </>
    );
  return <Outlet context={detail.data} />;
}
export function ClientsPage() {
  const context = useOutletContext<Context>();
  return <EntityPanel key={context.workspace.id} {...context} />;
}
export function ClientPage() {
  const { workspace, role } = useOutletContext<Context>();
  const { entityId = '', section } = useParams();
  if (
    !isUuid(entityId) ||
    (section !== undefined &&
      section !== 'people' &&
      section !== 'invitations' &&
      section !== 'documents')
  )
    return <InvalidResource />;
  return (
    <EntityDetailPage
      key={`${workspace.id}:${entityId}`}
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceRole={role}
      entityId={entityId}
      section={section ?? 'data'}
    />
  );
}
export function AccountPage() {
  const profile = useProfileQuery();
  return (
    <>
      <header className={styles.pageHeading}>
        <div>
          <p className={styles.eyebrow}>Personal</p>
          <h1>Mi cuenta</h1>
          <p className={styles.intro}>Tu información de perfil y acceso.</p>
        </div>
      </header>
      <div className={styles.accountContent}>
        <ProfileCard
          profile={profile.data}
          pending={profile.isPending}
          error={profile.error}
          onRetry={() => void profile.refetch()}
        />
      </div>
    </>
  );
}
function InvalidResource() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Enlace no disponible</h1>
      <p className="mt-3 text-muted">
        Revisa el enlace o elige un espacio desde el inicio.
      </p>
      <Link to="/" className="btn-secondary mt-6">
        Volver a mis espacios
      </Link>
    </>
  );
}
