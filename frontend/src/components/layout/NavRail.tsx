import { Box, IconButton, Tooltip } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { NavItem } from '../../types/domain';

interface NavRailProps {
  items: NavItem[];
}

/**
 * Icon-only navigation rail (medium breakpoint).
 * Requirements: 4.2, 4.3, 4.4, 2.11, 3.10
 */
export function NavRail({ items }: NavRailProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const filtered = items.filter((item) => !user || item.roles.includes(user.role));

  return (
    <Box
      component="nav"
      aria-label="Navigation rail"
      sx={{
        width: 72,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        pt: 2,
        gap: 1,
        borderRight: '1px solid',
        borderColor: 'divider',
        height: '100%',
      }}
    >
      {filtered.map((item) => {
        const active = location.pathname.startsWith(item.path);
        return (
          <Tooltip key={item.path} title={item.label} placement="right">
            <IconButton
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              aria-current={active ? 'page' : undefined}
              sx={{
                color: active ? 'primary.main' : 'text.secondary',
                bgcolor: active ? 'primary.50' : 'transparent',
                borderRadius: 2,
                width: 48,
                height: 48,
              }}
            >
              {item.icon}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
}
