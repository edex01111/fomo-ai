import { buildApp } from './app.js';
import { config } from './config.js';
import { closeDb } from './database/db.js';
const app = await buildApp();
try { await app.listen({ host: config.HOST, port: config.PORT }); app.log.info(`Fomo AI listening on ${config.HOST}:${config.PORT}`); } catch (error) { app.log.error(error); process.exit(1); }
const shutdown = async (signal: string) => { app.log.info({ signal }, 'shutting_down'); await app.close(); await closeDb(); process.exit(0); };
process.once('SIGINT', () => void shutdown('SIGINT')); process.once('SIGTERM', () => void shutdown('SIGTERM'));
