import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { allowedOrigins } from './config/cors.js';
import { routes } from './routes.js';
import { errorHandler } from './shared/middlewares/error-handler.js';
import { notFoundHandler } from './shared/middlewares/not-found.js';
import { isOriginAllowed } from './shared/utils/cors-origin.js';

export function createApp(): Express {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.use(
    cors({
      origin(origin, callback) {
        callback(null, isOriginAllowed(origin, allowedOrigins));
      },
      // A sessão viaja no cabeçalho Authorization, não em cookie. Sem necessidade
      // de credenciais, o navegador não anexa nada automaticamente entre origens.
      credentials: false,
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
