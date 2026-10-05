import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

declare global {
  var _postgresPool: Pool | undefined;
}

export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      max: 10,
      connectionTimeoutMillis: 15000,
    });

    global._postgresPool.on('error', (err) => {
      console.error('Unexpected error on idle SQL pool client:', err);
    });
  }
  return global._postgresPool;
};

export const pool = createPool();

export const db = drizzle(pool, { schema });

/**
 * Checks PostgreSQL connectivity by executing a lightweight query.
 * Sanitizes errors to prevent exposing internal connection details or credentials.
 */
export const checkDatabaseHealth = async (customPool?: Pool): Promise<{ ok: boolean; error?: string }> => {
  try {
    const p = customPool || pool;
    await p.query('SELECT 1');
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: 'Database query failed or timed out' };
  }
};

/**
 * Gracefully drains and closes the PostgreSQL connection pool.
 */
export const closePool = async (customPool?: Pool): Promise<void> => {
  const p = customPool || global._postgresPool;
  if (p) {
    global._postgresPool = undefined;
    await p.end();
  }
};
