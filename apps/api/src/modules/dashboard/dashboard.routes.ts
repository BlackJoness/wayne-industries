import { Router } from 'express';
import { prisma } from '../../config/prisma.js';
import { asyncHandler } from '../../shared/middlewares/async-handler.js';
import { authenticate } from '../../shared/middlewares/authenticate.js';
import { AuditRepository } from '../audit/audit.repository.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardRepository } from './dashboard.repository.js';
import { DashboardService } from './dashboard.service.js';

const controller = new DashboardController(
  new DashboardService(new DashboardRepository(prisma), new AuditRepository(prisma)),
);

export const dashboardRoutes = Router();

dashboardRoutes.get('/', authenticate, asyncHandler(controller.summary));
