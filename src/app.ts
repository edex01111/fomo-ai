import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { randomUUID } from 'node:crypto';
import { config, assertSafeLiveConfig } from './config.js';
import { query } from './database/db.js';
import { createBot, telegramWebhook } from './bot.js';
import { SimulationProvider, UnconfiguredProvider } from './blockchain/providers.js';

export async function buildApp() {
  assertSafeLiveConfig();
  const app = Fastify({ logger: { level: config.LOG_LEVEL }, genReqId: () => randomUUID() });
  await app.register(helmet);
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  app.addHook('onRequest', async (request, reply) => { reply.header('x-request-id', request.id); });
  app.get('/health', async () => ({ status: 'ok', service: 'fomo-ai', mode: config.TRADING_ENABLED ? 'live-configured' : 'test-simulation', provider: config.TRADING_PROVIDER }));
  app.get('/ready', async (_req, reply) => { if (!config.DATABASE_URL) return reply.code(503).send({ status: 'not_ready', reason: 'DATABASE_URL is not configured' }); try { await query('SELECT 1'); return { status: 'ready' }; } catch { return reply.code(503).send({ status: 'not_ready', reason: 'database unavailable' }); } });
  app.get('/api/v1/me', async (req, reply) => { const telegramId = Number((req.headers['x-telegram-user-id'] as string) ?? 0); if (!telegramId) return reply.code(401).send({ error: 'Telegram authentication required' }); const result = await query('SELECT id,telegram_user_id,username,first_name,status,created_at,last_activity_at FROM users WHERE telegram_user_id=$1', [telegramId]); return result.rows[0] ?? reply.code(404).send({ error: 'User not found' }); });
  app.get('/api/v1/wallets', async () => { if (!config.DATABASE_URL) return { wallets: [], unavailable: true }; const result = await query('SELECT id,label,chain,address,is_simulated,created_at FROM wallets ORDER BY created_at DESC'); return { wallets: result.rows }; });
  app.get('/api/v1/positions', async () => { if (!config.DATABASE_URL) return { positions: [], unavailable: true }; const result = await query('SELECT token_address,token_symbol,quantity,average_entry,current_value,pnl,pnl_percent,updated_at FROM positions ORDER BY updated_at DESC'); return { positions: result.rows }; });
  app.get('/api/v1/history', async () => { if (!config.DATABASE_URL) return { transactions: [], unavailable: true }; const result = await query('SELECT id,side,token_address,token_symbol,amount,status,tx_hash,created_at FROM transactions ORDER BY created_at DESC LIMIT 100'); return { transactions: result.rows }; });
  app.get('/api/v1/tokens', async () => { const provider = config.TRADING_ENABLED ? new UnconfiguredProvider() : new SimulationProvider(); const tokens = await provider.discover(); return { tokens, available: tokens.length > 0, provider: provider.name }; });
  const bot = createBot();
  if (bot) app.post('/telegram/webhook', telegramWebhook(bot)); else app.post('/telegram/webhook', async (_req, reply) => reply.code(503).send({ error: 'BOT_TOKEN is not configured' }));
  app.setErrorHandler((error: Error & { statusCode?: number }, request, reply) => { request.log.error({ err: error, requestId: request.id }, 'request_failed'); reply.code(error.statusCode ?? 500).send({ error: error.statusCode ? error.message : 'Internal server error', requestId: request.id }); });
  return app;
}
