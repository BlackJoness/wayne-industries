import type { Prisma, PrismaClient, User } from '@prisma/client';
import { toSkipTake, type PaginationInput } from '../../shared/utils/pagination.js';

export class UsersRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(where: Prisma.UserWhereInput, pagination: PaginationInput): Promise<[User[], number]> {
    const { skip, take } = toSkipTake(pagination);

    return Promise.all([
      this.db.user.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
      this.db.user.count({ where }),
    ]);
  }

  findById(id: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { id } });
  }

  findByEmail(email: string): Promise<User | null> {
    return this.db.user.findUnique({ where: { email } });
  }

  create(data: Prisma.UserCreateInput): Promise<User> {
    return this.db.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.db.user.update({ where: { id }, data });
  }

  deactivate(id: string): Promise<User> {
    return this.db.user.update({ where: { id }, data: { isActive: false } });
  }
}
