import { Link, Route, Routes } from 'react-router-dom';
import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { WelcomePage } from '@/features/auth/pages/WelcomePage';
export function AppRoutes() {
  return (
    <AuthLayout>
      <Routes>
        <Route
          path="/login"
          element={
            <ProtectedRoute publicOnly>
              <LoginPage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth/forgot-password" element={<ProtectedRoute publicOnly><ForgotPasswordPage /></ProtectedRoute>} />
        <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <WelcomePage />
            </ProtectedRoute>
          }
        />
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
      </Routes>
    </AuthLayout>
  );
}
