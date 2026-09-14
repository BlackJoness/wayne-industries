import { Role } from '@prisma/client';
import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { authorize } from '../../shared/middlewares/authorize.js';
import { validate } from '../../shared/middlewares/validate.js';
import { AuditRepository } from '../audit/audit.repository.js';
import { AreasController } from './areas.controller.js';
import { AreasRepository } from './areas.repository.js';
import {
  createAreaBodySchema,
  grantPermissionBodySchema,
  idParamSchema,
  permissionParamsSchema,
  updateAreaBodySchema,
} from './areas.schema.js';
import { AreasService } from './areas.service.js';

const controller = new AreasController(new AreasService(new AreasRepository(prisma), new AuditRepository(prisma)));

export const areasRoutes = Router();

areasRoutes.use(authenticate);

areasRoutes.get('/', asyncHandler(controller.list));
areasRoutes.get('/:id', validate({ params: idParamSchema }), asyncHandler(controller.findById));

// Toda escrita em áreas e permissões é exclusiva do Administrador de Segurança.
const adminOnly = authorize(Role.SECURITY_ADMIN);

areasRoutes.post('/', adminOnly, validate({ body: createAreaBodySchema }), asyncHandler(controller.create));
areasRoutes.patch('/:id', adminOnly, validate({ params: idParamSchema, body: updateAreaBodySchema }), asyncHandler(controller.update));
areasRoutes.delete('/:id', adminOnly, validate({ params: idParamSchema }), asyncHandler(controller.delete));
areasRoutes.post('/:id/permissions', adminOnly, validate({ params: idParamSchema, body: grantPermissionBodySchema }), asyncHandler(controller.grantPermission));
areasRoutes.delete('/:id/permissions/:userId', adminOnly, validate({ params: permissionParamsSchema }), asyncHandler(controller.revokePermission));
