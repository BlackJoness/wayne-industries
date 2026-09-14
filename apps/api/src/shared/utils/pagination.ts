export interface PaginationInput {
  page: number;
  perPage: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

export function toSkipTake({ page, perPage }: PaginationInput) {
  return { skip: (page - 1) * perPage, take: perPage };
}

export function paginate<T>(data: T[], total: number, { page, perPage }: PaginationInput): Paginated<T> {
  return {
    data,
    meta: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
  };
}
