import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/** Auth.js v5 (next-auth) treats AUTH_URL pathname `/` as "use default /api/auth". */
function normalizeAuthUrl(url: string): string {
  return new URL(url.replace(/\/api\/auth\/?$/, '')).origin;
}

export const env = createEnv({
  server: {
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development')
      .describe('Node environment'),

    // Database URL
    DATABASE_URL: z.string().url().describe('PostgreSQL database URL'),

    // NextAuth settings
    AUTH_URL: z
      .string()
      .url()
      .refine((url) => !url.includes('authjs.dev'), {
        message:
          'AUTH_URL must be your actual domain, not authjs.dev placeholder',
      })
      .transform(normalizeAuthUrl)
      .describe('NextAuth base URL (site origin)'),
    NEXTAUTH_URL: z
      .string()
      .url()
      .optional()
      .describe('NextAuth base URL (legacy)'),
    AUTH_SECRET: z
      .string()
      .min(1)
      .transform((value) => value.trim())
      .describe('NextAuth secret key'),
    AUTH_TRUST_HOST: z
      .string()
      .optional()
      .default('true')
      .describe(
        'Trust Host header for Auth.js (required on localhost and Vercel)',
      ),

    // OAuth Providers
    AUTH_GOOGLE_ID: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .describe('Google OAuth Client ID'),
    AUTH_GOOGLE_SECRET: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .describe('Google OAuth Client Secret'),
    AUTH_GITHUB_ID: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .describe('GitHub OAuth Client ID'),
    AUTH_GITHUB_SECRET: z
      .string()
      .transform((value) => value.trim())
      .optional()
      .describe('GitHub OAuth Client Secret'),

    // Paymob (optional: gateway registers only when configured)
    PAYMOB_API_URL: z
      .string()
      .url()
      .default('https://accept.paymob.com')
      .describe('Paymob API base URL'),
    PAYMOB_SECRET_KEY: z
      .string()
      .optional()
      .describe('Paymob secret key (Intention API auth)'),
    PAYMOB_PUBLIC_KEY: z
      .string()
      .optional()
      .describe('Paymob public key (unified checkout redirect)'),
    PAYMOB_HMAC_SECRET: z
      .string()
      .optional()
      .describe('Paymob HMAC secret (webhook signature verification)'),
    PAYMOB_API_KEY: z
      .string()
      .optional()
      .describe(
        'Paymob legacy API key (auth token for transaction inquiry / reconcile)',
      ),
    PAYMOB_INTEGRATION_IDS: z
      .string()
      .optional()
      .describe('Comma-separated Paymob payment integration IDs'),

    // Payment reconciliation
    PAYMENT_RECONCILE_THRESHOLD_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(30)
      .describe('Reconcile payments older than this many minutes'),
    PAYMENT_RECONCILE_BATCH_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .default(50)
      .describe('Max payments processed per reconciliation batch'),
    PAYMENT_RECONCILE_INTERVAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(900_000)
      .describe(
        'Reconciliation worker interval in milliseconds (default 15 min)',
      ),

    PAYMENT_RECONCILE_MAX_ATTEMPTS: z.coerce
      .number()
      .int()
      .positive()
      .default(8)
      .describe(
        'Max automatic reconcile attempts before abandon/manual review',
      ),

    PAYMENT_RECONCILE_MAX_WINDOW_HOURS: z.coerce
      .number()
      .int()
      .positive()
      .default(24)
      .describe('Max age of a payment eligible for automatic reconciliation'),

    PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(30)
      .describe('Base backoff delay for reconcile retries'),

    PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES: z.coerce
      .number()
      .int()
      .positive()
      .default(720)
      .describe(
        'Maximum backoff delay between reconcile attempts (default 12h)',
      ),

    PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT: z.coerce
      .number()
      .int()
      .positive()
      .default(3)
      .describe(
        'Consecutive not_found outcomes required before abandon (with expired session)',
      ),

    PAYMENT_RECONCILE_USE_QUEUE: z
      .enum(['true', 'false'])
      .default('false')
      .describe(
        'Enqueue claimed payments to BullMQ instead of inline processing',
      ),

    PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE: z.coerce
      .number()
      .int()
      .positive()
      .default(60)
      .describe('Max provider inquiry calls per minute per PSP'),

    PAYMENT_RECONCILE_ADMIN_SECRET: z
      .string()
      .optional()
      .describe('Bearer token for /api/admin/payment/reconcile'),

    PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(30_000)
      .describe('Grace period for in-flight reconcile batch on SIGTERM'),

    PAYMOB_CIRCUIT_BREAKER_THRESHOLD: z.coerce
      .number()
      .int()
      .positive()
      .default(5)
      .describe('Consecutive Paymob inquiry failures before circuit opens'),

    PAYMOB_CIRCUIT_BREAKER_RESET_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(60_000)
      .describe('Milliseconds before Paymob inquiry circuit half-opens'),

    PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS: z.coerce
      .number()
      .int()
      .positive()
      .default(300)
      .describe('Reject Paymob webhooks older than this many seconds'),

    PAYMOB_RETRY_MAX: z.coerce
      .number()
      .int()
      .positive()
      .default(3)
      .describe('Max retry attempts for transient Paymob HTTP failures'),

    PAYMOB_RETRY_INITIAL_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(1000)
      .describe('Initial backoff delay for Paymob HTTP retries'),

    PAYMOB_TIMEOUT_MS: z.coerce
      .number()
      .int()
      .positive()
      .default(15_000)
      .describe('HTTP request timeout for Paymob API calls'),

    RESEND_API_KEY: z
      .string()
      .optional()
      .describe('Resend API key for purchase confirmation emails'),

    PAYMENT_EMAIL_FROM: z
      .string()
      .email()
      .optional()
      .describe('From address for payment confirmation emails'),

    CONTACT_NOTIFICATION_EMAIL: z
      .string()
      .email()
      .optional()
      .describe('Admin inbox address for contact form notifications'),

    TURNSTILE_SECRET_KEY: z
      .string()
      .optional()
      .describe('Cloudflare Turnstile secret key for server-side verification'),

    TURNSTILE_USE_PRODUCTION_KEYS: z
      .enum(['true', 'false'])
      .default('false')
      .describe(
        'In development, use production Turnstile keys instead of Cloudflare test keys on localhost',
      ),

    PAYMENT_ANALYTICS_ENABLED: z
      .enum(['true', 'false'])
      .default('false')
      .describe('Enable analytics tracking for completed orders'),

    // Redis
    REDIS_URL: z.string().url().describe('Redis connection URL'),

    // Bunny Stream (optional — signed HLS URLs for course video playback)
    BUNNY_STREAM_CDN_HOSTNAME: z
      .string()
      .optional()
      .describe('Bunny Stream CDN hostname (e.g. vz-xxxxx.b-cdn.net)'),
    BUNNY_STREAM_TOKEN_AUTH_KEY: z
      .string()
      .optional()
      .describe('Bunny Stream token authentication security key'),

    // Optional cookie domain (production)
    COOKIE_DOMAIN: z
      .string()
      .optional()
      .describe('Cookie domain for production'),

    // Direct database URL (for migrations)
    DIRECT_URL: z
      .string()
      .url()
      .optional()
      .describe('Direct database URL for migrations'),
  },

  client: {
    NEXT_PUBLIC_API_URL: z.string().url().optional().describe('API base URL'),
    NEXT_PUBLIC_APP_URL: z.string().url().describe('Next.js app public URL'),
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: z
      .string()
      .optional()
      .describe('Cloudflare Turnstile site key for contact form'),
  },

  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_TRUST_HOST: process.env.AUTH_TRUST_HOST,
    AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
    AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    PAYMOB_API_URL: process.env.PAYMOB_API_URL,
    PAYMOB_SECRET_KEY: process.env.PAYMOB_SECRET_KEY,
    PAYMOB_PUBLIC_KEY: process.env.PAYMOB_PUBLIC_KEY,
    PAYMOB_HMAC_SECRET: process.env.PAYMOB_HMAC_SECRET,
    PAYMOB_API_KEY: process.env.PAYMOB_API_KEY,
    PAYMOB_INTEGRATION_IDS: process.env.PAYMOB_INTEGRATION_IDS,
    PAYMENT_RECONCILE_THRESHOLD_MINUTES:
      process.env.PAYMENT_RECONCILE_THRESHOLD_MINUTES,
    PAYMENT_RECONCILE_BATCH_SIZE: process.env.PAYMENT_RECONCILE_BATCH_SIZE,
    PAYMENT_RECONCILE_INTERVAL_MS: process.env.PAYMENT_RECONCILE_INTERVAL_MS,
    PAYMENT_RECONCILE_MAX_ATTEMPTS: process.env.PAYMENT_RECONCILE_MAX_ATTEMPTS,
    PAYMENT_RECONCILE_MAX_WINDOW_HOURS:
      process.env.PAYMENT_RECONCILE_MAX_WINDOW_HOURS,
    PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES:
      process.env.PAYMENT_RECONCILE_BACKOFF_BASE_MINUTES,
    PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES:
      process.env.PAYMENT_RECONCILE_BACKOFF_CAP_MINUTES,
    PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT:
      process.env.PAYMENT_RECONCILE_ABANDON_NOT_FOUND_COUNT,
    PAYMENT_RECONCILE_USE_QUEUE: process.env.PAYMENT_RECONCILE_USE_QUEUE,
    PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE:
      process.env.PAYMENT_RECONCILE_RATE_LIMIT_PER_MINUTE,
    PAYMENT_RECONCILE_ADMIN_SECRET: process.env.PAYMENT_RECONCILE_ADMIN_SECRET,
    PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS:
      process.env.PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS,
    PAYMOB_CIRCUIT_BREAKER_THRESHOLD:
      process.env.PAYMOB_CIRCUIT_BREAKER_THRESHOLD,
    PAYMOB_CIRCUIT_BREAKER_RESET_MS:
      process.env.PAYMOB_CIRCUIT_BREAKER_RESET_MS,
    PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS:
      process.env.PAYMOB_WEBHOOK_REPLAY_WINDOW_SECONDS,
    PAYMOB_RETRY_MAX: process.env.PAYMOB_RETRY_MAX,
    PAYMOB_RETRY_INITIAL_MS: process.env.PAYMOB_RETRY_INITIAL_MS,
    PAYMOB_TIMEOUT_MS: process.env.PAYMOB_TIMEOUT_MS,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    PAYMENT_EMAIL_FROM: process.env.PAYMENT_EMAIL_FROM,
    CONTACT_NOTIFICATION_EMAIL: process.env.CONTACT_NOTIFICATION_EMAIL,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    TURNSTILE_USE_PRODUCTION_KEYS: process.env.TURNSTILE_USE_PRODUCTION_KEYS,
    PAYMENT_ANALYTICS_ENABLED: process.env.PAYMENT_ANALYTICS_ENABLED,
    REDIS_URL: process.env.REDIS_URL,
    BUNNY_STREAM_CDN_HOSTNAME: process.env.BUNNY_STREAM_CDN_HOSTNAME,
    BUNNY_STREAM_TOKEN_AUTH_KEY: process.env.BUNNY_STREAM_TOKEN_AUTH_KEY,
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
    DIRECT_URL: process.env.DIRECT_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

// Auth.js reads AUTH_URL / NEXTAUTH_URL / AUTH_TRUST_HOST / AUTH_SECRET from
// process.env. Keep AUTH_URL as the site origin (next-auth ignores pathname `/`
// and defaults basePath to `/api/auth`). Overwrite a stale NEXTAUTH_URL so it
// cannot point at an old Vercel hostname.
if (typeof window === 'undefined') {
  // Auth.js auto-reads provider env vars such as AUTH_GITHUB_ISSUER.
  // Ignore placeholder values that can break OAuth callback validation in production.
  if (process.env.AUTH_GITHUB_ISSUER?.includes('authjs.dev')) {
    console.warn(
      '[AUTH_GITHUB_ISSUER_SANITIZED] Ignoring placeholder AUTH_GITHUB_ISSUER value.',
    );
    delete process.env.AUTH_GITHUB_ISSUER;
  }

  const hasGoogleClientId = Boolean(env.AUTH_GOOGLE_ID);
  const hasGoogleClientSecret = Boolean(env.AUTH_GOOGLE_SECRET);
  const hasGitHubClientId = Boolean(env.AUTH_GITHUB_ID);
  const hasGitHubClientSecret = Boolean(env.AUTH_GITHUB_SECRET);

  if (hasGoogleClientId !== hasGoogleClientSecret) {
    console.error(
      '[ENV] Google OAuth is misconfigured: set both AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET, or remove both. Google login is disabled until fixed.',
    );
  }

  if (hasGitHubClientId !== hasGitHubClientSecret) {
    console.error(
      '[ENV] GitHub OAuth is misconfigured: set both AUTH_GITHUB_ID and AUTH_GITHUB_SECRET, or remove both. GitHub login is disabled until fixed.',
    );
  }

  process.env.AUTH_URL = env.AUTH_URL;
  process.env.NEXTAUTH_URL = env.AUTH_URL;
  process.env.AUTH_TRUST_HOST = 'true';
  if (env.AUTH_SECRET) {
    process.env.AUTH_SECRET = env.AUTH_SECRET;
  }
}
