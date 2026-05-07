import { useAuth } from '../../hooks/useAuth';

interface PermissionGateProps {
  allowedRoles: ('admin' | 'teacher')[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Render children only if the current user's role is in allowedRoles.
 * Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.11
 */
export function PermissionGate({ allowedRoles, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuth();

  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
