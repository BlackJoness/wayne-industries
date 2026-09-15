import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: Role; isActive: boolean };
    }
  }
}

export {};
