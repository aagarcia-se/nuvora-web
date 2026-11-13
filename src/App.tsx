import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/routes';
import { PwaStatus } from '@/shared/pwa/PwaStatus';
import { useAuth } from '@/features/auth/store/authStore';
import { applyThemeColor } from '@/shared/theme/themeMeta';
import { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

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

// A data router provides native navigation blocking for unsaved client edits,
// including Back/Forward. Existing routes and authentication remain unchanged.
const router = createBrowserRouter([
  {
    path: '*',
    element: (
      <>
        <InitialSplash />
        <AppRoutes />
        <PwaStatus />
      </>
    ),
  },
]);

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
