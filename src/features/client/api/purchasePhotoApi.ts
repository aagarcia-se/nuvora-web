import axios, { CanceledError } from 'axios';
import {
  ApiRequestError,
  authenticatedRequest,
  bearerHeaders,
  errorStatus,
} from '@/shared/api/authenticatedRequest';
import { httpClient } from '@/shared/api/httpClient';
import { env } from '@/shared/config/env';
import { isUuid } from '@/shared/utils/identifiers';

export const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];
export const photoMaxBytes = 10 * 1024 * 1024;
export type PhotoMetadata = { id: string; mimeType: string; byteSize: number };
export type PhotoScope = {
  userId: string;
  workspaceId: string;
  entityId: string;
  documentId: string;
};
const invalid = () => new ApiRequestError(502, 'INVALID_PHOTO_RESPONSE');
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw invalid();
  return value as Record<string, unknown>;
}
function signedUrl(value: unknown) {
  if (typeof value !== 'string') throw invalid();
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw invalid();
  }
  if (
    url.origin !== env.supabaseUrl ||
    !['https:', 'http:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    !url.pathname.startsWith('/storage/v1/') ||
    url.hash
  )
    throw invalid();
  return url.href;
}
function ttl(value: unknown) {
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > 300
  )
    throw invalid();
  return value;
}
function path(scope: PhotoScope) {
  if (
    ![scope.userId, scope.workspaceId, scope.entityId, scope.documentId].every(
      isUuid,
    )
  )
    throw invalid();
  return `/workspaces/${scope.workspaceId}/entities/${scope.entityId}/purchase-documents/${scope.documentId}/photo`;
}
export async function getPurchasePhoto(scope: PhotoScope, signal: AbortSignal) {
  return authenticatedRequest(scope.userId, signal, async (token) => {
    const response = await httpClient.get<unknown>(path(scope), {
      signal,
      headers: bearerHeaders(token),
      adapter: 'fetch',
      fetchOptions: { cache: 'no-store' },
    });
    const photo = object(response.data).photo;
    if (photo === null) return null;
    const row = object(photo);
    if (
      !isUuid(String(row.id)) ||
      !photoTypes.includes(String(row.mimeType)) ||
      typeof row.byteSize !== 'number' ||
      !Number.isInteger(row.byteSize) ||
      row.byteSize <= 0 ||
      row.byteSize > photoMaxBytes
    )
      throw invalid();
    return {
      metadata: {
        id: String(row.id),
        mimeType: String(row.mimeType),
        byteSize: row.byteSize,
      },
      url: signedUrl(row.url),
      expiresIn: ttl(row.expiresIn),
    };
  });
}
export async function requestPhotoUpload(
  scope: PhotoScope,
  file: File,
  signal: AbortSignal,
) {
  return authenticatedRequest(scope.userId, signal, async (token) => {
    // The server requires .jpg for JPEG (including camera files named .jpeg).
    const extension =
      file.type === 'image/jpeg'
        ? 'jpg'
        : file.type === 'image/png'
          ? 'png'
          : 'webp';
    const fileName = `${
      file.name
        .replace(/\.[^.]*$/, '')
        .replace(/[\\/]/g, '')
        .split('')
        .filter((character) => character.charCodeAt(0) >= 32)
        .join('')
        .trim()
        .slice(0, 180) || 'comprobante'
    }.${extension}`;
    const response = await httpClient.post<unknown>(
      `${path(scope)}/upload-url`,
      { mimeType: file.type, fileName, byteSize: file.size },
      { signal, headers: bearerHeaders(token) },
    );
    const row = object(object(response.data).upload);
    if (
      !isUuid(String(row.fileId)) ||
      row.mimeType !== file.type ||
      row.maxBytes !== photoMaxBytes
    )
      throw invalid();
    return {
      fileId: String(row.fileId),
      url: signedUrl(row.signedUrl),
      expiresIn: ttl(row.expiresIn),
    };
  });
}
// Deliberately isolated from the authenticated API transport. Never attach Bearer.
const storageClient = axios.create({ timeout: 60_000, withCredentials: false });
export async function uploadPhotoBinary(
  url: string,
  file: File,
  signal: AbortSignal,
  progress: (value: number) => void,
) {
  try {
    await storageClient.put(signedUrl(url), file, {
      signal,
      headers: { 'Content-Type': file.type },
      onUploadProgress: (event) => {
        if (event.total)
          progress(
            Math.min(100, Math.round((event.loaded / event.total) * 100)),
          );
      },
    });
  } catch (error) {
    if (signal.aborted || axios.isCancel(error)) throw new CanceledError();
    // Do not propagate Axios errors containing a signed URL or request configuration.
    throw new ApiRequestError(
      axios.isAxiosError(error) ? (error.response?.status ?? 0) : 0,
      'PHOTO_UPLOAD_FAILED',
    );
  }
}
export async function confirmPurchasePhoto(
  scope: PhotoScope,
  fileId: string,
  file: File,
  signal: AbortSignal,
) {
  await authenticatedRequest(scope.userId, signal, async (token) => {
    await httpClient.post(
      `${path(scope)}/confirm`,
      { fileId, mimeType: file.type, byteSize: file.size },
      { signal, headers: bearerHeaders(token) },
    );
  });
}
export async function deletePurchasePhoto(
  scope: PhotoScope,
  signal: AbortSignal,
) {
  await authenticatedRequest(scope.userId, signal, async (token) => {
    await httpClient.delete(path(scope), {
      signal,
      headers: bearerHeaders(token),
    });
  });
}
export function photoMessage(error: unknown) {
  switch (errorStatus(error)) {
    case 401:
      return 'Tu sesión terminó. Vuelve a iniciar sesión para consultar la foto.';
    case 403:
      return 'No tienes permiso para realizar esta acción sobre la foto.';
    case 404:
      return 'La foto o el comprobante ya no están disponibles. Actualiza la consulta.';
    case 409:
      return 'El comprobante o su foto cambiaron. Actualiza la consulta antes de continuar.';
    case 413:
      return 'La foto supera el límite de 10 MiB. Elige una imagen más pequeña.';
    case 400:
    case 415:
      return 'El archivo no es válido. Elige una foto JPEG, PNG o WebP.';
    case 503:
      return 'El servicio de fotos no está disponible. Puedes intentarlo nuevamente.';
    default:
      return 'No pudimos confirmar la operación. Comprueba el estado de la foto antes de intentarlo de nuevo.';
  }
}
