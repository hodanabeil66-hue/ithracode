import {
  courseRepository,
  type CourseRepository,
} from '../repositories/course.repository';
import {
  UpdateCourseError,
  COURSE_NOT_FOUND_MESSAGE,
} from '../errors/update-course.errors';
import {
  assertCanArchiveCourse,
  assertCourseOwnership,
} from '../services/course-authorization.service';
import { courseCacheService } from '../services/course-cache.service';
import type {
  UpdateCourseApiInput,
  UpdateCourseApiResult,
} from '../types/update-course.types';

/** Authorized course update for API routes (instructor owner or admin). */
export async function updateCourseUseCase(
  input: UpdateCourseApiInput,
  repository: CourseRepository = courseRepository,
): Promise<UpdateCourseApiResult> {
  const { courseIdOrSlug, user, data } = input;

  assertCanArchiveCourse(user);

  const existing = await repository.findByIdOrSlug(courseIdOrSlug);
  if (!existing) {
    throw new UpdateCourseError(
      404,
      COURSE_NOT_FOUND_MESSAGE,
      'COURSE_NOT_FOUND',
    );
  }

  assertCourseOwnership(user, existing.instructorId);

  const course = await repository.update(existing.id, data);

  void courseCacheService.invalidateCourseList();
  void courseCacheService.invalidateCourse(course.slug);

  return { course };
}