import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db.js';
if (!pool) throw new Error('DATABASE_URL is required for migrations');
const dir = path.join(process.cwd(), 'src/database/migrations');
const files = (await fs.readdir(dir)).filter(f => f.endsWith('.sql')).sort();
await pool.query('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())');
for (const file of files) {
  const exists = await pool.query('SELECT 1 FROM schema_migrations WHERE filename=$1', [file]);
  if (!exists.rowCount) { await pool.query('BEGIN'); try { await pool.query(await fs.readFile(path.join(dir, file), 'utf8')); await pool.query('INSERT INTO schema_migrations(filename) VALUES($1)', [file]); await pool.query('COMMIT'); console.log(`Applied ${file}`); } catch (e) { await pool.query('ROLLBACK'); throw e; } }
}
await pool.end();
