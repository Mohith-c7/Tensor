import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { NavItem } from '../../types/domain';

interface BottomNavProps {
  items: NavItem[];
}

/**
 * Bottom navigation bar (compact breakpoint).
 * Requirements: 4.2, 4.3, 4.4, 2.11, 3.11
 */
export function BottomNav({ items }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const filtered = items.filter((item) => !user || item.roles.includes(user.role));

  const currentValue = filtered.findIndex((item) =>
    location.pathname.startsWith(item.path)
  );

  return (
    <Paper
      component="nav"
      aria-label="Bottom navigation"
      elevation={3}
      sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }}
    >
      <BottomNavigation
        value={currentValue === -1 ? false : currentValue}
        onChange={(_, newValue: number) => {
          if (filtered[newValue]) navigate(filtered[newValue].path);
        }}
        showLabels
      >
        {filtered.map((item) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={item.icon}
            aria-label={item.label}
            aria-current={location.pathname.startsWith(item.path) ? 'page' : undefined}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
