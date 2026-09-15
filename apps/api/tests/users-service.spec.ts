import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Role, type User } from '@prisma/client';
import { UsersService } from '../src/modules/users/users.service.js';
import type { UsersRepository } from '../src/modules/users/users.repository.js';
import type { AuditRepository } from '../src/modules/audit/audit.repository.js';

function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'admin-1',
    name: 'Bruce Wayne',
    email: 'bruce@wayne.com',
    passwordHash: 'hash',
    role: Role.SECURITY_ADMIN,
    jobTitle: 'Diretor Executivo',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('UsersService', () => {
  let repository: UsersRepository;
  let audit: AuditRepository;
  let service: UsersService;

  beforeEach(() => {
    repository = {
      findMany: vi.fn().mockResolvedValue([[buildUser()], 1]),
      findById: vi.fn().mockResolvedValue(buildUser()),
      findByEmail: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockImplementation(async (data) => buildUser({ ...data, id: 'user-2' })),
      update: vi.fn().mockImplementation(async (id, data) => buildUser({ id, ...data })),
      deactivate: vi.fn().mockResolvedValue(buildUser({ isActive: false })),
    } as unknown as UsersRepository;

    audit = { record: vi.fn().mockResolvedValue(undefined), listRecent: vi.fn() } as unknown as AuditRepository;
    service = new UsersService(repository, audit);
  });

  it('impede que o administrador altere o próprio cargo', async () => {
    await expect(service.update('admin-1', { role: Role.EMPLOYEE }, 'admin-1')).rejects.toMatchObject({
      statusCode: 400,
    });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('impede que o administrador desative a própria conta pela edição', async () => {
    await expect(service.update('admin-1', { isActive: false }, 'admin-1')).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it('impede que o administrador desative a própria conta pela exclusão', async () => {
    await expect(service.deactivate('admin-1', 'admin-1')).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.deactivate).not.toHaveBeenCalled();
  });

  it('permite que o administrador altere o cargo de outra pessoa', async () => {
    repository.findById = vi.fn().mockResolvedValue(buildUser({ id: 'user-9', role: Role.EMPLOYEE }));
    const updated = await service.update('user-9', { role: Role.MANAGER }, 'admin-1');
    expect(updated.role).toBe(Role.MANAGER);
    expect(audit.record).toHaveBeenCalled();
  });

  it('rejeita e-mail duplicado na criação com 409', async () => {
    repository.findByEmail = vi.fn().mockResolvedValue(buildUser());
    await expect(
      service.create(
        { name: 'Outro Bruce', email: 'bruce@wayne.com', password: 'Senha1234', role: Role.EMPLOYEE },
        'admin-1',
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('nunca expõe o hash da senha na resposta', async () => {
    const created = await service.create(
      { name: 'Renee Montoya', email: 'renee@wayne.com', password: 'Gotham2026', role: Role.EMPLOYEE },
      'admin-1',
    );
    expect(JSON.stringify(created)).not.toContain('passwordHash');
  });

  it('devolve 404 ao atualizar usuário inexistente', async () => {
    repository.findById = vi.fn().mockResolvedValue(null);
    await expect(service.update('fantasma', { name: 'Teste' }, 'admin-1')).rejects.toMatchObject({ statusCode: 404 });
  });
});
