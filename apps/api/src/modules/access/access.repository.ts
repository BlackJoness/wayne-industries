import type { AccessResult, Area, AreaPermission, Prisma, PrismaClient, User } from '@prisma/client';
import { toSkipTake, type PaginationInput } from '../../shared/utils/pagination.js';

const logInclude = {
  user: { select: { id: true, name: true, role: true } },
  area: { select: { id: true, name: true, code: true } },
} as const;

export type AccessLogWithRelations = Prisma.AccessLogGetPayload<{ include: typeof logInclude }>;

export class AccessRepository {
  constructor(private readonly db: PrismaClient) {}

  findUser(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  findArea(id: string): Promise<Area | null> {
    return this.db.area.findUnique({ where: { id } });
  }

  listActiveAreas(): Promise<Area[]> {
    return this.db.area.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } });
  }

  findPermission(userId: string, areaId: string): Promise<AreaPermission | null> {
    return this.db.areaPermission.findUnique({ where: { userId_areaId: { userId, areaId } } });
  }

  listPermissionsByUser(userId: string): Promise<AreaPermission[]> {
    return this.db.areaPermission.findMany({ where: { userId } });
  }

  createLog(data: {
    userId: string;
    areaId: string;
    result: AccessResult;
    reason: string;
    ipAddress?: string;
  }): Promise<AccessLogWithRelations> {
    return this.db.accessLog.create({ data, include: logInclude });
  }

  async listLogs(
    where: Prisma.AccessLogWhereInput,
    pagination: PaginationInput,
  ): Promise<[AccessLogWithRelations[], number]> {
    const { skip, take } = toSkipTake(pagination);

    return Promise.all([
      this.db.accessLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: logInclude }),
      this.db.accessLog.count({ where }),
    ]);
  }
}
