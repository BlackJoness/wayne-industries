import { Role, type Prisma } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/app-error.js';
import { paginate, type Paginated } from '../../shared/utils/pagination.js';
import { ROLE_LABEL } from '../../shared/utils/role.js';
import type { AccessRepository, AccessLogWithRelations } from './access.repository.js';
import { evaluateAccess, type AccessDecision } from './access.policy.js';
import type { ListLogsQuery } from './access.schema.js';

export interface AccessLogView {
  id: string;
  result: string;
  reason: string;
  createdAt: Date;
  user: { id: string; name: string; role: string; roleLabel: string };
  area: { id: string; name: string; code: string };
}

export interface AreaClearanceView {
  areaId: string;
  name: string;
  code: string;
  description: string | null;
  minimumRoleLabel: string;
  allowed: boolean;
  reason: string;
}

const toLogView = (log: AccessLogWithRelations): AccessLogView => ({
  id: log.id,
  result: log.result,
  reason: log.reason,
  createdAt: log.createdAt,
  user: { id: log.user.id, name: log.user.name, role: log.user.role, roleLabel: ROLE_LABEL[log.user.role] },
  area: log.area,
});

export class AccessService {
  constructor(private readonly repository: AccessRepository) {}

  /** Registra uma tentativa real de acesso e devolve a decisão. */
  async attempt(userId: string, areaId: string, ipAddress?: string): Promise<AccessDecision & { log: AccessLogView }> {
    const [user, area] = await Promise.all([this.repository.findUser(userId), this.repository.findArea(areaId)]);

    if (!user) throw new NotFoundError('Usuário');
    if (!area) throw new NotFoundError('Área');

    const permission = await this.repository.findPermission(userId, areaId);
    const decision = evaluateAccess(user, area, permission);

    const log = await this.repository.createLog({
      userId,
      areaId,
      result: decision.result,
      reason: decision.reason,
      ipAddress,
    });

    return { ...decision, log: toLogView(log) };
  }

  /** Mostra ao usuário quais áreas ele pode acessar, sem gravar tentativa. */
  async clearanceMap(userId: string): Promise<AreaClearanceView[]> {
    const user = await this.repository.findUser(userId);
    if (!user) throw new NotFoundError('Usuário');

    const [areas, permissions] = await Promise.all([
      this.repository.listActiveAreas(),
      this.repository.listPermissionsByUser(userId),
    ]);

    const permissionByArea = new Map(permissions.map((permission) => [permission.areaId, permission]));

    return areas.map((area) => {
      const decision = evaluateAccess(user, area, permissionByArea.get(area.id) ?? null);
      return {
        areaId: area.id,
        name: area.name,
        code: area.code,
        description: area.description,
        minimumRoleLabel: ROLE_LABEL[area.minimumRole],
        allowed: decision.result === 'GRANTED',
        reason: decision.reason,
      };
    });
  }

  /**
   * Lista o histórico de acessos respeitando o escopo do solicitante.
   * O Gerente enxerga apenas as áreas que ele próprio poderia acessar;
   * o Administrador de Segurança enxerga tudo.
   */
  async listLogs(requesterId: string, requesterRole: Role, query: ListLogsQuery): Promise<Paginated<AccessLogView>> {
    const where: Prisma.AccessLogWhereInput = {};

    if (query.result) where.result = query.result;
    if (query.areaId) where.areaId = query.areaId;
    if (query.userId) where.userId = query.userId;

    if (requesterRole === Role.MANAGER) {
      const scope = await this.clearanceMap(requesterId);
      const allowedAreaIds = scope.filter((area) => area.allowed).map((area) => area.areaId);
      where.areaId = query.areaId && allowedAreaIds.includes(query.areaId) ? query.areaId : { in: allowedAreaIds };
    }

    const [logs, total] = await this.repository.listLogs(where, query);
    return paginate(logs.map(toLogView), total, query);
  }

  /** Histórico pessoal, disponível para qualquer perfil autenticado. */
  async listOwnLogs(userId: string, query: ListLogsQuery): Promise<Paginated<AccessLogView>> {
    const [logs, total] = await this.repository.listLogs({ userId }, query);
    return paginate(logs.map(toLogView), total, query);
  }
}
