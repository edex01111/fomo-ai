import { buildApp } from './app.js';
import { config } from './config.js';
import { closeDb } from './database/db.js';
import { createBot } from './bot.js';
const app = await buildApp();
try { await app.listen({ host: config.HOST, port: config.PORT }); app.log.info(`Fomo AI listening on ${config.HOST}:${config.PORT}`); } catch (error) { app.log.error(error); process.exit(1); }
if (config.BOT_MODE === 'polling') {
  const bot = createBot();
  if (bot) { await bot.start({ onStart: info => app.log.info({ username: info.username }, 'telegram_polling_started') }); }
}
const shutdown = async (signal: string) => { app.log.info({ signal }, 'shutting_down'); await app.close(); await closeDb(); process.exit(0); };
process.once('SIGINT', () => void shutdown('SIGINT')); process.once('SIGTERM', () => void shutdown('SIGTERM'));
