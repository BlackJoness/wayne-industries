import type { Prisma } from '@prisma/client';
import { BadRequestError, ConflictError, NotFoundError } from '../../shared/errors/app-error.js';
import { hashPassword } from '../../shared/utils/password.js';
import { paginate, type Paginated } from '../../shared/utils/pagination.js';
import { toPublicUser, type PublicUser } from '../auth/auth.service.js';
import type { AuditRepository } from '../audit/audit.repository.js';
import type { UsersRepository } from './users.repository.js';
import type { CreateUserBody, ListUsersQuery, UpdateUserBody } from './users.schema.js';

export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly audit: AuditRepository,
  ) {}

  async list(query: ListUsersQuery): Promise<Paginated<PublicUser>> {
    const where: Prisma.UserWhereInput = {};

    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await this.repository.findMany(where, query);
    return paginate(users.map(toPublicUser), total, query);
  }

  async findById(id: string): Promise<PublicUser> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('Usuário');
    return toPublicUser(user);
  }

  async create(data: CreateUserBody, actorId: string): Promise<PublicUser> {
    const existing = await this.repository.findByEmail(data.email);
    if (existing) throw new ConflictError('Já existe um usuário com este e-mail.');

    const user = await this.repository.create({
      name: data.name,
      email: data.email,
      role: data.role,
      jobTitle: data.jobTitle,
      passwordHash: await hashPassword(data.password),
    });

    await this.audit.record({
      actorId,
      entity: 'User',
      entityId: user.id,
      action: 'CREATE',
      changes: { name: user.name, email: user.email, role: user.role },
    });

    return toPublicUser(user);
  }

  async update(id: string, data: UpdateUserBody, actorId: string): Promise<PublicUser> {
    const current = await this.repository.findById(id);
    if (!current) throw new NotFoundError('Usuário');

    if (data.email && data.email !== current.email) {
      const duplicated = await this.repository.findByEmail(data.email);
      if (duplicated) throw new ConflictError('Já existe um usuário com este e-mail.');
    }

    // Trava de segurança: um administrador não pode rebaixar ou desativar a si mesmo
    // e ficar sem nenhum administrador ativo no sistema por engano.
    if (id === actorId && (data.role !== undefined || data.isActive === false)) {
      throw new BadRequestError('Você não pode alterar o próprio cargo ou desativar a própria conta.');
    }

    const user = await this.repository.update(id, data);

    await this.audit.record({
      actorId,
      entity: 'User',
      entityId: user.id,
      action: 'UPDATE',
      changes: { ...data },
    });

    return toPublicUser(user);
  }

  async deactivate(id: string, actorId: string): Promise<void> {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundError('Usuário');

    if (id === actorId) {
      throw new BadRequestError('Você não pode desativar a própria conta.');
    }

    await this.repository.deactivate(id);
    await this.audit.record({ actorId, entity: 'User', entityId: id, action: 'DELETE' });
  }
}
