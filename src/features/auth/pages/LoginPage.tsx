import { Link } from 'react-router-dom';
import { useRef, useState, type FormEvent } from 'react';
import { authConfigured } from '@/shared/config/env';
import { Button } from '@/shared/ui/components/Button';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';
import { useAuth } from '../store/authStore';
import { authMessage } from '../api/authApi';
import { getGoogleOAuthUrl, googleOAuthMessage } from '../api/authApi';
import { useLogin } from '../api/useLogin';
export function LoginPage() {
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
    if (pending || !authConfigured) return;
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
      await mutateAsync({ email, password });
    } catch (cause) {
      setError(authMessage(cause));
      requestAnimationFrame(() => summary.current?.focus());
    }
  }
  async function continueWithGoogle() {
    if (googlePending || !authConfigured) return;
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
        Bienvenido a tu espacio
      </p>
      <h1 className="text-3xl font-semibold tracking-tight">Iniciar sesión</h1>
      <p className="mb-8 mt-3 text-muted">
        Ingresa con el correo de tu cuenta.
      </p>
      {!authConfigured && (
        <InlineAlert>
          El acceso aún no está configurado. Contacta al administrador para
          habilitar la conexión.
        </InlineAlert>
      )}
      <form
        onSubmit={submit}
        noValidate
        className="mt-6 space-y-5"
        aria-busy={pending}
      >
        <div ref={summary} tabIndex={-1}>
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
          <label htmlFor="password" className="field-label">
            Contraseña
          </label>
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
          disabled={pending || !authConfigured}
        >
          {pending ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </Button>
        <div className="my-1 flex items-center gap-3 text-xs text-muted" aria-hidden="true">
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
          <Link className="underline" to="/auth/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="text-center text-sm">
          ¿Aún no tienes cuenta? <Link className="font-semibold underline" to="/auth/register">Crear cuenta</Link>
        </p>
        <p className="text-center text-xs leading-relaxed text-muted">
          Necesitas conexión a internet para acceder.
        </p>
      </form>
    </>
  );
}

export function GoogleMark() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z" />
      <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z" />
      <path fill="#FBBC05" d="M6.54 13.83a5.86 5.86 0 0 1 0-3.66V7.64H3.3a9.75 9.75 0 0 0 0 8.72l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.24 14.63 2.25 12 2.25A9.75 9.75 0 0 0 3.3 7.64l3.24 2.53C7.31 7.86 9.46 6.14 12 6.14Z" />
    </svg>
  );
}
