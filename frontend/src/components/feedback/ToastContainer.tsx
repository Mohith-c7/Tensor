import React from 'react';
import { Box } from '@mui/material';
import { useToastContext } from '../../contexts/ToastContext';
import { Toast } from './Toast';

/**
 * Renders up to 3 stacked toasts in the bottom-right corner.
 * Requirements: 12.1, 12.2, 12.3
 */
export function ToastContainer() {
  const { toasts, dismissToast } = useToastContext();

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        zIndex: 1400,
        maxWidth: 400,
      }}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={dismissToast} />
      ))}
    </Box>
  );
}
