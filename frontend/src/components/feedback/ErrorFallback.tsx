import React from 'react';
import { Button, Typography, Box } from '@mui/material';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Error boundary fallback component.
 * Requirements: 12.4, 12.5
 */
export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <Box
      role="alert"
      sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
    >
      <Typography variant="h6" color="error">
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {error.message}
      </Typography>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Reload Section
      </Button>
    </Box>
  );
}
