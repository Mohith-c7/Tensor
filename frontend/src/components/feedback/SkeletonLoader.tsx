import React from 'react';
import { Skeleton, Box } from '@mui/material';

type SkeletonVariant = 'kpi-card' | 'table-row' | 'chart' | 'list-item';

interface SkeletonLoaderProps {
  variant: SkeletonVariant;
  count?: number;
}

/**
 * Loading skeleton with wave animation for various content types.
 * Requirements: 5.7, 13.3
 */
export function SkeletonLoader({ variant, count = 1 }: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  return (
    <>
      {items.map((_, i) => (
        <SkeletonItem key={i} variant={variant} />
      ))}
    </>
  );
}

function SkeletonItem({ variant }: { variant: SkeletonVariant }) {
  switch (variant) {
    case 'kpi-card':
      return (
        <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Skeleton animation="wave" width="60%" height={20} />
          <Skeleton animation="wave" width="40%" height={40} sx={{ mt: 1 }} />
        </Box>
      );

    case 'table-row':
      return (
        <Box sx={{ display: 'flex', gap: 2, py: 1 }}>
          <Skeleton animation="wave" width="20%" height={20} />
          <Skeleton animation="wave" width="30%" height={20} />
          <Skeleton animation="wave" width="20%" height={20} />
          <Skeleton animation="wave" width="15%" height={20} />
        </Box>
      );

    case 'chart':
      return <Skeleton animation="wave" variant="rectangular" width="100%" height={300} sx={{ borderRadius: 2 }} />;

    case 'list-item':
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
          <Skeleton animation="wave" variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton animation="wave" width="60%" height={16} />
            <Skeleton animation="wave" width="40%" height={14} sx={{ mt: 0.5 }} />
          </Box>
        </Box>
      );
  }
}
