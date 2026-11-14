import {
  ApiRequestError,
  authenticatedRequest,
  bearerHeaders,
} from '@/shared/api/authenticatedRequest';
import { httpClient } from '@/shared/api/httpClient';
import { isUuid } from '@/shared/utils/identifiers';

export type PurchasePeriodSummary = {
  period: string;
  currency: 'GTQ';
  initialAmount: string;
  purchasesTotal: string;
  remainingAmount: string;
  purchaseCount: number;
  includedStatuses: ['approved'];
};
export const validPeriod = (value: string) =>
  /^(?!0000)\d{4}-(0[1-9]|1[0-2])$/.test(value);
export function normalizeInitialAmount(value: string) {
  const raw = value.trim().replace(',', '.');
  if (!/^\d{1,16}(\.\d{1,2})?$/.test(raw)) return null;
  const [whole, fraction = ''] = raw.split('.');
  return `${BigInt(whole)}.${fraction.padEnd(2, '0')}`;
}
function parse(value: unknown, period: string): PurchasePeriodSummary {
  const invalid = () =>
    new ApiRequestError(502, 'INVALID_PURCHASE_PERIOD_RESPONSE');
  if (!value || typeof value !== 'object') throw invalid();
  const row = value as Record<string, unknown>;
  const amount = (key: string, signed = false) => {
    const value = row[key];
    if (
      typeof value !== 'string' ||
      !(signed ? /^-?\d+(\.\d{1,2})?$/ : /^\d+(\.\d{1,2})?$/).test(value)
    )
      throw invalid();
    return value;
  };
  const statuses: ['approved'] = ['approved'];
  if (
    row.period !== period ||
    row.currency !== 'GTQ' ||
    !Number.isSafeInteger(row.purchase_count) ||
    (row.purchase_count as number) < 0 ||
    !Array.isArray(row.included_statuses) ||
    row.included_statuses.length !== statuses.length ||
    !statuses.every((status) =>
      (row.included_statuses as unknown[]).includes(status),
    )
  )
    throw invalid();
  return {
    period,
    currency: 'GTQ',
    initialAmount: amount('initial_amount'),
    purchasesTotal: amount('purchases_total'),
    remainingAmount: amount('remaining_amount', true),
    purchaseCount: row.purchase_count as number,
    includedStatuses: [...row.included_statuses] as ['approved'],
  };
}
function endpoint(workspaceId: string, entityId: string, period: string) {
  if (!isUuid(workspaceId) || !isUuid(entityId) || !validPeriod(period))
    throw new ApiRequestError(400, 'INVALID_PURCHASE_PERIOD_CONTEXT');
  return `workspaces/${workspaceId}/entities/${entityId}/purchase-periods/${period}`;
}
export function getPurchasePeriod(
  userId: string,
  workspaceId: string,
  entityId: string,
  period: string,
  signal: AbortSignal,
) {
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.get<{ summary: unknown }>(
      `${endpoint(workspaceId, entityId, period)}/summary`,
      {
        signal,
        headers: bearerHeaders(token),
        // Keep Axios auth/timeout/error handling; bypass the browser HTTP cache.
        adapter: 'fetch',
        fetchOptions: { cache: 'no-store' },
      },
    );
    return parse(data?.summary, period);
  });
}
export function putPurchasePeriod(
  userId: string,
  workspaceId: string,
  entityId: string,
  period: string,
  initialAmount: string,
  signal: AbortSignal,
) {
  const normalized = normalizeInitialAmount(initialAmount);
  if (normalized === null)
    throw new ApiRequestError(400, 'INVALID_INITIAL_AMOUNT');
  return authenticatedRequest(userId, signal, async (token) => {
    const { data } = await httpClient.put<{ summary: unknown }>(
      endpoint(workspaceId, entityId, period),
      { initialAmount: normalized, currency: 'GTQ' },
      { signal, headers: bearerHeaders(token) },
    );
    return parse(data?.summary, period);
  });
}
