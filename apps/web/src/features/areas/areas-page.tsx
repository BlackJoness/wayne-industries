import { useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import { useAreas, useGrantPermission, useRevokePermission, useSaveArea, useUsers, ROLE_OPTIONS } from '@/api/queries';
import type { Area, Role } from '@/api/types';
import {
  Badge,
  Button,
  ErrorState,
  Field,
  Input,
  Modal,
  Panel,
  PanelHeader,
  Select,
  Spinner,
} from '@/components/ui/primitives';

export function AreasPage() {
  const areas = useAreas();
  const users = useUsers(1, '');
  const grant = useGrantPermission();
  const revoke = useRevokePermission();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<Area | null>(null);
  const [permissionTarget, setPermissionTarget] = useState<Area | null>(null);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Áreas restritas</h1>
          <p className="mt-1 text-sm text-dim">
            Defina o nível mínimo de cada área e conceda exceções individuais quando necessário.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        >
          Cadastrar área
        </Button>
      </header>

      {areas.isLoading ? <Spinner label="Carregando áreas" /> : null}
      {areas.isError ? <ErrorState message="Falha ao carregar as áreas." /> : null}

      <div className="grid gap-5 lg:grid-cols-2">
        {areas.data?.map((area) => (
          <Panel key={area.id}>
            <PanelHeader
              title={area.name}
              hint={area.description ?? 'Sem descrição cadastrada.'}
              action={
                <Badge tone={area.isActive ? 'brass' : 'neutral'}>{area.isActive ? 'Ativa' : 'Inativa'}</Badge>
              }
            />

            <dl className="grid grid-cols-3 divide-x divide-line border-b border-line text-sm">
              <div className="p-4">
                <dt className="text-xs text-dim">Código</dt>
                <dd className="mt-1 font-mono">{area.code}</dd>
              </div>
              <div className="p-4">
                <dt className="text-xs text-dim">Nível mínimo</dt>
                <dd className="mt-1">{area.minimumRoleLabel}</dd>
              </div>
              <div className="p-4">
                <dt className="text-xs text-dim">Recursos</dt>
                <dd className="mt-1 tabular-nums">{area.resourceCount}</dd>
              </div>
            </dl>

            <div className="p-4">
              <p className="text-sm font-medium">Permissões individuais</p>
              {area.permissions.length === 0 ? (
                <p className="mt-1 text-sm text-dim">Nenhuma exceção concedida nesta área.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {area.permissions.map((permission) => (
                    <li
                      key={permission.userId}
                      className="flex items-center justify-between rounded bg-raised px-3 py-2 text-sm"
                    >
                      <span>
                        {permission.userName}
                        <span className="ml-2 font-mono text-xs text-dim">{permission.userEmail}</span>
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => void revoke.mutateAsync({ areaId: area.id, userId: permission.userId })}
                      >
                        Revogar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(area);
                    setIsFormOpen(true);
                  }}
                >
                  Editar área
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPermissionTarget(area)}>
                  Conceder permissão
                </Button>
              </div>
            </div>
          </Panel>
        ))}
      </div>

      {isFormOpen ? <AreaForm area={editing} onClose={() => setIsFormOpen(false)} /> : null}

      {permissionTarget ? (
        <Modal title={`Conceder acesso a ${permissionTarget.name}`} onClose={() => setPermissionTarget(null)}>
          <p className="mb-4 text-sm text-dim">
            A permissão individual libera a área mesmo quando o cargo da pessoa está abaixo do nível exigido.
          </p>
          <PermissionForm
            areaId={permissionTarget.id}
            users={users.data?.data ?? []}
            onSubmit={async (userId) => {
              await grant.mutateAsync({ areaId: permissionTarget.id, userId });
              setPermissionTarget(null);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function PermissionForm({
  users,
  onSubmit,
}: {
  areaId: string;
  users: Array<{ id: string; name: string; email: string }>;
  onSubmit: (userId: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState(users[0]?.id ?? '');
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await onSubmit(userId);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível conceder a permissão.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Pessoa">
        <Select value={userId} onChange={(event) => setUserId(event.target.value)}>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </Select>
      </Field>

      {error ? <p className="text-sm text-denied">{error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={!userId}>
          Conceder permissão
        </Button>
      </div>
    </form>
  );
}

function AreaForm({ area, onClose }: { area: Area | null; onClose: () => void }) {
  const save = useSaveArea();
  const [form, setForm] = useState({
    name: area?.name ?? '',
    code: area?.code ?? '',
    description: area?.description ?? '',
    minimumRole: area?.minimumRole ?? ('EMPLOYEE' as Role),
  });
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    try {
      await save.mutateAsync({
        id: area?.id,
        payload: {
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
          minimumRole: form.minimumRole,
        },
      });
      onClose();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Não foi possível salvar a área.');
    }
  }

  return (
    <Modal title={area ? `Editar ${area.name}` : 'Cadastrar área'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nome">
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </Field>

        <Field label="Código">
          <Input
            value={form.code}
            onChange={(event) => setForm({ ...form, code: event.target.value })}
            className="font-mono"
            placeholder="SRV-03"
            required
          />
        </Field>

        <Field label="Descrição">
          <Input
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </Field>

        <Field label="Nível mínimo de acesso">
          <Select
            value={form.minimumRole}
            onChange={(event) => setForm({ ...form, minimumRole: event.target.value as Role })}
          >
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        {error ? <p className="text-sm text-denied">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Salvando' : 'Salvar área'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
