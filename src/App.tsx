import { AppProviders } from '@/app/providers';
import { AppRoutes } from '@/app/routes';
import { PwaStatus } from '@/shared/pwa/PwaStatus';

export default function App() {
  return (
    <AppProviders>
      <AppRoutes />
      <PwaStatus />
    </AppProviders>
  );
}
