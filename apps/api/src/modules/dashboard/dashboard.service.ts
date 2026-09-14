import { AccessResult, ResourceStatus, ResourceType } from '@prisma/client';
import type { AuditRepository } from '../audit/audit.repository.js';
import type { DashboardRepository } from './dashboard.repository.js';

const RESOURCE_TYPE_LABEL: Record<ResourceType, string> = {
  EQUIPMENT: 'Equipamentos',
  VEHICLE: 'Veículos',
  SECURITY_DEVICE: 'Dispositivos de segurança',
};

const RESOURCE_STATUS_LABEL: Record<ResourceStatus, string> = {
  AVAILABLE: 'Disponível',
  IN_USE: 'Em uso',
  MAINTENANCE: 'Em manutenção',
  RETIRED: 'Baixado',
};

const ACTION_LABEL: Record<string, string> = {
  CREATE: 'cadastrou',
  UPDATE: 'atualizou',
  DELETE: 'removeu',
};

const ENTITY_LABEL: Record<string, string> = {
  Resource: 'o recurso',
  User: 'o usuário',
  Area: 'a área',
  AreaPermission: 'a permissão de área',
};

export class DashboardService {
  constructor(
    private readonly repository: DashboardRepository,
    private readonly audit: AuditRepository,
  ) {}

  async summary() {
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      totalResources,
      byType,
      byStatus,
      valueSum,
      activeUsers,
      totalAreas,
      deniedLast7Days,
      grantedLast7Days,
      logsSince,
      deniedByArea,
      recentAccess,
      recentAudit,
    ] = await Promise.all([
      this.repository.countResources(),
      this.repository.groupResourcesByType(),
      this.repository.groupResourcesByStatus(),
      this.repository.sumResourceValue(),
      this.repository.countUsers({ isActive: true }),
      this.repository.countAreas({ isActive: true }),
      this.repository.countAccessLogs({ result: AccessResult.DENIED, createdAt: { gte: sevenDaysAgo } }),
      this.repository.countAccessLogs({ result: AccessResult.GRANTED, createdAt: { gte: sevenDaysAgo } }),
      this.repository.listAccessLogsSince(sevenDaysAgo),
      this.repository.topDeniedAreas(),
      this.repository.recentAccessLogs(6),
      this.audit.listRecent(6),
    ]);

    const areaIds = deniedByArea.map((row) => row.areaId);
    const areas = areaIds.length > 0 ? await this.repository.areasByIds(areaIds) : [];
    const areaById = new Map(areas.map((area) => [area.id, area]));

    return {
      totals: {
        resources: totalResources,
        activeUsers,
        areas: totalAreas,
        estimatedValue: valueSum,
        grantedLast7Days,
        deniedLast7Days,
      },
      resourcesByType: byType.map((row) => ({
        key: row.type,
        label: RESOURCE_TYPE_LABEL[row.type],
        total: row.total,
      })),
      resourcesByStatus: byStatus.map((row) => ({
        key: row.status,
        label: RESOURCE_STATUS_LABEL[row.status],
        total: row.total,
      })),
      accessTrend: buildDailySeries(logsSince, sevenDaysAgo),
      topDeniedAreas: deniedByArea.map((row) => ({
        areaId: row.areaId,
        name: areaById.get(row.areaId)?.name ?? 'Área removida',
        code: areaById.get(row.areaId)?.code ?? '—',
        total: row.total,
      })),
      recentAccess: recentAccess.map((log) => ({
        id: log.id,
        result: log.result,
        reason: log.reason,
        createdAt: log.createdAt,
        userName: log.user.name,
        areaName: log.area.name,
      })),
      recentActivity: recentAudit.map((entry) => ({
        id: entry.id,
        createdAt: entry.createdAt,
        actorName: entry.actor.name,
        description: `${entry.actor.name} ${ACTION_LABEL[entry.action] ?? 'alterou'} ${ENTITY_LABEL[entry.entity] ?? entry.entity}`,
      })),
    };
  }
}

/** Constrói a série diária dos últimos 7 dias, preenchendo dias sem registro com zero. */
function buildDailySeries(logs: Array<{ createdAt: Date; result: AccessResult }>, start: Date) {
  const days: Array<{ date: string; label: string; granted: number; denied: number }> = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + offset);
    const iso = day.toISOString().slice(0, 10);
    days.push({
      date: iso,
      label: `${String(day.getDate()).padStart(2, '0')}/${String(day.getMonth() + 1).padStart(2, '0')}`,
      granted: 0,
      denied: 0,
    });
  }

  const indexByDate = new Map(days.map((day, index) => [day.date, index]));

  for (const log of logs) {
    const index = indexByDate.get(log.createdAt.toISOString().slice(0, 10));
    if (index === undefined) continue;
    if (log.result === AccessResult.GRANTED) days[index]!.granted += 1;
    else days[index]!.denied += 1;
  }

  return days;
}
