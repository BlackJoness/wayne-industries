import type { Prisma, PrismaClient, Resource } from '@prisma/client';
import { toSkipTake, type PaginationInput } from '../../shared/utils/pagination.js';

const withArea = { area: { select: { id: true, name: true, code: true } } } as const;

export type ResourceWithArea = Prisma.ResourceGetPayload<{ include: typeof withArea }>;

export class ResourcesRepository {
  constructor(private readonly db: PrismaClient) {}

  async findMany(
    where: Prisma.ResourceWhereInput,
    pagination: PaginationInput,
  ): Promise<[ResourceWithArea[], number]> {
    const { skip, take } = toSkipTake(pagination);

    return Promise.all([
      this.db.resource.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: withArea }),
      this.db.resource.count({ where }),
    ]);
  }

  findById(id: string): Promise<ResourceWithArea | null> {
    return this.db.resource.findUnique({ where: { id }, include: withArea });
  }

  findBySerialNumber(serialNumber: string): Promise<Resource | null> {
    return this.db.resource.findUnique({ where: { serialNumber } });
  }

  create(data: Prisma.ResourceUncheckedCreateInput): Promise<ResourceWithArea> {
    return this.db.resource.create({ data, include: withArea });
  }

  update(id: string, data: Prisma.ResourceUncheckedUpdateInput): Promise<ResourceWithArea> {
    return this.db.resource.update({ where: { id }, data, include: withArea });
  }

  async delete(id: string): Promise<void> {
    await this.db.resource.delete({ where: { id } });
  }
}
