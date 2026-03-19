import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '../types/api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,          // 10 minutes
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // No retry for 4xx errors
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000), // 1s, 2s, 4s
    },
    mutations: {
      retry: false,
    },
  },
});

// Query key factories for all domains
export const queryKeys = {
  students: {
    all: ['students'] as const,
    lists: () => [...queryKeys.students.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.students.lists(), params] as const,
    details: () => [...queryKeys.students.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.students.details(), id] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    class: (classId: number, sectionId: number, date: string) =>
      [...queryKeys.attendance.all, 'class', classId, sectionId, date] as const,
    student: (studentId: number, start: string, end: string) =>
      [...queryKeys.attendance.all, 'student', studentId, start, end] as const,
  },
  fees: {
    all: ['fees'] as const,
    structures: () => [...queryKeys.fees.all, 'structures'] as const,
    payments: () => [...queryKeys.fees.all, 'payments'] as const,
    studentStatus: (studentId: number, year: string) =>
      [...queryKeys.fees.all, 'student', studentId, year] as const,
    pending: () => [...queryKeys.fees.all, 'pending'] as const,
  },
  exams: {
    all: ['exams'] as const,
    lists: () => [...queryKeys.exams.all, 'list'] as const,
    list: (params: Record<string, unknown>) => [...queryKeys.exams.lists(), params] as const,
    detail: (id: number) => [...queryKeys.exams.all, 'detail', id] as const,
    marks: (examId: number) => [...queryKeys.exams.all, 'marks', examId] as const,
    results: (examId: number) => [...queryKeys.exams.all, 'results', examId] as const,
    studentResults: (studentId: number) =>
      [...queryKeys.exams.all, 'student-results', studentId] as const,
  },
  timetable: {
    all: ['timetable'] as const,
    class: (classId: number, sectionId: number) =>
      [...queryKeys.timetable.all, 'class', classId, sectionId] as const,
    teacher: (teacherId: number) =>
      [...queryKeys.timetable.all, 'teacher', teacherId] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    kpis: () => [...queryKeys.dashboard.all, 'kpis'] as const,
    attendanceTrend: () => [...queryKeys.dashboard.all, 'attendance-trend'] as const,
    feeCollection: () => [...queryKeys.dashboard.all, 'fee-collection'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'] as const,
  },
};
