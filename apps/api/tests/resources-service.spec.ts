import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResourceStatus, ResourceType } from '@prisma/client';
import { ResourcesService } from '../src/modules/resources/resources.service.js';
import type { ResourcesRepository, ResourceWithArea } from '../src/modules/resources/resources.repository.js';
import type { AuditRepository } from '../src/modules/audit/audit.repository.js';

function buildResource(overrides: Partial<ResourceWithArea> = {}): ResourceWithArea {
  return {
    id: 'resource-1',
    name: 'Batmóvel',
    description: null,
    type: ResourceType.VEHICLE,
    serialNumber: 'WV-0001',
    status: ResourceStatus.AVAILABLE,
    areaId: null,
    acquiredAt: new Date('2025-01-10'),
    value: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    area: null,
    ...overrides,
  } as ResourceWithArea;
}

describe('ResourcesService', () => {
  let repository: ResourcesRepository;
  let audit: AuditRepository;
  let service: ResourcesService;

  beforeEach(() => {
    repository = {
      findMany: vi.fn().mockResolvedValue([[buildResource()], 1]),
      findById: vi.fn().mockResolvedValue(buildResource()),
      findBySerialNumber: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (data) => buildResource({ ...data, id: 'resource-2' })),
      update: vi.fn().mockImplementation(async (_id, data) => buildResource({ ...data })),
      delete: vi.fn().mockResolvedValue(undefined),
    } as unknown as ResourcesRepository;

    audit = { record: vi.fn().mockResolvedValue(undefined), listRecent: vi.fn() } as unknown as AuditRepository;
    service = new ResourcesService(repository, audit);
  });

  it('lista recursos com metadados de paginação', async () => {
    const result = await service.list({ page: 1, perPage: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.meta).toEqual({ page: 1, perPage: 10, total: 1, totalPages: 1 });
  });

  it('rejeita número de série duplicado com 409', async () => {
    repository.findBySerialNumber = vi.fn().mockResolvedValue(buildResource());

    await expect(
      service.create(
        {
          name: 'Batmóvel Clone',
          type: ResourceType.VEHICLE,
          serialNumber: 'WV-0001',
          status: ResourceStatus.AVAILABLE,
          acquiredAt: new Date(),
        },
        'admin-1',
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('registra trilha de auditoria ao criar um recurso', async () => {
    await service.create(
      {
        name: 'Drone Falcão',
        type: ResourceType.SECURITY_DEVICE,
        serialNumber: 'WS-9999',
        status: ResourceStatus.AVAILABLE,
        acquiredAt: new Date(),
      },
      'admin-1',
    );

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin-1', entity: 'Resource', action: 'CREATE' }),
    );
  });

  it('devolve 404 ao buscar recurso inexistente', async () => {
    repository.findById = vi.fn().mockResolvedValue(null);
    await expect(service.findById('inexistente')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('não permite excluir recurso inexistente', async () => {
    repository.findById = vi.fn().mockResolvedValue(null);
    await expect(service.delete('inexistente', 'admin-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(repository.delete).not.toHaveBeenCalled();
  });

  it('converte o valor decimal do banco para número na resposta', async () => {
    repository.findById = vi.fn().mockResolvedValue(buildResource({ value: '4500000.00' as never }));
    const resource = await service.findById('resource-1');
    expect(resource.value).toBe(4500000);
  });
});
