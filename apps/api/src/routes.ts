import { Router } from 'express';
import { accessRoutes } from './modules/access/access.routes.js';
import { areasRoutes } from './modules/areas/areas.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes.js';
import { resourcesRoutes } from './modules/resources/resources.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';

export const routes = Router();

routes.get('/health', (_request, response) => {
  response.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

routes.use('/auth', authRoutes);
routes.use('/users', usersRoutes);
routes.use('/areas', areasRoutes);
routes.use('/access', accessRoutes);
routes.use('/resources', resourcesRoutes);
routes.use('/dashboard', dashboardRoutes);
