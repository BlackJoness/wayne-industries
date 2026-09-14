import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import type { Role } from '@/api/types';
import { Panel, Spinner } from '@/components/ui/primitives';

/** Exige sessão ativa. Sem token válido, devolve ao login. */
export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner label="Validando sessão" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}

/**
 * Esconde telas fora do perfil. Isto é conveniência de navegação:
 * a autorização real acontece no backend, que rejeita a chamada com 403.
 */
export function RoleGuard({ allow }: { allow: Role[] }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  if (!allow.includes(user.role)) {
    return (
      <Panel className="p-8">
        <h1 className="text-lg font-semibold">Área fora do seu nível de acesso</h1>
        <p className="mt-2 max-w-prose text-sm text-dim">
          Seu perfil é {user.roleLabel}. Esta tela é restrita a outros níveis. Se você precisa deste acesso, solicite ao
          administrador de segurança.
        </p>
      </Panel>
    );
  }

  return <Outlet />;
}
