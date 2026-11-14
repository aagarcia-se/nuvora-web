import { forwardRef, type ButtonHTMLAttributes } from 'react';
export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
  loadingLabel?: string;
}>(function Button({
  variant = 'primary',
  className = '',
  children,
  loading = false,
  loadingLabel,
  disabled,
  ...props
}, ref) {
  return (
    <button
      className={`${variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'btn-danger' : 'btn-secondary'} ${className}`}
      ref={ref}
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
});
