import React from 'react';
import {
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { NavItem } from '../../types/domain';

interface NavDrawerProps {
  items: NavItem[];
  open?: boolean;
  onClose?: () => void;
  variant?: 'permanent' | 'temporary';
}

const DRAWER_WIDTH = 240;

/**
 * Full navigation drawer with icons + labels (expanded breakpoint).
 * Requirements: 4.2, 4.3, 4.4, 2.11, 3.9
 */
export function NavDrawer({ items, open = true, onClose, variant = 'permanent' }: NavDrawerProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const filtered = items.filter((item) => !user || item.roles.includes(user.role));

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          Tensor
        </Typography>
      </Box>
      <List>
        {filtered.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <ListItemButton
              key={item.path}
              selected={active}
              onClick={() => { navigate(item.path); onClose?.(); }}
              sx={{ borderRadius: 1, mx: 1, mb: 0.5 }}
            >
              <ListItemIcon sx={{ color: active ? 'primary.main' : 'inherit', minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: 'body2', fontWeight: active ? 'bold' : 'normal' }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Drawer>
  );
}
