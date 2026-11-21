import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // Expose the resolved Sentry environment to the browser bundle so client
  // events carry the same environment as server events. Must be set at BUILD
  // time (SENTRY_ENVIRONMENT=staging|production). Not a secret.
  env: {
    NEXT_PUBLIC_SENTRY_ENVIRONMENT: process.env.SENTRY_ENVIRONMENT ?? '',
  },
  // Standalone output is for self-hosted/Docker builds only. On Vercel it
  // conflicts with the deployment adapter and breaks the build on Next.js 16.3+.
  ...(isVercel ? {} : { output: 'standalone' as const }),
  reactCompiler: true,
  outputFileTracingIncludes: {
    '/*': ['./src/generated/prisma/**/*'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: process.env.SENTRY_ORG ?? 'ithracode',

  project: process.env.SENTRY_PROJECT ?? 'ithracode-web',

  // SENTRY_AUTH_TOKEN is read from the build environment by the plugin. It is
  // a build-time secret only - never prefix it with NEXT_PUBLIC_.

  sourcemaps: {
    // Upload then delete, so .map files are never served publicly.
    deleteSourcemapsAfterUpload: true,
  },

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: true,

  // Browser tunnel is served by `src/app/monitoring/route.ts` + client
  // `tunnel: '/monitoring'`. Do not use deprecated `tunnelRoute` rewrites —
  // they can 500 on Next.js with regional ingest hosts (`r=de`).

  webpack: {
    // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
    // See the following for more information:
    // https://docs.sentry.io/product/crons/
    // https://vercel.com/docs/cron-jobs
    automaticVercelMonitors: true,

    // Tree-shaking options for reducing bundle size
    treeshake: {
      // Automatically tree-shake Sentry logger statements to reduce bundle size
      removeDebugLogging: true,
    },
  },
});
