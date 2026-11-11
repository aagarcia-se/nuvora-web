import { useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authConfigured } from '@/shared/config/env';
import { Button } from '@/shared/ui/components/Button';
import { InlineAlert } from '@/shared/ui/components/InlineAlert';
import { passwordResetMessage, requestPasswordReset } from '../api/authApi';

export function ForgotPasswordPage() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState('');
  const summary = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !authConfigured) return;
    const email = String(new FormData(event.currentTarget).get('email') || '').trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setEmailError(valid ? '' : 'Escribe un correo válido.');
    setError(null);
    if (!valid) {
      requestAnimationFrame(() => summary.current?.focus());
      return;
    }
    setPending(true);
    try {
      await requestPasswordReset(email, new AbortController().signal);
      setSent(true);
    } catch (cause) {
      setError(passwordResetMessage(cause));
      requestAnimationFrame(() => summary.current?.focus());
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <p className="mb-3 text-sm font-medium text-muted">Recupera el acceso</p>
      <h1 className="text-3xl font-semibold tracking-tight">Olvidé mi contraseña</h1>
      <p className="mb-8 mt-3 text-muted">
        Te enviaremos instrucciones para crear una contraseña nueva.
      </p>
      {!authConfigured && (
        <InlineAlert>El acceso aún no está configurado. Contacta al administrador.</InlineAlert>
      )}
      {sent ? (
        <div ref={summary} tabIndex={-1} className="space-y-5" role="status">
          <div className="success-alert">
            <p className="font-semibold">Revisa tu correo</p>
            <p className="mt-1">Si existe una cuenta con ese correo, recibirás un enlace para continuar.</p>
          </div>
          <p className="text-sm text-muted">El enlace puede vencer por seguridad. Revisa también tu carpeta de spam.</p>
          <Link className="btn-secondary w-full" to="/login">Volver a iniciar sesión</Link>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-5" aria-busy={pending}>
          <div ref={summary} tabIndex={-1}>
            {error && <InlineAlert>{error}</InlineAlert>}
            {emailError && <div role="alert" className="alert mt-3">{emailError}</div>}
          </div>
          <div>
            <label htmlFor="reset-email" className="field-label">Correo electrónico</label>
            <input
              id="reset-email"
              name="email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              inputMode="email"
              className="input"
              placeholder="tu@despacho.com"
              required
              aria-invalid={!!emailError}
              aria-describedby={emailError ? 'reset-email-error' : undefined}
            />
            {emailError && <p id="reset-email-error" className="field-error">{emailError}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={pending || !authConfigured}>
            {pending ? 'Enviando…' : 'Enviar enlace'}
          </Button>
          <p className="text-center text-sm"><Link className="underline" to="/login">Volver a iniciar sesión</Link></p>
        </form>
      )}
    </>
  );
}
