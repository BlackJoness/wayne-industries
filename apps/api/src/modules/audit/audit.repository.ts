import type { AuditAction, AuditLog, PrismaClient, Role } from '@prisma/client';

export interface AuditEntry {
  actorId: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
}

export class AuditRepository {
  constructor(private readonly db: PrismaClient) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.db.auditLog.create({
      data: {
        actorId: entry.actorId,
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action,
        changes: entry.changes ?? undefined,
      },
    });
  }

  listRecent(limit: number): Promise<Array<AuditLog & { actor: { id: string; name: string; role: Role } }>> {
    return this.db.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, name: true, role: true } } },
    });
  }
}
