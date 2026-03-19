import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../contexts/AuthContext';
import ExamsPage from '../../pages/exams/ExamsPage';
import ExamResultsPage from '../../pages/exams/ExamResultsPage';
import StudentResultsPage from '../../pages/exams/StudentResultsPage';

const makeJwt = (payload: object) => {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
};

const adminToken = makeJwt({
  userId: 1, role: 'admin', email: 'admin@test.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

const mockExams = [
  { id: 1, name: 'Math Final', examType: 'final', classId: 1, className: 'Class 10', subject: 'Mathematics', maxMarks: 100, passingMarks: 40, examDate: new Date().toISOString() },
];

const mockResults = {
  average: 72.5, highest: 95, lowest: 35, passCount: 28, failCount: 2, passPercentage: 93.3,
  distribution: [{ range: '0-20', count: 0 }, { range: '21-40', count: 2 }, { range: '41-60', count: 8 }, { range: '61-80', count: 12 }, { range: '81-100', count: 8 }],
};

const mockStudentResults = [
  { id: 1, examId: 1, studentId: 1, studentName: 'Alice Smith', admissionNo: 'ADM001', marksObtained: 85, isAbsent: false, grade: 'A', isPassed: true },
];

function renderPage(element: React.ReactElement, routePath: string, initialPath: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  sessionStorage.setItem('auth_token', adminToken);
  const router = createMemoryRouter(
    [
      { path: routePath, element: <AuthProvider>{element}</AuthProvider> },
      { path: '/exams/new', element: <div>New Exam</div> },
      { path: '/exams/:id/marks', element: <div>Marks</div> },
      { path: '/404', element: <div>Not Found</div> },
    ],
    { initialEntries: [initialPath] }
  );
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Exams integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('auth_token', adminToken);
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
      http.get('*/exams', () => HttpResponse.json({ data: mockExams, pagination: { total: 1, page: 1, totalPages: 1, limit: 20 } })),
      http.get('*/exams/*/results', () => HttpResponse.json(mockResults)),
      http.get('*/exams/student/*', () => HttpResponse.json(mockStudentResults)),
      http.get('*/exams/*', () => HttpResponse.json(mockExams[0])),
    );
  });

  it('displays exam list', async () => {
    renderPage(<ExamsPage />, '/exams', '/exams');
    await waitFor(() => {
      expect(screen.getByText('Math Final')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows Create Exam button for admin', async () => {
    renderPage(<ExamsPage />, '/exams', '/exams');
    await waitFor(() => {
      expect(screen.getByText('Math Final')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.getByRole('button', { name: /create exam/i })).toBeInTheDocument();
  });

  it('displays exam results statistics', async () => {
    renderPage(<ExamResultsPage />, '/exams/:id/results', '/exams/1/results');
    await waitFor(() => {
      expect(screen.getByText('72.5')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('displays student results with grade', async () => {
    renderPage(<StudentResultsPage />, '/exams/student/:id', '/exams/student/1');
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
