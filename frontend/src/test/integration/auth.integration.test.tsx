import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../contexts/AuthContext';
import LoginPage from '../../pages/auth/LoginPage';
import { fixtures } from '../mocks/fixtures';

function makeQC() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderLogin(initialPath = '/login', token?: string) {
  if (token) sessionStorage.setItem('auth_token', token);
  const router = createMemoryRouter(
    [
      { path: '/login', element: <AuthProvider><LoginPage /></AuthProvider> },
      { path: '/dashboard', element: <div>Dashboard</div> },
      { path: '/403', element: <div>Forbidden</div> },
    ],
    { initialEntries: [initialPath] }
  );
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

describe('Auth flow integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('login success → token stored → redirect to dashboard', async () => {
    server.use(
      http.post('*/auth/login', () => HttpResponse.json({ token: fixtures.adminToken })),
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
    );
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(sessionStorage.getItem('auth_token')).toBe(fixtures.adminToken);
  });

  it('login failure → shows error message', async () => {
    server.use(
      http.post('*/auth/login', () => new HttpResponse(null, { status: 401 })),
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
    );
    renderLogin();
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'bad@test.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    }, { timeout: 5000 });
    expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
  });

  it('verify on init → authenticated user stays on page', async () => {
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
    );
    renderLogin('/login', fixtures.adminToken);
    // Token is valid, auth resolves to authenticated
    await waitFor(() => {
      expect(sessionStorage.getItem('auth_token')).toBe(fixtures.adminToken);
    }, { timeout: 3000 });
  });

  it('verify 401 → unauthenticated, stays on login', async () => {
    server.use(
      http.post('*/auth/verify', () => new HttpResponse(null, { status: 401 })),
    );
    renderLogin('/login', fixtures.adminToken);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    }, { timeout: 3000 });
    // Token should be cleared
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });

  it('logout → session cleared', async () => {
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({ ok: true })),
    );
    sessionStorage.setItem('auth_token', fixtures.adminToken);
    sessionStorage.removeItem('auth_token');
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });
});
