import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDashboard } from '@/api/queries';
import { useAuth } from '@/contexts/auth-context';
import { Badge, ErrorState, Panel, PanelHeader, Spinner } from '@/components/ui/primitives';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const TYPE_COLORS = ['#C9A227', '#5B8FB9', '#4E9A6B'];

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useDashboard();

  if (isLoading) return <Spinner label="Reunindo indicadores" />;
  if (isError) return <ErrorState message={error instanceof Error ? error.message : 'Falha ao carregar o painel.'} />;
  if (!data) return null;

  const { totals } = data;
  const deniedShare =
    totals.grantedLast7Days + totals.deniedLast7Days > 0
      ? Math.round((totals.deniedLast7Days / (totals.grantedLast7Days + totals.deniedLast7Days)) * 100)
      : 0;

  const figures = [
    { label: 'Recursos cadastrados', value: String(totals.resources) },
    { label: 'Valor estimado do inventário', value: formatCurrency(totals.estimatedValue) },
    { label: 'Áreas monitoradas', value: String(totals.areas) },
    { label: 'Usuários ativos', value: String(totals.activeUsers) },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Bom trabalho, {user?.name.split(' ')[0]}.</h1>
        <p className="mt-1 text-sm text-dim">
          Situação das instalações nos últimos sete dias, atualizada automaticamente a cada minuto.
        </p>
      </header>

      <Panel className="grid divide-line sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label} className="border-b border-line p-5 last:border-b-0 sm:border-b-0">
            <p className="text-sm text-dim">{figure.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{figure.value}</p>
          </div>
        ))}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader
            title="Tentativas de acesso por dia"
            hint={`${totals.grantedLast7Days} liberadas e ${totals.deniedLast7Days} negadas no período.`}
            action={
              <Badge tone={deniedShare > 30 ? 'denied' : 'neutral'}>{deniedShare}% negadas</Badge>
            }
          />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.accessTrend}>
                <CartesianGrid strokeDasharray="2 4" stroke="#262E38" vertical={false} />
                <XAxis dataKey="label" stroke="#8B95A3" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#8B95A3" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: '#1B2129' }}
                  contentStyle={{ background: '#151A21', border: '1px solid #262E38', borderRadius: 4, color: '#E6E9ED' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8B95A3' }} />
                <Bar dataKey="granted" name="Liberadas" fill="#4E9A6B" radius={[2, 2, 0, 0]} />
                <Bar dataKey="denied" name="Negadas" fill="#C4453B" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Inventário por categoria" hint="Distribuição dos recursos cadastrados." />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.resourcesByType} dataKey="total" nameKey="label" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {data.resourcesByType.map((entry, index) => (
                    <Cell key={entry.key} fill={TYPE_COLORS[index % TYPE_COLORS.length]} stroke="#151A21" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: '#151A21', border: '1px solid #262E38', borderRadius: 4, color: '#E6E9ED' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, color: '#8B95A3' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel>
          <PanelHeader title="Situação operacional" hint="Recursos por estado atual." />
          <ul className="divide-y divide-line">
            {data.resourcesByStatus.map((status) => (
              <li key={status.key} className="flex items-center justify-between px-5 py-3 text-sm">
                <span className="text-dim">{status.label}</span>
                <span className="font-medium tabular-nums">{status.total}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Áreas com mais negativas" hint="Onde as barreiras mais bloqueiam." />
          {data.topDeniedAreas.length === 0 ? (
            <p className="px-5 py-8 text-sm text-dim">Nenhuma tentativa negada registrada.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.topDeniedAreas.map((area) => (
                <li key={area.areaId} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span>
                    {area.name} <span className="font-mono text-xs text-dim">{area.code}</span>
                  </span>
                  <Badge tone="denied">{area.total}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel>
          <PanelHeader title="Atividades recentes" hint="Últimas alterações no sistema." />
          {data.recentActivity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-dim">Nenhuma alteração registrada ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {data.recentActivity.map((activity) => (
                <li key={activity.id} className="px-5 py-3">
                  <p className="text-sm">{activity.description}</p>
                  <p className="mt-0.5 text-xs text-dim">{formatDateTime(activity.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel>
        <PanelHeader title="Últimas passagens registradas" hint="Leitura direta do log de acesso às áreas." />
        <ul className="divide-y divide-line">
          {data.recentAccess.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-medium">{entry.userName}</span> em {entry.areaName}
                </p>
                <p className="mt-0.5 text-xs text-dim">{entry.reason}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-dim">{formatDateTime(entry.createdAt)}</span>
                <Badge tone={entry.result === 'GRANTED' ? 'granted' : 'denied'}>
                  {entry.result === 'GRANTED' ? 'Liberado' : 'Negado'}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
