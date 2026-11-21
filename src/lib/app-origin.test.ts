import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveConfiguredAppOrigin, toAbsoluteOrigin } from './app-origin';
import { SEO_CANONICAL_ORIGIN } from './seo/config';

describe('toAbsoluteOrigin', () => {
  it('returns an origin from a full URL', () => {
    expect(toAbsoluteOrigin('https://ithracode.tech/api/auth/')).toBe(
      'https://ithracode.tech',
    );
  });

  it('adds https to a bare host', () => {
    expect(toAbsoluteOrigin('ithra-code.vercel.app')).toBe(
      'https://ithra-code.vercel.app',
    );
  });

  it('returns undefined for a blank or invalid value', () => {
    expect(toAbsoluteOrigin('   ')).toBeUndefined();
    expect(toAbsoluteOrigin(undefined)).toBeUndefined();
    expect(toAbsoluteOrigin('http://')).toBeUndefined();
  });
});

describe('resolveConfiguredAppOrigin', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses the public app url when it is set', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://ithracode.tech/');
    expect(resolveConfiguredAppOrigin()).toBe('https://ithracode.tech');
  });

  it('falls back to the Vercel host when the public url is missing', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('AUTH_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', 'ithra-code-git-staging.vercel.app');

    expect(resolveConfiguredAppOrigin()).toBe(
      'https://ithra-code-git-staging.vercel.app',
    );
  });

  it('uses the production origin when no host is configured', () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('AUTH_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', '');

    expect(resolveConfiguredAppOrigin()).toBe(SEO_CANONICAL_ORIGIN);
  });
});
