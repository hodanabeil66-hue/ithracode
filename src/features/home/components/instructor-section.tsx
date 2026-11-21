import Image from 'next/image';
import { ExpandableContent } from '@/components/shared/expandable-content';
import SocialLinks from '@/components/shared/footer/social-links';
import { INSTRUCTOR_IMAGE_SIZES } from '@/features/home/constants/image-sizes';
import { SEO_AUTHOR_JOB_TITLE, SEO_AUTHOR_NAME } from '@/lib/seo/config';
import SectionHeading from './section-heading';

export default function InstructorSection() {
  return (
    <section className="pb-16 md:pb-20 lg:pb-24">
      <div className="container element-center flex-col">
        <SectionHeading
          subTitle={`تعلّم مباشرة مع ${SEO_AUTHOR_NAME}`}
          title="تعرّف على مدربتك"
          subTitleUppercase={false}
        />
        <div
          className="max-w-5xl mx-auto mt-12 w-full overflow-hidden
         rounded-xl border border-border bg-card
          [--fade-background:var(--card)] shadow-sm 
          flex flex-col md:flex-row md:items-start"
        >
          {/* Image block */}
          <div
            className="relative w-full aspect-4/5 sm:aspect-3/4 md:aspect-auto
           md:w-1/2 md:min-h-112.5 shrink-0 overflow-hidden"
          >
            <Image
              src="/img/home/hoda.jpeg"
              alt={`${SEO_AUTHOR_NAME}، ${SEO_AUTHOR_JOB_TITLE} — IthraCode`}
              sizes={INSTRUCTOR_IMAGE_SIZES}
              width={600}
              height={750}
              priority
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Text content */}
          <div className="p-6 md:p-8 flex flex-col justify-center md:w-1/2 min-w-0">
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground mt-1">
              {SEO_AUTHOR_NAME}
            </h3>
            <p className="text-brand mt-2 font-bold">{SEO_AUTHOR_JOB_TITLE}</p>
            <p className="text-muted-foreground text-sm font-medium">
              المؤسسة والمالكة والمدرّبة
            </p>
            <ExpandableContent className="mt-4">
              <div className="space-y-4 text-muted-foreground text-base leading-relaxed">
                <p>
                  {SEO_AUTHOR_NAME} مطوّرة ويب متكاملة (Full-Stack Developer)
                  بخبرة عملية في تصميم وبناء تطبيقات ويب عالية الأداء وقابلة
                  للتوسّع (Scalable Web Applications). تتمتع بكفاءة متقدمة في
                  تطوير الواجهات الأمامية (Frontend Development) باستخدام React
                  وNext.js وTypeScript، وتطوير الواجهات الخلفية (Backend
                  Development) عبر Node.js وNestJS وواجهات REST، مع إدارة
                  بيانات موثوقة عبر PostgreSQL وPrisma، مما يُمكّنها من تقديم
                  حلول متكاملة جاهزة للنشر في بيئات الإنتاج (Production-Ready
                  Solutions). تهتم بهندسة البرمجيات (Software Engineering)
                  ومبادئ الكود النظيف (Clean Code) وحل المشكلات التقنية
                  المعقدة، وبناء معماريات واضحة تسهّل الصيانة والتوسّع. إلى
                  جانب مسيرتها التقنية، تعمل كمدرّبة تقنية (Tech Instructor)
                  ومنتجة للمحتوى التعليمي (Educational Content Creator)، إذ
                  تُبسّط المفاهيم البرمجية والتقنية عبر منصة IthraCode وقناتها
                  على يوتيوب ودوراتها التدريبية الإلكترونية (Online Courses)،
                  مساهمةً في رفع مستوى المطورين بأسلوب عملي (Hands-on Learning)
                  وسهل الاستيعاب.
                </p>
              </div>
            </ExpandableContent>

            <div className="mt-6">
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
