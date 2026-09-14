import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { validate } from '../../shared/middlewares/validate.js';
import { AuthController } from './auth.controller.js';
import { AuthRepository } from './auth.repository.js';
import { loginBodySchema } from './auth.schema.js';
import { AuthService } from './auth.service.js';

const repository = new AuthRepository(prisma);
const service = new AuthService(repository);
const controller = new AuthController(service);

/** Freia tentativas de força bruta no login. */
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 'TOO_MANY_REQUESTS', message: 'Muitas tentativas de login. Aguarde alguns minutos.' },
});

export const authRoutes = Router();

authRoutes.post('/login', loginLimiter, validate({ body: loginBodySchema }), asyncHandler(controller.login));
authRoutes.get('/me', authenticate, asyncHandler(controller.me));
