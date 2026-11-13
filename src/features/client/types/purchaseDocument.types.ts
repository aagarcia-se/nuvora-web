export const purchaseDocumentTypes = {
  invoice: 'Factura',
  receipt: 'Recibo',
  service_receipt: 'Recibo de servicio',
  payment_proof: 'Comprobante de pago',
} as const;

export type PurchaseDocumentType = keyof typeof purchaseDocumentTypes;
export type PurchaseDocumentStatus = 'draft' | 'pending_review';

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
