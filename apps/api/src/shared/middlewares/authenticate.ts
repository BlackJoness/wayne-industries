import type { NextFunction, Request, Response } from 'express';
import { UnauthorizedError } from '../errors/app-error.js';
import { verifyToken } from '../utils/jwt.js';

/** Valida o Bearer token e anexa o usuário autenticado à requisição. */
export function authenticate(request: Request, _response: Response, next: NextFunction): void {
  const header = request.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticação não informado.');
  }

  const token = header.slice(7).trim();
  const payload = verifyToken(token);

  request.user = { id: payload.sub, role: payload.role };
  next();
}
