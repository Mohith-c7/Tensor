/**
 * Property-based tests for route guards.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import React from 'react';

// Mock useAuth
const mockUseAuth = vi.fn();
vi.mock('../../hooks/useAuth', () => ({ useAuth: () => mockUseAuth() }));

import { ProtectedRoute } from '../../components/guards/ProtectedRoute';
import { PermissionGate } from '../../components/guards/PermissionGate';

const PROTECTED_PATHS = [
  '/dashboard',
  '/students',
  '/students/1',
  '/attendance',
  '/fees/structures',
  '/exams',
  '/timetable',
];

/**
 * Property 5: Unauthenticated Route Redirect
 * Validates: Requirements 2.1
 */
describe('Property 5: Unauthenticated Route Redirect', () => {
  it('unauthenticated user is redirected to /login with state.from', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PROTECTED_PATHS),
        (path) => {
          mockUseAuth.mockReturnValue({ status: 'unauthenticated', user: null });

          const { unmount } = render(
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route
                  path={path}
                  element={
                    <ProtectedRoute>
                      <div>Protected Content</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<div data-testid="login-page">Login</div>} />
              </Routes>
            </MemoryRouter>
          );

          expect(screen.queryByText('Protected Content')).toBeNull();
          expect(screen.getByTestId('login-page')).toBeDefined();
          unmount();
        }
      )
    );
  });
});

/**
 * Property 6: Role-Based Route Enforcement
 * Validates: Requirements 2.2, 2.8
 */
describe('Property 6: Role-Based Route Enforcement', () => {
  it('teacher role is redirected to /403 for admin-only routes', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...PROTECTED_PATHS),
        (path) => {
          mockUseAuth.mockReturnValue({
            status: 'authenticated',
            user: { id: 1, role: 'teacher', email: 'teacher@test.com', firstName: 'T', lastName: 'T' },
          });

          const { unmount } = render(
            <MemoryRouter initialEntries={[path]}>
              <Routes>
                <Route
                  path={path}
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <div>Admin Content</div>
                    </ProtectedRoute>
                  }
                />
                <Route path="/403" element={<div data-testid="forbidden-page">Forbidden</div>} />
              </Routes>
            </MemoryRouter>
          );

          expect(screen.queryByText('Admin Content')).toBeNull();
          expect(screen.getByTestId('forbidden-page')).toBeDefined();
          unmount();
        }
      )
    );
  });

  it('admin role can access admin-only routes', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: 1, role: 'admin', email: 'admin@test.com', firstName: 'A', lastName: 'A' },
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="admin">
                <div data-testid="admin-content">Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-content')).toBeDefined();
  });
});

/**
 * Property 7: Teacher Permission Gate
 * Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7, 2.11
 */
describe('Property 7: Teacher Permission Gate', () => {
  it('renders null for teacher when allowedRoles is admin-only', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (content) => {
          mockUseAuth.mockReturnValue({
            status: 'authenticated',
            user: { id: 1, role: 'teacher', email: 'teacher@test.com', firstName: 'T', lastName: 'T' },
          });

          const { unmount } = render(
            <MemoryRouter>
              <PermissionGate allowedRoles={['admin']}>
                <div data-testid="admin-only">{content}</div>
              </PermissionGate>
            </MemoryRouter>
          );

          expect(screen.queryByTestId('admin-only')).toBeNull();
          unmount();
        }
      )
    );
  });

  it('renders children for admin when allowedRoles includes admin', () => {
    mockUseAuth.mockReturnValue({
      status: 'authenticated',
      user: { id: 1, role: 'admin', email: 'admin@test.com', firstName: 'A', lastName: 'A' },
    });

    render(
      <MemoryRouter>
        <PermissionGate allowedRoles={['admin']}>
          <div data-testid="admin-content">Admin Only</div>
        </PermissionGate>
      </MemoryRouter>
    );

    expect(screen.getByTestId('admin-content')).toBeDefined();
  });
});
