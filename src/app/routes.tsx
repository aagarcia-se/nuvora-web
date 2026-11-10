import { Route, Routes } from 'react-router-dom';
import { env } from '@/shared/config/env';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="flex min-h-screen items-center justify-center p-6">
            <h1 className="text-3xl font-semibold text-brand-600">{env.appName}</h1>
          </main>
        }
      />
      <Route path="*" element={<main className="p-6">Página no encontrada.</main>} />
    </Routes>
  );
}
