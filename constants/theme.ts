export const Colors = {
  background: '#0A0514',
  surface: '#130D2B',
  surfaceLight: '#1E1542',
  surfaceMid: '#17103A',
  primary: '#8B5CF6',
  primaryGlow: '#A78BFA',
  primaryDark: '#6D28D9',
  accent: '#F59E0B',
  accentGlow: '#FCD34D',
  accentDark: '#D97706',
  text: '#F8F4FF',
  textSecondary: '#9D8EC7',
  textMuted: '#6B5F8F',
  error: '#EF4444',
  errorLight: '#FCA5A5',
  success: '#10B981',
  successLight: '#6EE7B7',
  warning: '#F59E0B',
  border: '#2D1F5E',
  borderLight: '#3D2F7E',
  gold: '#F59E0B',
  goldLight: '#FCD34D',
  violet: '#8B5CF6',
  violetLight: '#A78BFA',
  moonWhite: '#F0E6FF',
  starWhite: '#E8E0FF',
  nebula1: '#4C1D95',
  nebula2: '#1E1B4B',
  nebula3: '#2E1065',
  overlay: 'rgba(10, 5, 20, 0.7)',
  overlayLight: 'rgba(19, 13, 43, 0.85)',
  glassBackground: 'rgba(30, 21, 66, 0.6)',
  glassBorder: 'rgba(139, 92, 246, 0.2)',
  glow: 'rgba(139, 92, 246, 0.4)',
  goldGlow: 'rgba(245, 158, 11, 0.4)',
} as const;

export const Fonts = {
  heading: 'PlayfairDisplay-Regular',
  headingBold: 'PlayfairDisplay-Bold',
  headingItalic: 'PlayfairDisplay-Italic',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  bodySemiBold: 'Inter-SemiBold',
  bodyBold: 'Inter-Bold',
} as const;

export const FontSizes = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export const BorderRadius = {
  sm: 6,
  md: 10,
  base: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const Shadows = {
  glow: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  soft: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
} as const;

export const ZodiacGradients = {
  fire: ['#EF4444', '#F59E0B', '#8B5CF6'],
  earth: ['#10B981', '#059669', '#1E1542'],
  air: ['#60A5FA', '#8B5CF6', '#1E1542'],
  water: ['#3B82F6', '#8B5CF6', '#0A0514'],
} as const;

export const PlanColors = {
  free: '#9D8EC7',
  starseed: '#8B5CF6',
  cosmic: '#F59E0B',
} as const;
