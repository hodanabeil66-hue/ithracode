'use client';

import React from 'react';
import { CourseSidebarHeader } from './header';
import { SectionAccordion } from '@/features/my-courses/[courseSlug]/components/content/section-accordion';
import { SidebarScrollArea } from './scroll-area';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';

export const CourseSidebarTabs: React.FC = () => {
  const activeCourseSlug = useCourseLayoutStore((s) => s.activeCourseSlug);

  if (!activeCourseSlug) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="flex h-full min-h-0 flex-col gap-0 overflow-hidden border-s border-border/50 bg-sidebar"
    >
      <CourseSidebarHeader />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <SidebarScrollArea>
          <SectionAccordion courseSlug={activeCourseSlug} />
        </SidebarScrollArea>
      </div>
    </div>
  );
};
