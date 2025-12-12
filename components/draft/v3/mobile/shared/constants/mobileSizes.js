/**
 * Mobile-Optimized Measurements
 * Touch-friendly sizes for mobile draft room
 */

export const MOBILE_SIZES = {
  // Touch Targets (Apple HIG & Material Design)
  TOUCH_TARGET_MIN: '44px',      // Minimum recommended touch target
  TOUCH_TARGET_COMFORT: '48px',  // Comfortable touch target
  TOUCH_TARGET_LARGE: '56px',    // Large action buttons

  // Player Cards (Mobile Optimized)
  PLAYER_CARD: {
    height: '64px',              // Reduced height for tighter spacing
    padding: '8px',              // Reduced internal padding
    gap: '12px'                  // Space between elements
  },

  // Picks Bar (Horizontal Scroll)
  PICKS_BAR: {
    height: '100px',             // Reduced height for shorter player cards
    cardWidth: '107px',          // Increased by 6px (101px + 6px = 107px)
    cardGap: '4px',              // Reduced gaps for tighter spacing
    padding: '16px'              // Container padding
  },

  // Layout Spacing
  SPACING: {
    xs: '4px',
    sm: '8px', 
    md: '16px',
    lg: '24px',
    xl: '32px'
  },

  // Typography (Mobile Optimized)
  TEXT: {
    body: '16px',                // Never smaller than 16px on mobile
    small: '14px',               // Minimum readable size
    large: '18px',               // Emphasis text
    title: '24px'                // Section headers
  }
};

export const MOBILE_BREAKPOINTS = {
  // Device Categories
  PHONE_SMALL: '320px',          // iPhone SE
  PHONE_LARGE: '414px',          // iPhone Pro Max
  TABLET_SMALL: '768px',         // iPad Mini
  TABLET_LARGE: '1024px',        // iPad Pro

  // Orientation Breakpoints
  PORTRAIT_MAX: '768px',
  LANDSCAPE_MIN: '769px'
};

export const PLATFORM_SPECIFIC = {
  // iOS Specific
  IOS: {
    SAFE_AREA_TOP: 'env(safe-area-inset-top)',
    SAFE_AREA_BOTTOM: 'env(safe-area-inset-bottom)',
    BORDER_RADIUS: '12px',       // iOS corner radius
    ANIMATION_DURATION: '0.25s'   // iOS standard timing
  },

  // Android Specific  
  ANDROID: {
    ELEVATION_1: '0px 1px 3px rgba(0,0,0,0.12)',
    ELEVATION_2: '0px 1px 5px rgba(0,0,0,0.2)',
    BORDER_RADIUS: '8px',        // Material corner radius
    ANIMATION_DURATION: '0.2s'    // Material standard timing
  }
};
