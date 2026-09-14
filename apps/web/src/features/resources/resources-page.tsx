import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useDeleteResource, useResources, type ResourceFilters } from '@/api/queries';
import { useAuth } from '@/contexts/auth-context';
import type { Resource, ResourceStatus, ResourceType } from '@/api/types';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  Panel,
  PanelHeader,
  Select,
  Spinner,
} from '@/components/ui/primitives';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ResourceForm } from './resource-form';

const TYPE_LABEL: Record<ResourceType, string> = {
  EQUIPMENT: 'Equipamento',
  VEHICLE: 'Veículo',
  SECURITY_DEVICE: 'Dispositivo',
};

const STATUS_LABEL: Record<ResourceStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em uso',
  MAINTENANCE: 'Em manutenção',
  RETIRED: 'Baixado',
};

const STATUS_TONE: Record<ResourceStatus, 'granted' | 'brass' | 'denied' | 'neutral'> = {
  AVAILABLE: 'granted',
  IN_USE: 'brass',
  MAINTENANCE: 'denied',
  RETIRED: 'neutral',
};

export function ResourcesPage() {
  const { can } = useAuth();
  const [filters, setFilters] = useState<ResourceFilters>({ page: 1, search: '', type: '', status: '' });
  const [editing, setEditing] = useState<Resource | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Resource | null>(null);

  const { data, isLoading, isError, error } = useResources(filters);
  const remove = useDeleteResource();

  const canWrite = can('MANAGER', 'SECURITY_ADMIN');
  const canDelete = can('SECURITY_ADMIN');

  function updateFilter<K extends keyof ResourceFilters>(key: K, value: ResourceFilters[K]) {
    setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await remove.mutateAsync(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Recursos</h1>
          <p className="mt-1 text-sm text-dim">
            Equipamentos, veículos e dispositivos de segurança sob controle das Indústrias Wayne.
          </p>
        </div>

        {canWrite ? (
          <Button
            onClick={() => {
              setEditing(null);
              setIsFormOpen(true);
            }}
          >
            <Plus size={16} aria-hidden />
            Cadastrar recurso
          </Button>
        ) : null}
      </header>

      <Panel>
        <div className="grid gap-3 border-b border-line p-4 sm:grid-cols-[2fr_1fr_1fr]">
          <Input
            placeholder="Buscar por nome ou número de série"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
          />
          <Select value={filters.type} onChange={(event) => updateFilter('type', event.target.value as ResourceType)}>
            <option value="">Todas as categorias</option>
            {Object.entries(TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onChange={(event) => updateFilter('status', event.target.value as ResourceStatus)}
          >
            <option value="">Todas as situações</option>
            {Object.entries(STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        {isLoading ? <Spinner label="Buscando recursos" /> : null}
        {isError ? <ErrorState message={error instanceof Error ? error.message : 'Falha ao listar recursos.'} /> : null}

        {data && data.data.length === 0 ? (
          <EmptyState
            title="Nenhum recurso encontrado"
            description="Ajuste os filtros ou cadastre o primeiro item do inventário."
          />
        ) : null}

        {data && data.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-dim">
                <tr>
                  <th className="px-5 py-3 font-medium">Recurso</th>
                  <th className="px-5 py-3 font-medium">Série</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Área</th>
                  <th className="px-5 py-3 font-medium">Aquisição</th>
                  <th className="px-5 py-3 text-right font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  {canWrite ? <th className="px-5 py-3 text-right font-medium">Ações</th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((resource) => (
                  <tr key={resource.id} className="hover:bg-raised/50">
                    <td className="px-5 py-3">
                      <p className="font-medium">{resource.name}</p>
                      {resource.description ? (
                        <p className="mt-0.5 max-w-xs truncate text-xs text-dim">{resource.description}</p>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-dim">{resource.serialNumber}</td>
                    <td className="px-5 py-3 text-dim">{TYPE_LABEL[resource.type]}</td>
                    <td className="px-5 py-3 text-dim">{resource.area?.name ?? '—'}</td>
                    <td className="px-5 py-3 text-dim">{formatDate(resource.acquiredAt)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{formatCurrency(resource.value)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[resource.status]}>{STATUS_LABEL[resource.status]}</Badge>
                    </td>
                    {canWrite ? (
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={`Editar ${resource.name}`}
                            onClick={() => {
                              setEditing(resource);
                              setIsFormOpen(true);
                            }}
                          >
                            <Pencil size={15} aria-hidden />
                          </Button>
                          {canDelete ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              aria-label={`Excluir ${resource.name}`}
                              onClick={() => setPendingDelete(resource)}
                            >
                              <Trash2 size={15} aria-hidden className="text-denied" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {data ? (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            onChange={(page) => updateFilter('page', page)}
          />
        ) : null}
      </Panel>

      {isFormOpen ? <ResourceForm resource={editing} onClose={() => setIsFormOpen(false)} /> : null}

      {pendingDelete ? (
        <Panel className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md p-5 shadow-2xl">
          <PanelHeader title="Excluir recurso" hint={`${pendingDelete.name} será removido em definitivo.`} />
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Manter recurso
            </Button>
            <Button variant="danger" onClick={confirmDelete} disabled={remove.isPending}>
              {remove.isPending ? 'Excluindo' : 'Excluir'}
            </Button>
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
