import React from 'react';
import { Box, Typography } from '@mui/material';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

/**
 * Page header with title and optional action buttons.
 * Requirements: 4.1
 */
export function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Typography variant="h5" component="h1">
        {title}
      </Typography>
      {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
    </Box>
  );
}
