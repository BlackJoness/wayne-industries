import { Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';
import { AccessController } from './access.controller.js';
import { AccessRepository } from './access.repository.js';
import { attemptBodySchema, listLogsQuerySchema } from './access.schema.js';
import { AccessService } from './access.service.js';

const controller = new AccessController(new AccessService(new AccessRepository(prisma)));

export const accessRoutes = Router();

accessRoutes.use(authenticate);

accessRoutes.post('/attempt', validate({ body: attemptBodySchema }), asyncHandler(controller.attempt));
accessRoutes.get('/clearance', asyncHandler(controller.clearanceMap));
accessRoutes.get('/my-history', validate({ query: listLogsQuerySchema }), asyncHandler(controller.listOwnLogs));

// Auditoria de acessos de terceiros é restrita a Gerente e Administrador.
accessRoutes.get(
  '/logs',
  authorize(Role.MANAGER, Role.SECURITY_ADMIN),
  validate({ query: listLogsQuerySchema }),
  asyncHandler(controller.listLogs),
);
