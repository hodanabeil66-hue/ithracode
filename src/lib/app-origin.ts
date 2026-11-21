import { SEO_CANONICAL_ORIGIN } from './seo/config';

/** Turn a host or URL into an origin, or return undefined when it is unusable. */
export function toAbsoluteOrigin(
  value: string | undefined,
): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    return new URL(withProtocol).origin;
  } catch {
    return undefined;
  }
}

/**
 * Public site origin for metadata and redirects.
 * Preview builds can leave NEXT_PUBLIC_APP_URL unset on the client env
 * proxy, so fall through to the auth URL, the Vercel host, then production.
 */
export function resolveConfiguredAppOrigin(): string {
  const publicUrl = toAbsoluteOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (publicUrl) return publicUrl;

  if (typeof window === 'undefined') {
    const serverUrl = toAbsoluteOrigin(
      process.env.AUTH_URL ||
        process.env.VERCEL_PROJECT_PRODUCTION_URL ||
        process.env.VERCEL_URL,
    );
    if (serverUrl) return serverUrl;
  }

  return SEO_CANONICAL_ORIGIN;
}
