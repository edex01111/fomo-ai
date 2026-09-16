import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development','test','production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  BOT_TOKEN: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),
  TRADING_ENABLED: z.string().default('false').transform(v => v === 'true'),
  TRADING_PROVIDER: z.string().default('unconfigured'),
  BLOCKCHAIN_RPC_URL: z.string().optional(),
  ENCRYPTION_KEY: z.string().optional(),
  ADMIN_USER_IDS: z.string().default('').transform(v => v.split(',').map(x => x.trim()).filter(Boolean)),
  WEBHOOK_URL: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
  BOT_MODE: z.enum(['polling', 'webhook']).default('polling'),
  BOT_USERNAME: z.string().default('fomo_ai_bot'),
  LOG_LEVEL: z.string().default('info')
});
export const config = schema.parse(process.env);
export const isProduction = config.NODE_ENV === 'production';
export function assertSafeLiveConfig() {
  if (config.TRADING_ENABLED && (!config.BOT_TOKEN || !config.DATABASE_URL || !config.ENCRYPTION_KEY)) {
    throw new Error('Live trading requires BOT_TOKEN, DATABASE_URL, and ENCRYPTION_KEY');
  }
}
