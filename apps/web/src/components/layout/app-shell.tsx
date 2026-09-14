import { NavLink, Outlet } from 'react-router-dom';
import { Boxes, DoorOpen, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';
import type { Role } from '@/api/types';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  allow?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Visão geral', icon: LayoutDashboard },
  { to: '/recursos', label: 'Recursos', icon: Boxes },
  { to: '/acessos', label: 'Controle de acesso', icon: DoorOpen },
  { to: '/areas', label: 'Áreas restritas', icon: ShieldCheck, allow: ['SECURITY_ADMIN'] },
  { to: '/usuarios', label: 'Usuários', icon: Users, allow: ['SECURITY_ADMIN'] },
];

export function AppShell() {
  const { user, logout } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !item.allow || (user && item.allow.includes(user.role)));

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-panel md:flex">
        <div className="border-b border-line px-5 py-5">
          <p className="font-mono text-xs tracking-widest text-brass">W A Y N E</p>
          <p className="mt-1 text-sm font-semibold leading-tight">Central de Segurança</p>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-brass-soft text-brass' : 'text-dim hover:bg-raised hover:text-ink',
                )
              }
            >
              <Icon size={16} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <p className="px-3 text-sm font-medium">{user?.name}</p>
          <p className="px-3 pb-2 text-xs text-brass">{user?.roleLabel}</p>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={logout}>
            <LogOut size={15} aria-hidden />
            Encerrar sessão
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line px-5 py-3 md:hidden">
          <span className="font-mono text-xs tracking-widest text-brass">W A Y N E</span>
          <Button variant="ghost" size="sm" onClick={logout}>
            Sair
          </Button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-line px-3 py-2 md:hidden">
          {visibleItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'whitespace-nowrap rounded px-3 py-1.5 text-sm',
                  isActive ? 'bg-brass-soft text-brass' : 'text-dim',
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <main className="min-w-0 flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
