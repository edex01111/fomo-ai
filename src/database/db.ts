import pg from 'pg';
import { config } from '../config.js';
const { Pool } = pg;
export const pool = config.DATABASE_URL ? new Pool({ connectionString: config.DATABASE_URL, max: 10, ssl: config.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined }) : null;
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(text: string, values: unknown[] = []): Promise<pg.QueryResult<T>> {
  if (!pool) throw new Error('DATABASE_URL is not configured');
  return pool.query<T>(text, values);
}
export async function closeDb() { await pool?.end(); }
