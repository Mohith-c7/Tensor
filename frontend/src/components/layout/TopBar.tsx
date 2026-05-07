import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

interface TopBarProps {
  title?: string;
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

/**
 * Top application bar with logo, title, theme toggle, and user menu.
 * Requirements: 4.1, 4.7, 14.3
 */
export function TopBar({ title = 'Tensor', onMenuClick, showMenuButton = false }: TopBarProps) {
  const { user, logout } = useAuth();
  const { mode, setMode } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleUserMenuClose = () => setAnchorEl(null);

  const cycleTheme = () => {
    if (mode === 'light') setMode('dark');
    else if (mode === 'dark') setMode('system');
    else setMode('light');
  };

  const themeIcon =
    mode === 'light' ? <LightModeIcon /> : mode === 'dark' ? <DarkModeIcon /> : <SettingsBrightnessIcon />;
  const themeLabel =
    mode === 'light' ? 'Switch to dark mode' : mode === 'dark' ? 'Switch to system mode' : 'Switch to light mode';

  const initials = user
    ? user.firstName
      ? `${user.firstName.charAt(0)}${user.lastName.charAt(0) ?? ''}`.toUpperCase()
      : user.email.charAt(0).toUpperCase()
    : '?';

  const displayName = user?.fullName ?? user?.email ?? '';
  const displayRole = user ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '';

  return (
    <AppBar position="sticky" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Toolbar>
        {showMenuButton && (
          <IconButton
            edge="start"
            aria-label="Open navigation menu"
            onClick={onMenuClick}
            sx={{ mr: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography
          variant="h6"
          component="div"
          fontWeight="bold"
          color="primary"
          sx={{ flexGrow: 0, mr: 2 }}
        >
          Tensor
        </Typography>

        {title !== 'Tensor' && (
          <Typography variant="body1" color="text.secondary" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <IconButton
          aria-label={themeLabel}
          onClick={cycleTheme}
          size="medium"
        >
          {themeIcon}
        </IconButton>

        <IconButton
          aria-label="User account menu"
          aria-controls={anchorEl ? 'user-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={anchorEl ? 'true' : undefined}
          onClick={handleUserMenuOpen}
          sx={{ ml: 1, borderRadius: 2, px: 1, gap: 1 }}
        >
          {user && (
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" fontWeight="medium" lineHeight={1.2}>
                {displayName}
              </Typography>
              <Typography variant="caption" color="text.secondary" lineHeight={1.2}>
                {displayRole}
              </Typography>
            </Box>
          )}
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>
            {initials}
          </Avatar>
        </IconButton>

        <Menu
          id="user-menu"
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleUserMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {user && (
            <MenuItem disabled>
              <ListItemText
                primary={user.email}
                secondary={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              />
            </MenuItem>
          )}
          <Divider />
          <MenuItem
            onClick={() => {
              handleUserMenuClose();
            }}
          >
            <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem
            onClick={() => {
              handleUserMenuClose();
              logout();
            }}
          >
            <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
