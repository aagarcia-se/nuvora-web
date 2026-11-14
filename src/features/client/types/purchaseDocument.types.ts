export const purchaseDocumentTypes = {
  invoice: 'Factura',
  receipt: 'Recibo',
  service_receipt: 'Recibo de servicio',
  payment_proof: 'Comprobante de pago',
} as const;

export type PurchaseDocumentType = keyof typeof purchaseDocumentTypes;
export type PurchaseDocumentStatus =
  | 'draft'
  | 'pending_review'
  | 'needs_correction'
  | 'approved'
  | 'rejected'
  | 'discarded';

export const purchaseDocumentStatusLabels: Record<
  PurchaseDocumentStatus,
  string
> = {
  draft: 'Borrador',
  pending_review: 'Pendiente de revisión',
  needs_correction: 'Requiere corrección',
  approved: 'Aprobada internamente',
  rejected: 'Rechazada',
  discarded: 'Descartada',
};

export type PurchaseDocument = {
  id: string;
  workspaceId: string;
  entityId: string;
  documentType: PurchaseDocumentType;
  issueDate: string;
  issuerName: string;
  issuerTaxId: string | null;
  receiverTaxId: string;
  receiverName: string;
  description: string;
  category: string;
  total: string;
  currency: 'GTQ';
  status: PurchaseDocumentStatus;
  reviewObservation: string | null;
  observedBy: string | null;
  observedAt: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseDocumentInput = {
  documentType: PurchaseDocumentType;
  issueDate: string;
  issuerName: string;
  issuerTaxId?: string;
  receiverTaxId?: string;
  receiverName: string;
  description: string;
  category: string;
  total: string;
  currency: 'GTQ';
};

export type PurchaseDocumentPatch = Partial<PurchaseDocumentInput>;
export type PurchaseLifecycleActionKind =
  'discard' | 'return-to-draft' | 'approve' | 'reject';
