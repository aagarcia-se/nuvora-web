import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/routes';
import { PwaStatus } from '@/shared/pwa/PwaStatus';
import { useAuth } from '@/features/auth/store/authStore';
import { useEffect } from 'react';

function InitialSplash() {
  const { initializing } = useAuth();
  useEffect(() => {
    if (!initializing) {
      const splash = document.querySelector<HTMLElement>('#initial-splash');
      if (splash) splash.hidden = true;
    }
  }, [initializing]);
  return null;
}

export default function App() {
  return (
    <AppProviders>
      <InitialSplash />
      <AppRoutes />
      <PwaStatus />
    </AppProviders>
  );
}
