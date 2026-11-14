import {
  ApiRequestError,
  authenticatedRequest,
  bearerHeaders,
  errorStatus,
} from '@/shared/api/authenticatedRequest';
import { httpClient } from '@/shared/api/httpClient';
import { isUuid } from '@/shared/utils/identifiers';
import type {
  PurchaseDocument,
  PurchaseDocumentInput,
  PurchaseDocumentPatch,
  PurchaseDocumentStatus,
  PurchaseDocumentType,
} from '../types/purchaseDocument.types';

const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw invalid();
  return value as Record<string, unknown>;
};
const invalid = () =>
  new ApiRequestError(502, 'INVALID_PURCHASE_DOCUMENT_RESPONSE');
const text = (value: unknown): string => {
  if (typeof value !== 'string') throw invalid();
  return value;
};
const nullableText = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  return text(value);
};

function parseDocument(
  value: unknown,
  workspaceId: string,
  entityId: string,
  documentId?: string,
): PurchaseDocument {
  const row = record(value);
  if (
    row.workspace_id !== workspaceId ||
    row.entity_id !== entityId ||
    (documentId !== undefined && row.id !== documentId)
  )
    throw invalid();
  const type = row.document_type;
  const status = row.status;
  if (
    !isUuid(String(row.id)) ||
    !isUuid(String(row.workspace_id)) ||
    !isUuid(String(row.entity_id))
  )
    throw invalid();
  if (
    !['invoice', 'receipt', 'service_receipt', 'payment_proof'].includes(
      String(type),
    )
  )
    throw invalid();
  if (
    ![
      'draft',
      'pending_review',
      'needs_correction',
      'approved',
      'rejected',
      'discarded',
    ].includes(String(status))
  )
    throw invalid();
  const total = row.total;
  if (typeof total !== 'string' && typeof total !== 'number') throw invalid();
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    entityId: String(row.entity_id),
    documentType: type as PurchaseDocumentType,
    issueDate: text(row.issue_date),
    issuerName: text(row.issuer_name),
    issuerTaxId: nullableText(row.issuer_tax_id),
    receiverTaxId: text(row.receiver_tax_id),
    receiverName: text(row.receiver_name),
    description: text(row.description),
    category: text(row.category),
    total: String(total),
    currency:
      row.currency === 'GTQ'
        ? 'GTQ'
        : (() => {
            throw invalid();
          })(),
    status: status as PurchaseDocumentStatus,
    reviewObservation: nullableText(row.review_observation),
    observedBy: nullableText(row.observed_by),
    observedAt: nullableText(row.observed_at),
    createdAt: text(row.created_at),
    updatedAt: text(row.updated_at),
  };
}
function endpoint(workspaceId: string, entityId: string, documentId?: string) {
  if (
    !isUuid(workspaceId) ||
    !isUuid(entityId) ||
    (documentId !== undefined && !isUuid(documentId))
  )
    throw new ApiRequestError(400, 'INVALID_PURCHASE_DOCUMENT_CONTEXT');
  return `workspaces/${workspaceId}/entities/${entityId}/purchase-documents${documentId ? `/${documentId}` : ''}`;
}
export function listPurchaseDocuments(
  userId: string,
  workspaceId: string,
  entityId: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ documents: unknown }>(
      endpoint(workspaceId, entityId),
      { signal, headers: bearerHeaders(token) },
    );
    if (!Array.isArray(data?.documents)) throw invalid();
    return data.documents.map((value) =>
      parseDocument(value, workspaceId, entityId),
    );
  });
}
export function getPurchaseDocument(
  userId: string,
  workspaceId: string,
  entityId: string,
  documentId: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ document: unknown }>(
      endpoint(workspaceId, entityId, documentId),
      { signal, headers: bearerHeaders(token) },
    );
    return parseDocument(data?.document, workspaceId, entityId, documentId);
  });
}
export function createPurchaseDocument(
  userId: string,
  workspaceId: string,
  entityId: string,
  input: PurchaseDocumentInput,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.post<{ document: unknown }>(
      endpoint(workspaceId, entityId),
      input,
      { signal, headers: bearerHeaders(token) },
    );
    return parseDocument(data?.document, workspaceId, entityId);
  });
}
export function patchPurchaseDocument(
  userId: string,
  workspaceId: string,
  entityId: string,
  documentId: string,
  input: PurchaseDocumentPatch,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.patch<{ document: unknown }>(
      endpoint(workspaceId, entityId, documentId),
      input,
      { signal, headers: bearerHeaders(token) },
    );
    return parseDocument(data?.document, workspaceId, entityId, documentId);
  });
}
export function submitPurchaseDocument(
  userId: string,
  workspaceId: string,
  entityId: string,
  documentId: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.post<{ document: unknown }>(
      `${endpoint(workspaceId, entityId, documentId)}/submit-review`,
      {},
      { signal, headers: bearerHeaders(token) },
    );
    return parseDocument(data?.document, workspaceId, entityId, documentId);
  });
}
export function discardPurchaseDocument(
  userId: string,
  workspaceId: string,
  entityId: string,
  documentId: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.post<{ document: unknown }>(
      `${endpoint(workspaceId, entityId, documentId)}/discard`,
      {},
      { signal, headers: bearerHeaders(token) },
    );
    return parseDocument(data?.document, workspaceId, entityId, documentId);
  });
}
export function returnPurchaseDocumentToDraft(
  userId: string,
  workspaceId: string,
  entityId: string,
  documentId: string,
  observation: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.post<{ document: unknown }>(
      `${endpoint(workspaceId, entityId, documentId)}/return-to-draft`,
      { observation },
      { signal, headers: bearerHeaders(token) },
    );
    return parseDocument(data?.document, workspaceId, entityId, documentId);
  });
}
export function purchaseDocumentMessage(
  error: unknown,
  operation: 'read' | 'write' = 'read',
) {
  switch (errorStatus(error)) {
    case 401:
      return 'Tu sesión ya no es válida. Vuelve a iniciar sesión.';
    case 403:
      return 'No tienes permiso para consultar o registrar compras en esta empresa.';
    case 404:
      return 'La empresa o el comprobante ya no está disponible para tu cuenta.';
    case 409:
      return 'El comprobante cambió de estado o existe un conflicto con sus datos. Actualiza su detalle antes de repetir la acción.';
    case 400:
    case 422:
      return 'Revisa los datos indicados. No pudimos completar la acción con esta información.';
    case 503:
      return 'El servicio de compras no está disponible por el momento. Inténtalo más tarde.';
    case 0:
      return operation === 'write'
        ? 'No pudimos confirmar el guardado. Actualiza la lista antes de repetirlo.'
        : 'No pudimos conectar. Revisa tu conexión.';
    default:
      return 'No pudimos completar la solicitud. Inténtalo de nuevo.';
  }
}
