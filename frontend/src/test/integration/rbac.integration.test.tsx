import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/guards/ProtectedRoute';
import { PermissionGate } from '../../components/guards/PermissionGate';
import { fixtures } from '../mocks/fixtures';

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithRouter(
  routes: Parameters<typeof createMemoryRouter>[0],
  initialPath: string,
  token?: string,
) {
  if (token) sessionStorage.setItem('auth_token', token);
  const router = createMemoryRouter(routes, { initialEntries: [initialPath] });
  return render(
    <QueryClientProvider client={makeQC()}>
      <ThemeProvider>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('RBAC flow integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
    );
  });

  it('unauthenticated → redirect to login with state.from', async () => {
    renderWithRouter(
      [
        {
          path: '/dashboard',
          element: (
            <AuthProvider>
              <ProtectedRoute><div>Dashboard Content</div></ProtectedRoute>
            </AuthProvider>
          ),
        },
        { path: '/login', element: <div>Login Page</div> },
      ],
      '/dashboard',
    );
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('teacher → admin-only route → redirected to 403', async () => {
    renderWithRouter(
      [
        {
          path: '/fees/pending',
          element: (
            <AuthProvider>
              <ProtectedRoute requiredRole="admin"><div>Pending Fees</div></ProtectedRoute>
            </AuthProvider>
          ),
        },
        { path: '/403', element: <div>Forbidden Page</div> },
        { path: '/login', element: <div>Login Page</div> },
      ],
      '/fees/pending',
      fixtures.teacherToken,
    );
    await waitFor(() => {
      expect(screen.getByText('Forbidden Page')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('admin → protected route → accessible', async () => {
    renderWithRouter(
      [
        {
          path: '/dashboard',
          element: (
            <AuthProvider>
              <ProtectedRoute><div>Dashboard Content</div></ProtectedRoute>
            </AuthProvider>
          ),
        },
        { path: '/login', element: <div>Login Page</div> },
      ],
      '/dashboard',
      fixtures.adminToken,
    );
    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('PermissionGate hides admin controls for teacher', async () => {
    renderWithRouter(
      [
        {
          path: '/page',
          element: (
            <AuthProvider>
              <ProtectedRoute>
                <div>
                  <span>Visible to all</span>
                  <PermissionGate allowedRoles={['admin']}>
                    <button>Admin Only Button</button>
                  </PermissionGate>
                </div>
              </ProtectedRoute>
            </AuthProvider>
          ),
        },
        { path: '/login', element: <div>Login</div> },
      ],
      '/page',
      fixtures.teacherToken,
    );
    await waitFor(() => {
      expect(screen.getByText('Visible to all')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.queryByRole('button', { name: /admin only button/i })).not.toBeInTheDocument();
  });
});
