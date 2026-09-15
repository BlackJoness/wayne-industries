import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccessResult, ResourceStatus, ResourceType, Role } from '@prisma/client';
import { DashboardService } from '../src/modules/dashboard/dashboard.service.js';
import type { DashboardRepository } from '../src/modules/dashboard/dashboard.repository.js';
import type { AuditRepository } from '../src/modules/audit/audit.repository.js';

describe('DashboardService', () => {
  let repository: DashboardRepository;
  let audit: AuditRepository;
  let service: DashboardService;

  beforeEach(() => {
    repository = {
      countResources: vi.fn().mockResolvedValue(25),
      countUsers: vi.fn().mockResolvedValue(4),
      countAreas: vi.fn().mockResolvedValue(5),
      countAccessLogs: vi.fn().mockResolvedValue(12),
      groupResourcesByType: vi.fn().mockResolvedValue([{ type: ResourceType.VEHICLE, total: 5 }]),
      groupResourcesByStatus: vi.fn().mockResolvedValue([{ status: ResourceStatus.AVAILABLE, total: 9 }]),
      sumResourceValue: vi.fn().mockResolvedValue(4500000),
      topDeniedAreas: vi.fn().mockResolvedValue([{ areaId: 'area-1', total: 3 }]),
      areasByIds: vi.fn().mockResolvedValue([{ id: 'area-1', name: 'Batcaverna', code: 'BAT-00' }]),
      listAccessLogsSince: vi.fn().mockResolvedValue([{ createdAt: new Date(), result: AccessResult.DENIED }]),
      recentAccessLogs: vi.fn().mockResolvedValue([
        {
          id: 'log-1',
          result: AccessResult.DENIED,
          reason: 'Cargo insuficiente.',
          createdAt: new Date(),
          user: { id: 'u1', name: 'Alfred Pennyworth' },
          area: { id: 'area-1', name: 'Batcaverna', code: 'BAT-00' },
        },
      ]),
    } as unknown as DashboardRepository;

    audit = {
      record: vi.fn(),
      listRecent: vi.fn().mockResolvedValue([
        {
          id: 'audit-1',
          entity: 'Resource',
          entityId: 'r1',
          action: 'CREATE',
          changes: null,
          actorId: 'admin-1',
          createdAt: new Date(),
          actor: { id: 'admin-1', name: 'Bruce Wayne', role: Role.SECURITY_ADMIN },
        },
      ]),
    } as unknown as AuditRepository;

    service = new DashboardService(repository, audit);
  });

  it('entrega ao Funcionário apenas números agregados', async () => {
    const summary = await service.summary(Role.EMPLOYEE);

    expect(summary.totals.resources).toBe(25);
    expect(summary.resourcesByType).toHaveLength(1);
    expect(summary.accessTrend).toHaveLength(7);
  });

  it('não expõe ao Funcionário dados de terceiros nem o valor do patrimônio', async () => {
    const summary = await service.summary(Role.EMPLOYEE);

    expect(summary.totals.estimatedValue).toBeUndefined();
    expect(summary.recentAccess).toBeUndefined();
    expect(summary.recentActivity).toBeUndefined();
    expect(summary.topDeniedAreas).toBeUndefined();
  });

  it('não consulta auditoria nem valor de inventário quando o cargo é Funcionário', async () => {
    await service.summary(Role.EMPLOYEE);

    expect(audit.listRecent).not.toHaveBeenCalled();
    expect(repository.sumResourceValue).not.toHaveBeenCalled();
    expect(repository.recentAccessLogs).not.toHaveBeenCalled();
  });

  it('entrega ao Gerente o histórico de acessos e o valor do inventário', async () => {
    const summary = await service.summary(Role.MANAGER);

    expect(summary.totals.estimatedValue).toBe(4500000);
    expect(summary.recentAccess).toHaveLength(1);
    expect(summary.topDeniedAreas?.[0]?.name).toBe('Batcaverna');
  });

  it('não entrega a trilha de auditoria ao Gerente', async () => {
    const summary = await service.summary(Role.MANAGER);

    expect(summary.recentActivity).toBeUndefined();
    expect(audit.listRecent).not.toHaveBeenCalled();
  });

  it('entrega tudo ao Administrador de Segurança', async () => {
    const summary = await service.summary(Role.SECURITY_ADMIN);

    expect(summary.totals.estimatedValue).toBe(4500000);
    expect(summary.recentAccess).toHaveLength(1);
    expect(summary.recentActivity).toHaveLength(1);
    expect(summary.recentActivity?.[0]?.description).toContain('Bruce Wayne');
  });
});
