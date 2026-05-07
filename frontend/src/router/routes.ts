/**
 * Typed route path constants.
 * Requirements: 4.1
 */
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',

  STUDENTS: '/students',
  STUDENT_NEW: '/students/new',
  STUDENT_EDIT: '/students/:id/edit',
  STUDENT_PROFILE: '/students/:id',

  ATTENDANCE: '/attendance',
  ATTENDANCE_STUDENT: '/attendance/student/:id',

  FEES_STRUCTURES: '/fees/structures',
  FEES_STRUCTURE_NEW: '/fees/structures/new',
  FEES_PAYMENTS: '/fees/payments',
  FEES_PAYMENT_NEW: '/fees/payments/new',
  FEES_STUDENT: '/fees/student/:id',
  FEES_PENDING: '/fees/pending',
  FEES_CLASS: '/fees/class',

  EXAMS: '/exams',
  EXAM_NEW: '/exams/new',
  EXAM_MARKS: '/exams/:id/marks',
  EXAM_RESULTS: '/exams/:id/results',
  EXAM_STUDENT_RESULTS: '/exams/student/:id',

  TIMETABLE: '/timetable',
  TIMETABLE_TEACHER: '/timetable/teacher/:id',

  NOT_FOUND: '/404',
  FORBIDDEN: '/403',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

/** Build a concrete path by replacing :param segments */
export function buildPath(route: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (path, [key, value]) => path.replace(`:${key}`, String(value)),
    route
  );
}
