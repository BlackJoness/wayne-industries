import type { NextFunction, Request, Response } from 'express';
import type { Role } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../errors/app-error.js';

/**
 * Restringe a rota a uma lista explícita de cargos.
 * A autorização vive no backend: esconder o botão no frontend não é controle de acesso.
 */
export function authorize(...allowedRoles: Role[]) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    if (!request.user) {
      throw new UnauthorizedError();
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}
