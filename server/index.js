import { mkdirSync } from 'node:fs';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';

logger.warn('Legacy Express backend invoked. Convex is the sole live operational backend for DDSE.');

mkdirSync(env.uploadDirAbsolutePath, { recursive: true });

const app = createApp();

app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      origin: env.APP_ORIGIN,
      uploadDir: env.uploadDirAbsolutePath,
    },
    'DDSE backend server listening',
  );
});
