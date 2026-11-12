import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/routes';
import { PwaStatus } from '@/shared/pwa/PwaStatus';
import { useAuth } from '@/features/auth/store/authStore';
import { applyThemeColor } from '@/shared/theme/themeMeta';
import { useEffect } from 'react';

function InitialSplash() {
  const { initializing } = useAuth();
  useEffect(() => {
    if (!initializing) {
      const splash = document.querySelector<HTMLElement>('#initial-splash');
      if (splash) {
        splash.hidden = true;
        applyThemeColor(document.documentElement.classList.contains('dark'));
      }
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
