import type { PropsWithChildren } from 'react';
export function InlineAlert({ children }: PropsWithChildren) {
  return (
    <p role="alert" className="alert">
      {children}
    </p>
  );
}
