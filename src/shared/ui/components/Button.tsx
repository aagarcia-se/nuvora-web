import type { ButtonHTMLAttributes } from 'react';
export function Button({
  variant = 'primary',
  className = '',
  children,
  loading = false,
  loadingLabel,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      className={`${variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary'} ${className}`}
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      {loadingLabel ? (
        <span className="button-state">
          <span aria-hidden={loading}>{children}</span>
          <span aria-hidden={!loading}>{loadingLabel}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
