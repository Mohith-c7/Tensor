import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../contexts/AuthContext';
import StudentsPage from '../../pages/students/StudentsPage';
import StudentNewPage from '../../pages/students/StudentNewPage';

const makeJwt = (payload: object) => {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
};

const adminToken = makeJwt({
  userId: 1, role: 'admin', email: 'admin@test.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

const mockStudents = [
  { id: 1, admissionNo: 'ADM001', firstName: 'Alice', lastName: 'Smith', className: '10A', sectionName: 'A', gender: 'female', isActive: true, classId: 1, sectionId: 1, dateOfBirth: '2005-01-01', admissionDate: '2020-06-01', parentName: 'Bob Smith', parentPhone: '1234567890', createdAt: new Date(), updatedAt: new Date() },
  { id: 2, admissionNo: 'ADM002', firstName: 'Bob', lastName: 'Jones', className: '10B', sectionName: 'B', gender: 'male', isActive: true, classId: 1, sectionId: 2, dateOfBirth: '2005-03-15', admissionDate: '2020-06-01', parentName: 'Carol Jones', parentPhone: '0987654321', createdAt: new Date(), updatedAt: new Date() },
];

function makeRouter(element: React.ReactElement, path = '/students') {
  return createMemoryRouter(
    [
      { path, element },
      { path: '/students/:id', element: <div>Profile</div> },
      { path: '/students/new', element: <StudentNewPage /> },
      { path: '/login', element: <div>Login</div> },
    ],
    { initialEntries: [path] }
  );
}

function renderWithProviders(element: React.ReactElement, path = '/students') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = makeRouter(element, path);
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

describe('Students integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('auth_token', adminToken);
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
      http.get('*/students', () =>
        HttpResponse.json({
          data: mockStudents,
          pagination: { total: 2, page: 1, totalPages: 1, limit: 20 },
        })
      )
    );
  });

  it('loads and displays student list', async () => {
    renderWithProviders(
      <AuthProvider><StudentsPage /></AuthProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows empty state when no students match filters', async () => {
    server.use(
      http.get('*/students', () =>
        HttpResponse.json({ data: [], pagination: { total: 0, page: 1, totalPages: 0, limit: 20 } })
      )
    );
    renderWithProviders(<AuthProvider><StudentsPage /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByText(/no students match/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows retry button on error', async () => {
    server.use(
      http.get('*/students', () => HttpResponse.json({ message: 'Server error' }, { status: 500 }))
    );
    renderWithProviders(<AuthProvider><StudentsPage /></AuthProvider>);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows Add Student button for admin', async () => {
    renderWithProviders(<AuthProvider><StudentsPage /></AuthProvider>);
    // Wait for auth verify to complete and students to load
    await waitFor(() => {
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.getByRole('button', { name: /add student/i })).toBeInTheDocument();
  });

  it('student new page renders step 1 fields', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const router = createMemoryRouter(
      [{ path: '/students/new', element: <AuthProvider><StudentNewPage /></AuthProvider> }],
      { initialEntries: ['/students/new'] }
    );
    render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
    await waitFor(() => {
      expect(screen.getByLabelText(/admission no/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
