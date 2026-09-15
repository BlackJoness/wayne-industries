import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/contexts/auth-context';
import { AppShell } from '@/components/layout/app-shell';
import { ProtectedRoute, RoleGuard } from '@/routes/guards';
import { LoginPage } from '@/features/auth/login-page';
import { NotFoundPage } from '@/features/errors/not-found-page';
import { DashboardPage } from '@/features/dashboard/dashboard-page';
import { ResourcesPage } from '@/features/resources/resources-page';
import { AccessPage } from '@/features/access/access-page';
import { AreasPage } from '@/features/areas/areas-page';
import { UsersPage } from '@/features/users/users-page';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/*
            O curinga vive dentro da área protegida de propósito. Quem está logado e
            digita um endereço errado vê um 404 sem perder a sessão; quem não está
            logado é levado ao login pelo ProtectedRoute, como em qualquer outra rota.
          */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="recursos" element={<ResourcesPage />} />
              <Route path="acessos" element={<AccessPage />} />

              <Route element={<RoleGuard allow={['SECURITY_ADMIN']} />}>
                <Route path="areas" element={<AreasPage />} />
                <Route path="usuarios" element={<UsersPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
