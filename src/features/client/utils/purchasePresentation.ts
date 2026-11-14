import type {
  PurchaseDocument,
  PurchaseDocumentInput,
} from '../types/purchaseDocument.types';

export function guatemalaDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function emptyPurchase(receiverName: string): PurchaseDocumentInput {
  return {
    documentType: 'invoice',
    issueDate: guatemalaDate(),
    issuerName: '',
    issuerTaxId: '',
    receiverName,
    receiverTaxId: 'C/F',
    description: '',
    category: '',
    total: '',
    currency: 'GTQ',
  };
}
export function purchaseInput(
  document: PurchaseDocument,
): PurchaseDocumentInput {
  return {
    documentType: document.documentType,
    issueDate: document.issueDate,
    issuerName: document.issuerName,
    issuerTaxId: document.issuerTaxId ?? '',
    receiverName: document.receiverName,
    receiverTaxId: document.receiverTaxId,
    description: document.description,
    category: document.category,
    total: document.total,
    currency: document.currency,
  };
}
export function normalizePurchase(
  input: PurchaseDocumentInput,
): PurchaseDocumentInput {
  return {
    ...input,
    issuerName: input.issuerName.trim(),
    issuerTaxId: input.issuerTaxId?.trim() || undefined,
    receiverName: input.receiverName.trim(),
    receiverTaxId: input.receiverTaxId?.trim() || 'C/F',
    category: input.category.trim().toLocaleLowerCase('es'),
    description: input.description.trim(),
    total: input.total.trim().replace(',', '.'),
  };
}
export function samePurchase(
  a: PurchaseDocumentInput,
  b: PurchaseDocumentInput,
) {
  const left = normalizePurchase(a);
  const right = normalizePurchase(b);
  return (Object.keys(left) as (keyof PurchaseDocumentInput)[]).every(
    (key) => left[key] === right[key],
  );
}
export function validatePurchase(input: PurchaseDocumentInput) {
  const form = normalizePurchase(input);
  const errors: Partial<Record<keyof PurchaseDocumentInput, string>> = {};
  if (
    !['invoice', 'receipt', 'service_receipt', 'payment_proof'].includes(
      form.documentType,
    )
  )
    errors.documentType = 'Selecciona el tipo de comprobante.';
  const date = new Date(`${form.issueDate}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(form.issueDate) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== form.issueDate
  )
    errors.issueDate = 'Indica una fecha válida.';
  if (!form.issuerName) errors.issuerName = 'Indica el nombre del emisor.';
  if (!form.receiverName)
    errors.receiverName = 'Indica el nombre del receptor.';
  if (!form.description) errors.description = 'Describe brevemente la compra.';
  if (!form.category) errors.category = 'Indica una categoría.';
  if (!/^\d+(\.\d{1,2})?$/.test(form.total) || !/[1-9]/.test(form.total))
    errors.total = 'Usa un total mayor que cero, con hasta dos decimales.';
  return errors;
}
export function formatPurchaseTotal(total: string) {
  if (!/^-?\d+(\.\d{1,2})?$/.test(total)) return `${total} GTQ`;
  const negative = total.startsWith('-') && /[1-9]/.test(total);
  const [integer, fraction = ''] = total.replace(/^-/, '').split('.');
  return `${negative ? '−' : ''}Q ${new Intl.NumberFormat('es-GT').format(BigInt(integer))}.${fraction.padEnd(2, '0')}`;
}
export function formatPurchaseDate(value: string) {
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat('es-GT', {
        timeZone: 'America/Guatemala',
        dateStyle: 'medium',
      }).format(date)
    : value;
}
