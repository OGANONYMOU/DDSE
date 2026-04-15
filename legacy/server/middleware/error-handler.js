import { logger } from '../lib/logger.js';

export function notFoundHandler(_req, _res, next) {
  const error = new Error('Endpoint not found.');
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, req, res, _next) {
  const statusCode = error.statusCode ?? 500;

  logger.error(
    {
      err: error,
      statusCode,
      correlationId: req.id,
      route: req.originalUrl,
      method: req.method,
      actor: req.auth?.sub ?? null,
    },
    'Unhandled application error',
  );

  res.status(statusCode).json({
    error: statusCode >= 500 ? 'An internal error occurred.' : error.message,
    correlationId: req.id,
  });
}
