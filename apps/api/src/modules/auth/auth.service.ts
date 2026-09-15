import type { Role, User } from '@prisma/client';
import { UnauthorizedError } from '../../shared/errors/app-error.js';
import { comparePassword } from '../../shared/utils/password.js';
import { signToken } from '../../shared/utils/jwt.js';
import { ROLE_LABEL } from '../../shared/utils/role.js';
import type { AuthRepository } from './auth.repository.js';
import type { LoginBody } from './auth.schema.js';

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  jobTitle: string | null;
  isActive: boolean;
}

export const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  roleLabel: ROLE_LABEL[user.role],
  jobTitle: user.jobTitle,
  isActive: user.isActive,
});

export class AuthService {
  constructor(private readonly repository: AuthRepository) {}

  async login({ email, password }: LoginBody): Promise<{ token: string; user: PublicUser }> {
    const user = await this.repository.findByEmail(email);

    // Mensagem genérica de propósito: não revelamos se o e-mail existe.
    if (!user) {
      throw new UnauthorizedError('E-mail ou senha incorretos.');
    }

    const passwordMatches = await comparePassword(password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('E-mail ou senha incorretos.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Este usuário está inativo. Procure o administrador de segurança.');
    }

    const token = signToken({ sub: user.id });
    return { token, user: toPublicUser(user) };
  }

  async profile(userId: string): Promise<PublicUser> {
    const user = await this.repository.findById(userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Sessão inválida.');
    }

    return toPublicUser(user);
  }
}
