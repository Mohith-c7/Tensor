import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../router/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'teacher';
}

/**
 * Guard component that enforces authentication and optional role checks.
 * Requirements: 2.1, 2.2, 2.8
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { status, user } = useAuth();
  const location = useLocation();

  if (status === 'initializing') {
    return <PageSkeleton />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }

  return <>{children}</>;
}

function PageSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
