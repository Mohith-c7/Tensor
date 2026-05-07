import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { ThemeProvider } from '../../contexts/ThemeContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { AuthProvider } from '../../contexts/AuthContext';
import LoginPage from '../../pages/auth/LoginPage';

// Minimal valid JWT for testing (header.payload.sig)
const makeJwt = (payload: object) => {
  const enc = (obj: object) => btoa(JSON.stringify(obj)).replace(/=/g, '');
  return `${enc({ alg: 'HS256' })}.${enc(payload)}.sig`;
};

const validToken = makeJwt({
  userId: 1,
  role: 'admin',
  email: 'admin@test.com',
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
});

function renderLogin(initialPath = '/login', state?: object) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <ThemeProvider>
        <ToastProvider>
          <MemoryRouter initialEntries={[{ pathname: initialPath, state }]}>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/dashboard" element={<div>Dashboard</div>} />
              </Routes>
            </AuthProvider>
          </MemoryRouter>
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('LoginPage integration', () => {
  beforeEach(() => {
    sessionStorage.clear();
    // Default: verify returns 401 (no existing session)
    server.use(
      http.post('*/auth/verify', () => HttpResponse.json({}, { status: 401 }))
    );
  });

  it('renders email and password fields', async () => {
    renderLogin();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('disables submit button while submitting', async () => {
    server.use(
      http.post('*/auth/login', async () => {
        await new Promise((r) => setTimeout(r, 100));
        return HttpResponse.json({ token: validToken });
      })
    );
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
  });

  it('redirects to dashboard on successful login', async () => {
    server.use(
      http.post('*/auth/login', () => HttpResponse.json({ token: validToken }))
    );
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'admin@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
    });
  });

  it('redirects to state.from on successful login', async () => {
    server.use(
      http.post('*/auth/login', () => HttpResponse.json({ token: validToken }))
    );
    renderLogin('/login', { from: { pathname: '/students' } });
    // Add students route
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const { unmount } = render(
      <QueryClientProvider client={qc}>
        <ThemeProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={[{ pathname: '/login', state: { from: { pathname: '/students' } } }]}>
              <AuthProvider>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/students" element={<div>Students</div>} />
                  <Route path="/dashboard" element={<div>Dashboard</div>} />
                </Routes>
              </AuthProvider>
            </MemoryRouter>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
    const user = userEvent.setup();
    await user.type(screen.getAllByLabelText(/email/i)[1], 'admin@test.com');
    await user.type(screen.getAllByLabelText(/password/i)[1], 'password123');
    await user.click(screen.getAllByRole('button', { name: /sign in/i })[1]);
    await waitFor(() => {
      expect(screen.getByText('Students')).toBeInTheDocument();
    });
    unmount();
  });

  it('shows error message on login failure', async () => {
    server.use(
      http.post('*/auth/login', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }))
    );
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'wrong@test.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
    });
  });

  it('shows validation error for invalid email', async () => {
    renderLogin();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'not-an-email');
    await user.type(screen.getByLabelText(/password/i), 'pass');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });
});
