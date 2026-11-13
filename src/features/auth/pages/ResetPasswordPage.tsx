import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/shared/lib/supabase';
import { Button } from '@/shared/ui/components/Button';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';
import { passwordResetMessage, updatePassword } from '../api/authApi';

import { passwordRules } from '../types/passwordRules';

const recoveryMarker = 'nuvora-recovery-flow';
type Status = 'loading' | 'ready' | 'success' | 'error';

function clearRecoveryMarker() {
  sessionStorage.removeItem(recoveryMarker);
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Validando tu enlace…');
  const [pending, setPending] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({ password: '', confirmation: '' });
  const summary = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    async function adoptRecoverySession() {
      if (!supabase) {
        setStatus('error');
        setMessage(
          'La recuperación no está configurada. Contacta al administrador.',
        );
        return;
      }
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const queryAccessToken = url.searchParams.get('access_token');
      const queryRefreshToken = url.searchParams.get('refresh_token');
      const params = new URLSearchParams(url.hash.slice(1));
      const accessToken = params.get('access_token') || queryAccessToken;
      const refreshToken = params.get('refresh_token') || queryRefreshToken;
      const recoveryType = params.get('type') || url.searchParams.get('type');
      const hasLink = Boolean(
        code || accessToken || refreshToken || recoveryType,
      );
      if (hasLink) sessionStorage.setItem(recoveryMarker, 'active');
      // Remove code and hash before any async SDK operation. Tokens never remain in the address bar.
      if (url.search || url.hash)
        window.history.replaceState(
          {},
          document.title,
          `${url.origin}${url.pathname}`,
        );
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else if (!sessionStorage.getItem(recoveryMarker)) {
          throw new Error('Missing recovery link');
        }
        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session)
          throw error || new Error('Missing recovery session');
        sessionStorage.setItem(recoveryMarker, 'active');
        setStatus('ready');
      } catch {
        clearRecoveryMarker();
        setStatus('error');
        setMessage(
          'El enlace no es válido, fue cancelado o ya venció. Solicita uno nuevo.',
        );
      }
    }
    void adoptRecoverySession();
  }, []);

  async function cancel() {
    clearRecoveryMarker();
    await supabase?.auth.signOut({ scope: 'local' });
    navigate('/login', { replace: true });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || status !== 'ready' || !supabase) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    const confirmation = String(data.get('confirmation') || '');
    const next = {
      password: passwordRules.every((rule) => rule.test(password))
        ? ''
        : 'Usa entre 8 y 128 caracteres, mayúscula, minúscula, número y carácter especial.',
      confirmation:
        password === confirmation ? '' : 'Las contraseñas no coinciden.',
    };
    setErrors(next);
    if (next.password || next.confirmation) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    setPending(true);
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData.session)
        throw error || new Error('Missing recovery session');
      await updatePassword(
        sessionData.session.access_token,
        password,
        new AbortController().signal,
      );
      clearRecoveryMarker();
      await supabase.auth.signOut({ scope: 'local' });
      setStatus('success');
    } catch (cause) {
      setMessage(passwordResetMessage(cause));
      setStatus('error');
      requestAnimationFrame(() => summary.current?.focus());
    } finally {
      setPending(false);
    }
  }

  if (status === 'loading')
    return (
      <div role="status">
        <h1 className="text-2xl font-semibold">Validando tu enlace</h1>
        <p className="mt-4 text-muted">{message}</p>
      </div>
    );
  if (status === 'success')
    return (
      <div ref={summary} tabIndex={-1} className="space-y-5">
        <h1 className="text-3xl font-semibold">Contraseña actualizada</h1>
        <p className="text-muted">
          Tu contraseña cambió correctamente. Inicia sesión con ella para
          continuar.
        </p>
        <Link className="btn-primary w-full" to="/login">
          Ir a iniciar sesión
        </Link>
      </div>
    );
  if (status === 'error')
    return (
      <div ref={summary} tabIndex={-1} className="space-y-5">
        <h1 className="text-3xl font-semibold">No pudimos actualizarla</h1>
        <InlineAlert>{message}</InlineAlert>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link className="btn-primary flex-1" to="/auth/forgot-password">
            Solicitar otro enlace
          </Link>
          <Link className="btn-secondary flex-1" to="/login">
            Volver al inicio
          </Link>
        </div>
      </div>
    );

  return (
    <>
      <div className="auth-heading">
        <p className="auth-eyebrow">Casi terminamos</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Crea una contraseña nueva
        </h1>
        <p className="auth-description">
          Usa entre 8 y 128 caracteres, mayúscula, minúscula, número y carácter
          especial. No reutilices una contraseña que compartas con alguien.
        </p>
      </div>
      <form
        onSubmit={submit}
        noValidate
        className="auth-login-form"
        aria-busy={pending}
      >
        <div ref={summary} tabIndex={-1}>
          {(errors.password || errors.confirmation) && (
            <div role="alert" className="alert">
              Revisa los datos antes de continuar.
            </div>
          )}
        </div>
        <div>
          <label htmlFor="new-password" className="field-label">
            Contraseña nueva
          </label>
          <div className="relative">
            <input
              id="new-password"
              name="password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              className="input pr-24"
              minLength={8}
              maxLength={128}
              required
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? 'new-password-error' : undefined
              }
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShow(!show)}
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={show}
            >
              {show ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {errors.password && (
            <p id="new-password-error" className="field-error">
              {errors.password}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="new-password-confirmation" className="field-label">
            Repite la contraseña
          </label>
          <input
            id="new-password-confirmation"
            name="confirmation"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            className="input"
            minLength={8}
            maxLength={128}
            required
            aria-invalid={!!errors.confirmation}
            aria-describedby={
              errors.confirmation ? 'new-confirmation-error' : undefined
            }
          />
          {errors.confirmation && (
            <p id="new-confirmation-error" className="field-error">
              {errors.confirmation}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          loading={pending}
          loadingLabel="Actualizando…"
          disabled={pending}
        >
          Actualizar contraseña
        </Button>
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => void cancel()}
          disabled={pending}
        >
          Cancelar y volver
        </Button>
      </form>
    </>
  );
}
