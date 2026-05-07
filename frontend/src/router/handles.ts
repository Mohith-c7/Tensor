import type { RouteHandle } from '../types/domain';

/**
 * Breadcrumb handle definitions for all routes.
 * Requirements: 4.5
 */
export const handles: Record<string, RouteHandle> = {
  dashboard: {
    breadcrumb: () => 'Dashboard',
  },
  students: {
    breadcrumb: () => 'Students',
  },
  studentNew: {
    breadcrumb: () => 'New Student',
  },
  studentEdit: {
    breadcrumb: (params) => `Edit Student #${params.id}`,
  },
  studentProfile: {
    breadcrumb: (params) => `Student #${params.id}`,
  },
  attendance: {
    breadcrumb: () => 'Attendance',
  },
  attendanceStudent: {
    breadcrumb: (params) => `Student #${params.id} Attendance`,
  },
  feesStructures: {
    breadcrumb: () => 'Fee Structures',
  },
  feesStructureNew: {
    breadcrumb: () => 'New Fee Structure',
  },
  feesPayments: {
    breadcrumb: () => 'Payments',
  },
  feesPaymentNew: {
    breadcrumb: () => 'Record Payment',
  },
  feesStudent: {
    breadcrumb: (params) => `Student #${params.id} Fees`,
  },
  feesPending: {
    breadcrumb: () => 'Pending Fees',
  },
  feesClass: {
    breadcrumb: () => 'Class-wise Fees',
  },
  exams: {
    breadcrumb: () => 'Exams',
  },
  examNew: {
    breadcrumb: () => 'New Exam',
  },
  examMarks: {
    breadcrumb: (params) => `Exam #${params.id} Marks`,
  },
  examResults: {
    breadcrumb: (params) => `Exam #${params.id} Results`,
  },
  examStudentResults: {
    breadcrumb: (params) => `Student #${params.id} Results`,
  },
  timetable: {
    breadcrumb: () => 'Timetable',
  },
  timetableTeacher: {
    breadcrumb: (params) => `Teacher #${params.id} Timetable`,
  },
};
