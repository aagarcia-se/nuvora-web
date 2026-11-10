import { Route, Routes } from 'react-router-dom';
import { env } from '@/shared/config/env';
import { InstallApp } from '@/shared/pwa/InstallApp';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
            <img
              src="/icons/icon-192.png"
              width="80"
              height="80"
              alt=""
              className="rounded-2xl"
            />
            <h1 className="text-3xl font-semibold text-ink">{env.appName}</h1>
            <InstallApp />
          </main>
        }
      />
      <Route
        path="*"
        element={<main className="p-6">Página no encontrada.</main>}
      />
    </Routes>
  );
}
