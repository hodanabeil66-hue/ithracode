import { revalidateTag } from 'next/cache';

import { HOME_TAGS } from '@/lib/query-keys';

/** Clears Next.js Data Cache for homepage featured courses (Redis list cache is separate). */
export function invalidateHomeFeaturedCoursesCache(): void {
  for (const tag of HOME_TAGS.featuredCoursesTags()) {
    revalidateTag(tag, 'max');
  }
}

/** Clears cached public testimonials used on the marketing homepage. */
export function invalidateHomeTestimonialsCache(): void {
  for (const tag of HOME_TAGS.testimonialsTags()) {
    revalidateTag(tag, 'max');
  }
}

/**
 * Call after any mutation that affects public social proof on the homepage:
 * admin testimonials and qualifying course reviews (rating ≥ 4 with comment).
 * Wire this from the first review create/update/delete use-case when implemented.
 */
export function invalidateHomeTestimonialsOnPublicSocialProofChange(): void {
  invalidateHomeTestimonialsCache();
}

/** Clears cached public FAQs used on the marketing homepage. */
export function invalidateHomeFaqsCache(): void {
  for (const tag of HOME_TAGS.faqsTags()) {
    revalidateTag(tag, 'max');
  }
}