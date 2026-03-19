// MUI Component Overrides — MD3 Styling
// Requirements: 3.12

import type { Components, Theme } from '@mui/material/styles';
import { motionTokens } from './tokens';

export const components: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 20,
        textTransform: 'none',
        transition: `all ${motionTokens.durationMedium} ${motionTokens.easingStandard}`,
      },
    },
  },
  MuiTextField: {
    defaultProps: {
      variant: 'outlined',
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: 'none',
      },
    },
  },
  MuiDialog: {
    styleOverrides: {
      paper: {
        borderRadius: 28,
      },
    },
  },
  MuiSnackbar: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },
  MuiCheckbox: {
    defaultProps: {
      size: 'medium',
    },
  },
};
