import { Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';
import { AuditRepository } from '../audit/audit.repository.js';
import { ResourcesController } from './resources.controller.js';
import { ResourcesRepository } from './resources.repository.js';
import {
  createResourceBodySchema,
  idParamSchema,
  listResourcesQuerySchema,
  updateResourceBodySchema,
} from './resources.schema.js';
import { ResourcesService } from './resources.service.js';

const controller = new ResourcesController(
  new ResourcesService(new ResourcesRepository(prisma), new AuditRepository(prisma)),
);

export const resourcesRoutes = Router();

resourcesRoutes.use(authenticate);

// Leitura: todos os perfis autenticados.
resourcesRoutes.get('/', validate({ query: listResourcesQuerySchema }), asyncHandler(controller.list));
resourcesRoutes.get('/:id', validate({ params: idParamSchema }), asyncHandler(controller.findById));

// Escrita: Gerente e Administrador de Segurança.
resourcesRoutes.post(
  '/',
  authorize(Role.MANAGER, Role.SECURITY_ADMIN),
  validate({ body: createResourceBodySchema }),
  asyncHandler(controller.create),
);
resourcesRoutes.patch(
  '/:id',
  authorize(Role.MANAGER, Role.SECURITY_ADMIN),
  validate({ params: idParamSchema, body: updateResourceBodySchema }),
  asyncHandler(controller.update),
);

// Exclusão definitiva: apenas Administrador de Segurança.
resourcesRoutes.delete(
  '/:id',
  authorize(Role.SECURITY_ADMIN),
  validate({ params: idParamSchema }),
  asyncHandler(controller.delete),
);
