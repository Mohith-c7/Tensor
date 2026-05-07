import { Breadcrumbs, Link, Typography } from '@mui/material';
import { useMatches, Link as RouterLink } from 'react-router-dom';
import type { RouteHandle } from '../../types/domain';

/**
 * Dynamic breadcrumb built from route handles.
 * Updates within 100ms of navigation.
 * Requirements: 4.5, 4.6
 */
export function Breadcrumb() {
  const matches = useMatches();

  const crumbs = matches
    .filter((m) => (m.handle as RouteHandle | undefined)?.breadcrumb)
    .map((m) => ({
      label: (m.handle as RouteHandle).breadcrumb(m.params as Record<string, string>),
      path: m.pathname,
    }));

  if (crumbs.length <= 1) return null;

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 1 }}>
      {crumbs.slice(0, -1).map((crumb) => (
        <Link
          key={crumb.path}
          component={RouterLink}
          to={crumb.path}
          underline="hover"
          color="inherit"
          variant="body2"
        >
          {crumb.label}
        </Link>
      ))}
      <Typography variant="body2" color="text.primary">
        {crumbs[crumbs.length - 1].label}
      </Typography>
    </Breadcrumbs>
  );
}
