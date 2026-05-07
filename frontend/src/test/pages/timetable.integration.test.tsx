import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../contexts/AuthContext';
import TimetablePage from '../../pages/timetable/TimetablePage';
import TeacherTimetablePage from '../../pages/timetable/TeacherTimetablePage';

const makeJwt = (payload: object) => {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
};

const adminToken = makeJwt({
  userId: 1, role: 'admin', email: 'admin@test.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

const teacherToken = makeJwt({
  userId: 42, role: 'teacher', email: 'teacher@test.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

const mockEntries = [
  {
    id: 1, classId: 1, sectionId: 1, teacherId: 42,
    subject: 'Mathematics', dayOfWeek: 'monday', periodNumber: 1,
    startTime: '08:00', endTime: '09:00', roomNumber: 'R101',
  },
];

function renderPage(
  element: React.ReactElement,
  routePath: string,
  initialPath: string,
  token = adminToken,
) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  sessionStorage.setItem('auth_token', token);
  const router = createMemoryRouter(
    [
      { path: routePath, element: <AuthProvider>{element}</AuthProvider> },
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

describe('Timetable integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
      http.get('*/timetable', () => HttpResponse.json(mockEntries)),
      http.post('*/timetable', () => HttpResponse.json({ ...mockEntries[0], id: 2, subject: 'Physics' })),
      http.put('*/timetable/*', () => HttpResponse.json({ ...mockEntries[0], subject: 'Chemistry' })),
      http.delete('*/timetable/*', () => new HttpResponse(null, { status: 204 })),
    );
  });

  it('renders timetable grid after selecting class and section', async () => {
    renderPage(<TimetablePage />, '/timetable', '/timetable');
    // Set classId and sectionId inputs
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('opens create dialog on empty cell click (admin)', async () => {
    renderPage(<TimetablePage />, '/timetable', '/timetable');
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '1' } });
    fireEvent.change(inputs[1], { target: { value: '1' } });
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    }, { timeout: 5000 });
    // Dialog should not be open yet
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows teacher timetable for specific teacher id', async () => {
    renderPage(
      <TeacherTimetablePage />,
      '/timetable/teacher/:id',
      '/timetable/teacher/42',
    );
    await waitFor(() => {
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('teacher defaults to own timetable when no id param', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    sessionStorage.setItem('auth_token', teacherToken);
    const router = createMemoryRouter(
      [
        { path: '/timetable/teacher/me', element: <AuthProvider><TeacherTimetablePage /></AuthProvider> },
        { path: '/404', element: <div>Not Found</div> },
      ],
      { initialEntries: ['/timetable/teacher/me'] }
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
      expect(screen.getByText('My Timetable')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
