import axios from 'axios';
import { httpClient } from '@/shared/api/httpClient';
import type { Identity } from '../types/auth.types';
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
