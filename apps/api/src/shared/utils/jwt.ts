import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

/**
 * O token guarda apenas a identidade. Cargo e situação são carregados do banco a
 * cada requisição, para que rebaixar ou desativar um usuário tenha efeito imediato
 * em vez de esperar o token expirar.
 */
export interface TokenPayload {
  sub: string;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  } catch {
    throw new UnauthorizedError('Token inválido ou expirado.');
  }
}
