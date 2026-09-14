import { AccessResult } from '@prisma/client';
import { z } from 'zod';

export const attemptBodySchema = z.object({
  areaId: z.string().uuid('Área inválida.'),
});

export const listLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(15),
  result: z.nativeEnum(AccessResult).optional(),
  areaId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
});

export type AttemptBody = z.infer<typeof attemptBodySchema>;
export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;
