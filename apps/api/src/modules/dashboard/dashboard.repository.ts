import { AccessResult, type PrismaClient, type ResourceStatus, type ResourceType, type Role } from '@prisma/client';


export class DashboardRepository {
  constructor(private readonly db: PrismaClient) {}

  countResources(where = {}) {
    return this.db.resource.count({ where });
  }

  groupResourcesByType(): Promise<Array<{ type: ResourceType; _count: { _all: number } }>> {
    return this.db.resource.groupBy({ by: ['type'], _count: { _all: true } });
  }

  groupResourcesByStatus(): Promise<Array<{ status: ResourceStatus; _count: { _all: number } }>> {
    return this.db.resource.groupBy({ by: ['status'], _count: { _all: true } });
  }

  sumResourceValue(): Promise<{ _sum: { value: unknown | null } }> {
    return this.db.resource.aggregate({ _sum: { value: true } });
  }

  countUsers(where: { isActive?: boolean; role?: Role } = {}) {
    return this.db.user.count({ where });
  }

  countAreas(where: { isActive?: boolean } = {}) {
    return this.db.area.count({ where });
  }

  countAccessLogs(where: { result?: AccessResult; createdAt?: { gte: Date } } = {}) {
    return this.db.accessLog.count({ where });
  }

  listAccessLogsSince(since: Date): Promise<Array<{ createdAt: Date; result: AccessResult }>> {
    return this.db.accessLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, result: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  topDeniedAreas(): Promise<Array<{ areaId: string; _count: { _all: number } }>> {
    return this.db.accessLog.groupBy({
      by: ['areaId'],
      where: { result: AccessResult.DENIED },
      _count: { _all: true },
      orderBy: { _count: { areaId: 'desc' } },
      take: 5,
    });
  }

  areasByIds(ids: string[]): Promise<Array<{ id: string; name: string; code: string }>> {
    return this.db.area.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, code: true } });
  }

  recentAccessLogs(limit: number): Promise<Array<{ id: string; result: AccessResult; reason: string; createdAt: Date; user: { id: string; name: string }; area: { id: string; name: string; code: string } }>> {
    return this.db.accessLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } },
        area: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
