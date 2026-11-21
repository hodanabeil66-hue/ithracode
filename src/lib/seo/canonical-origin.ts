import {
  resolveConfiguredAppOrigin,
  toAbsoluteOrigin,
} from '@/lib/app-origin';

import { SEO_CANONICAL_ORIGIN } from './config';
import { isSeoIndexingEnabled } from './environment';

/** Origin used for canonical URLs, metadataBase, and JSON-LD @id in production. */
export function getCanonicalOrigin(appOrigin?: string): string {
  const siteOrigin =
    toAbsoluteOrigin(appOrigin) ?? resolveConfiguredAppOrigin();

  if (isSeoIndexingEnabled({ origin: siteOrigin })) {
    return SEO_CANONICAL_ORIGIN;
  }

  return siteOrigin;
}
