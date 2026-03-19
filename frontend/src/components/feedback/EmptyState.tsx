import React from 'react';
import { Box, Typography, Button } from '@mui/material';

interface EmptyStateProps {
  illustration?: React.ReactNode;
  message: string;
  action?: { label: string; onClick: () => void };
}

/**
 * Empty state placeholder with optional illustration and action.
 * Requirements: 6.15, 12.11
 */
export function EmptyState({ illustration, message, action }: EmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 8,
        px: 3,
        textAlign: 'center',
      }}
    >
      {illustration && <Box sx={{ mb: 1 }}>{illustration}</Box>}
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
      {action && (
        <Button variant="outlined" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Box>
  );
}
