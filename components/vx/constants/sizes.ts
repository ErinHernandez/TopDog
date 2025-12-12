/**
 * VX Size Constants
 * 
 * Responsive sizing system for mobile-first development.
 * Mobile values are the base, desktop values scale up.
 */

// ============================================================================
// TOUCH TARGETS
// ============================================================================

export const TOUCH_TARGETS = {
  min: '44px',        // Minimum touch target (Apple HIG)
  comfort: '48px',    // Comfortable touch target
  large: '56px',      // Large action buttons
} as const;

// ============================================================================
// MOBILE SIZES (Base - Source of Truth)
// ============================================================================

export const MOBILE = {
  // Player Cards
  playerCard: {
    height: '40px',      // Row height
    padding: '8px',
    gap: '12px',
  },
  
  // Picks Bar
  picksBar: {
    height: '160px',     // Container height
    cardWidth: '107px',
    cardHeight: '140px',
    cardGap: '4px',
    padding: '16px',
  },
  
  // Navigation
  navbar: {
    height: '64px',
  },
  footer: {
    height: '80px',
  },
  
  // Queue/Roster Panels
  panel: {
    width: '100%',       // Full width on mobile
  },
} as const;

// ============================================================================
// TABLET SIZES
// ============================================================================

export const TABLET = {
  playerCard: {
    height: '48px',
    padding: '12px',
    gap: '16px',
  },
  
  picksBar: {
    height: '180px',
    cardWidth: '130px',
    cardHeight: '160px',
    cardGap: '6px',
    padding: '20px',
  },
  
  navbar: {
    height: '64px',
  },
  
  panel: {
    width: '320px',
  },
} as const;

// ============================================================================
// DESKTOP SIZES
// ============================================================================

export const DESKTOP = {
  playerCard: {
    height: '52px',
    padding: '16px',
    gap: '20px',
  },
  
  picksBar: {
    height: '200px',
    cardWidth: '158px',
    cardHeight: '180px',
    cardGap: '8px',
    padding: '24px',
  },
  
  navbar: {
    height: '64px',
  },
  
  // Three-column layout
  layout: {
    queueWidth: '288px',
    rosterWidth: '320px',
    contentGap: '16px',
  },
  
  panel: {
    width: '288px',
  },
} as const;

// ============================================================================
// SPACING SCALE
// ============================================================================

export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const;

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const TYPOGRAPHY = {
  // Mobile-first (minimum readable sizes)
  xs: '11px',
  sm: '13px',
  base: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '24px',
  '3xl': '30px',
  '4xl': '36px',
  '5xl': '48px',
} as const;

// Semantic font sizes for specific UI elements
export const FONT_SIZE = {
  // Player list
  playerName: '13px',
  playerTeam: '11px',
  playerRank: '13px',
  
  // Picks bar
  pickNumber: '11.5px',
  participantName: '12px',
  timer: '48px',
  
  // Draft board
  cellPickNumber: '12px',
  cellPlayerName: '10px',
  cellTimer: '32px',
  
  // Headers/labels
  columnHeader: '13px',
  tabLabel: '12px',
  buttonText: '14px',
  
  // Stats/data
  statValue: '16px',
  statLabel: '11px',
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  sm: '640px',   // Large phones
  md: '768px',   // Tablets
  lg: '1024px',  // Small laptops
  xl: '1280px',  // Desktops
  '2xl': '1536px', // Large desktops
} as const;

// ============================================================================
// PLATFORM SPECIFIC
// ============================================================================

export const PLATFORM = {
  ios: {
    safeAreaTop: 'env(safe-area-inset-top)',
    safeAreaBottom: 'env(safe-area-inset-bottom)',
    borderRadius: '12px',
    animationDuration: '0.25s',
  },
  android: {
    elevation1: '0px 1px 3px rgba(0,0,0,0.12)',
    elevation2: '0px 1px 5px rgba(0,0,0,0.2)',
    borderRadius: '8px',
    animationDuration: '0.2s',
  },
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const Z_INDEX = {
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
} as const;

