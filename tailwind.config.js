/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Dynamic position text colors
    { pattern: /^text-position-/ },
  ],
  theme: {
    extend: {
      // ========================================================================
      // SCREENS - Responsive Breakpoints
      // ========================================================================
      screens: {
        xs: '320px',
      },

      // ========================================================================
      // ANIMATIONS
      // ========================================================================
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },

      // ========================================================================
      // COLORS - Mapped to CSS Custom Properties
      // ========================================================================
      colors: {
        // Top-level aliases for common colors (enables text-accent, text-primary, etc.)
        accent: 'var(--color-brand-accent)',
        primary: 'var(--color-brand-primary)',
        // Brand
        brand: {
          primary: 'var(--color-brand-primary)',
          secondary: 'var(--color-brand-secondary)',
          accent: 'var(--color-brand-accent)',
        },
        // Navbar
        navbar: {
          solid: 'var(--color-navbar-solid)',
          light: 'var(--color-navbar-light)',
          dark: 'var(--color-navbar-dark)',
        },
        // Positions
        position: {
          qb: 'var(--color-position-qb)',
          rb: 'var(--color-position-rb)',
          wr: 'var(--color-position-wr)',
          te: 'var(--color-position-te)',
          bn: 'var(--color-position-bn)',
        },
        // Backgrounds
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
          elevated: 'var(--bg-elevated)',
          black: 'var(--bg-black)',
        },
        // Text
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          disabled: 'var(--text-disabled)',
        },
        // Borders
        border: {
          DEFAULT: 'var(--border-default)',
          light: 'var(--border-light)',
          subtle: 'var(--border-subtle)',
          focus: 'var(--border-focus)',
          error: 'var(--border-error)',
          success: 'var(--border-success)',
        },
        // States
        state: {
          success: 'var(--color-success)',
          warning: 'var(--color-warning)',
          error: 'var(--color-error)',
          info: 'var(--color-info)',
          active: 'var(--color-active)',
          selected: 'var(--color-selected)',
          hover: 'var(--color-hover)',
        },
        // Gray scale
        gray: {
          50: 'var(--gray-50)',
          100: 'var(--gray-100)',
          200: 'var(--gray-200)',
          300: 'var(--gray-300)',
          400: 'var(--gray-400)',
          500: 'var(--gray-500)',
          600: 'var(--gray-600)',
          700: 'var(--gray-700)',
          800: 'var(--gray-800)',
          900: 'var(--gray-900)',
          950: 'var(--gray-950)',
        },
        // Overlays
        overlay: {
          DEFAULT: 'var(--overlay)',
          dark: 'var(--overlay-dark)',
          light: 'var(--overlay-light)',
        },
      },

      // ========================================================================
      // SPACING - Mapped to CSS Custom Properties
      // ========================================================================
      spacing: {
        '2xs': 'var(--spacing-2xs)',
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
        '3xl': 'var(--spacing-3xl)',
        '4xl': 'var(--spacing-4xl)',
        // Touch targets
        'touch-min': 'var(--touch-target-min)',
        'touch-comfort': 'var(--touch-target-comfort)',
        'touch-large': 'var(--touch-target-large)',
      },

      // ========================================================================
      // TYPOGRAPHY
      // ========================================================================
      fontSize: {
        '2xs': ['var(--font-size-2xs)', { lineHeight: 'var(--line-height-normal)' }],
        'xs': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-normal)' }],
        'sm': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
        'base': ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
        'lg': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-snug)' }],
        'xl': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-snug)' }],
        '2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
        '3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
        '4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
        '5xl': ['var(--font-size-5xl)', { lineHeight: 'var(--line-height-tight)' }],
      },
      fontWeight: {
        normal: 'var(--font-weight-normal)',
        medium: 'var(--font-weight-medium)',
        semibold: 'var(--font-weight-semibold)',
        bold: 'var(--font-weight-bold)',
      },
      lineHeight: {
        none: 'var(--line-height-none)',
        tight: 'var(--line-height-tight)',
        snug: 'var(--line-height-snug)',
        normal: 'var(--line-height-normal)',
        relaxed: 'var(--line-height-relaxed)',
        loose: 'var(--line-height-loose)',
      },
      fontFamily: {
        sans: 'var(--font-family-sans)',
        mono: 'var(--font-family-mono)',
      },

      // ========================================================================
      // BORDER RADIUS
      // ========================================================================
      borderRadius: {
        'none': 'var(--radius-none)',
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        'full': 'var(--radius-full)',
      },

      // ========================================================================
      // BOX SHADOW
      // ========================================================================
      boxShadow: {
        'none': 'var(--shadow-none)',
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'card': 'var(--shadow-card)',
        'elevated': 'var(--shadow-elevated)',
      },

      // ========================================================================
      // Z-INDEX
      // ========================================================================
      zIndex: {
        'base': 'var(--z-base)',
        'elevated': 'var(--z-elevated)',
        'sticky-content': 'var(--z-sticky-content)',
        'dropdown': 'var(--z-dropdown)',
        'header': 'var(--z-header)',
        'tab-bar': 'var(--z-tab-bar)',
        'sticky': 'var(--z-sticky)',
        'fixed': 'var(--z-fixed)',
        'modal-backdrop': 'var(--z-modal-backdrop)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'toast': 'var(--z-toast)',
        'max': 'var(--z-max)',
      },

      // ========================================================================
      // TRANSITIONS
      // ========================================================================
      transitionDuration: {
        'instant': 'var(--duration-instant)',
        'fast': 'var(--duration-fast)',
        'normal': 'var(--duration-normal)',
        'slow': 'var(--duration-slow)',
        'page': 'var(--duration-page)',
      },
      transitionTimingFunction: {
        'default': 'var(--ease-default)',
        'in': 'var(--ease-in)',
        'out': 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        'spring': 'var(--ease-spring)',
      },
    },
  },
  plugins: [
    // Custom plugin for touch target utilities
    function({ addUtilities }) {
      addUtilities({
        '.touch-target': {
          minWidth: 'var(--touch-target-min)',
          minHeight: 'var(--touch-target-min)',
        },
        '.touch-target-comfort': {
          minWidth: 'var(--touch-target-comfort)',
          minHeight: 'var(--touch-target-comfort)',
        },
        '.touch-target-large': {
          minWidth: 'var(--touch-target-large)',
          minHeight: 'var(--touch-target-large)',
        },
      });
    },
  ],
};
