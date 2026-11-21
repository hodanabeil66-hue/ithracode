# Vercel Environment Variables Setup

Copy into **Vercel → Project → Settings → Environment Variables**.

Use **Production**, **Preview**, and **Development** scopes as noted. Never paste real credentials into Git.

---

## 1. Required for deployment (build + runtime)

| Variable | Production | Preview | Example (placeholder) |
|----------|:----------:|:-------:|------------------------|
| `DATABASE_URL` | ✓ | ✓ | `postgresql://USER:PASS@ep-XXXX-pooler.REGION.aws.neon.tech/neondb?sslmode=require` |
| `REDIS_URL` | ✓ | ✓ | `rediss://default:TOKEN@REGION.upstash.io:6379` |
| `AUTH_SECRET` | ✓ | ✓ | `a1b2c3...` (64 hex chars: `openssl rand -hex 32`) |
| `AUTH_URL` | ✓ | ✓ | `https://YOUR_DOMAIN` (origin only, no trailing path) |
| `AUTH_TRUST_HOST` | ✓ | ✓ | `true` |
| `NEXT_PUBLIC_APP_URL` | ✓ | ✓ | `https://YOUR_DOMAIN` (must match `AUTH_URL` origin) |

**Do not set:** `NEXTAUTH_URL` (app mirrors `AUTH_URL`), `NEXTAUTH_SECRET` (use `AUTH_SECRET` only).

**Build tip:** `NEXT_PUBLIC_APP_URL` and `AUTH_URL` must be set for **Preview** builds if you test checkout or OAuth on preview URLs.

---

## 2. Required for authentication (at least one sign-in method)

### Always

| Variable | Production | Preview | Example |
|----------|:----------:|:-------:|---------|
| `AUTH_SECRET` | ✓ | ✓ | (see §1) |
| `AUTH_URL` | ✓ | ✓ | (see §1) |

### Google OAuth (optional but typical)

| Variable | Production | Preview | Example |
|----------|:----------:|:-------:|---------|
| `AUTH_GOOGLE_ID` | ✓ | ✓ | `123456789.apps.googleusercontent.com` |
| `AUTH_GOOGLE_SECRET` | ✓ | ✓ | `GOCSPX-xxxxxxxx` |

**Google redirect URI:** `https://YOUR_DOMAIN/api/auth/callback/google`

### GitHub OAuth (optional)

| Variable | Production | Preview | Example |
|----------|:----------:|:-------:|---------|
| `AUTH_GITHUB_ID` | ✓ | ✓ | `Ov23lixxxxx` |
| `AUTH_GITHUB_SECRET` | ✓ | ✓ | `ghp_xxxxxxxx` or client secret |

**GitHub callback URL:** `https://YOUR_DOMAIN/api/auth/callback/github`

Set **both** ID and secret or **neither** for each provider.

---

## 3. Required for database

| Variable | Production | Preview | When needed |
|----------|:----------:|:-------:|-------------|
| `DATABASE_URL` | ✓ | ✓ | Runtime (pooler) |
| `DIRECT_URL` | Optional on Vercel | Optional | **Local/CI migrations only** — Neon direct host, not pooler |

Vercel **does not** need `DIRECT_URL` for `next build` if you run migrations outside Vercel.

---

## 4. Required for payments (production checkout)

| Variable | Production | Preview | Example |
|----------|:----------:|:-------:|---------|
| `PAYMOB_SECRET_KEY` | ✓ live | ✓ test | `egy_sk_live_...` / `egy_sk_test_...` |
| `PAYMOB_PUBLIC_KEY` | ✓ | ✓ | `egy_pk_live_...` |
| `PAYMOB_HMAC_SECRET` | ✓ | ✓ | `REPLACE_HMAC_SECRET` |
| `PAYMOB_INTEGRATION_IDS` | ✓ | ✓ | `123456` (comma-separated if multiple) |
| `PAYMOB_API_URL` | ✓ | ✓ | `https://accept.paymob.com` |
| `PAYMOB_API_KEY` | Recommended | Recommended | `REPLACE_LEGACY_API_KEY` (reconciliation / inquiry) |

**Paymob webhook URL:** `https://YOUR_DOMAIN/api/payment/webhooks/paymob`

Without the first three secrets + integration IDs, Paymob is treated as not configured (`readPaymobConfig()` → `null`); in **production** there is no fake payment gateway.

### Payment ops (optional on Vercel)

| Variable | Scope | Example |
|----------|-------|---------|
| `PAYMENT_RECONCILE_ADMIN_SECRET` | Production secret | `REPLACE_RANDOM_BEARER_TOKEN` |
| `PAYMENT_RECONCILE_*` tuning | Optional | Defaults in `env.ts` |

Admin API: `Authorization: Bearer <PAYMENT_RECONCILE_ADMIN_SECRET>` → `/api/admin/payment/reconcile`

---

## 5. Required for emails

| Variable | Production | Preview | Example |
|----------|:----------:|:-------:|---------|
| `RESEND_API_KEY` | ✓ | optional | `re_xxxxxxxx` |
| `PAYMENT_EMAIL_FROM` | ✓ | optional | `noreply@yourdomain.com` (verified in Resend) |
| `CONTACT_NOTIFICATION_EMAIL` | ✓ | optional | `admin@yourdomain.com` |

Emails fail gracefully if missing. **Post-order email** also requires the **order-completed BullMQ worker** (not Vercel).

---

## 6. Required for AI

**None.** No AI environment variables are referenced in the codebase. Do not add `OPENAI_*` or `AI_*` to Vercel unless you add matching code.

---

## 7. Optional integrations

### Bunny Stream (signed lecture video URLs)

| Variable | Production | Example |
|----------|:----------:|---------|
| `BUNNY_STREAM_CDN_HOSTNAME` | ✓ | `vz-xxxxx.b-cdn.net` |
| `BUNNY_STREAM_TOKEN_AUTH_KEY` | ✓ | `REPLACE_BUNNY_TOKEN_KEY` |

Both required together for HLS signing.

### Cloudflare Turnstile (contact form)

| Variable | Production | Preview | Example |
|----------|:----------:|:-------:|---------|
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | ✓ | optional | `0x4AAAAAAA...` |
| `TURNSTILE_SECRET_KEY` | ✓ | optional | `0x4AAAAAAA...` |
| `TURNSTILE_USE_PRODUCTION_KEYS` | ✓ | `false` | `true` |

### Sentry (recommended)

| Variable | Production | Preview | Build? | Example |
|----------|:----------:|:-------:|:------:|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | ✓ | ✓ | **Yes** | `https://key@o123.ingest.us.sentry.io/456` |
| `SENTRY_ENVIRONMENT` | `production` | `staging` | **Yes** | `production` / `staging` |
| `SENTRY_AUTH_TOKEN` | optional | optional | **Yes** | `sntrys_...` (source maps) |
| `SENTRY_ORG` | optional | optional | Yes | `ithracode` |
| `SENTRY_PROJECT` | optional | optional | Yes | `ithracode-web` |
| `SENTRY_TEST_ENDPOINT_ENABLED` | `false` | optional | No | `false` |
| `SENTRY_DEBUG` | `false` | `false` | No | `false` |

### API base override

| Variable | When | Example |
|----------|------|---------|
| `NEXT_PUBLIC_API_URL` | Only if API is on another origin | `https://YOUR_DOMAIN/api` |

Default same-origin relative API works if unset on server; client falls back to localhost if unset — **set explicitly in production**.

### Custom cookie domain

| Variable | When | Example |
|----------|------|---------|
| `COOKIE_DOMAIN` | Custom apex + subdomains (not wired in code today) | `.ithracode.com` |

### Analytics

| Variable | Example |
|----------|---------|
| `PAYMENT_ANALYTICS_ENABLED` | `false` or `true` |

---

## 8. Build-time variables (Vercel → check “Build” or all environments)

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Inlined into browser bundle |
| `SENTRY_ENVIRONMENT` | Copied to `NEXT_PUBLIC_SENTRY_ENVIRONMENT` in `next.config.ts` |
| `SENTRY_AUTH_TOKEN` | Upload source maps during `next build` |
| `SENTRY_ORG`, `SENTRY_PROJECT` | Sentry webpack plugin targets |
| All `NEXT_PUBLIC_*` above | Client bundle inlining |

---

## Secrets checklist (mark as “Sensitive” in Vercel)

- `DATABASE_URL`, `DIRECT_URL`
- `REDIS_URL`
- `AUTH_SECRET`, `AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_SECRET`
- All `PAYMOB_*` except `PAYMOB_API_URL` and numeric tuning
- `RESEND_API_KEY`
- `TURNSTILE_SECRET_KEY`
- `BUNNY_STREAM_TOKEN_AUTH_KEY`
- `PAYMENT_RECONCILE_ADMIN_SECRET`
- `SENTRY_AUTH_TOKEN`

---

## Never add to Vercel (local / scripts / deprecated)

| Variable | Reason |
|----------|--------|
| `SKIP_ENV_VALIDATION` | Disables production safety checks |
| `PAYMENT_PROVIDER`, `WEBHOOK_SMOKE_BASE_URL` | Local scripts only |
| `STRIPE_*`, `OPENAI_*`, `AI_PLATFORM_*`, `AI_TUTOR_*` | Not referenced in code |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Not referenced in code |

---

## Quick copy block (production placeholders)

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN
DATABASE_URL=postgresql://USER:PASS@ep-XXXX-pooler.REGION.aws.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:TOKEN@REGION.upstash.io:6379
AUTH_SECRET=REPLACE_64_HEX_CHARS
AUTH_URL=https://YOUR_DOMAIN
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=REPLACE
AUTH_GOOGLE_SECRET=REPLACE
AUTH_GITHUB_ID=REPLACE
AUTH_GITHUB_SECRET=REPLACE
PAYMOB_API_URL=https://accept.paymob.com
PAYMOB_SECRET_KEY=egy_sk_live_REPLACE
PAYMOB_PUBLIC_KEY=egy_pk_live_REPLACE
PAYMOB_HMAC_SECRET=REPLACE
PAYMOB_API_KEY=REPLACE
PAYMOB_INTEGRATION_IDS=123456
RESEND_API_KEY=re_REPLACE
PAYMENT_EMAIL_FROM=noreply@yourdomain.com
CONTACT_NOTIFICATION_EMAIL=admin@yourdomain.com
NEXT_PUBLIC_TURNSTILE_SITE_KEY=REPLACE
TURNSTILE_SECRET_KEY=REPLACE
TURNSTILE_USE_PRODUCTION_KEYS=true
BUNNY_STREAM_CDN_HOSTNAME=vz-xxxxx.b-cdn.net
BUNNY_STREAM_TOKEN_AUTH_KEY=REPLACE
NEXT_PUBLIC_SENTRY_DSN=https://KEY@oORG.ingest.sentry.io/PROJECT
SENTRY_ENVIRONMENT=production
SENTRY_AUTH_TOKEN=sntrys_REPLACE
SENTRY_ORG=ithracode
SENTRY_PROJECT=ithracode-web
SENTRY_TEST_ENDPOINT_ENABLED=false
PAYMENT_RECONCILE_ADMIN_SECRET=REPLACE
```

Run BullMQ workers separately with the same `DATABASE_URL`, `REDIS_URL`, and Paymob/Resend variables.