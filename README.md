# Fomo AI

Fomo AI is an original, provider-agnostic Telegram bot for crypto token discovery and portfolio workflows. It is inspired by the general interaction patterns of modern Telegram trading terminals, but contains independent branding, UI copy, architecture, and implementation.

## Current status

This repository contains a production-oriented foundation with Telegram commands and inline navigation, a webhook endpoint, PostgreSQL migrations, health/readiness endpoints, safe simulation mode, a trading-provider abstraction, rate limiting, security headers, structured request IDs, and API read models. **Live market data, wallet signing, and real transaction providers are intentionally unconfigured until credentials and a reviewed provider adapter are supplied.**

`TRADING_ENABLED=false` is the safe default. In this mode the bot never broadcasts a real transaction and explicitly labels the environment as TEST / SIMULATION.

## Architecture

- `src/bot.ts`: Telegram commands, inline keyboards, callback navigation, webhook adapter.
- `src/app.ts`: Fastify HTTP API, health checks, webhook route, rate limiting, security headers.
- `src/blockchain/providers.ts`: `TradingProvider` interface plus simulation/unconfigured providers.
- `src/database/migrations`: PostgreSQL schema for users, wallets, transactions, positions, watchlists, settings, referrals, notifications, and audit logs.
- `src/config.ts`: validated environment configuration.

## Local development

Requirements: Node.js 22+ and PostgreSQL 14+.

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

The service listens on `http://localhost:3000` by default. Check `/health`, `/ready`, and `/api/v1/tokens`.

## Environment variables

See `.env.example`. The important values are:

| Variable | Purpose |
|---|---|
| `BOT_TOKEN` | Telegram bot token; leave blank to run the API without Telegram. |
| `DATABASE_URL` | PostgreSQL connection string. |
| `TRADING_ENABLED` | Must remain `false` until a reviewed live provider and signer are configured. |
| `TRADING_PROVIDER` | Provider name shown by health checks. |
| `BLOCKCHAIN_RPC_URL` | Chain RPC endpoint for a future provider adapter. |
| `ENCRYPTION_KEY` | Environment-managed key for encrypted wallet material; never commit it. |
| `ADMIN_USER_IDS` | Comma-separated Telegram administrator IDs. |
| `WEBHOOK_URL` | Public HTTPS base URL used for Telegram webhook registration. |
| `WEBHOOK_SECRET` | Secret token for Telegram webhook verification. |
| `BOT_MODE` | `polling` for local testing; `webhook` for production deployment. |

## Telegram setup

1. Create a bot with BotFather and place the token in `BOT_TOKEN`.
2. Set `BOT_USERNAME` to the bot username without `@`.
3. For local testing, leave `BOT_MODE=polling`. The process will receive updates directly from Telegram, so no public URL is required. Only run one polling instance for a bot token.
4. For production, set `BOT_MODE=webhook`, expose the service over HTTPS, and configure Telegram to call `POST /telegram/webhook` with the secret token configured in `WEBHOOK_SECRET`.
5. Use `/start` or `/menu` to open the dashboard.

Implemented commands: `/start`, `/help`, `/menu`, `/wallet`, `/discover`, `/buy`, `/sell`, `/positions`, `/history`, `/settings`, and `/referral`.

## Database

Run `npm run db:migrate`. Migrations are transactional and tracked in `schema_migrations`. No private keys or seed phrases are stored by the current implementation.

## Test mode and provider configuration

The simulation provider returns deterministic, clearly labelled simulation results and empty discovery data rather than fabricated market values. A live adapter must implement `TradingProvider`, perform provider-specific validation, use a dedicated signer, persist transaction lifecycle states, and never blindly retry a possibly broadcast transaction.

Do not enable live trading merely by changing a UI setting. Require reviewed provider configuration, encryption key management, signer controls, monitoring, limits, and an explicit operational change.

## API

- `GET /health` — liveness and mode/provider status.
- `GET /ready` — database readiness.
- `GET /api/v1/me` — authenticated by the current Telegram identity header (`x-telegram-user-id`) for internal use.
- `GET /api/v1/wallets` — wallet read model.
- `GET /api/v1/positions` — positions read model.
- `GET /api/v1/history` — recent transaction history.
- `GET /api/v1/tokens` — provider-backed token discovery.
- `POST /telegram/webhook` — Telegram update endpoint.

## Deployment

```bash
docker build -t fomo-ai .
docker run --env-file .env -p 3000:3000 fomo-ai
```

Provide a managed PostgreSQL instance, set the environment variables, run migrations as a release step, expose the service through HTTPS, and configure Telegram's webhook. Verify `/health` and `/ready` before accepting traffic.

## Security

Never commit `.env`, tokens, RPC credentials, encryption keys, private keys, or seed phrases. Secrets must stay in the deployment secret manager. User-facing errors are sanitized; request IDs are returned for support diagnostics. Sensitive wallet operations require a future dedicated signer and audit trail. Admin authorization should be enforced by the configured administrator IDs before adding operational controls.

## Troubleshooting

- `503 /ready`: `DATABASE_URL` is absent or PostgreSQL is unreachable.
- Telegram webhook returns `503`: `BOT_TOKEN` is not configured.
- Discovery is empty: no market-data provider is configured; this is intentional and avoids fabricated values.
- Live configuration fails at startup: live mode requires `BOT_TOKEN`, `DATABASE_URL`, and `ENCRYPTION_KEY`.
