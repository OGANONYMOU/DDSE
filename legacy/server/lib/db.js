import { Pool } from 'pg';
import { env } from '../config/env.js';
import { logger } from './logger.js';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.isDevelopment ? 5 : 20,
  idleTimeoutMillis: 30000,
  ssl: env.isProduction ? { rejectUnauthorized: false } : false,
});

pool.on('error', (error) => {
  logger.error({ err: error }, 'Unexpected PostgreSQL client error');
});

export async function query(text, params = []) {
  return pool.query(text, params);
}
