import { AccessResult, type PrismaClient, type ResourceStatus, type ResourceType, type Role } from '@prisma/client';

export interface TypeTotal {
  type: ResourceType;
  total: number;
}

export interface StatusTotal {
  status: ResourceStatus;
  total: number;
}

export interface AreaTotal {
  areaId: string;
  total: number;
}

export interface AccessLogPoint {
  createdAt: Date;
  result: AccessResult;
}

export interface RecentAccessEntry {
  id: string;
  result: AccessResult;
  reason: string;
  createdAt: Date;
  user: { id: string; name: string };
  area: { id: string; name: string; code: string };
}

/**
 * Consultas de leitura do painel.
 *
 * As agregações devolvem formatos próprios da aplicação, e não o formato cru do
 * Prisma. Isso mantém o serviço livre de detalhes do ORM e evita que uma mudança
 * na biblioteca se espalhe pelas camadas de cima.
 */
export class DashboardRepository {
  constructor(private readonly db: PrismaClient) {}

  countResources(): Promise<number> {
    return this.db.resource.count();
  }

  countUsers(where: { isActive?: boolean; role?: Role } = {}): Promise<number> {
    return this.db.user.count({ where });
  }

  countAreas(where: { isActive?: boolean } = {}): Promise<number> {
    return this.db.area.count({ where });
  }

  countAccessLogs(where: { result?: AccessResult; createdAt?: { gte: Date } } = {}): Promise<number> {
    return this.db.accessLog.count({ where });
  }

  async groupResourcesByType(): Promise<TypeTotal[]> {
    const rows = await this.db.resource.groupBy({ by: ['type'], _count: { _all: true } });
    return rows.map((row) => ({ type: row.type, total: row._count._all }));
  }

  async groupResourcesByStatus(): Promise<StatusTotal[]> {
    const rows = await this.db.resource.groupBy({ by: ['status'], _count: { _all: true } });
    return rows.map((row) => ({ status: row.status, total: row._count._all }));
  }

  async sumResourceValue(): Promise<number> {
    const result = await this.db.resource.aggregate({ _sum: { value: true } });
    return Number(result._sum.value ?? 0);
  }

  async topDeniedAreas(limit = 5): Promise<AreaTotal[]> {
    const rows = await this.db.accessLog.groupBy({
      by: ['areaId'],
      where: { result: AccessResult.DENIED },
      _count: { _all: true },
      orderBy: { _count: { areaId: 'desc' } },
      take: limit,
    });
    return rows.map((row) => ({ areaId: row.areaId, total: row._count._all }));
  }

  listAccessLogsSince(since: Date): Promise<AccessLogPoint[]> {
    return this.db.accessLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, result: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  areasByIds(ids: string[]): Promise<Array<{ id: string; name: string; code: string }>> {
    return this.db.area.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, code: true } });
  }

  recentAccessLogs(limit: number): Promise<RecentAccessEntry[]> {
    return this.db.accessLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        result: true,
        reason: true,
        createdAt: true,
        user: { select: { id: true, name: true } },
        area: { select: { id: true, name: true, code: true } },
      },
    });
  }
}
