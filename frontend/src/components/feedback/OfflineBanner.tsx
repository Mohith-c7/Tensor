import { useEffect, useState } from 'react';
import { Alert } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';

/**
 * Persistent banner shown when the browser is offline.
 * Requirements: 12.12
 */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <Alert
      severity="warning"
      icon={<WifiOffIcon />}
      aria-live="polite"
      sx={{ borderRadius: 0, position: 'sticky', top: 0, zIndex: 1200 }}
    >
      You are offline. Some features may be unavailable.
    </Alert>
  );
}
