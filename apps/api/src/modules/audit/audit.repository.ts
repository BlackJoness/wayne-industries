import type { AuditAction, AuditLog, Prisma, PrismaClient, Role } from '@prisma/client';

export interface AuditEntry {
  actorId: string;
  entity: string;
  entityId: string;
  action: AuditAction;
  changes?: Record<string, unknown>;
}

export type AuditLogWithActor = AuditLog & { actor: { id: string; name: string; role: Role } };

export class AuditRepository {
  constructor(private readonly db: PrismaClient) {}

  async record(entry: AuditEntry): Promise<void> {
    await this.db.auditLog.create({
      data: {
        actorId: entry.actorId,
        entity: entry.entity,
        entityId: entry.entityId,
        action: entry.action,
        // A fronteira com o Prisma exige o tipo Json dele. O restante da aplicação
        // trabalha com um objeto comum, que é mais simples de montar nos serviços.
        changes: (entry.changes ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  }

  async listRecent(limit: number): Promise<AuditLogWithActor[]> {
    return this.db.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, name: true, role: true } } },
    });
  }
}
