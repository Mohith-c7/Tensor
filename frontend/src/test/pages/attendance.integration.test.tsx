import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../contexts/AuthContext';
import AttendancePage from '../../pages/attendance/AttendancePage';

const makeJwt = (payload: object) => {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
};

const adminToken = makeJwt({
  userId: 1, role: 'admin', email: 'admin@test.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

const mockRecords = [
  { id: 1, studentId: 1, studentName: 'Alice Smith', admissionNo: 'ADM001', date: new Date().toISOString(), status: 'present', remarks: '' },
  { id: 2, studentId: 2, studentName: 'Bob Jones', admissionNo: 'ADM002', date: new Date().toISOString(), status: 'absent', remarks: '' },
];

function renderAttendancePage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  sessionStorage.setItem('auth_token', adminToken);
  const router = createMemoryRouter(
    [{ path: '/attendance', element: <AuthProvider><AttendancePage /></AuthProvider> }],
    { initialEntries: ['/attendance'] }
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

describe('Attendance integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('auth_token', adminToken);
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
      http.get('*/attendance/class', () => HttpResponse.json(mockRecords))
    );
  });

  it('renders class/section/date selectors', () => {
    renderAttendancePage();
    expect(screen.getByLabelText(/class id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/section id/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  it('shows future date warning', async () => {
    renderAttendancePage();
    const user = userEvent.setup();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await user.clear(screen.getByLabelText(/date/i));
    await user.type(screen.getByLabelText(/date/i), tomorrowStr);
    await waitFor(() => {
      expect(screen.getByText(/cannot be marked for future dates/i)).toBeInTheDocument();
    });
  });

  it('loads existing attendance records when class/section/date selected', async () => {
    renderAttendancePage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/class id/i), '1');
    await user.type(screen.getByLabelText(/section id/i), '1');
    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows save button after records load', async () => {
    renderAttendancePage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/class id/i), '1');
    await user.type(screen.getByLabelText(/section id/i), '1');
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save attendance/i })).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows error retry on attendance fetch failure', async () => {
    server.use(
      http.get('*/attendance/class', () => HttpResponse.json({ message: 'Error' }, { status: 500 }))
    );
    renderAttendancePage();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/class id/i), '1');
    await user.type(screen.getByLabelText(/section id/i), '1');
    await waitFor(() => {
      expect(screen.getByText(/failed to load attendance/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
