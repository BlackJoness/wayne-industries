import { Role } from '@prisma/client';
import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid('Identificador inválido.') });

export const permissionParamsSchema = z.object({
  id: z.string().uuid('Identificador de área inválido.'),
  userId: z.string().uuid('Identificador de usuário inválido.'),
});

export const createAreaBodySchema = z.object({
  name: z.string().trim().min(3, 'O nome precisa ter ao menos 3 caracteres.').max(80),
  code: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'O código precisa ter ao menos 3 caracteres.')
    .max(12)
    .regex(/^[A-Z0-9-]+$/, 'Use apenas letras, números e hífen no código.'),
  description: z.string().trim().max(300).optional(),
  minimumRole: z.nativeEnum(Role).default(Role.EMPLOYEE),
});

export const updateAreaBodySchema = createAreaBodySchema
  .partial()
  .extend({ isActive: z.boolean().optional() })
  .refine((data) => Object.keys(data).length > 0, { message: 'Envie ao menos um campo para atualizar.' });

export const grantPermissionBodySchema = z.object({
  userId: z.string().uuid('Usuário inválido.'),
  expiresAt: z.coerce.date().optional(),
});

export type CreateAreaBody = z.infer<typeof createAreaBodySchema>;
export type UpdateAreaBody = z.infer<typeof updateAreaBodySchema>;
export type GrantPermissionBody = z.infer<typeof grantPermissionBodySchema>;
