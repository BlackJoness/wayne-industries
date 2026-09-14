import { ResourceStatus, ResourceType } from '@prisma/client';
import { z } from 'zod';

export const idParamSchema = z.object({ id: z.string().uuid('Identificador inválido.') });

export const listResourcesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  type: z.nativeEnum(ResourceType).optional(),
  status: z.nativeEnum(ResourceStatus).optional(),
  areaId: z.string().uuid().optional(),
});

export const createResourceBodySchema = z.object({
  name: z.string().trim().min(3, 'O nome precisa ter ao menos 3 caracteres.').max(120),
  description: z.string().trim().max(500).optional(),
  type: z.nativeEnum(ResourceType, { errorMap: () => ({ message: 'Tipo de recurso inválido.' }) }),
  serialNumber: z
    .string()
    .trim()
    .toUpperCase()
    .min(3, 'O número de série precisa ter ao menos 3 caracteres.')
    .max(40)
    .regex(/^[A-Z0-9-]+$/, 'Use apenas letras, números e hífen no número de série.'),
  status: z.nativeEnum(ResourceStatus).default(ResourceStatus.AVAILABLE),
  areaId: z.string().uuid('Área inválida.').nullable().optional(),
  acquiredAt: z.coerce.date({ errorMap: () => ({ message: 'Data de aquisição inválida.' }) }),
  value: z.coerce.number().nonnegative('O valor não pode ser negativo.').optional(),
});

export const updateResourceBodySchema = createResourceBodySchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, { message: 'Envie ao menos um campo para atualizar.' });

export type ListResourcesQuery = z.infer<typeof listResourcesQuerySchema>;
export type CreateResourceBody = z.infer<typeof createResourceBodySchema>;
export type UpdateResourceBody = z.infer<typeof updateResourceBodySchema>;
