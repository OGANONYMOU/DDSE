import crypto from 'node:crypto';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { httpLogger } from './lib/logger.js';
import { authRouter } from './routes/auth-routes.js';
import { catalogRouter } from './routes/catalog-routes.js';
import { dashboardRouter } from './routes/dashboard-routes.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(httpLogger);
  app.use((req, _res, next) => {
    req.id = req.id ?? crypto.randomUUID();
    next();
  });
  app.use(
    cors({
      origin: env.APP_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-Id'],
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: env.isProduction
        ? {
            useDefaults: true,
            directives: {
              'img-src': ["'self'", 'data:'],
              'script-src': ["'self'"],
              'style-src': ["'self'", "'unsafe-inline'"],
              'connect-src': ["'self'", env.APP_ORIGIN],
            },
          }
        : false,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 150,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
    });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/catalog', catalogRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
