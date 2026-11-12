import { NavLink } from 'react-router-dom';
import { Icon } from '@/shared/ui/components/Icon';
import type { Workspace } from '../types/workspace.types';
import { initials } from '../utils/workspacePresentation';
import styles from '../navigation.module.css';

type Props = {
  workspace?: Workspace;
  checking: boolean;
  onNavigate?: () => void;
};
export function WorkspaceNavigation({
  workspace,
  checking,
  onNavigate,
}: Props) {
  return (
    <div className={styles.navigationBody}>
      <p className={styles.label}>Espacio de trabajo</p>
      <div className={styles.context}>
        <span className={styles.contextIcon} aria-hidden="true">
          {workspace ? initials(workspace.name) : <Icon name="layers" />}
        </span>
        <div className={styles.contextCopy}>
          <p className={styles.contextName}>
            {workspace?.name ??
              (checking ? 'Verificando acceso…' : 'Sin espacio activo')}
          </p>
          <p className={styles.contextHint}>
            {workspace ? 'Espacio activo' : 'Elige dónde trabajar'}
          </p>
        </div>
      </div>
      {workspace && (
        <NavLink to="/" onClick={onNavigate} className={styles.change}>
          Cambiar espacio <Icon name="arrow-right" />
        </NavLink>
      )}
      <nav aria-label="Navegación principal" className={styles.links}>
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }
        >
          <Icon name="layers" />
          <span>Espacios</span>
        </NavLink>
        {workspace && (
          <NavLink
            to={`/workspaces/${workspace.id}/clients`}
            onClick={onNavigate}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <Icon name="user" />
            <span>Clientes</span>
          </NavLink>
        )}
      </nav>
      {!workspace && !checking && (
        <p className={styles.hint}>
          Selecciona un espacio para acceder a su cartera de clientes.
        </p>
      )}
    </div>
  );
}
