import { cache } from '@/lib/cache';
import { HOME_TAGS } from '@/lib/query-keys';
import { getFaqs } from '@/features/faqs/api/use-cases/get-faqs.use-case';
import type { FaqItem } from '@/features/faqs/api/dto/faq.dto';
import { listCourses } from '@/features/courses/listing';
import { mapCourseListResultToGetCoursesResult } from '@/features/courses/listing/mapper/to-list-dto';
import type { CourseListDTO } from '@/types/course/course.dto';
import { getTestimonials } from '@/features/testimonials/api/use-cases/get-testimonials.use-case';
import type { TestimonialItem } from '@/features/testimonials/api/dto/testimonial.dto';
import {
  HOME_FAQS_LIMIT,
  HOME_FEATURED_COURSES_LIMIT,
  HOME_TESTIMONIALS_LIMIT,
} from './home-page.constants';

const loadHomeFeaturedCoursesCached = cache(
  async (): Promise<CourseListDTO[]> => {
    const result = await listCourses({
      query: {
        page: 1,
        limit: HOME_FEATURED_COURSES_LIMIT,
        featured: true,
      },
      viewer: null,
    });

    return mapCourseListResultToGetCoursesResult(result).courses;
  },
  () => [...HOME_TAGS.featuredCourses()],
  {
    tags: [...HOME_TAGS.featuredCoursesTags()],
    revalidate: 60,
  },
);

const loadHomeTestimonialsCached = cache(
  async (): Promise<TestimonialItem[]> => {
    const result = await getTestimonials({
      page: 1,
      limit: HOME_TESTIMONIALS_LIMIT,
    });
    return result.items;
  },
  () => [...HOME_TAGS.testimonials()],
  {
    tags: [...HOME_TAGS.testimonialsTags()],
    revalidate: 300,
  },
);

const loadHomeFaqsCached = cache(
  async (): Promise<FaqItem[]> => {
    const result = await getFaqs(
      { page: 1, limit: HOME_FAQS_LIMIT },
      { includeTotal: false },
    );
    return result.items;
  },
  () => [...HOME_TAGS.faqs()],
  {
    tags: [...HOME_TAGS.faqsTags()],
    revalidate: 300,
  },
);

export const getCachedHomeFeaturedCourses = () =>
  loadHomeFeaturedCoursesCached();

export const getCachedHomeTestimonials = () => loadHomeTestimonialsCached();

export const getCachedHomeFaqs = () => loadHomeFaqsCached();