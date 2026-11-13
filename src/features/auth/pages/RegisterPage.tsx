import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authConfigured } from '@/shared/config/env';
import { Button } from '@/shared/ui/components/Button';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';
import {
  getGoogleOAuthUrl,
  googleOAuthMessage,
  authMessage,
} from '../api/authApi';
import { GoogleMark } from '../components/GoogleMark';
import { useAuth } from '../store/authStore';

import { passwordRules } from '../types/passwordRules';

export function RegisterPage({ onLogin }: { onLogin?: () => void } = {}) {
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
    confirmation: '',
  });
  const summary = useRef<HTMLDivElement>(null);
  const rules = passwordRules.map((rule) => ({
    ...rule,
    valid: rule.test(password),
  }));
  const passwordValid = rules.every((rule) => rule.valid);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !authConfigured) return;
    const next = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        ? ''
        : 'Escribe un correo válido.',
      password: passwordValid
        ? ''
        : 'La contraseña no cumple todos los requisitos.',
      confirmation:
        password === confirmation ? '' : 'Las contraseñas no coinciden.',
    };
    setFieldErrors(next);
    setError(null);
    setSuccess(false);
    if (next.email || next.password || next.confirmation) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    setPending(true);
    try {
      const signedIn = await auth.register(email.trim(), password);
      if (signedIn) return;
      setSuccess(true);
    } catch (cause) {
      setError(authMessage(cause));
      requestAnimationFrame(() => summary.current?.focus());
    } finally {
      setPending(false);
    }
  }

  async function continueWithGoogle() {
    if (googlePending || pending || !authConfigured) return;
    setGooglePending(true);
    setGoogleError(null);
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
      <p className="mb-3 text-sm font-medium text-muted">
        Empieza con claridad
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Crear tu cuenta</h1>
      <p className="mb-8 mt-3 text-muted">
        Configura tu acceso a Nuvora Contadores.
      </p>
      {!authConfigured && (
        <InlineAlert>
          El acceso aún no está configurado. Contacta al administrador.
        </InlineAlert>
      )}
      <form
        onSubmit={submit}
        noValidate
        className="mt-6 space-y-5"
        aria-busy={pending}
      >
        <div ref={summary} tabIndex={-1}>
          {error && <InlineAlert>{error}</InlineAlert>}
          {success && (
            <p role="status" className="success-alert">
              Revisa tu correo para confirmar la cuenta. Cuando la confirmes,
              podrás iniciar sesión.
            </p>
          )}
          {(fieldErrors.email ||
            fieldErrors.password ||
            fieldErrors.confirmation) && (
            <div role="alert" className="alert mt-3">
              <p>Revisa los siguientes datos:</p>
              {fieldErrors.email && (
                <a className="block underline" href="#register-email">
                  {fieldErrors.email}
                </a>
              )}
              {fieldErrors.password && (
                <a className="block underline" href="#register-password">
                  {fieldErrors.password}
                </a>
              )}
              {fieldErrors.confirmation && (
                <a className="block underline" href="#register-confirmation">
                  {fieldErrors.confirmation}
                </a>
              )}
            </div>
          )}
        </div>
        <div>
          <label htmlFor="register-email" className="field-label">
            Correo electrónico
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            inputMode="email"
            className="input"
            placeholder="tu@despacho.com"
            required
            aria-invalid={!!fieldErrors.email}
            aria-describedby={
              fieldErrors.email ? 'register-email-error' : undefined
            }
          />
          {fieldErrors.email && (
            <p id="register-email-error" className="field-error">
              {fieldErrors.email}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="register-password" className="field-label">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="register-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              className="input pr-24"
              required
              maxLength={128}
              aria-invalid={!!fieldErrors.password}
              aria-describedby="password-rules"
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={
                showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
              }
              aria-pressed={showPassword}
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <ul
            id="password-rules"
            className="mt-3 space-y-1 text-sm text-muted"
            aria-live="polite"
          >
            {rules.map((rule) => (
              <li
                key={rule.key}
                className={rule.valid ? 'password-rule-valid' : ''}
              >
                <span aria-hidden="true">{rule.valid ? '✓' : '○'}</span>{' '}
                <span>{rule.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <label htmlFor="register-confirmation" className="field-label">
            Confirmar contraseña
          </label>
          <div className="relative">
            <input
              id="register-confirmation"
              type={showConfirmation ? 'text' : 'password'}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="new-password"
              className="input pr-24"
              required
              aria-invalid={!!fieldErrors.confirmation}
              aria-describedby={
                fieldErrors.confirmation
                  ? 'register-confirmation-error'
                  : undefined
              }
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={
                showConfirmation
                  ? 'Ocultar confirmación'
                  : 'Mostrar confirmación'
              }
              aria-pressed={showConfirmation}
              onClick={() => setShowConfirmation(!showConfirmation)}
            >
              {showConfirmation ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          {fieldErrors.confirmation && (
            <p id="register-confirmation-error" className="field-error">
              {fieldErrors.confirmation}
            </p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={
            pending || googlePending || !authConfigured || !passwordValid
          }
        >
          {pending ? 'Creando cuenta…' : 'Crear cuenta'}
        </Button>
        <div
          className="my-1 flex items-center gap-3 text-xs text-muted"
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
        <p className="text-center text-sm">
          ¿Ya tienes una cuenta?{' '}
          {onLogin ? (
            <button
              type="button"
              className="font-semibold underline"
              onClick={onLogin}
            >
              Inicia sesión
            </button>
          ) : (
            <Link className="font-semibold underline" to="/login">
              Inicia sesión
            </Link>
          )}
        </p>
      </form>
    </>
  );
}
