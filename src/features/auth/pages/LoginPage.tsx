import { Link } from 'react-router-dom';
import { useRef, useState, type FormEvent } from 'react';
import { authConfigured } from '@/shared/config/env';
import { Button } from '@/shared/ui/components/Button';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';
import { useAuth } from '../store/authStore';
import { authMessage } from '../api/authApi';
import { useLogin } from '../api/useLogin';
export function LoginPage() {
  const auth = useAuth();
  const [show, setShow] = useState(false);
  const { mutateAsync, isPending: pending } = useLogin();
  const [error, setError] = useState<string | null>(null);
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
        <p className="text-center text-sm">
          <Link className="underline" to="/auth/forgot-password">¿Olvidaste tu contraseña?</Link>
        </p>
        <p className="text-center text-xs leading-relaxed text-muted">
          Necesitas conexión a internet para acceder.
        </p>
      </form>
    </>
  );
}
