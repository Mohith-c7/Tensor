import { useState, type ReactNode } from 'react';
import { Box, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';
import { NavDrawer } from './NavDrawer';
import { NavRail } from './NavRail';
import { BottomNav } from './BottomNav';
import { TopBar } from './TopBar';
import { ErrorFallback } from '../feedback/ErrorFallback';
import type { NavItem } from '../../types/domain';

interface AppShellProps {
  navItems: NavItem[];
  children: ReactNode;
  pageTitle?: string;
}

/**
 * Responsive application shell.
 * - expanded (≥905px): permanent NavDrawer
 * - medium (600–904px): NavRail
 * - compact (<600px): BottomNav + hamburger in TopBar
 * Requirements: 3.9, 3.10, 3.11, 4.1, 12.4
 */
export function AppShell({ navItems, children, pageTitle }: AppShellProps) {
  const muiTheme = useMuiTheme();
  const isExpanded = useMediaQuery(muiTheme.breakpoints.up('lg'));
  const isMedium = useMediaQuery(muiTheme.breakpoints.between('sm', 'lg'));
  const isCompact = useMediaQuery(muiTheme.breakpoints.down('sm'));
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar
        title={pageTitle}
        showMenuButton={isCompact}
        onMenuClick={() => setMobileDrawerOpen(true)}
      />

      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {isExpanded && <NavDrawer items={navItems} variant="permanent" />}

        {isMedium && <NavRail items={navItems} />}

        {isCompact && (
          <NavDrawer
            items={navItems}
            variant="temporary"
            open={mobileDrawerOpen}
            onClose={() => setMobileDrawerOpen(false)}
          />
        )}

        <Box
          component="main"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: { xs: 2, sm: 3 },
            pb: isCompact ? 8 : 3,
          }}
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            {children}
          </ErrorBoundary>
        </Box>
      </Box>

      {isCompact && <BottomNav items={navItems} />}
    </Box>
  );
}
