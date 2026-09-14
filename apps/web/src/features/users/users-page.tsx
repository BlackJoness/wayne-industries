import { useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import { ROLE_OPTIONS, useSaveUser, useUsers } from '@/api/queries';
import { useAuth } from '@/contexts/auth-context';
import type { AuthUser, Role } from '@/api/types';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Modal,
  Pagination,
  Panel,
  Select,
  Spinner,
} from '@/components/ui/primitives';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<AuthUser | null>(null);

  const { data, isLoading, isError } = useUsers(page, search);
  const save = useSaveUser();

  async function toggleActive(target: AuthUser) {
    await save.mutateAsync({ id: target.id, payload: { isActive: !target.isActive } });
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Usuários</h1>
          <p className="mt-1 text-sm text-dim">
            Cada pessoa recebe um cargo, e o cargo define o que ela abre nesta torre.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        >
          Cadastrar usuário
        </Button>
      </header>

      <Panel>
        <div className="border-b border-line p-4">
          <Input
            placeholder="Buscar por nome ou e-mail"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>

        {isLoading ? <Spinner label="Carregando usuários" /> : null}
        {isError ? <ErrorState message="Falha ao carregar os usuários." /> : null}

        {data && data.data.length === 0 ? (
          <EmptyState title="Nenhum usuário encontrado" description="Ajuste a busca ou cadastre uma nova pessoa." />
        ) : null}

        {data && data.data.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-dim">
                <tr>
                  <th className="px-5 py-3 font-medium">Pessoa</th>
                  <th className="px-5 py-3 font-medium">Cargo</th>
                  <th className="px-5 py-3 font-medium">Função</th>
                  <th className="px-5 py-3 font-medium">Situação</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {data.data.map((person) => (
                  <tr key={person.id} className="hover:bg-raised/50">
                    <td className="px-5 py-3">
                      <p className="font-medium">{person.name}</p>
                      <p className="font-mono text-xs text-dim">{person.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={person.role === 'SECURITY_ADMIN' ? 'brass' : 'neutral'}>{person.roleLabel}</Badge>
                    </td>
                    <td className="px-5 py-3 text-dim">{person.jobTitle ?? '—'}</td>
                    <td className="px-5 py-3">
                      <Badge tone={person.isActive ? 'granted' : 'denied'}>
                        {person.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditing(person);
                            setIsFormOpen(true);
                          }}
                        >
                          Editar
                        </Button>
                        {person.id !== currentUser?.id ? (
                          <Button variant="ghost" size="sm" onClick={() => void toggleActive(person)}>
                            {person.isActive ? 'Desativar' : 'Reativar'}
                          </Button>
                        ) : null}
                      </div>
                    </td>
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
            onChange={setPage}
          />
        ) : null}
      </Panel>

      {isFormOpen ? <UserForm person={editing} onClose={() => setIsFormOpen(false)} /> : null}
    </div>
  );
}

function UserForm({ person, onClose }: { person: AuthUser | null; onClose: () => void }) {
  const save = useSaveUser();
  const [form, setForm] = useState({
    name: person?.name ?? '',
    email: person?.email ?? '',
    password: '',
    role: person?.role ?? ('EMPLOYEE' as Role),
    jobTitle: person?.jobTitle ?? '',
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const payload: Record<string, unknown> = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      role: form.role,
      jobTitle: form.jobTitle.trim() || undefined,
    };

    if (!person) payload.password = form.password;

    try {
      await save.mutateAsync({ id: person?.id, payload });
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.details ?? {});
      } else {
        setError('Não foi possível salvar o usuário.');
      }
    }
  }

  return (
    <Modal title={person ? `Editar ${person.name}` : 'Cadastrar usuário'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nome completo" error={fieldErrors.name?.[0]}>
          <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
        </Field>

        <Field label="E-mail corporativo" error={fieldErrors.email?.[0]}>
          <Input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
        </Field>

        {!person ? (
          <Field label="Senha inicial" error={fieldErrors.password?.[0]}>
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Mínimo 8 caracteres, com letra e número"
              required
            />
          </Field>
        ) : null}

        <Field label="Cargo">
          <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Role })}>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Função na empresa">
          <Input value={form.jobTitle} onChange={(event) => setForm({ ...form, jobTitle: event.target.value })} />
        </Field>

        {error ? (
          <p className="rounded border border-denied/40 bg-denied-soft px-3 py-2 text-sm text-denied" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'Salvando' : 'Salvar usuário'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
