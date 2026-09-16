import { Bot, InlineKeyboard, webhookCallback } from 'grammy';
import { config } from './config.js';
import { query } from './database/db.js';
import { SimulationProvider, UnconfiguredProvider, type TradingProvider } from './blockchain/providers.js';

const provider: TradingProvider = config.TRADING_ENABLED ? new UnconfiguredProvider() : new SimulationProvider();
const modeLabel = config.TRADING_ENABLED ? 'LIVE CONFIGURED' : 'TEST / SIMULATION';
const keyboard = () => new InlineKeyboard().text('🔥 Discover', 'discover').text('💼 Wallet', 'wallet').row().text('📊 Positions', 'positions').text('💰 Buy', 'buy').row().text('💸 Sell', 'sell').text('🕐 History', 'history').row().text('🔔 Alerts', 'alerts').text('⚙️ Settings', 'settings').row().text('🎁 Referral', 'referral').text('❓ Help', 'help');
const backHome = () => new InlineKeyboard().text('⌂ Home', 'home');

export function createBot() {
  if (!config.BOT_TOKEN) return null;
  const bot = new Bot(config.BOT_TOKEN);
  bot.catch(err => console.error('telegram_error', err.error));
  bot.use(async (ctx, next) => { if (ctx.from) { await query('INSERT INTO users(telegram_user_id,username,first_name) VALUES($1,$2,$3) ON CONFLICT(telegram_user_id) DO UPDATE SET username=EXCLUDED.username, first_name=EXCLUDED.first_name,last_activity_at=now()', [ctx.from.id, ctx.from.username ?? null, ctx.from.first_name ?? null]).catch(() => undefined); } await next(); });
  const home = async (ctx: any) => { const text = `*Fomo AI*\n\nFast token discovery and portfolio tools.\n\nEnvironment: *${modeLabel}*\nProvider: ${provider.name}`; if (ctx.callbackQuery) await ctx.editMessageText(text, { parse_mode: 'Markdown', reply_markup: keyboard() }); else await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard() }); };
  bot.command(['start','menu'], home);
  bot.command('help', ctx => ctx.reply('Use the buttons to explore tokens, manage wallets, review positions, and configure alerts.\n\nTransactions always require an explicit confirmation. Live trading is disabled by default.'));
  bot.command('discover', async ctx => ctx.reply(await discoveryText(), { reply_markup: new InlineKeyboard().text('↻ Refresh', 'discover').row().text('⌂ Home', 'home') }));
  bot.command('wallet', ctx => ctx.reply('💼 Wallet\n\nWallet creation/import is available through the configured signing provider.\n\nNo signing provider is configured, so no keys are generated or stored.', { reply_markup: backHome() }));
  bot.command('positions', ctx => ctx.reply('📊 Positions\n\nNo live position data is available yet.', { reply_markup: backHome() }));
  bot.command('history', ctx => ctx.reply('🕐 History\n\nNo transactions recorded.', { reply_markup: backHome() }));
  bot.command('settings', ctx => ctx.reply(`⚙️ Settings\n\nMode: ${modeLabel}\nSlippage: configured per trade\nConfirmations: required`, { reply_markup: backHome() }));
  bot.command('referral', ctx => ctx.reply(`🎁 Referral\n\nYour referral link: https://t.me/${config.BOT_USERNAME}?start=ref_${ctx.from?.id ?? 'user'}\n\nRewards are not enabled by default.`, { reply_markup: backHome() }));
  bot.command(['buy','sell'], ctx => ctx.reply('Trading flow: choose a token, amount, quote, slippage, then confirm.\n\nNo token was supplied. Use Discover first.', { reply_markup: backHome() }));
  for (const action of ['home','discover','wallet','positions','buy','sell','history','alerts','settings','referral','help']) bot.callbackQuery(action, async ctx => { await ctx.answerCallbackQuery(); if (action === 'home') return home(ctx); if (action === 'discover') return ctx.editMessageText(await discoveryText(), { reply_markup: new InlineKeyboard().text('↻ Refresh','discover').row().text('⌂ Home','home') }); return ctx.editMessageText(actionText(action), { reply_markup: backHome() }); });
  return bot;
}
async function discoveryText() { const tokens = await provider.discover(); if (!tokens.length) return `🔥 *Discover*\n\nLive market data is unavailable. Configure a token data provider to populate this section.\n\nEnvironment: *${modeLabel}*`; return `🔥 *Discover*\n\n${tokens.map(t => `*${t.symbol ?? t.name ?? 'Token'}*\\n${t.address}`).join('\\n\\n')}`; }
function actionText(action: string) { const labels: Record<string,string> = { wallet:'💼 Wallet\\n\\nNo wallet provider configured.', positions:'📊 Positions\\n\\nNo live position data is available.', buy:'💰 Buy\\n\\nSelect a token from Discover to begin.', sell:'💸 Sell\\n\\nSelect a token from Positions to begin.', history:'🕐 History\\n\\nNo transactions recorded.', alerts:'🔔 Alerts\\n\\nAlert architecture is ready; no alerts configured.', settings:'⚙️ Settings\\n\\nTrading remains confirmation-protected.', referral:'🎁 Referral\\n\\nReferral tracking is ready; rewards are disabled.', help:'❓ Help\\n\\nUse Home to navigate Fomo AI.' }; return labels[action] ?? 'Unavailable'; }
export function telegramWebhook(bot: Bot) { return webhookCallback(bot, 'fastify', { secretToken: config.WEBHOOK_SECRET }); }
