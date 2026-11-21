import type { FaqItem } from '@/features/faqs';
import type { TestimonialItem } from '@/features/testimonials/api/dto/testimonial.dto';
import type { CourseListDTO } from '@/types/course/course.dto';
import { getHomeFallbackTestimonials } from '@/features/home/data/home-marketing-content';
import {
  getCachedHomeFaqs,
  getCachedHomeFeaturedCourses,
  getCachedHomeTestimonials,
} from './home-page.cache';

export type HomeDataResult<T> = {
  success: boolean;
  data: T;
  error?: string;
};

/**
 * Home segments use Next.js Data Cache. On a warm cache hit, public sections can still
 * render while PostgreSQL is unavailable; on a cold miss, loaders throw and sections
 * degrade via try/catch below (success: false + empty data).
 */

export async function getFeaturedCoursesForHome(): Promise<
  HomeDataResult<{ courses: CourseListDTO[] }>
> {
  try {
    const courses = await getCachedHomeFeaturedCourses();

    return {
      success: true,
      data: { courses },
    };
  } catch (error) {
    console.error('[HOME_FEATURED_COURSES_ERROR]', error);
    return {
      success: false,
      data: { courses: [] },
      error: 'فشل في جلب الدورات المميزة',
    };
  }
}

export async function getHomeTestimonials(): Promise<
  HomeDataResult<{ items: TestimonialItem[] }>
> {
  try {
    const items = await getCachedHomeTestimonials();

    return {
      success: true,
      data: {
        items: items.length > 0 ? items : getHomeFallbackTestimonials(),
      },
    };
  } catch (error) {
    console.error('[HOME_TESTIMONIALS_ERROR]', error);
    return {
      success: false,
      data: { items: [] },
      error: 'فشل في جلب آراء الطلاب',
    };
  }
}

export async function getHomeFaqs(): Promise<
  HomeDataResult<{ items: FaqItem[] }>
> {
  try {
    const items = await getCachedHomeFaqs();

    return {
      success: true,
      data: { items },
    };
  } catch (error) {
    console.error('[HOME_FAQS_ERROR]', error);
    return {
      success: false,
      data: { items: [] },
      error: 'فشل في جلب الأسئلة الشائعة',
    };
  }
}
