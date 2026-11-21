/* eslint-disable no-console */

import {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  Currency,
  EnrollmentStatus,
  LectureType,
  PathCategory,
  PrismaClient,
  Role,
} from '@prisma/client';
import { SEO_SITE_NAME_EN } from '../../src/lib/seo/config';
import {
  countHtmlCssLessons,
  HTML_CSS_COURSE_MODULES,
  HTML_CSS_FRONTEND_PATH_SLUG,
  HTML_CSS_FRONTEND_TRACK_SLUG,
  HTML_CSS_FUNDAMENTALS_SLUG,
} from './data/html-css-fundamentals.curriculum';

const HTML_CSS_TITLE = 'HTML & CSS Fundamentals';
const HTML_CSS_TITLE_AR = 'أساسيات HTML و CSS: بناء صفحات ويب حديثة من الصفر';
const HTML_CSS_DESCRIPTION_AR =
  'تعلّم كيفية بناء صفحات ويب حديثة من الصفر باستخدام HTML5 و CSS3، مع أمثلة عملية ومشاريع واقعية.';
const HTML_CSS_META_DESCRIPTION_EN =
  'Learn how to build modern web pages from scratch using HTML5 and CSS3, with practical examples and real-world projects.';
const TARGET_ACTIVE_ENROLLMENTS = 16;

export type SeedHtmlCssFundamentalsResult = {
  courseId: string;
  courseSlug: string;
  moduleCount: number;
  lessonCount: number;
  activeEnrollmentCount: number;
};

async function syncCurriculum(
  prisma: PrismaClient,
  courseId: string,
): Promise<void> {
  await prisma.section.deleteMany({ where: { courseId } });

  for (
    let moduleIndex = 0;
    moduleIndex < HTML_CSS_COURSE_MODULES.length;
    moduleIndex++
  ) {
    const curriculumModule = HTML_CSS_COURSE_MODULES[moduleIndex];
    if (!curriculumModule) continue;

    await prisma.section.create({
      data: {
        courseId,
        title: curriculumModule.title,
        position: moduleIndex + 1,
        isPublished: true,
        lectures: {
          create: curriculumModule.lessons.map((lessonTitle, lessonIndex) => ({
            title: lessonTitle,
            position: lessonIndex + 1,
            type: LectureType.TEXT,
            isPublished: true,
          })),
        },
      },
    });
  }

  const durationMinutes = countHtmlCssLessons() * 12;
  await prisma.course.update({
    where: { id: courseId },
    data: { duration: durationMinutes },
  });
}

/**
 * Enrolls up to `target` ACTIVE students using existing STUDENT accounts only
 * (no fabricated users). Skips instructor and users already enrolled.
 */
async function ensureActiveEnrollments(
  prisma: PrismaClient,
  courseId: string,
  instructorId: string,
  target: number,
): Promise<number> {
  const existingEnrollments = await prisma.enrollment.findMany({
    where: {
      courseId,
      status: EnrollmentStatus.ACTIVE,
    },
    select: { studentId: true },
  });

  let activeCount = existingEnrollments.length;
  if (activeCount >= target) {
    return activeCount;
  }

  const excludeStudentIds = new Set(
    existingEnrollments.map((row) => row.studentId),
  );
  excludeStudentIds.add(instructorId);

  const needed = target - activeCount;
  const candidates = await prisma.user.findMany({
    where: {
      role: Role.STUDENT,
      isActive: true,
      id: { notIn: [...excludeStudentIds] },
    },
    orderBy: { createdAt: 'asc' },
    take: needed,
    select: { id: true, email: true },
  });

  for (const student of candidates) {
    await prisma.enrollment.upsert({
      where: {
        studentId_courseId: {
          studentId: student.id,
          courseId,
        },
      },
      update: {
        status: EnrollmentStatus.ACTIVE,
      },
      create: {
        studentId: student.id,
        courseId,
        status: EnrollmentStatus.ACTIVE,
      },
    });
    activeCount++;
  }

  if (activeCount < target) {
    console.warn(
      `⚠️  html-css-fundamentals: ${activeCount}/${target} ACTIVE enrollments — add more STUDENT users or enroll manually.`,
    );
  }

  return activeCount;
}

export async function seedHtmlCssFundamentals(
  prisma: PrismaClient,
  instructorId: string,
): Promise<SeedHtmlCssFundamentalsResult> {
  console.log('📘 Upserting Frontend Development path & track...');

  const frontendPath = await prisma.path.upsert({
    where: { slug: HTML_CSS_FRONTEND_PATH_SLUG },
    update: {
      title: 'Frontend Development',
      tagline: 'من أساسيات الويب إلى واجهات تفاعلية احترافية',
      shortDescription:
        'مسار تطوير الواجهات الأمامية: HTML، CSS، التصميم المتجاوب، وأساسيات JavaScript.',
      description:
        'مسار Frontend Development يغطي بناء صفحات ويب حديثة من الصفر باستخدام HTML و CSS، مع التركيز على البنية الدلالية، إمكانية الوصول، والتصميم المتجاوب.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1507725066427-8c73a3971a75?w=800',
      category: PathCategory.WEB,
      icon: '🎨',
      isPublished: true,
      sortOrder: 2,
      metaTitle: `Frontend Development | ${SEO_SITE_NAME_EN}`,
      metaDescription:
        'Arabic-first frontend learning path covering HTML, CSS, responsive design, and modern layout techniques.',
    },
    create: {
      title: 'Frontend Development',
      slug: HTML_CSS_FRONTEND_PATH_SLUG,
      tagline: 'من أساسيات الويب إلى واجهات تفاعلية احترافية',
      shortDescription:
        'مسار تطوير الواجهات الأمامية: HTML، CSS، التصميم المتجاوب، وأساسيات JavaScript.',
      description:
        'مسار Frontend Development يغطي بناء صفحات ويب حديثة من الصفر باستخدام HTML و CSS، مع التركيز على البنية الدلالية، إمكانية الوصول، والتصميم المتجاوب.',
      thumbnailUrl:
        'https://images.unsplash.com/photo-1507725066427-8c73a3971a75?w=800',
      category: PathCategory.WEB,
      icon: '🎨',
      isPublished: true,
      sortOrder: 2,
      metaTitle: `Frontend Development | ${SEO_SITE_NAME_EN}`,
      metaDescription:
        'Arabic-first frontend learning path covering HTML, CSS, responsive design, and modern layout techniques.',
    },
  });

  const frontendTrack = await prisma.track.upsert({
    where: { slug: HTML_CSS_FRONTEND_TRACK_SLUG },
    update: {
      pathId: frontendPath.id,
      title: 'Frontend Development Track',
      shortDescription:
        'HTML, CSS, Flexbox, Grid, and responsive web design for modern frontends.',
      description:
        'تراك تطوير الواجهات الأمامية يبدأ بأساسيات HTML و CSS ويصل إلى Flexbox و Grid والتصميم المتجاوب مع مشاريع عملية.',
      category: PathCategory.WEB,
      icon: '📐',
      isPublished: true,
      sortOrder: 1,
      metaTitle: `Frontend Development Track | ${SEO_SITE_NAME_EN}`,
      metaDescription:
        'Learn HTML5, CSS3, semantic markup, layout systems, and responsive design in Arabic.',
    },
    create: {
      pathId: frontendPath.id,
      title: 'Frontend Development Track',
      slug: HTML_CSS_FRONTEND_TRACK_SLUG,
      shortDescription:
        'HTML, CSS, Flexbox, Grid, and responsive web design for modern frontends.',
      description:
        'تراك تطوير الواجهات الأمامية يبدأ بأساسيات HTML و CSS ويصل إلى Flexbox و Grid والتصميم المتجاوب مع مشاريع عملية.',
      category: PathCategory.WEB,
      icon: '📐',
      isPublished: true,
      sortOrder: 1,
      metaTitle: `Frontend Development Track | ${SEO_SITE_NAME_EN}`,
      metaDescription:
        'Learn HTML5, CSS3, semantic markup, layout systems, and responsive design in Arabic.',
    },
  });

  console.log('📗 Upserting HTML & CSS Fundamentals course...');

  const course = await prisma.course.upsert({
    where: { slug: HTML_CSS_FUNDAMENTALS_SLUG },
    update: {
      instructorId,
      pathId: frontendPath.id,
      trackId: frontendTrack.id,
      title: HTML_CSS_TITLE,
      description: HTML_CSS_DESCRIPTION_AR,
      shortDescription: HTML_CSS_TITLE_AR,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
      previewVideo: null,
      price: 1000,
      compareAtPrice: 1500,
      currency: Currency.EGP,
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      publishedAt: new Date(),
      isFeatured: true,
      requirements: [
        'معرفة أساسية باستخدام الحاسوب والمتصفح',
        'رغبة في تعلم تطوير الواجهات الأمامية',
        'لا يلزم خبرة برمجية سابقة',
      ],
      objectives: [
        'بناء صفحات HTML5 ذات بنية دلالية واضحة',
        'تنسيق الواجهات باستخدام CSS3 الحديث',
        'فهم نموذج الصندوق (Box Model) وخصائص العرض',
        'إنشاء تخطيطات باستخدام Flexbox و CSS Grid',
        'تطبيق التصميم المتجاوب عبر Media Queries',
        'إتقان إمكانية الوصول الأساسية في النماذج والمحتوى',
        'إنجاز مشاريع عملية: Portfolio وصفحة هبوط وموقع كامل',
      ],
      targetAudience: [
        'المبتدئون في تطوير الويب',
        'طلاب علوم الحاسوب الراغبون في أساسيات Frontend',
        'المصممون الذين يريدون تحويل التصاميم إلى صفحات ويب',
        'المطورون الذين يريدون تعزيز أساسيات HTML و CSS',
      ],
      tags: [
        'html',
        'css',
        'html5',
        'css3',
        'frontend',
        'web-development',
        'responsive-design',
        'flexbox',
        'css-grid',
        'arabic',
      ],
      metaTitle: `${HTML_CSS_TITLE} | ${SEO_SITE_NAME_EN}`,
      metaDescription: HTML_CSS_META_DESCRIPTION_EN,
      certificateEnabled: true,
      maxStudents: 500,
    },
    create: {
      instructorId,
      pathId: frontendPath.id,
      trackId: frontendTrack.id,
      title: HTML_CSS_TITLE,
      slug: HTML_CSS_FUNDAMENTALS_SLUG,
      description: HTML_CSS_DESCRIPTION_AR,
      shortDescription: HTML_CSS_TITLE_AR,
      thumbnailUrl:
        'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
      previewVideo: null,
      price: 1000,
      compareAtPrice: 1500,
      currency: Currency.EGP,
      level: CourseLevel.INTERMEDIATE,
      status: CourseStatus.PUBLISHED,
      visibility: CourseVisibility.PUBLIC,
      publishedAt: new Date(),
      isFeatured: true,
      duration: 0,
      requirements: [
        'معرفة أساسية باستخدام الحاسوب والمتصفح',
        'رغبة في تعلم تطوير الواجهات الأمامية',
        'لا يلزم خبرة برمجية سابقة',
      ],
      objectives: [
        'بناء صفحات HTML5 ذات بنية دلالية واضحة',
        'تنسيق الواجهات باستخدام CSS3 الحديث',
        'فهم نموذج الصندوق (Box Model) وخصائص العرض',
        'إنشاء تخطيطات باستخدام Flexbox و CSS Grid',
        'تطبيق التصميم المتجاوب عبر Media Queries',
        'إتقان إمكانية الوصول الأساسية في النماذج والمحتوى',
        'إنجاز مشاريع عملية: Portfolio وصفحة هبوط وموقع كامل',
      ],
      targetAudience: [
        'المبتدئون في تطوير الويب',
        'طلاب علوم الحاسوب الراغبون في أساسيات Frontend',
        'المصممون الذين يريدون تحويل التصاميم إلى صفحات ويب',
        'المطورون الذين يريدون تعزيز أساسيات HTML و CSS',
      ],
      tags: [
        'html',
        'css',
        'html5',
        'css3',
        'frontend',
        'web-development',
        'responsive-design',
        'flexbox',
        'css-grid',
        'arabic',
      ],
      metaTitle: `${HTML_CSS_TITLE} | ${SEO_SITE_NAME_EN}`,
      metaDescription: HTML_CSS_META_DESCRIPTION_EN,
      certificateEnabled: true,
      maxStudents: 500,
    },
  });

  console.log('📑 Syncing curriculum (sections & lectures)...');
  await syncCurriculum(prisma, course.id);

  console.log(
    `🎓 Linking up to ${TARGET_ACTIVE_ENROLLMENTS} existing students (no new accounts)...`,
  );
  const activeEnrollmentCount = await ensureActiveEnrollments(
    prisma,
    course.id,
    instructorId,
    TARGET_ACTIVE_ENROLLMENTS,
  );

  const moduleCount = HTML_CSS_COURSE_MODULES.length;
  const lessonCount = countHtmlCssLessons();

  console.log('✅ HTML & CSS Fundamentals seed completed');
  console.log(`   Course: ${course.title} (${course.slug})`);
  console.log(`   Modules: ${moduleCount} | Lessons: ${lessonCount}`);
  console.log(`   ACTIVE enrollments: ${activeEnrollmentCount}`);

  return {
    courseId: course.id,
    courseSlug: course.slug,
    moduleCount,
    lessonCount,
    activeEnrollmentCount,
  };
}
