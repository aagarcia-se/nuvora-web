import { useEffect, type PropsWithChildren } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/shared/api/queryClient';
import { AuthProvider } from '@/features/auth/store/AuthProvider';

export function AppProviders({ children }: PropsWithChildren) {
  useEffect(() => {
    // Motion is reserved for pointer interactions; keyboard responses stay instant.
    const root = document.documentElement;
    const pointer = () => {
      root.dataset.input = 'pointer';
    };
    const keyboard = () => {
      root.dataset.input = 'keyboard';
    };
    document.addEventListener('pointerdown', pointer, true);
    document.addEventListener('keydown', keyboard, true);
    return () => {
      document.removeEventListener('pointerdown', pointer, true);
      document.removeEventListener('keydown', keyboard, true);
      delete root.dataset.input;
    };
  }, []);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
