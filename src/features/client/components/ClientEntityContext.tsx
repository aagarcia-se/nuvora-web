import { Icon } from '@/shared/ui/components/Icon';
import styles from '../client.module.css';

export function ClientEntityContext({ name }: { name: string }) {
  return (
    <div className={styles.entityContext} aria-label="Empresa activa">
      <Icon name="layers" />
      <span>{name}</span>
    </div>
  );
}
