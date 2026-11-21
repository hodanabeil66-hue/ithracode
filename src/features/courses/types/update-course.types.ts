import type { Course } from '@prisma/client';
import type { Prisma } from '@prisma/client';

import type { AuthenticatedUser } from './authenticated-user.types';

export type UpdateCourseApiInput = {
  courseIdOrSlug: string;
  user: AuthenticatedUser;
  data: Prisma.CourseUpdateInput;
};

export type UpdateCourseApiResult = {
  course: Course;
};