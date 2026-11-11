import axios from 'axios';
import { httpClient } from '@/shared/api/httpClient';
import { env } from '@/shared/config/env';
import type { Identity } from '../types/auth.types';

export interface GoogleOAuthUrlResponse {
  url: string;
}

export function authMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401)
      return 'Correo o contraseña inválidos, o sesión vencida. Inicia sesión de nuevo.';
    if (status === 403)
      return 'No tienes permiso para acceder. Contacta al administrador.';
    if (status === 429)
      return 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
    if (status === 400)
      return 'Revisa el correo y la contraseña e intenta de nuevo.';
    if (!status)
      return 'No pudimos conectar. Comprueba tu conexión e intenta de nuevo.';
  }
  return 'No pudimos completar la solicitud. Intenta de nuevo en un momento.';
}
export function passwordResetMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.error;
    if (code === 'AUTH_RATE_LIMITED' || error.response?.status === 429)
      return 'Hemos recibido tu solicitud. Si necesitas intentarlo de nuevo, espera unos minutos.';
    if (code === 'VALIDATION_ERROR' || error.response?.status === 400)
      return 'La solicitud no es válida. Revisa los datos e intenta de nuevo.';
    if (code === 'PASSWORD_UPDATE_FAILED' || error.response?.status === 401)
      return 'El enlace no es válido o ya venció. Solicita un enlace nuevo.';
    if (!error.response)
      return 'No pudimos conectar. Comprueba tu conexión e intenta de nuevo.';
  }
  return 'No pudimos completar la solicitud. Intenta de nuevo en un momento.';
}

export function googleOAuthMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const code = error.response?.data?.error;
    if (code === 'GOOGLE_OAUTH_FAILED' || error.response?.status === 400)
      return 'No pudimos iniciar Google. Comprueba la configuración del proveedor e inténtalo de nuevo.';
    if (error.response?.status === 429)
      return 'Demasiados intentos. Espera unos minutos antes de volver a intentar.';
    if (!error.response)
      return 'No pudimos conectar. Comprueba tu conexión e intenta de nuevo.';
  }
  return 'No pudimos iniciar sesión con Google. Intenta de nuevo en un momento.';
}

export function isAllowedOAuthUrl(value: string): boolean {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password)
      return false;

    const apiOrigin = env.apiBaseUrl;
    const supabaseOrigin = env.supabaseUrl;
    const isLocalHttp =
      url.protocol === 'http:' &&
      (url.hostname === 'localhost' || url.hostname === '127.0.0.1');
    const isSupabaseAuthorize =
      url.origin === supabaseOrigin && url.pathname === '/auth/v1/authorize';
    const isGoogleProvider =
      url.protocol === 'https:' &&
      url.hostname === 'accounts.google.com' &&
      url.pathname.startsWith('/o/oauth2/');
    // The API is the trusted source of this URL. Keep the legacy API/local and
    // provider allowances, but require an exact origin/host and safe URL parts.
    return url.origin === apiOrigin || isSupabaseAuthorize || isLocalHttp || isGoogleProvider;
  } catch {
    return false;
  }
}

export async function getGoogleOAuthUrl(signal: AbortSignal): Promise<string> {
  const { data } = await httpClient.get<GoogleOAuthUrlResponse>(
    'auth/oauth/google/url',
    { signal },
  );
  if (typeof data?.url !== 'string' || !isAllowedOAuthUrl(data.url))
    throw new Error('Invalid Google OAuth URL');
  return data.url;
}
export async function signIn(
  email: string,
  password: string,
  signal: AbortSignal,
) {
  const { data } = await httpClient.post(
    'auth/signin',
    { email, password },
    { signal },
  );
  if (
    typeof data?.session?.access_token !== 'string' ||
    typeof data?.session?.refresh_token !== 'string'
  )
    throw new Error('Invalid session response');
  return {
    access_token: data.session.access_token as string,
    refresh_token: data.session.refresh_token as string,
  };
}
export async function currentUser(
  token: string,
  signal: AbortSignal,
): Promise<Identity> {
  // Fixed API destination: never attach a bearer to arbitrary URLs.
  const { data } = await httpClient.get('auth/me', {
    signal,
    headers: { Authorization: `Bearer ${token}`, 'Cache-Control': 'no-store' },
  });
  if (
    typeof data?.user?.id !== 'string' ||
    (data.user.email !== undefined && typeof data.user.email !== 'string')
  )
    throw new Error('Invalid identity response');
  return { id: data.user.id, email: data.user.email };
}

export async function requestPasswordReset(email: string, signal: AbortSignal) {
  await httpClient.post(
    'auth/password-reset/request',
    { email },
    { signal },
  );
}

export async function updatePassword(
  token: string,
  password: string,
  signal: AbortSignal,
) {
  await httpClient.post(
    'auth/password-reset/update',
    { password },
    {
      signal,
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}
