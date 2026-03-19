import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

/**
 * Block navigation when the form has unsaved changes.
 * Shows a confirmation dialog before allowing navigation.
 * Requirements: 4.9
 */
export function useUnsavedChanges(isDirty: boolean) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname
  );

  // Handle browser back/refresh
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const confirmNavigation = () => {
    if (blocker.state === 'blocked') blocker.proceed();
  };

  const cancelNavigation = () => {
    if (blocker.state === 'blocked') blocker.reset();
  };

  return {
    isBlocked: blocker.state === 'blocked',
    confirmNavigation,
    cancelNavigation,
  };
}
