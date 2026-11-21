# IthraCode — Production Environment Variables Audit

**Audit date:** 2026-11-21  
**Scope:** Code-driven inventory of every environment variable referenced in this repository.  
**Constraints:** No secret values printed; findings tied to source files.

---

## Executive summary

- **Central validation:** `src/config/env.ts` (`@t3-oss/env-nextjs`) validates most application secrets at import time. Any module importing `@/config` or `@/config/env` triggers validation unless `SKIP_ENV_VALIDATION=true`.
- **Additional env reads:** Sentry (`src/lib/sentry/sentry-config.ts`, `next.config.ts`), Turnstile (`src/features/contact/lib/turnstile-config.ts`), and Vercel-injected hosts (`src/lib/app-origin.ts`) bypass the T3 schema but are production-relevant.
- **Payments:** **Paymob** is the only live PSP in production code. **Stripe** and **PayPal** have schema/types only; no env vars or route handlers. Development uses `FakePaymentGateway` (`src/features/payments/infrastructure/di/payments.container.ts` lines 37–43).
- **Video:** Playback uses **Bunny Stream** signed HLS (`src/lib/bunny-stream.ts`).
- **AI / OpenAI / LangChain:** Dependencies exist in `package.json` but **no `process.env` references** in application code. Several `AI_*` / `OPENAI_*` / `STRIPE_*` names appear in a local `.env` only — **not used by the codebase** (see § Orphaned local-only names).
- **Background jobs:** BullMQ workers (`pnpm worker:*`) require **Redis** and a **long-running host** separate from Vercel serverless.

---

## Validation & startup behavior

| Mechanism | Location | Behavior |
|-----------|----------|----------|
| T3 `createEnv` | `src/config/env.ts` | Fails fast on missing/invalid required vars when imported |
| Skip validation | `SKIP_ENV_VALIDATION` | `skipValidation: !!process.env.SKIP_ENV_VALIDATION` (line 367) — **not for production** |
| Proxy / auth | `src/proxy.ts` line 3 | Imports `@/config/env` on every matched request |
| Prisma client | `src/lib/prisma.ts` | Uses `env.DATABASE_URL` at import |
| Redis client | `src/lib/redis.ts` | Uses `env.REDIS_URL` at import; `lazyConnect: true` |
| Prisma CLI | `prisma.config.ts` | `DATABASE_URL` for datasource |
| Prisma migrations (subdir) | `prisma/prisma.config.ts` | `DIRECT_URL` for datasource |
| `postinstall` | `package.json` | `prisma generate` — does **not** require DB connectivity |
| Build | `next build` | Compiles routes that import `env`; **DATABASE_URL, REDIS_URL, AUTH_*, NEXT_PUBLIC_APP_URL** must be valid for a clean build |

---

## Complete environment variable inventory

Legend — **Required:** Yes = startup/build failure if missing (with validation on). Conditional = required only when feature enabled. **Environment:** Prod = Vercel Production runtime; Build = `next build`; Both = runtime + build (public vars inlined at build).

### Core / Node

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `NODE_ENV` | No (default `development`) | Both | `env.ts`, cookies, SEO | Node environment | `production` | Vercel sets automatically | Server | Low |
| `SKIP_ENV_VALIDATION` | No | Build | `env.ts:367` | Bypass T3 validation | `true` | Local only | Server | **High** if set in prod |
| `CI` | No | Build | `next.config.ts:47` | Sentry plugin verbosity | `true` | GitHub Actions / Vercel | Server | Low |
| `NEXT_RUNTIME` | No | Runtime | `instrumentation.ts` | Edge vs Node Sentry bootstrap | `nodejs` | Vercel-injected | Server | Low |

### Application URLs

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `NEXT_PUBLIC_APP_URL` | **Yes** | **Both** | `env.ts`, `checkout/page.tsx`, `app-origin.ts` | Canonical public origin (checkout return URLs, metadata) | `https://ithracode.com` | Your domain / Vercel | **Public** | Medium |
| `NEXT_PUBLIC_API_URL` | No | Both | `http-client.ts`, `http-server.ts` | API base (defaults to `http://localhost:3000/api`) | `https://ithracode.com/api` | Same origin as app | **Public** | Low |
| `AUTH_URL` | **Yes** | Both | `env.ts`, `auth.ts`, `app-origin.ts` | Auth.js site origin (not `/api/auth` path) | `https://ithracode.com` | Must match deployment URL | Server | High |
| `NEXTAUTH_URL` | No | Runtime | `env.ts` (optional; mirrored from `AUTH_URL` lines 402–403) | Legacy Auth.js URL | — | Do not set; app overwrites | Server | Medium |
| `AUTH_TRUST_HOST` | No (default `true`) | Runtime | `env.ts` | Trust `Host` header (Vercel) | `true` | Vercel docs | Server | Low |
| `VERCEL_URL` | No | Runtime | `app-origin.ts:33` | Preview host fallback | `*.vercel.app` | Vercel-injected | Server | Low |
| `VERCEL_PROJECT_PRODUCTION_URL` | No | Runtime | `app-origin.ts:32` | Production host fallback | `ithracode.com` | Vercel-injected | Server | Low |
| `VERCEL` | No | Build | `next.config.ts:4` | Disables `standalone` output on Vercel | `1` | Vercel-injected | Server | Low |
| `COOKIE_DOMAIN` | No | Runtime | `env.ts` only — **no consumers in `src/`** | Declared for production cookies | `.ithracode.com` | DNS / app config | Server | Low |

### Database

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `DATABASE_URL` | **Yes** | Prod (+ Build if env imported) | `env.ts`, `prisma.ts`, `prisma.config.ts`, seeds | PostgreSQL (pooler URL on serverless) | `postgresql://...@ep-xxx-pooler.../neondb?sslmode=require` | Neon / Vercel integration | Server | **High** |
| `DIRECT_URL` | Conditional | Migrations / `prisma db *` | `env.ts`, `prisma/prisma.config.ts` | Non-pooled URL for migrations | `postgresql://...@ep-xxx.../neondb?sslmode=require` | Neon direct endpoint | Server | **High** |

### Authentication

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `AUTH_SECRET` | **Yes** | Both | `env.ts`, `auth.ts`, `auth.config.ts` | Session/JWT encryption | 64-char hex (`openssl rand -hex 32`) | Generate locally | Server | **High** |
| `AUTH_GOOGLE_ID` | Conditional | Both | `auth.ts`, `auth-providers.ts` | Google OAuth client ID | `xxxx.apps.googleusercontent.com` | Google Cloud Console | Server | Medium |
| `AUTH_GOOGLE_SECRET` | Conditional | Both | Same | Google OAuth secret | `GOCSPX-...` | Google Cloud Console | Server | **High** |
| `AUTH_GITHUB_ID` | Conditional | Both | Same | GitHub OAuth App ID | `Ov23li...` | GitHub Developer Settings | Server | Medium |
| `AUTH_GITHUB_SECRET` | Conditional | Both | Same | GitHub OAuth secret | `ghp_...` / client secret | GitHub | Server | **High** |
| `AUTH_GITHUB_ISSUER` | No | Runtime | `env.ts:378–382` | Sanitized if placeholder `authjs.dev` | — | Avoid setting | Server | Medium |

**OAuth pairing rule:** `env.ts` logs errors if only one of Google/GitHub ID+secret is set (lines 390–399). Providers register only when **both** are set (`auth.ts` lines 84–104).

**Callbacks (configure in provider dashboards):**

- Google: `https://YOUR_DOMAIN/api/auth/callback/google`
- GitHub: `https://YOUR_DOMAIN/api/auth/callback/github`

### Redis

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `REDIS_URL` | **Yes** | Prod | `env.ts`, `redis.ts`, BullMQ queues, rate limits, checkout locks | Cache, locks, job queues | `rediss://default:PASS@REGION.upstash.io:6379` | Upstash / Vercel integration | Server | **High** |

### Payments — Paymob

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `PAYMOB_API_URL` | No (default `https://accept.paymob.com`) | Prod | `paymob.config.ts`, gateway | API base | `https://accept.paymob.com` | Paymob dashboard | Server | Low |
| `PAYMOB_SECRET_KEY` | Conditional* | Prod | `readPaymobConfig()` | Intention API auth | `egy_sk_live_...` | Paymob API keys | Server | **High** |
| `PAYMOB_PUBLIC_KEY` | Conditional* | Prod | Same | Unified checkout / Pixel | `egy_pk_live_...` | Paymob | Server | Medium |
| `PAYMOB_HMAC_SECRET` | Conditional* | Prod | Same, webhook HMAC | Webhook signature | random string | Paymob webhooks | Server | **High** |
| `PAYMOB_API_KEY` | Conditional** | Prod | `paymob.config.ts` | Legacy auth for transaction inquiry / reconcile | API key | Paymob | Server | **High** |
| `PAYMOB_INTEGRATION_IDS` | Conditional* | Prod | `paymob.gateway.ts:102` | Comma-separated integration IDs | `123456,789012` | Paymob integrations | Server | Medium |
| `PAYMOB_RETRY_MAX` | No (default 3) | Prod | `paymob.gateway.ts` | HTTP retry count | `3` | — | Server | Low |
| `PAYMOB_RETRY_INITIAL_MS` | No (default 1000) | Prod | Same | Retry backoff | `1000` | — | Server | Low |
| `PAYMOB_TIMEOUT_MS` | No (default 15000) | Prod | Same | HTTP timeout | `15000` | — | Server | Low |
| `PAYMOB_CIRCUIT_BREAKER_THRESHOLD` | No (default 5) | Prod | `paymob.gateway.ts:86` | Circuit breaker | `5` | — | Server | Low |
| `PAYMOB_CIRCUIT_BREAKER_RESET_MS` | No (default 60000) | Prod | Same | Circuit reset | `60000` | — | Server | Low |
| `PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS` | No (default 300) | Prod | `api/payment/webhooks/paymob/route.ts:98` | Replay protection | `300` | — | Server | Low |

\* **Conditional for real payments in production:** `readPaymobConfig()` returns `null` unless `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, and `PAYMOB_HMAC_SECRET` are all set (`paymob.config.ts:18–24`). In `NODE_ENV=production`, no `FakePaymentGateway` — checkout/webhook returns unavailable without Paymob.

\** **Conditional for reconciliation:** Inquiry path uses `PAYMOB_API_KEY` when configured; omit only if you do not run reconcile jobs.

**Webhook URL (Paymob dashboard):** `https://YOUR_DOMAIN/api/payment/webhooks/paymob`

### Payments — reconciliation & admin

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `PAYMENT_RECONCILE_THRESHOLD_MINUTES` | No (30) | Prod / workers | `payments.container.ts`, `create-checkout.use-case.ts` | Stale payment threshold | `30` | — | Server | Low |
| `PAYMENT_RECONCILE_BATCH_SIZE` | No (50) | Workers | `payments.container.ts` | Batch size | `50` | — | Server | Low |
| `PAYMENT_RECONCILE_INTERVAL_MS` | No (900000) | Workers | `reconcile-payments.worker.ts` | Scheduler interval | `900000` | — | Server | Low |
| `PAYMENT_RECONCILE_MAX_ATTEMPTS` | No (8) | Prod | `payments.container.ts` | Max retry attempts | `8` | — | Server | Low |
| `PAYMENT_RECONCILE_MAX_WINDOW_HOURS` | No (24) | Prod | Same | Max payment age | `24` | — | Server | Low |
| `PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES` | No (30) | Prod | Same | Backoff base | `30` | — | Server | Low |
| `PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES` | No (720) | Prod | Same | Backoff cap | `720` | — | Server | Low |
| `PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT` | No (3) | Prod | Same | Abandon after N not_found | `3` | — | Server | Low |
| `PAYMENT_RECONCILE_USE_QUEUE` | No (`false`) | Prod / workers | `payments.container.ts` | BullMQ vs inline reconcile | `true` / `false` | — | Server | Low |
| `PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE` | No (60) | Prod | `payments.container.ts:110` | Provider rate limit | `60` | — | Server | Low |
| `PAYMENT_RECONCILE_ADMIN_SECRET` | Conditional*** | Prod | `api/admin/payment/reconcile/route.ts:8` | Bearer auth for admin reconcile API | random 32+ bytes | Generate | Server | **High** |
| `PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS` | No (30000) | Workers | `reconcile-payments.worker.ts:7` | SIGTERM grace | `30000` | — | Server | Low |
| `PAYMENT_ANALYTICS_ENABLED` | No (`false`) | Prod | `logging-analytics.tracker.ts:11` | Log analytics on order complete | `true` / `false` | — | Server | Low |

\*** Required only if you use `GET/POST /api/admin/payment/reconcile`.

### Email (Resend)

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `RESEND_API_KEY` | Conditional**** | Prod | `resend-email.sender.ts`, `resend-contact-notifier.ts` | Send email | `re_...` | resend.com | Server | **High** |
| `PAYMENT_EMAIL_FROM` | Conditional**** | Prod | Same | From address (verified domain) | `noreply@yourdomain.com` | Resend domain | Server | Low |
| `CONTACT_NOTIFICATION_EMAIL` | Conditional**** | Prod | `resend-contact-notifier.ts:18` | Admin inbox for contact form | `admin@yourdomain.com` | Your inbox | Server | Low |

\**** Email is optional at startup; without `RESEND_API_KEY` + `PAYMENT_EMAIL_FROM`, purchase confirmation and contact notifications are no-ops. Worker `order-completed` still queues jobs but sending fails without Resend.

### Cloudflare Turnstile

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Conditional***** | **Both** | `turnstile-config.ts` | Widget site key | `0x4AAAA...` | Cloudflare Turnstile | **Public** | Low |
| `TURNSTILE_SECRET_KEY` | Conditional***** | Prod | `turnstile-config.ts:46` | Server verification | `0x4AAAA...` | Cloudflare | Server | **High** |
| `TURNSTILE_USE_PRODUCTION_KEYS` | No (`false`) | Prod | `turnstile-config.ts:15` | Force prod keys in dev | `true` on Vercel prod | — | Server | Low |

\***** If site key is set, secret is required for server verification in production (`isTurnstileVerificationRequired()`). `.env.vercel.example` treats Turnstile as required for production contact form.

### Video — Bunny Stream (optional feature)

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `BUNNY_STREAM_CDN_HOSTNAME` | Conditional****** | Prod | `bunny-stream.ts` | CDN host for HLS | `vz-xxxxx.b-cdn.net` | Bunny Stream | Server | Low |
| `BUNNY_STREAM_TOKEN_AUTH_KEY` | Conditional****** | Prod | Same | Token auth key | random key | Bunny security settings | Server | **High** |

\****** Both required for signed lecture HLS URLs; otherwise `signBunnyHlsUrl` returns `null` (non-fatal).

### Sentry (not in T3 schema)

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | No (strongly recommended) | **Build + runtime** | `sentry-config.ts`, `monitoring/route.ts` | Client/server DSN | `https://...@...ingest.../...` | Sentry project | **Public** | Low |
| `SENTRY_ENVIRONMENT` | Recommended | **Build** (copied to client) | `sentry-config.ts`, `next.config.ts:11` | `staging` / `production` | `production` | You | Server → Public label | Low |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | No | Build | Injected from `SENTRY_ENVIRONMENT` | Browser environment tag | — | Automatic | **Public** | Low |
| `SENTRY_AUTH_TOKEN` | Optional | **Build only** | `@sentry/nextjs` webpack plugin | Source map upload | `sntrys_...` | Sentry auth tokens | Build secret | **High** |
| `SENTRY_ORG` | No (default `ithracode`) | Build | `next.config.ts:34` | Sentry org slug | `ithracode` | Sentry | Build | Low |
| `SENTRY_PROJECT` | No (default `ithracode-web`) | Build | `next.config.ts:36` | Project slug | `ithracode-web` | Sentry | Build | Low |
| `SENTRY_TEST_ENDPOINT_ENABLED` | No (`false`) | Prod | `sentry-test-gate.ts:11` | Debug Sentry test routes | `false` | — | Server | Medium if `true` in prod |
| `SENTRY_DEBUG` | No | Runtime | `sentry-config.ts:111` | SDK verbose logs | `false` | — | Server | Low |

### Vercel / Node tuning

| Variable | Required | Environment | Used by | Purpose | Example format | Where to obtain | Exposure | Risk |
|----------|----------|-------------|---------|---------|----------------|-----------------|----------|------|
| `NODE_OPTIONS` | No | Runtime | `vercel.json` | Suppress Node DEP0169 warning on Vercel | `--disable-warning=DEP0169` | `vercel.json` | Server | Low |

### Scripts / local only (not Vercel Production)

| Variable | Required | Environment | Used by | Purpose |
|----------|----------|-------------|---------|---------|
| `PAYMENT_PROVIDER` | No | Local scripts | `scripts/payment/e2e.ts:53` | E2E provider selection |
| `WEBHOOK_SMOKE_BASE_URL` | No | Local scripts | `scripts/payment/paymob-webhook-smoke.ts:39` | Webhook smoke base URL |

---

## Orphaned names (local `.env` only — not in source)

These names were found in a local `.env` **key list only** (values not inspected in this report) and have **zero references** in `src/`, `scripts/` (except N/A), or `env.ts`:

`AI_PLATFORM_DAILY_COST_CAP`, `AI_PLATFORM_EMBEDDING_MODEL`, `AI_PLATFORM_ENABLED`, `AI_PLATFORM_LLM_MODEL`, `AI_PLATFORM_RATE_LIMIT_PER_DAY`, `AI_PLATFORM_RATE_LIMIT_PER_HOUR`, `AI_PLATFORM_RATE_LIMIT_PER_MINUTE`, `AI_TUTOR_EMBEDDING_MODEL`, `AI_TUTOR_ENABLED`, `AI_TUTOR_LLM_MODEL`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `STRIPE_API_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Do not configure these on Vercel** unless new code is added. If these values were ever committed or shared, **rotate them** (see § Security).

---

## Variables in example files vs code

### Missing from `.env.example` (used in code)

- Entire `PAYMENT_RECONCILE_*` group (defaults apply; tune for production ops)
- `PAYMENT_RECONCILE_ADMIN_SECRET`
- `PAYMENT_ANALYTICS_ENABLED`
- `PAYMOB_CIRCUIT_BREAKER_*`, `PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS`
- `NEXT_PUBLIC_API_URL`
- `SKIP_ENV_VALIDATION`
- `AUTH_TRUST_HOST` is documented; OK

### Missing from `.env.vercel.example` (used in code)

- All Sentry variables (present in `.env.example` only)
- `BUNNY_STREAM_*`
- `PAYMENT_RECONCILE_*` (optional tuning)
- `PAYMENT_ANALYTICS_ENABLED`
- `NEXT_PUBLIC_API_URL`

### Declared in `env.ts` but unused in application logic

- `COOKIE_DOMAIN` — no references outside `env.ts`

---

## Vercel production configuration notes

### Required in Vercel Production (minimum viable)

1. `DATABASE_URL`, `REDIS_URL`
2. `AUTH_SECRET`, `AUTH_URL`, `NEXT_PUBLIC_APP_URL`
3. At least one OAuth pair **or** accept email/credentials-only auth if implemented
4. Paymob quartet for payments: `PAYMOB_SECRET_KEY`, `PAYMOB_PUBLIC_KEY`, `PAYMOB_HMAC_SECRET`, `PAYMOB_INTEGRATION_IDS`
5. `SENTRY_ENVIRONMENT=production`, `NEXT_PUBLIC_SENTRY_DSN` at **build** time

### Preview deployments

| Variable | Production | Preview |
|----------|------------|---------|
| `NEXT_PUBLIC_APP_URL` | Custom domain | `https://<branch>-<project>.vercel.app` |
| `AUTH_URL` | Production domain | Match preview URL (or rely on `AUTH_URL_AUTO_RECOVERY` in `auth.ts:57–66` when request origin is non-local) |
| `SENTRY_ENVIRONMENT` | `production` | `staging` |
| `DATABASE_URL` | Prod Neon branch | Separate preview DB recommended |
| Paymob keys | Live keys | **Test** keys only |

### Build-time vs runtime

| Variable | Build-time | Runtime |
|----------|------------|---------|
| `NEXT_PUBLIC_*` | Inlined into client bundle | Also on server |
| `SENTRY_ENVIRONMENT` | Required for client tag via `next.config.ts` | Server reads too |
| `SENTRY_AUTH_TOKEN` | Source maps upload only | Not needed at runtime |
| `DATABASE_URL` | Needed if build imports `@/config` | Always |
| `DIRECT_URL` | Not required for Vercel `next build` | Migrations CLI / local |

### Must NOT be `NEXT_PUBLIC_*`

All payment secrets, `AUTH_SECRET`, OAuth secrets, `REDIS_URL`, `DATABASE_URL`, `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `PAYMOB_*` secrets, `BUNNY_STREAM_TOKEN_AUTH_KEY`, `PAYMENT_RECONCILE_ADMIN_SECRET`, `SENTRY_AUTH_TOKEN`.

### Safe as `NEXT_PUBLIC_*`

`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SENTRY_DSN`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_SENTRY_ENVIRONMENT` (derived).

### Vercel limitations

- **No BullMQ consumers** on default Vercel Node functions — run `worker:order-completed`, `worker:reconcile`, `worker:reconcile-consumer` on Railway/Fly/VM with same `REDIS_URL` and `DATABASE_URL`.
- **No `vercel.json` cron** defined — reconciliation is worker- or admin-API-driven.
- **`vercel.json`** only sets `NODE_OPTIONS` (DEP0169); do not override without appending `--disable-warning=DEP0169`.
- **Prisma:** Use Neon **pooler** for `DATABASE_URL`; `max: 1` pool in `prisma.ts` for serverless.
- **Redis:** Use TLS (`rediss://`) for Upstash in production.

---

## Security audit

| Finding | Severity | Detail |
|---------|----------|--------|
| Paymob webhook HMAC | OK | `verifyPaymobTransactionHmac` + replay window (`paymob/route.ts`) |
| No Stripe webhook route | OK | No `STRIPE_WEBHOOK_SECRET` in code |
| `NEXT_PUBLIC_SENTRY_DSN` | OK | DSN is public by design; tunnel at `/monitoring` |
| Turnstile test keys in dev | OK | `turnstile-config.ts` swaps test keys on localhost |
| `SKIP_ENV_VALIDATION` | Risk | Disables all T3 checks — never in production |
| `AUTH_URL` localhost in prod | Mitigated | Auto-recovery from request origin (`auth.ts`);仍 prefer explicit `AUTH_URL` |
| `http-client` localhost fallback | Low | `NEXT_PUBLIC_API_URL` unset → `http://localhost:3000/api` — set in prod |
| Orphan secrets in local `.env` | Medium | Stripe/AI keys not used; rotate if leaked; do not copy to Vercel |
| `SENTRY_TEST_ENDPOINT_ENABLED` | Medium | Must stay `false` in production (`sentry-test-gate.ts`) |
| `swagger.ts` demo password | Low | `SecurePass1!` is OpenAPI example only — not an env var |

**Rotation recommendations (names only):** If local `.env` ever leaked: `AUTH_SECRET`, all `PAYMOB_*` secrets, `STRIPE_*` (if ever used elsewhere), `OPENAI_API_KEY`, OAuth client secrets, `RESEND_API_KEY`, `REDIS_URL` password, database passwords in `DATABASE_URL` / `DIRECT_URL`.

---

## External services checklist (summary)

See `PRODUCTION_DEPENDENCIES.md` for full detail.

| Service | Active in code | Required for initial prod deploy |
|---------|----------------|----------------------------------|
| PostgreSQL (Neon) | Yes | **Yes** |
| Redis (Upstash) | Yes | **Yes** |
| Auth.js / OAuth | Yes | **Yes** (`AUTH_SECRET` + URL); OAuth conditional |
| Paymob | Yes | **Yes** for paid checkout in production |
| PayPal / Stripe | Types only | **No** |
| Resend | Yes | No (emails disabled without) |
| Bunny Stream | Yes | No (video URLs null without) |
| Sentry | Yes | No (errors only logged) |
| Turnstile | Yes | Recommended for contact form |
| BullMQ workers | Yes | **Yes** for post-order email/invoice jobs |
| Google Calendar | Prisma model only | **No** |
| AI providers | Dependencies only | **No** |

---

## Code references (primary)

- Env schema: `src/config/env.ts`
- Auth: `src/lib/auth.ts`, `src/lib/auth.config.ts`, `src/proxy.ts`
- Paymob: `src/features/payments/infrastructure/gateways/paymob/*`, `src/app/api/payment/webhooks/paymob/route.ts`
- Payments DI: `src/features/payments/infrastructure/di/payments.container.ts`
- Bunny: `src/lib/bunny-stream.ts`
- Sentry: `next.config.ts`, `src/lib/sentry/sentry-config.ts`, `src/app/monitoring/route.ts`
- Turnstile: `src/features/contact/lib/turnstile-config.ts`
- Workers: `src/server/workers/*.ts`, `package.json` scripts
- Vercel: `vercel.json`, `next.config.ts` (`isVercel`)

---

## Summary statistics

| Metric | Count |
|--------|------:|
| Total unique names in application/scripts/config | **62** |
| Orphan names in local `.env` only | **16** |
| **Mandatory** (T3 required for startup/build) | **6** (`DATABASE_URL`, `AUTH_URL`, `AUTH_SECRET`, `REDIS_URL`, `NEXT_PUBLIC_APP_URL`, plus implicit `NODE_ENV` for prod behavior) |
| **Optional** (feature off = OK) | **28** |
| **Conditional** | **26** (OAuth pairs, Paymob, email, Turnstile, Bunny, reconcile admin, Sentry maps, etc.) |

See chat **Final Summary** for prioritized production checklist.