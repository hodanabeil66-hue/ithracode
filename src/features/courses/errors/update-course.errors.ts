/** Thrown by update-course use-case; route handler maps `status` to HTTP responses. */
export class UpdateCourseError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'UpdateCourseError';
  }
}

export const COURSE_NOT_FOUND_MESSAGE = 'Course not found';