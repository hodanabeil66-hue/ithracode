import { CourseStatus } from '@prisma/client';

import {
  PublishCourseError,
  COURSE_NOT_FOUND_MESSAGE,
  LECTURE_NOT_FOUND_MESSAGE,
} from '../errors/publish-course.errors';
import {
  type PublishableCourseRepository,
  type PublishableLectureRepository,
} from '../repositories/publishable-course.repository';
import {
  assertCanArchiveCourse,
  assertCourseOwnership,
} from '../services/course-authorization.service';
import type {
  PublishCourseInput,
  PublishCourseResult,
  PublishLectureInput,
  PublishLectureResult,
} from '../types/publish-course.types';

export type PublishCourseUseCaseDeps = {
  courseRepository: PublishableCourseRepository;
  lectureRepository: PublishableLectureRepository;
  cacheInvalidator: {
    invalidateAfterCoursePublish(slug: string): Promise<void>;
    invalidateAfterLecturePublish(slug: string): Promise<void>;
  };
};

/** Publishes a course. */
export async function publishCourseUseCase(
  input: PublishCourseInput,
  deps: PublishCourseUseCaseDeps,
): Promise<PublishCourseResult> {
  const { courseIdOrSlug, user } = input;

  assertCanArchiveCourse(user);

  const existing = await deps.courseRepository.findByIdOrSlug(courseIdOrSlug);
  if (!existing) {
    throw new PublishCourseError(
      404,
      COURSE_NOT_FOUND_MESSAGE,
      'COURSE_NOT_FOUND',
    );
  }

  assertCourseOwnership(user, existing.instructorId);

  const alreadyPublished = existing.status === CourseStatus.PUBLISHED;
  const course = alreadyPublished
    ? existing
    : await deps.courseRepository.publish(existing.id);

  void deps.cacheInvalidator.invalidateAfterCoursePublish(course.slug);

  return {
    published: true,
    alreadyPublished,
    courseId: course.id,
    courseSlug: course.slug,
  };
}

/** Publishes a lecture. */
export async function publishLectureUseCase(
  input: PublishLectureInput,
  deps: PublishCourseUseCaseDeps,
): Promise<PublishLectureResult> {
  const { courseIdOrSlug, lectureId, user } = input;

  assertCanArchiveCourse(user);

  const lecture = await deps.lectureRepository.findById(lectureId);
  if (!lecture) {
    throw new PublishCourseError(
      404,
      LECTURE_NOT_FOUND_MESSAGE,
      'LECTURE_NOT_FOUND',
    );
  }

  const course = await deps.courseRepository.findByIdOrSlug(courseIdOrSlug);
  if (!course || course.id !== lecture.course.id) {
    throw new PublishCourseError(
      404,
      LECTURE_NOT_FOUND_MESSAGE,
      'LECTURE_NOT_FOUND',
    );
  }

  assertCourseOwnership(user, lecture.course.instructorId);

  if (lecture.course.status !== CourseStatus.PUBLISHED) {
    throw new PublishCourseError(
      400,
      'يجب نشر الدورة قبل نشر المحاضرات',
      'COURSE_NOT_PUBLISHED',
    );
  }

  const alreadyPublished = lecture.isPublished;
  const publishedLecture = alreadyPublished
    ? lecture
    : await deps.lectureRepository.publish(lectureId);

  void deps.cacheInvalidator.invalidateAfterLecturePublish(lecture.course.slug);

  return {
    published: true,
    alreadyPublished,
    courseId: lecture.course.id,
    courseSlug: lecture.course.slug,
    lectureId: publishedLecture.id,
  };
}
