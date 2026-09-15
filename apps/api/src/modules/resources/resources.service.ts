import type { Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error.js';
import { paginate, type Paginated } from '../../shared/utils/pagination.js';
import type { AuditRepository } from '../audit/audit.repository.js';
import type { ResourcesRepository, ResourceWithArea } from './resources.repository.js';
import type { CreateResourceBody, ListResourcesQuery, UpdateResourceBody } from './resources.schema.js';

export interface ResourceView {
  id: string;
  name: string;
  description: string | null;
  type: string;
  serialNumber: string;
  status: string;
  acquiredAt: Date;
  value: number | null;
  area: { id: string; name: string; code: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

const toView = (resource: ResourceWithArea): ResourceView => ({
  id: resource.id,
  name: resource.name,
  description: resource.description,
  type: resource.type,
  serialNumber: resource.serialNumber,
  status: resource.status,
  acquiredAt: resource.acquiredAt,
  value: resource.value ? Number(resource.value) : null,
  area: resource.area,
  createdAt: resource.createdAt,
  updatedAt: resource.updatedAt,
});

export class ResourcesService {
  constructor(
    private readonly repository: ResourcesRepository,
    private readonly audit: AuditRepository,
  ) {}

  async list(query: ListResourcesQuery): Promise<Paginated<ResourceView>> {
    const where: Prisma.ResourceWhereInput = {};

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
    if (query.areaId) where.areaId = query.areaId;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { serialNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [resources, total] = await this.repository.findMany(where, query);
    return paginate(resources.map(toView), total, query);
  }

  async findById(id: string): Promise<ResourceView> {
    const resource = await this.repository.findById(id);
    if (!resource) throw new NotFoundError('Recurso');
    return toView(resource);
  }

  async create(data: CreateResourceBody, actorId: string): Promise<ResourceView> {
    const duplicated = await this.repository.findBySerialNumber(data.serialNumber);
    if (duplicated) throw new ConflictError('Já existe um recurso com este número de série.');

    const resource = await this.repository.create({
      name: data.name,
      description: data.description,
      type: data.type,
      serialNumber: data.serialNumber,
      status: data.status,
      areaId: data.areaId ?? null,
      acquiredAt: data.acquiredAt,
      value: data.value,
    });

    await this.audit.record({
      actorId,
      entity: 'Resource',
      entityId: resource.id,
      action: 'CREATE',
      changes: { name: resource.name, serialNumber: resource.serialNumber, status: resource.status },
    });

    return toView(resource);
  }

  async update(id: string, data: UpdateResourceBody, actorId: string): Promise<ResourceView> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError('Recurso');

    if (data.serialNumber && data.serialNumber !== current.serialNumber) {
      const duplicated = await this.repository.findBySerialNumber(data.serialNumber);
      if (duplicated) throw new ConflictError('Já existe um recurso com este número de série.');
    }

    // Enviar areaId como null desvincula o recurso da área; omitir o campo mantém o vínculo.
    const resource = await this.repository.update(id, data);

    await this.audit.record({
      actorId,
      entity: 'Resource',
      entityId: resource.id,
      action: 'UPDATE',
      changes: { before: { status: current.status, name: current.name }, after: { ...data } },
    });

    return toView(resource);
  }

  async delete(id: string, actorId: string): Promise<void> {
    const resource = await this.repository.findById(id);
    if (!resource) throw new NotFoundError('Recurso');

    await this.repository.delete(id);
    await this.audit.record({
      actorId,
      entity: 'Resource',
      entityId: id,
      action: 'DELETE',
      changes: { name: resource.name, serialNumber: resource.serialNumber },
    });
  }
}
