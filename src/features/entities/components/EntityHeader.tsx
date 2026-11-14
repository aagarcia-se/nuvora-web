import { Link } from 'react-router-dom';
import type { Ref } from 'react';
import { Icon } from '@/shared/ui/components/Icon';
import { initials } from '@/features/workspace/utils/workspacePresentation';
import workspaceStyles from '@/features/workspace/workspace.module.css';
import styles from '../entities.module.css';

export type EntitySection = 'data' | 'people' | 'invitations' | 'documents';

export function EntityHeader({
  name,
  workspaceName,
  basePath,
  section,
  canManageAccess,
  headingRef,
}: {
  name: string;
  workspaceName: string;
  basePath: string;
  section: EntitySection;
  canManageAccess: boolean;
  headingRef: Ref<HTMLHeadingElement>;
}) {
  const links = [
    { key: 'data', label: 'Datos del cliente', to: basePath },
    { key: 'documents', label: 'Comprobantes', to: `${basePath}/documents` },
    ...(canManageAccess
      ? [
          {
            key: 'people',
            label: 'Personas y accesos',
            to: `${basePath}/people`,
          },
          {
            key: 'invitations',
            label: 'Invitaciones',
            to: `${basePath}/invitations`,
          },
        ]
      : []),
  ];
  return (
    <>
      <header className={styles.entityHeader}>
        <div className={styles.entityIdentity}>
          <span className={styles.detailAvatar} aria-hidden="true">
            {initials(name)}
          </span>
          <div>
            <p className={workspaceStyles.eyebrow}>
              Cliente de {workspaceName}
            </p>
            <h1 ref={headingRef} tabIndex={-1}>
              {name}
            </h1>
          </div>
        </div>
        <Link
          className={workspaceStyles.backLink}
          to={basePath.slice(0, basePath.lastIndexOf('/'))}
        >
          <Icon name="arrow-right" /> Volver a clientes
        </Link>
      </header>
      <nav
        className={styles.entityNavigation}
        aria-label="Secciones del cliente"
      >
        {links.map((link) => (
          <Link
            key={link.key}
            to={link.to}
            aria-current={section === link.key ? 'page' : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
