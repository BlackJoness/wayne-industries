import { useState } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { useAccessAttempt, useAccessLogs, useClearance } from '@/api/queries';
import { useAuth } from '@/contexts/auth-context';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Pagination,
  Panel,
  PanelHeader,
  Spinner,
} from '@/components/ui/primitives';
import { formatDateTime } from '@/lib/utils';

export function AccessPage() {
  const { user, can } = useAuth();
  const canAudit = can('MANAGER', 'SECURITY_ADMIN');

  const [scope, setScope] = useState<'all' | 'mine'>(canAudit ? 'all' : 'mine');
  const [page, setPage] = useState(1);
  const [lastOutcome, setLastOutcome] = useState<{ areaId: string; result: 'GRANTED' | 'DENIED'; reason: string } | null>(null);

  const clearance = useClearance();
  const logs = useAccessLogs(page, scope);
  const attempt = useAccessAttempt();

  async function tryAccess(areaId: string) {
    const outcome = await attempt.mutateAsync(areaId);
    setLastOutcome({ areaId, ...outcome });
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Controle de acesso</h1>
        <p className="mt-1 text-sm text-dim">
          Seu nível é {user?.roleLabel}. Cada tentativa abaixo é avaliada pelo servidor e gravada no histórico.
        </p>
      </header>

      <Panel>
        <PanelHeader
          title="Suas credenciais por área"
          hint="A faixa mostra o que a sua identificação abre nesta torre."
        />

        {clearance.isLoading ? <Spinner label="Consultando permissões" /> : null}
        {clearance.isError ? <ErrorState message="Falha ao consultar suas permissões." /> : null}

        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {clearance.data?.map((area) => {
            const outcome = lastOutcome?.areaId === area.areaId ? lastOutcome : null;

            return (
              <article key={area.areaId} className="flex flex-col justify-between gap-4 bg-panel p-5">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{area.name}</h3>
                      <p className="font-mono text-xs text-dim">{area.code}</p>
                    </div>
                    {area.allowed ? (
                      <Unlock size={16} className="mt-0.5 shrink-0 text-granted" aria-label="Liberado" />
                    ) : (
                      <Lock size={16} className="mt-0.5 shrink-0 text-denied" aria-label="Bloqueado" />
                    )}
                  </div>

                  <p className="mt-3 text-sm text-dim">{area.reason}</p>
                  <p className="mt-1 text-xs text-dim">Exige {area.minimumRoleLabel} ou superior.</p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={attempt.isPending}
                    onClick={() => void tryAccess(area.areaId)}
                  >
                    Registrar tentativa de entrada
                  </Button>

                  {outcome ? (
                    <p
                      className={`rounded px-3 py-2 text-xs ${
                        outcome.result === 'GRANTED'
                          ? 'bg-granted-soft text-granted'
                          : 'bg-denied-soft text-denied'
                      }`}
                      role="status"
                    >
                      {outcome.result === 'GRANTED' ? 'Porta liberada. ' : 'Entrada negada. '}
                      {outcome.reason}
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Histórico de acessos"
          hint={
            canAudit
              ? 'Gerentes veem apenas as áreas que podem acessar. Administradores veem tudo.'
              : 'Seu histórico pessoal de tentativas.'
          }
          action={
            canAudit ? (
              <div className="flex gap-2">
                <Button
                  variant={scope === 'all' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setScope('all');
                    setPage(1);
                  }}
                >
                  Todas as pessoas
                </Button>
                <Button
                  variant={scope === 'mine' ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setScope('mine');
                    setPage(1);
                  }}
                >
                  Só as minhas
                </Button>
              </div>
            ) : null
          }
        />

        {logs.isLoading ? <Spinner label="Carregando histórico" /> : null}
        {logs.isError ? <ErrorState message="Falha ao carregar o histórico." /> : null}

        {logs.data && logs.data.data.length === 0 ? (
          <EmptyState
            title="Nenhuma tentativa registrada"
            description="Use o botão acima para registrar a primeira entrada."
          />
        ) : null}

        {logs.data && logs.data.data.length > 0 ? (
          <ul className="divide-y divide-line">
            {logs.data.data.map((log) => (
              <li key={log.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{log.user.name}</span>
                    <span className="text-dim"> · {log.user.roleLabel} · {log.area.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-dim">{log.reason}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-dim">{formatDateTime(log.createdAt)}</span>
                  <Badge tone={log.result === 'GRANTED' ? 'granted' : 'denied'}>
                    {log.result === 'GRANTED' ? 'Liberado' : 'Negado'}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {logs.data ? (
          <Pagination
            page={logs.data.meta.page}
            totalPages={logs.data.meta.totalPages}
            total={logs.data.meta.total}
            onChange={setPage}
          />
        ) : null}
      </Panel>
    </div>
  );
}
