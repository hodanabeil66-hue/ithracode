/** Course modules (sections) and lessons (lectures) for html-css-fundamentals. */

export const HTML_CSS_FUNDAMENTALS_SLUG = 'html-css-fundamentals';

export const HTML_CSS_FRONTEND_PATH_SLUG = 'frontend-development';
export const HTML_CSS_FRONTEND_TRACK_SLUG = 'frontend-development-track';

export const HTML_CSS_COURSE_MODULES: ReadonlyArray<{
  title: string;
  lessons: readonly string[];
}> = [
  {
    title: 'Introduction to Web Development',
    lessons: [
      'What is Web Development?',
      'How Websites Work',
      'Introduction to HTML, CSS, and JavaScript',
      'Setting Up the Development Environment',
    ],
  },
  {
    title: 'HTML Fundamentals',
    lessons: [
      'HTML Document Structure',
      'HTML Elements and Attributes',
      'Headings, Paragraphs, and Text Formatting',
      'Links and Images',
      'Lists and Tables',
    ],
  },
  {
    title: 'HTML Forms & Semantic HTML',
    lessons: [
      'HTML Forms',
      'Input Types and Validation',
      'Semantic HTML5 Elements',
      'Accessibility Basics',
    ],
  },
  {
    title: 'CSS Fundamentals',
    lessons: [
      'Introduction to CSS',
      'CSS Syntax and Selectors',
      'Colors and Backgrounds',
      'Typography and Fonts',
      'External, Internal, and Inline CSS',
    ],
  },
  {
    title: 'CSS Box Model',
    lessons: [
      'Margin and Padding',
      'Borders and Dimensions',
      'Display Properties',
      'Positioning',
      'Overflow and Z-Index',
    ],
  },
  {
    title: 'Flexbox',
    lessons: [
      'Flexbox Fundamentals',
      'Main Axis and Cross Axis',
      'Alignment and Justification',
      'Building Layouts with Flexbox',
    ],
  },
  {
    title: 'CSS Grid',
    lessons: [
      'Grid Fundamentals',
      'Rows and Columns',
      'Grid Areas',
      'Practical Grid Layouts',
    ],
  },
  {
    title: 'Responsive Web Design',
    lessons: [
      'Media Queries',
      'Mobile-First Design',
      'Responsive Units',
      'Building Responsive Layouts',
    ],
  },
  {
    title: 'Practical Projects',
    lessons: [
      'Build a Personal Portfolio',
      'Create a Responsive Landing Page',
      'Build a Complete Website Using HTML & CSS',
    ],
  },
  {
    title: 'Final Project',
    lessons: [
      'Build a complete responsive website',
      'Apply HTML semantic structure',
      'Implement modern CSS layouts',
      'Ensure mobile and desktop compatibility',
    ],
  },
];

export function countHtmlCssLessons(): number {
  return HTML_CSS_COURSE_MODULES.reduce(
    (sum, module) => sum + module.lessons.length,
    0,
  );
}