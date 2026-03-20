import React from 'react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';

/**
 * Root layout that provides AuthContext to all routes.
 * Must be inside RouterProvider so AuthProvider can use useNavigate.
 */
export function AuthLayout() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  );
}
