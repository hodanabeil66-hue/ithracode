import type { EnrollmentReviewDTO } from '../dto/enrollment-list.dto';

/**
 * Read-only today. When create/update/delete review methods are added, call
 * `invalidateHomeTestimonialsOnPublicSocialProofChange()` from
 * `@/features/home/cache/invalidate-home-cache` after each successful mutation
 * so the marketing homepage testimonial block stays fresh.
 */
export interface EnrollmentReviewRepository {
  findByUserAndCourseIds(
    userId: string,
    courseIds: string[],
  ): Promise<EnrollmentReviewDTO[]>;
}
