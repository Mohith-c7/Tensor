// MD3 Design Tokens
// Requirements: 3.1, 3.5, 3.6, 3.7, 3.8

export const colorTokens = {
  light: {
    primary: '#1565C0', onPrimary: '#FFFFFF', primaryContainer: '#D3E4FF', onPrimaryContainer: '#001B3E',
    secondary: '#535F70', onSecondary: '#FFFFFF', secondaryContainer: '#D7E3F7', onSecondaryContainer: '#101C2B',
    tertiary: '#6B5778', onTertiary: '#FFFFFF', tertiaryContainer: '#F2DAFF', onTertiaryContainer: '#251431',
    error: '#BA1A1A', onError: '#FFFFFF', errorContainer: '#FFDAD6', onErrorContainer: '#410002',
    surface: '#F8F9FF', onSurface: '#191C20', surfaceVariant: '#DFE2EB', onSurfaceVariant: '#43474E',
    outline: '#73777F', outlineVariant: '#C3C7CF', background: '#F8F9FF', onBackground: '#191C20',
  },
  dark: {
    primary: '#A4C8FF', onPrimary: '#003063', primaryContainer: '#00468C', onPrimaryContainer: '#D3E4FF',
    secondary: '#BBC7DB', onSecondary: '#253140', secondaryContainer: '#3B4858', onSecondaryContainer: '#D7E3F7',
    tertiary: '#D6BEE4', onTertiary: '#3B2948', tertiaryContainer: '#523F5F', onTertiaryContainer: '#F2DAFF',
    error: '#FFB4AB', onError: '#690005', errorContainer: '#93000A', onErrorContainer: '#FFDAD6',
    surface: '#111318', onSurface: '#E2E2E9', surfaceVariant: '#43474E', onSurfaceVariant: '#C3C7CF',
    outline: '#8D9199', outlineVariant: '#43474E', background: '#111318', onBackground: '#E2E2E9',
  },
} as const;

export const spacingTokens = [0, 4, 8, 12, 16, 24, 32, 48, 64] as const;

export const elevationTokens = {
  0: 'none',
  1: '0px 1px 2px rgba(0,0,0,0.3), 0px 1px 3px 1px rgba(0,0,0,0.15)',
  2: '0px 1px 2px rgba(0,0,0,0.3), 0px 2px 6px 2px rgba(0,0,0,0.15)',
  3: '0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)',
  4: '0px 6px 10px 4px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3)',
  5: '0px 8px 12px 6px rgba(0,0,0,0.15), 0px 2px 3px rgba(0,0,0,0.3)',
} as const;

export const motionTokens = {
  durationShort: '100ms',
  durationMedium: '250ms',
  durationLong: '400ms',
  easingStandard: 'cubic-bezier(0.2, 0, 0, 1)',
  easingEmphasized: 'cubic-bezier(0.2, 0, 0, 1)',
  easingDecelerate: 'cubic-bezier(0, 0, 0, 1)',
  easingAccelerate: 'cubic-bezier(0.3, 0, 1, 1)',
} as const;

export const breakpoints = {
  compact: 0,
  medium: 600,
  expanded: 905,
} as const;
