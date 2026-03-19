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
import FeeStructuresPage from '../../pages/fees/FeeStructuresPage';
import StudentFeePage from '../../pages/fees/StudentFeePage';

const makeJwt = (payload: object) => {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
};

const adminToken = makeJwt({
  userId: 1, role: 'admin', email: 'admin@test.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

const mockStructures = [
  { id: 1, classId: 1, className: 'Class 10', academicYear: '2024-2025', tuitionFee: 50000, transportFee: 5000, activityFee: 2000, otherFee: 1000, totalFee: 58000 },
];

const mockFeeStatus = {
  feeStructure: mockStructures[0],
  totalFee: 58000,
  totalPaid: 30000,
  outstandingBalance: 28000,
  payments: [
    { id: 1, studentId: 1, academicYear: '2024-2025', amount: 30000, paymentDate: new Date().toISOString(), paymentMethod: 'cash', transactionId: 'TXN001' },
  ],
};

function renderPage(element: React.ReactElement, path: string, initialPath?: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  sessionStorage.setItem('auth_token', adminToken);
  const router = createMemoryRouter(
    [
      { path, element: <AuthProvider>{element}</AuthProvider> },
      { path: '/fees/structures/new', element: <div>New Structure</div> },
      { path: '/fees/student/:id', element: <AuthProvider><StudentFeePage /></AuthProvider> },
      { path: '/404', element: <div>Not Found</div> },
    ],
    { initialEntries: [initialPath ?? path] }
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

describe('Fees integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('auth_token', adminToken);
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
      http.get('*/fees/structures', () => HttpResponse.json(mockStructures)),
      http.get('*/fees/student/*', () => HttpResponse.json(mockFeeStatus)),
    );
  });

  it('displays fee structures list', async () => {
    renderPage(<FeeStructuresPage />, '/fees/structures');
    await waitFor(() => {
      expect(screen.getByText('Class 10')).toBeInTheDocument();
      expect(screen.getByText('2024-2025')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows Add Fee Structure button for admin', async () => {
    renderPage(<FeeStructuresPage />, '/fees/structures');
    await waitFor(() => {
      expect(screen.getByText('Class 10')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.getByRole('button', { name: /add fee structure/i })).toBeInTheDocument();
  });

  it('displays student fee status with outstanding balance', async () => {
    renderPage(<StudentFeePage />, '/fees/student/:id', '/fees/student/1');
    await waitFor(() => {
      expect(screen.getByText(/outstanding/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows warning when no fee structure exists', async () => {
    server.use(
      http.get('*/fees/student/*', () =>
        HttpResponse.json({ feeStructure: null, totalFee: 0, totalPaid: 0, outstandingBalance: 0, payments: [] })
      )
    );
    renderPage(<StudentFeePage />, '/fees/student/:id', '/fees/student/1');
    await waitFor(() => {
      expect(screen.getByText(/no fee structure found/i)).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
