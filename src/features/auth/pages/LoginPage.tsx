import { Link } from 'react-router-dom';
import { useRef, useState, type FormEvent } from 'react';
import { authConfigured } from '@/shared/config/env';
import { Button } from '@/shared/ui/components/Button';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';
import { useAuth } from '../store/authStore';
import {
  authMessage,
  getGoogleOAuthUrl,
  googleOAuthMessage,
} from '../api/authApi';
import { GoogleMark } from '../components/GoogleMark';
import { useLogin } from '../api/useLogin';
import { persistInvitationContinuation } from '@/features/access/invitationToken';
export function LoginPage({ onRegister }: { onRegister?: () => void } = {}) {
  const auth = useAuth();
  const [show, setShow] = useState(false);
  const { mutateAsync, isPending: pending } = useLogin();
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const summary = useRef<HTMLDivElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || googlePending || !authConfigured) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const password = String(data.get('password') || '');
    const next = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ? ''
        : 'Escribe un correo válido.',
      password:
        password.length >= 8 && password.length <= 128
          ? ''
          : 'Usa entre 8 y 128 caracteres.',
    };
    setErrors(next);
    setError(null);
    if (next.email || next.password) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    try {
      persistInvitationContinuation();
      await mutateAsync({ email, password });
    } catch (cause) {
      setError(authMessage(cause));
      requestAnimationFrame(() => summary.current?.focus());
    }
  }
  async function continueWithGoogle() {
    if (googlePending || pending || !authConfigured) return;
    setGooglePending(true);
    setGoogleError(null);
    persistInvitationContinuation();
    const controller = new AbortController();
    try {
      const url = await getGoogleOAuthUrl(controller.signal);
      window.location.assign(url);
    } catch (cause) {
      setGooglePending(false);
      setGoogleError(googleOAuthMessage(cause));
    }
  }
  return (
    <>
      <div className="auth-heading">
        <p className="auth-eyebrow">Tu espacio contable</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Iniciar sesión
        </h1>
        <p className="auth-description">
          Qué gusto tenerte de vuelta. Accede a tu cuenta.
        </p>
      </div>
      {!authConfigured && (
        <InlineAlert>
          El acceso aún no está configurado. Contacta al administrador para
          habilitar la conexión.
        </InlineAlert>
      )}
      <form
        onSubmit={submit}
        noValidate
        className="auth-login-form"
        aria-busy={pending}
      >
        <div
          ref={summary}
          tabIndex={-1}
          hidden={!error && !auth.error && !errors.email && !errors.password}
        >
          {(error || auth.error) && (
            <InlineAlert>{error || auth.error}</InlineAlert>
          )}
          {(errors.email || errors.password) && (
            <div role="alert" className="alert">
              <p>Revisa los siguientes datos:</p>
              {errors.email && (
                <a className="block underline" href="#email">
                  {errors.email}
                </a>
              )}
              {errors.password && (
                <a className="block underline" href="#password">
                  {errors.password}
                </a>
              )}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            className="input"
            placeholder="tu@despacho.com"
            required
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="field-error">
              {errors.email}
            </p>
          )}
        </div>
        <div>
          <div className="auth-field-heading">
            <label htmlFor="password" className="field-label">
              Contraseña
            </label>
            <Link className="auth-recovery-link" to="/auth/forgot-password">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              className="input pr-24"
              required
              minLength={8}
              maxLength={128}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              aria-pressed={show}
              onClick={() => setShow(!show)}
            >
              {show ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="field-error">
              {errors.password}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={pending || googlePending || !authConfigured}
        >
          {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </Button>
        <div
          className="auth-divider flex items-center gap-3 text-xs text-muted"
          aria-hidden="true"
        >
          <span className="h-px flex-1 bg-line" />
          <span>o continúa con</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        {googleError && <InlineAlert>{googleError}</InlineAlert>}
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={googlePending || pending || !authConfigured}
          onClick={() => void continueWithGoogle()}
        >
          <GoogleMark />
          {googlePending ? 'Conectando con Google…' : 'Continuar con Google'}
        </Button>
      </form>
      <div className="auth-account-prompt">
        <p>
          ¿Aún no tienes cuenta?{' '}
          {onRegister ? (
            <button type="button" className="auth-link" onClick={onRegister}>
              Crear cuenta
            </button>
          ) : (
            <Link className="auth-link" to="/auth/register">
              Crear cuenta
            </Link>
          )}
        </p>
      </div>
      <p className="auth-connection-note">
        Necesitas conexión a internet para acceder.
      </p>
    </>
  );
}
