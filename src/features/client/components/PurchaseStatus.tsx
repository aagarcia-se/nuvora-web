import {
  purchaseDocumentStatusLabels,
  type PurchaseDocumentStatus,
} from '../types/purchaseDocument.types';
import styles from '../client.module.css';

export function PurchaseStatus({ status }: { status: PurchaseDocumentStatus }) {
  const tone =
    status === 'needs_correction'
      ? styles.statusCorrection
      : status === 'approved'
        ? styles.statusApproved
        : status === 'rejected'
          ? styles.statusRejected
          : status === 'pending_review'
            ? styles.statusReview
            : styles.statusDraft;
  return <span className={tone}>{purchaseDocumentStatusLabels[status]}</span>;
}
