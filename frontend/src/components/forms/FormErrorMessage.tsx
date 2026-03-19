import React from 'react';
import { Box, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

interface FormErrorMessageProps {
  id: string;
  message: string;
}

/**
 * Accessible form error message with icon.
 * Requirements: 11.3, 14.6
 */
export function FormErrorMessage({ id, message }: FormErrorMessageProps) {
  return (
    <Box
      id={id}
      role="alert"
      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
    >
      <ErrorIcon fontSize="small" color="error" />
      <Typography variant="caption" color="error">
        {message}
      </Typography>
    </Box>
  );
}
