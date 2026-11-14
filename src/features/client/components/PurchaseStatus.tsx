import {
  purchaseDocumentStatusLabels,
  type PurchaseDocumentStatus,
} from '../types/purchaseDocument.types';
import styles from '../client.module.css';
import { Icon } from '@/shared/ui/components/Icon';

const statusVisuals: Record<
  PurchaseDocumentStatus,
  { tone: string; icon: Parameters<typeof Icon>[0]['name'] }
> = {
  draft: {
    tone: 'bg-[var(--document-draft-bg)] text-[color:var(--document-draft-ink)] border-[color:var(--document-draft-border)]',
    icon: 'pencil',
  },
  pending_review: {
    tone: 'bg-[var(--document-pending-bg)] text-[color:var(--document-pending-ink)] border-[color:var(--document-pending-border)]',
    icon: 'clock',
  },
  needs_correction: {
    tone: 'bg-[var(--document-correction-bg)] text-[color:var(--document-correction-ink)] border-[color:var(--document-correction-border)]',
    icon: 'alert',
  },
  approved: {
    tone: 'bg-[var(--document-approved-bg)] text-[color:var(--document-approved-ink)] border-[color:var(--document-approved-border)]',
    icon: 'check',
  },
  rejected: {
    tone: 'bg-[var(--document-rejected-bg)] text-[color:var(--document-rejected-ink)] border-[color:var(--document-rejected-border)]',
    icon: 'close',
  },
  discarded: {
    tone: 'bg-[var(--document-discarded-bg)] text-[color:var(--document-discarded-ink)] border-[color:var(--document-discarded-border)]',
    icon: 'archive',
  },
};

export function PurchaseStatus({ status }: { status: PurchaseDocumentStatus }) {
  const { tone, icon } = statusVisuals[status];
  return (
    <span className={`${styles.statusBadge} ${tone}`}>
      <Icon name={icon} />
      <span>{purchaseDocumentStatusLabels[status]}</span>
    </span>
  );
}
