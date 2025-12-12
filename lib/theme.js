/**
 * TopDog V3 Design System
 * Centralized theme configuration for consistent styling across the platform
 */

export const theme = {
  // Color Palette
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#EBF8FF',
      100: '#BEE3F8', 
      200: '#90CDF4',
      300: '#63B3ED',
      400: '#4299E1',
      500: '#3182CE',  // Main blue
      600: '#2B77CB',  // Active blue
      700: '#2C5AA0',
      800: '#2A4365',
      900: '#1A365D'
    },

    // Background Colors
    background: {
      primary: '#101927',    // Main dark background
      secondary: '#1F2937',  // Card/surface background
      tertiary: '#374151',   // Elevated surfaces
      overlay: 'rgba(0, 0, 0, 0.5)'
    },

    // Text Colors
    text: {
      primary: '#FFFFFF',     // Main text
      secondary: '#E5E7EB',   // Secondary text
      muted: '#9CA3AF',       // Muted text
      disabled: '#6B7280',    // Disabled text
      inverse: '#111827'      // Text on light backgrounds
    },

    // Accent Colors
    accent: {
      teal: '#59c5bf',       // Teal highlights
      yellow: '#F59E0B',     // Warning/badges
      green: '#10B981',      // Success states
      red: '#EF4444',        // Error states
      purple: '#8B5CF6'      // Special highlights
    },

    // Position Colors (Fantasy Sports)
    positions: {
      QB: '#7C3AED',         // Purple
      RB: '#0fba80',         // Green
      WR: '#4285F4',         // Blue
      TE: '#F472B6',         // Pink
      FLEX: '#6B7280',       // Gray
      K: '#F59E0B'           // Orange
    },

    // Border Colors
    border: {
      primary: '#374151',
      secondary: '#4B5563',
      accent: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444'
    }
  },

  // Spacing System (8px base)
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px'
  },

  // Border Radius
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px'
  },

  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['Fira Code', 'monospace']
    },
    fontSize: {
      xs: ['12px', '16px'],
      sm: ['14px', '20px'],
      base: ['16px', '24px'],
      lg: ['18px', '28px'],
      xl: ['20px', '28px'],
      '2xl': ['24px', '32px'],
      '3xl': ['30px', '36px'],
      '4xl': ['36px', '40px']
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },

  // Breakpoints
  breakpoints: {
    mobile: '320px',
    tablet: '768px', 
    desktop: '1024px',
    wide: '1280px',
    ultrawide: '1536px'
  },

  // Z-Index Scale
  zIndex: {
    base: 0,
    dropdown: 10,
    sticky: 20,
    overlay: 30,
    modal: 40,
    popover: 50,
    tooltip: 60,
    toast: 70
  },

  // Animation Durations
  animation: {
    fast: '150ms',
    normal: '300ms',
    slow: '500ms'
  },

  // Component Variants
  components: {
    button: {
      sizes: {
        sm: { padding: '8px 12px', fontSize: '14px' },
        md: { padding: '12px 16px', fontSize: '16px' },
        lg: { padding: '16px 24px', fontSize: '18px' }
      },
      variants: {
        primary: {
          background: '#3B82F6',
          color: '#FFFFFF',
          border: 'none'
        },
        secondary: {
          background: 'transparent',
          color: '#3B82F6',
          border: '1px solid #3B82F6'
        },
        ghost: {
          background: 'transparent',
          color: '#9CA3AF',
          border: 'none'
        }
      }
    },
    
    card: {
      variants: {
        default: {
          background: '#1F2937',
          border: '1px solid #374151',
          borderRadius: '12px',
          padding: '24px'
        },
        elevated: {
          background: '#374151',
          border: '1px solid #4B5563',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }
};

// Utility functions for theme usage
export const getPositionColor = (position) => {
  return theme.colors.positions[position] || theme.colors.text.muted;
};

export const getSpacing = (size) => {
  return theme.spacing[size] || size;
};

export const getBreakpoint = (breakpoint) => {
  return theme.breakpoints[breakpoint];
};

// CSS-in-JS helper for styled-components or emotion
export const createThemeStyles = (styles) => {
  return (props) => styles(props.theme || theme);
};

export default theme;
