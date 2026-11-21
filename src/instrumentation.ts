import * as Sentry from '@sentry/nextjs';

// Captures errors thrown in Server Components, route handlers, server actions
// and the proxy/middleware.
export const onRequestError = Sentry.captureRequestError;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
    return;
  }

  // Startup hooks below use Node-only APIs.
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return;
  }

  await import('../sentry.server.config');
}
