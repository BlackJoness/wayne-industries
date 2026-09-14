import { Role } from '@prisma/client';
import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid('Identificador inválido.') });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  role: z.nativeEnum(Role).optional(),
});

export const createUserBodySchema = z.object({
  name: z.string().trim().min(3, 'O nome precisa ter ao menos 3 caracteres.'),
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  password: z
    .string()
    .min(8, 'A senha precisa ter ao menos 8 caracteres.')
    .regex(/[A-Za-z]/, 'A senha precisa conter ao menos uma letra.')
    .regex(/[0-9]/, 'A senha precisa conter ao menos um número.'),
  role: z.nativeEnum(Role),
  jobTitle: z.string().trim().max(80).optional(),
});

export const updateUserBodySchema = createUserBodySchema
  .partial()
  .omit({ password: true })
  .extend({ isActive: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, { message: 'Envie ao menos um campo para atualizar.' });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type CreateUserBody = z.infer<typeof createUserBodySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
