import { Link, Outlet, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { WorkspacePage } from '@/features/workspace/pages/WorkspacePage';
import { useAuth } from '@/features/auth/store/authStore';
import {
  PrivateShell,
  WorkspaceBoundary,
  ClientsPage,
  ClientPage,
  AccountPage,
} from './WorkspaceRoutes';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';
function WorkspaceEntry() {
  const { status, user } = useAuth();
  if (status === 'authenticated' && user) return <PrivateShell key={user.id} />;
  return (
    <AuthLayout>
      <ProtectedRoute>
        <span />
      </ProtectedRoute>
    </AuthLayout>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        element={
          <AuthLayout>
            <Outlet />
          </AuthLayout>
        }
      >
        <Route
          path="/login"
          element={
            <ProtectedRoute publicOnly>
              <LoginPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/register"
          element={
            <ProtectedRoute publicOnly>
              <RegisterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth/forgot-password"
          element={
            <ProtectedRoute publicOnly>
              <ForgotPasswordPage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route
          path="*"
          element={
            <>
              <h1 className="text-2xl font-semibold">Página no encontrada</h1>
              <Link className="btn-secondary mt-6" to="/">
                Volver al inicio
              </Link>
            </>
          }
        />
      </Route>
      <Route element={<WorkspaceEntry />}>
        <Route path="/" element={<WorkspacePage />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/workspaces/:workspaceId" element={<WorkspaceBoundary />}>
          <Route path="clients" element={<ClientsPage />} />
          <Route path="clients/:entityId" element={<ClientPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
