import crypto from 'node:crypto';
import pino from 'pino';
import pinoHttp from 'pino-http';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.isDevelopment ? 'debug' : 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.otpCode',
      'response.refreshToken',
    ],
    censor: '[REDACTED]',
  },
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: true,
  genReqId: (req) => req.headers['x-correlation-id']?.toString() ?? crypto.randomUUID(),
});
