import React from 'react';
import { Snackbar, Alert, Button } from '@mui/material';
import type { Toast as ToastType } from '../../types/domain';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

const VARIANT_SEVERITY = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
} as const;

/**
 * Single toast notification rendered as MUI Snackbar.
 * Requirements: 12.1, 12.2, 12.3
 */
export function Toast({ toast, onClose }: ToastProps) {
  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      onClose={() => onClose(toast.id)}
    >
      <Alert
        severity={VARIANT_SEVERITY[toast.variant]}
        onClose={() => onClose(toast.id)}
        action={
          toast.action ? (
            <Button color="inherit" size="small" onClick={toast.action.onClick}>
              {toast.action.label}
            </Button>
          ) : undefined
        }
        sx={{ width: '100%' }}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
}
