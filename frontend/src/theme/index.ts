// CssVarsProvider Theme Export
// Requirements: 3.1, 3.2

import { experimental_extendTheme as extendTheme } from '@mui/material/styles';
import { colorTokens, motionTokens } from './tokens';
import { typographyScale } from './typography';
import { components } from './components';

export const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: colorTokens.light.primary,
          contrastText: colorTokens.light.onPrimary,
        },
        secondary: {
          main: colorTokens.light.secondary,
          contrastText: colorTokens.light.onSecondary,
        },
        error: {
          main: colorTokens.light.error,
          contrastText: colorTokens.light.onError,
        },
        background: {
          default: colorTokens.light.background,
          paper: colorTokens.light.surface,
        },
        text: {
          primary: colorTokens.light.onBackground,
          secondary: colorTokens.light.onSurfaceVariant,
        },
      },
    },
    dark: {
      palette: {
        primary: {
          main: colorTokens.dark.primary,
          contrastText: colorTokens.dark.onPrimary,
        },
        secondary: {
          main: colorTokens.dark.secondary,
          contrastText: colorTokens.dark.onSecondary,
        },
        error: {
          main: colorTokens.dark.error,
          contrastText: colorTokens.dark.onError,
        },
        background: {
          default: colorTokens.dark.background,
          paper: colorTokens.dark.surface,
        },
        text: {
          primary: colorTokens.dark.onBackground,
          secondary: colorTokens.dark.onSurfaceVariant,
        },
      },
    },
  },
  spacing: 4,
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: typographyScale.displayLarge,
    h2: typographyScale.headlineMedium,
    h3: typographyScale.titleLarge,
    h4: typographyScale.titleMedium,
    body1: typographyScale.bodyLarge,
    body2: typographyScale.bodyMedium,
    button: typographyScale.labelLarge,
  },
  transitions: {
    duration: {
      shortest: parseInt(motionTokens.durationShort),
      short: parseInt(motionTokens.durationShort),
      standard: parseInt(motionTokens.durationMedium),
      complex: parseInt(motionTokens.durationLong),
    },
  },
  components,
});

export type AppTheme = typeof theme;
