/**
 * Integration tests for route guard scenarios.
 * Requirements: 16.5
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

import { ProtectedRoute } from '../../components/guards/ProtectedRoute';
import { PermissionGate } from '../../components/guards/PermissionGate';

function LocationDisplay() {
  const location = useLocation();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="from">{(location.state as { from?: { pathname: string } })?.from?.pathname ?? ''}</span>
    </div>
  );
}

describe('Route Guard Integration Tests', () => {
  it('unauthenticated redirect preserves the original path in state.from', () => {
    mockUseAuth.mockReturnValue({ status: 'unauthenticated', user: null });

    render(
      <MemoryRouter initialEntries={['/students']}>
        <Routes>
          <Route
            path="/students"
            element={
              <ProtectedRoute>
                <div>Students</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('pathname').textContent).toBe('/login');
    expect(screen.getByTestId('from').textContent).toBe('/students');
  });

  it('teacher is blocked from admin-only routes and redirected to /403', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: 2, role: 'teacher', email: 'teacher@test.com', firstName: 'T', lastName: 'T' },
    });

    render(
      <MemoryRouter initialEntries={['/fees/structures/new']}>
        <Routes>
          <Route
            path="/fees/structures/new"
            element={
              <ProtectedRoute requiredRole="admin">
                <div data-testid="admin-page">Admin Page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/403" element={<div data-testid="forbidden">Forbidden</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId('admin-page')).toBeNull();
    expect(screen.getByTestId('forbidden')).toBeDefined();
  });

  it('admin can access all routes', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: 1, role: 'admin', email: 'admin@test.com', firstName: 'A', lastName: 'A' },
    });

    const adminRoutes = ['/students', '/fees/structures/new', '/fees/pending', '/exams/new'];

    for (const path of adminRoutes) {
      const { unmount } = render(
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route
              path={path}
              element={
                <ProtectedRoute requiredRole="admin">
                  <div data-testid="content">Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      );
      expect(screen.getByTestId('content')).toBeDefined();
      unmount();
    }
  });

  it('PermissionGate hides admin controls for teacher role', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: 2, role: 'teacher', email: 'teacher@test.com', firstName: 'T', lastName: 'T' },
    });

    render(
      <MemoryRouter>
        <div>
          <span data-testid="visible">Visible to all</span>
          <PermissionGate allowedRoles={['admin']}>
            <span data-testid="admin-only">Admin Only</span>
          </PermissionGate>
        </div>
      </MemoryRouter>
    );

    expect(screen.getByTestId('visible')).toBeDefined();
    expect(screen.queryByTestId('admin-only')).toBeNull();
  });
});
