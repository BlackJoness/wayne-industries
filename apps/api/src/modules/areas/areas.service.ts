import { Role } from '@prisma/client';
import { ConflictError, NotFoundError } from '../../shared/errors/app-error.js';
import { ROLE_LABEL } from '../../shared/utils/role.js';
import type { AuditRepository } from '../audit/audit.repository.js';
import type { AreasRepository, AreaWithPermissions } from './areas.repository.js';
import type { CreateAreaBody, GrantPermissionBody, UpdateAreaBody } from './areas.schema.js';

export interface AreaView {
  id: string;
  name: string;
  code: string;
  description: string | null;
  minimumRole: Role;
  minimumRoleLabel: string;
  isActive: boolean;
  resourceCount: number;
  permissions: Array<{ userId: string; userName: string; userEmail: string; expiresAt: Date | null }>;
}

const toView = (area: AreaWithPermissions): AreaView => ({
  id: area.id,
  name: area.name,
  code: area.code,
  description: area.description,
  minimumRole: area.minimumRole,
  minimumRoleLabel: ROLE_LABEL[area.minimumRole],
  isActive: area.isActive,
  resourceCount: area._count.resources,
  permissions: area.permissions.map((permission) => ({
    userId: permission.user.id,
    userName: permission.user.name,
    userEmail: permission.user.email,
    expiresAt: permission.expiresAt,
  })),
});

export class AreasService {
  constructor(
    private readonly repository: AreasRepository,
    private readonly audit: AuditRepository,
  ) {}

  async list(): Promise<AreaView[]> {
    const areas = await this.repository.findAll();
    return areas.map(toView);
  }

  async findById(id: string): Promise<AreaView> {
    const area = await this.repository.findById(id);
    if (!area) throw new NotFoundError('Área');
    return toView(area);
  }

  async create(data: CreateAreaBody, actorId: string): Promise<AreaView> {
    const duplicated = await this.repository.findByCode(data.code);
    if (duplicated) throw new ConflictError('Já existe uma área com este código.');

    const created = await this.repository.create(data);
    await this.audit.record({
      actorId,
      entity: 'Area',
      entityId: created.id,
      action: 'CREATE',
      changes: { name: created.name, code: created.code },
    });

    return this.findById(created.id);
  }

  async update(id: string, data: UpdateAreaBody, actorId: string): Promise<AreaView> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError('Área');

    if (data.code && data.code !== current.code) {
      const duplicated = await this.repository.findByCode(data.code);
      if (duplicated) throw new ConflictError('Já existe uma área com este código.');
    }

    await this.repository.update(id, data);
    await this.audit.record({ actorId, entity: 'Area', entityId: id, action: 'UPDATE', changes: { ...data } });

    return this.findById(id);
  }

  async delete(id: string, actorId: string): Promise<void> {
    const area = await this.repository.findById(id);
    if (!area) throw new NotFoundError('Área');

    if (area._count.resources > 0) {
      throw new ConflictError('Esta área ainda possui recursos vinculados. Realoque os recursos antes de excluí-la.');
    }

    await this.repository.delete(id);
    await this.audit.record({ actorId, entity: 'Area', entityId: id, action: 'DELETE', changes: { code: area.code } });
  }

  async grantPermission(areaId: string, data: GrantPermissionBody, actorId: string): Promise<AreaView> {
    const area = await this.repository.findById(areaId);
    if (!area) throw new NotFoundError('Área');

    const existing = await this.repository.findPermission(data.userId, areaId);
    if (existing) throw new ConflictError('Este usuário já possui permissão individual nesta área.');

    await this.repository.grantPermission({
      areaId,
      userId: data.userId,
      grantedById: actorId,
      expiresAt: data.expiresAt,
    });

    await this.audit.record({
      actorId,
      entity: 'AreaPermission',
      entityId: `${data.userId}:${areaId}`,
      action: 'CREATE',
      changes: { areaCode: area.code, userId: data.userId },
    });

    return this.findById(areaId);
  }

  async revokePermission(areaId: string, userId: string, actorId: string): Promise<AreaView> {
    const permission = await this.repository.findPermission(userId, areaId);
    if (!permission) throw new NotFoundError('Permissão');

    await this.repository.revokePermission(userId, areaId);
    await this.audit.record({
      actorId,
      entity: 'AreaPermission',
      entityId: `${userId}:${areaId}`,
      action: 'DELETE',
    });

    return this.findById(areaId);
  }
}
