import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/guards/ProtectedRoute';
import { AuthLayout } from '../components/layout/AuthLayout';
import { AppShellLayout } from '../components/layout/AppShellLayout';
import { ROUTES } from './routes';
import { handles } from './handles';

// Lazy-loaded page components
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'));

const StudentsPage = lazy(() => import('../pages/students/StudentsPage'));
const StudentNewPage = lazy(() => import('../pages/students/StudentNewPage'));
const StudentEditPage = lazy(() => import('../pages/students/StudentEditPage'));
const StudentProfilePage = lazy(() => import('../pages/students/StudentProfilePage'));

const AttendancePage = lazy(() => import('../pages/attendance/AttendancePage'));
const AttendanceStudentPage = lazy(() => import('../pages/attendance/AttendanceStudentPage'));

const FeeStructuresPage = lazy(() => import('../pages/fees/FeeStructuresPage'));
const FeeStructureNewPage = lazy(() => import('../pages/fees/FeeStructureNewPage'));
const PaymentsPage = lazy(() => import('../pages/fees/PaymentsPage'));
const PaymentNewPage = lazy(() => import('../pages/fees/PaymentNewPage'));
const StudentFeePage = lazy(() => import('../pages/fees/StudentFeePage'));
const PendingFeesPage = lazy(() => import('../pages/fees/PendingFeesPage'));
const ClassFeesPage = lazy(() => import('../pages/fees/ClassFeesPage'));

const ExamsPage = lazy(() => import('../pages/exams/ExamsPage'));
const ExamNewPage = lazy(() => import('../pages/exams/ExamNewPage'));
const ExamMarksPage = lazy(() => import('../pages/exams/ExamMarksPage'));
const ExamResultsPage = lazy(() => import('../pages/exams/ExamResultsPage'));
const StudentResultsPage = lazy(() => import('../pages/exams/StudentResultsPage'));

const TimetablePage = lazy(() => import('../pages/timetable/TimetablePage'));
const TeacherTimetablePage = lazy(() => import('../pages/timetable/TeacherTimetablePage'));

const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));
const ForbiddenPage = lazy(() => import('../pages/errors/ForbiddenPage'));

const PageSkeleton = () => (
  <div role="status" aria-label="Loading page" style={{ minHeight: '100vh' }} />
);

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<PageSkeleton />}>{element}</Suspense>
);

export const router = createBrowserRouter([
  {
    // Root layout: provides AuthProvider to all routes
    element: <AuthLayout />,
    children: [
  {
    path: ROUTES.LOGIN,
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShellLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to={ROUTES.DASHBOARD} replace /> },
      {
        path: ROUTES.DASHBOARD,
        element: withSuspense(<DashboardPage />),
        handle: handles.dashboard,
      },

      // Students
      {
        path: ROUTES.STUDENTS,
        element: withSuspense(<StudentsPage />),
        handle: handles.students,
      },
      {
        path: ROUTES.STUDENT_NEW,
        element: withSuspense(
          <ProtectedRoute requiredRole="admin">
            <StudentNewPage />
          </ProtectedRoute>
        ),
        handle: handles.studentNew,
      },
      {
        path: ROUTES.STUDENT_EDIT,
        element: withSuspense(
          <ProtectedRoute requiredRole="admin">
            <StudentEditPage />
          </ProtectedRoute>
        ),
        handle: handles.studentEdit,
      },
      {
        path: ROUTES.STUDENT_PROFILE,
        element: withSuspense(<StudentProfilePage />),
        handle: handles.studentProfile,
      },

      // Attendance
      {
        path: ROUTES.ATTENDANCE,
        element: withSuspense(<AttendancePage />),
        handle: handles.attendance,
      },
      {
        path: ROUTES.ATTENDANCE_STUDENT,
        element: withSuspense(<AttendanceStudentPage />),
        handle: handles.attendanceStudent,
      },

      // Fees
      {
        path: ROUTES.FEES_STRUCTURES,
        element: withSuspense(<FeeStructuresPage />),
        handle: handles.feesStructures,
      },
      {
        path: ROUTES.FEES_STRUCTURE_NEW,
        element: withSuspense(
          <ProtectedRoute requiredRole="admin">
            <FeeStructureNewPage />
          </ProtectedRoute>
        ),
        handle: handles.feesStructureNew,
      },
      {
        path: ROUTES.FEES_PAYMENTS,
        element: withSuspense(<PaymentsPage />),
        handle: handles.feesPayments,
      },
      {
        path: ROUTES.FEES_PAYMENT_NEW,
        element: withSuspense(
          <ProtectedRoute requiredRole="admin">
            <PaymentNewPage />
          </ProtectedRoute>
        ),
        handle: handles.feesPaymentNew,
      },
      {
        path: ROUTES.FEES_STUDENT,
        element: withSuspense(<StudentFeePage />),
        handle: handles.feesStudent,
      },
      {
        path: ROUTES.FEES_PENDING,
        element: withSuspense(
          <ProtectedRoute requiredRole="admin">
            <PendingFeesPage />
          </ProtectedRoute>
        ),
        handle: handles.feesPending,
      },
      {
        path: ROUTES.FEES_CLASS,
        element: withSuspense(<ClassFeesPage />),
        handle: handles.feesClass,
      },

      // Exams
      {
        path: ROUTES.EXAMS,
        element: withSuspense(<ExamsPage />),
        handle: handles.exams,
      },
      {
        path: ROUTES.EXAM_NEW,
        element: withSuspense(
          <ProtectedRoute requiredRole="admin">
            <ExamNewPage />
          </ProtectedRoute>
        ),
        handle: handles.examNew,
      },
      {
        path: ROUTES.EXAM_MARKS,
        element: withSuspense(<ExamMarksPage />),
        handle: handles.examMarks,
      },
      {
        path: ROUTES.EXAM_RESULTS,
        element: withSuspense(<ExamResultsPage />),
        handle: handles.examResults,
      },
      {
        path: ROUTES.EXAM_STUDENT_RESULTS,
        element: withSuspense(<StudentResultsPage />),
        handle: handles.examStudentResults,
      },

      // Timetable
      {
        path: ROUTES.TIMETABLE,
        element: withSuspense(<TimetablePage />),
        handle: handles.timetable,
      },
      {
        path: ROUTES.TIMETABLE_TEACHER,
        element: withSuspense(<TeacherTimetablePage />),
        handle: handles.timetableTeacher,
      },
    ],
  },

  // Error pages
  { path: ROUTES.NOT_FOUND, element: withSuspense(<NotFoundPage />) },
  { path: ROUTES.FORBIDDEN, element: withSuspense(<ForbiddenPage />) },
  { path: '*', element: <Navigate to={ROUTES.NOT_FOUND} replace /> },
    ],
  },
]);
