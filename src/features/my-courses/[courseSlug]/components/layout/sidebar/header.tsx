'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';

export const CourseSidebarHeader: React.FC = () => {
  const isSidebarExpanded = useCourseLayoutStore((s) => s.isSidebarExpanded);
  const closeSidebar = useCourseLayoutStore((s) => s.closeSidebar);
  const toggleSidebarExpanded = useCourseLayoutStore(
    (s) => s.toggleSidebarExpanded,
  );

  return (
    <div
      dir="rtl"
      className="relative z-10 flex min-w-0 shrink-0 items-center gap-2 border-b border-border/50 bg-sidebar/50 px-2 pt-2"
    >
      <div className="flex h-11 min-w-0 flex-1 items-center px-3 py-2.5 text-sm font-semibold text-foreground">
        <span className="truncate">محتوى الدورة</span>
      </div>

      <div className="ms-auto flex shrink-0 items-center gap-0.5 pe-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={toggleSidebarExpanded}
          aria-label={isSidebarExpanded ? 'تصغير' : 'تكبير'}
        >
          {isSidebarExpanded ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={closeSidebar}
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
};
