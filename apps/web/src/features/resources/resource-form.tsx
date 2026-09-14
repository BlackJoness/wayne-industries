import { useState, type FormEvent } from 'react';
import { ApiError } from '@/api/client';
import { useAreas, useSaveResource, type ResourcePayload } from '@/api/queries';
import type { Resource, ResourceStatus, ResourceType } from '@/api/types';
import { Button, Field, Input, Modal, Select } from '@/components/ui/primitives';

const TYPES: Array<{ value: ResourceType; label: string }> = [
  { value: 'EQUIPMENT', label: 'Equipamento' },
  { value: 'VEHICLE', label: 'Veículo' },
  { value: 'SECURITY_DEVICE', label: 'Dispositivo de segurança' },
];

const STATUSES: Array<{ value: ResourceStatus; label: string }> = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'IN_USE', label: 'Em uso' },
  { value: 'MAINTENANCE', label: 'Em manutenção' },
  { value: 'RETIRED', label: 'Baixado' },
];

export function ResourceForm({ resource, onClose }: { resource: Resource | null; onClose: () => void }) {
  const { data: areas } = useAreas();
  const save = useSaveResource();

  const [form, setForm] = useState({
    name: resource?.name ?? '',
    description: resource?.description ?? '',
    type: resource?.type ?? ('EQUIPMENT' as ResourceType),
    serialNumber: resource?.serialNumber ?? '',
    status: resource?.status ?? ('AVAILABLE' as ResourceStatus),
    areaId: resource?.area?.id ?? '',
    acquiredAt: (resource?.acquiredAt ?? new Date().toISOString()).slice(0, 10),
    value: resource?.value != null ? String(resource.value) : '',
  });

  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setFieldErrors({});

    const payload: ResourcePayload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      type: form.type,
      serialNumber: form.serialNumber.trim().toUpperCase(),
      status: form.status,
      areaId: form.areaId || null,
      acquiredAt: new Date(form.acquiredAt).toISOString(),
      value: form.value ? Number(form.value) : undefined,
    };

    try {
      await save.mutateAsync({ id: resource?.id, payload });
      onClose();
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        setFieldErrors(caught.details ?? {});
      } else {
        setError('Não foi possível salvar o recurso.');
      }
    }
  }

  return (
    <Modal title={resource ? `Editar ${resource.name}` : 'Cadastrar recurso'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Field label="Nome" error={fieldErrors.name?.[0]}>
          <Input value={form.name} onChange={(event) => update('name', event.target.value)} required />
        </Field>

        <Field label="Descrição">
          <Input value={form.description} onChange={(event) => update('description', event.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria">
            <Select value={form.type} onChange={(event) => update('type', event.target.value as ResourceType)}>
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Número de série" error={fieldErrors.serialNumber?.[0]}>
            <Input
              value={form.serialNumber}
              onChange={(event) => update('serialNumber', event.target.value)}
              className="font-mono"
              placeholder="WE-1234"
              required
            />
          </Field>

          <Field label="Situação">
            <Select value={form.status} onChange={(event) => update('status', event.target.value as ResourceStatus)}>
              {STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Área onde fica">
            <Select value={form.areaId} onChange={(event) => update('areaId', event.target.value)}>
              <option value="">Sem área definida</option>
              {areas?.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Data de aquisição" error={fieldErrors.acquiredAt?.[0]}>
            <Input
              type="date"
              value={form.acquiredAt}
              onChange={(event) => update('acquiredAt', event.target.value)}
              required
            />
          </Field>

          <Field label="Valor estimado (R$)" error={fieldErrors.value?.[0]}>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.value}
              onChange={(event) => update('value', event.target.value)}
            />
          </Field>
        </div>

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
            {save.isPending ? 'Salvando' : 'Salvar recurso'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
