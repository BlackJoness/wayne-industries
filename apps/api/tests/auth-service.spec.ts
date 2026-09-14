import { beforeEach, describe, expect, it } from 'vitest';
import { Role, type User } from '@prisma/client';
import { AuthService } from '../src/modules/auth/auth.service.js';
import type { AuthRepository } from '../src/modules/auth/auth.repository.js';
import { hashPassword } from '../src/shared/utils/password.js';
import { AppError } from '../src/shared/errors/app-error.js';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Bruce Wayne',
    email: 'bruce@wayne.com',
    passwordHash: '',
    role: Role.SECURITY_ADMIN,
    jobTitle: 'Diretor Executivo',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

class FakeAuthRepository implements Pick<AuthRepository, 'findByEmail' | 'findById'> {
  constructor(private readonly users: User[]) {}
  async findByEmail(email: string) {
    return this.users.find((user) => user.email === email) ?? null;
  }
  async findById(id: string) {
    return this.users.find((user) => user.id === id) ?? null;
  }
}

describe('AuthService', () => {
  let service: AuthService;
  let user: User;

  beforeEach(async () => {
    user = buildUser({ passwordHash: await hashPassword('Wayne@123') });
    service = new AuthService(new FakeAuthRepository([user]) as unknown as AuthRepository);
  });

  it('devolve token e usuário público em credenciais válidas', async () => {
    const result = await service.login({ email: 'bruce@wayne.com', password: 'Wayne@123' });
    expect(result.token).toBeTypeOf('string');
    expect(result.user.email).toBe('bruce@wayne.com');
    expect(result.user.roleLabel).toBe('Administrador de Segurança');
  });

  it('nunca expõe o hash da senha na resposta', async () => {
    const result = await service.login({ email: 'bruce@wayne.com', password: 'Wayne@123' });
    expect(JSON.stringify(result.user)).not.toContain('passwordHash');
  });

  it('rejeita senha incorreta com 401', async () => {
    await expect(service.login({ email: 'bruce@wayne.com', password: 'errada' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  it('usa a mesma mensagem para e-mail inexistente e senha errada', async () => {
    const wrongEmail = await service.login({ email: 'ninguem@wayne.com', password: 'x' }).catch((e: AppError) => e);
    const wrongPassword = await service.login({ email: 'bruce@wayne.com', password: 'x' }).catch((e: AppError) => e);
    expect((wrongEmail as AppError).message).toBe((wrongPassword as AppError).message);
  });

  it('bloqueia login de usuário inativo', async () => {
    const inactive = buildUser({ id: 'user-2', email: 'selina@wayne.com', isActive: false, passwordHash: await hashPassword('Wayne@123') });
    const localService = new AuthService(new FakeAuthRepository([inactive]) as unknown as AuthRepository);
    await expect(localService.login({ email: 'selina@wayne.com', password: 'Wayne@123' })).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});
