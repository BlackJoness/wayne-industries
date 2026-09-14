import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

export interface TokenPayload {
  sub: string;
  role: Role;
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
