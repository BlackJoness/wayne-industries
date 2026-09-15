import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { Role } from '@prisma/client';
import { UnauthorizedError } from '../errors/app-error.js';
import { verifyToken } from '../utils/jwt.js';

export interface AuthenticatedUser {
  id: string;
  role: Role;
  isActive: boolean;
}

export type AuthenticatedUserLoader = (id: string) => Promise<AuthenticatedUser | null>;

/**
 * Valida o Bearer token e recarrega a identidade do banco.
 *
 * A consulta extra por requisição é deliberada. Sem ela, o cargo ficaria congelado
 * dentro do token: rebaixar alguém de Gerente para Funcionário, ou desativar a conta,
 * só faria efeito quando o token expirasse. Em um sistema de controle de acesso,
 * revogação precisa ser imediata.
 *
 * Recebe o carregador por parâmetro para poder ser testado sem banco.
 */
export function createAuthenticate(loadUser: AuthenticatedUserLoader): RequestHandler {
  return (request: Request, _response: Response, next: NextFunction): void => {
    const header = request.headers.authorization;

    if (!header?.startsWith('Bearer ')) {
      next(new UnauthorizedError('Token de autenticação não informado.'));
      return;
    }

    let userId: string;
    try {
      userId = verifyToken(header.slice(7).trim()).sub;
    } catch (error) {
      next(error);
      return;
    }

    loadUser(userId)
      .then((user) => {
        if (!user) {
          next(new UnauthorizedError('Sessão inválida.'));
          return;
        }

        if (!user.isActive) {
          next(new UnauthorizedError('Este usuário está inativo. Procure o administrador de segurança.'));
          return;
        }

        request.user = { id: user.id, role: user.role, isActive: user.isActive };
        next();
      })
      .catch(next);
  };
}

/**
 * Instância usada pelas rotas. O Prisma entra por import dinâmico para que este
 * módulo possa ser importado (em testes, por exemplo) sem subir o ORM junto.
 */
export const authenticate = createAuthenticate(async (id) => {
  const { prisma } = await import('../../config/prisma.js');
  return prisma.user.findUnique({ where: { id }, select: { id: true, role: true, isActive: true } });
});
