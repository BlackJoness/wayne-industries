import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z.string().trim().toLowerCase().email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
