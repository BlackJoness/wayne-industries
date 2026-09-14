import { Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';
import { AuditRepository } from '../audit/audit.repository.js';
import { UsersController } from './users.controller.js';
import { UsersRepository } from './users.repository.js';
import {
  createUserBodySchema,
  idParamSchema,
  listUsersQuerySchema,
  updateUserBodySchema,
} from './users.schema.js';
import { UsersService } from './users.service.js';

const controller = new UsersController(new UsersService(new UsersRepository(prisma), new AuditRepository(prisma)));

export const usersRoutes = Router();

// Gestão de usuários é exclusiva do Administrador de Segurança.
usersRoutes.use(authenticate, authorize(Role.SECURITY_ADMIN));

usersRoutes.get('/', validate({ query: listUsersQuerySchema }), asyncHandler(controller.list));
usersRoutes.get('/:id', validate({ params: idParamSchema }), asyncHandler(controller.findById));
usersRoutes.post('/', validate({ body: createUserBodySchema }), asyncHandler(controller.create));
usersRoutes.patch('/:id', validate({ params: idParamSchema, body: updateUserBodySchema }), asyncHandler(controller.update));
usersRoutes.delete('/:id', validate({ params: idParamSchema }), asyncHandler(controller.deactivate));
