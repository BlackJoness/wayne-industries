import type { Area, AreaPermission, Prisma, PrismaClient } from '@prisma/client';

const permissionInclude = {
  permissions: {
    include: { user: { select: { id: true, name: true, email: true, role: true } } },
  },
  _count: { select: { resources: true } },
} as const;

export type AreaWithPermissions = Prisma.AreaGetPayload<{ include: typeof permissionInclude }>;

export class AreasRepository {
  constructor(private readonly db: PrismaClient) {}

  findAll(): Promise<AreaWithPermissions[]> {
    return this.db.area.findMany({ orderBy: { name: 'asc' }, include: permissionInclude });
  }

  findById(id: string): Promise<AreaWithPermissions | null> {
    return this.db.area.findUnique({ where: { id }, include: permissionInclude });
  }

  findByCode(code: string): Promise<Area | null> {
    return this.db.area.findUnique({ where: { code } });
  }

  create(data: Prisma.AreaCreateInput): Promise<Area> {
    return this.db.area.create({ data });
  }

  update(id: string, data: Prisma.AreaUpdateInput): Promise<Area> {
    return this.db.area.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.db.area.delete({ where: { id } });
  }

  findPermission(userId: string, areaId: string): Promise<AreaPermission | null> {
    return this.db.areaPermission.findUnique({ where: { userId_areaId: { userId, areaId } } });
  }

  listPermissionsByUser(userId: string): Promise<AreaPermission[]> {
    return this.db.areaPermission.findMany({ where: { userId } });
  }

  grantPermission(data: Prisma.AreaPermissionUncheckedCreateInput): Promise<AreaPermission> {
    return this.db.areaPermission.create({ data });
  }

  async revokePermission(userId: string, areaId: string): Promise<void> {
    await this.db.areaPermission.delete({ where: { userId_areaId: { userId, areaId } } });
  }
}
