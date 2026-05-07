import { Button, Typography, Box } from '@mui/material';
import type { FallbackProps } from 'react-error-boundary';

/**
 * Error boundary fallback component.
 * Requirements: 12.4, 12.5
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  
  return (
    <Box
      role="alert"
      sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}
    >
      <Typography variant="h6" color="error">
        Something went wrong
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {errorMessage}
      </Typography>
      <Button variant="contained" onClick={resetErrorBoundary}>
        Reload Section
      </Button>
    </Box>
  );
}
