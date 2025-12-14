/**
 * Draft Room V3 - Constants Index
 * 
 * Centralized exports for all constants used in the V3 draft room.
 * This maintains the exact measurements and specifications from
 * the meticulously crafted original design.
 */

// Layout constants - All precise measurements
export { 
  LAYOUT,
  POSITION_FILTERS,
  GRADIENTS,
  MEASUREMENTS
} from './layout';

// Position system - Colors, gradients, and position logic
import {
  POSITIONS as _POSITIONS,
  FLEX_POSITIONS as _FLEX_POSITIONS,
  isValidPosition as _isValidPosition,
  isFlexEligible as _isFlexEligible,
  POSITION_COLORS as _POSITION_COLORS,
  POSITION_END_COLORS as _POSITION_END_COLORS,
  POSITION_FILTER_STYLES as _POSITION_FILTER_STYLES,
  GRADIENT_FUNCTIONS as _GRADIENT_FUNCTIONS,
  QUEUE_GRADIENTS as _QUEUE_GRADIENTS,
  POSITION_HELPERS as _POSITION_HELPERS
} from './positions';

export const POSITIONS = _POSITIONS;
export const FLEX_POSITIONS = _FLEX_POSITIONS;
export const isValidPosition = _isValidPosition;
export const isFlexEligible = _isFlexEligible;
export const POSITION_COLORS = _POSITION_COLORS;
export const POSITION_END_COLORS = _POSITION_END_COLORS;
export const POSITION_FILTER_STYLES = _POSITION_FILTER_STYLES;
export const GRADIENT_FUNCTIONS = _GRADIENT_FUNCTIONS;
export const QUEUE_GRADIENTS = _QUEUE_GRADIENTS;
export const POSITION_HELPERS = _POSITION_HELPERS;

// Style constants - CSS classes, animations, styling
export {
  CSS_CLASSES,
  ANIMATIONS,
  SCROLL_BEHAVIOR,
  BORDERS,
  BACKGROUNDS,
  TEXT_COLORS,
  FONTS,
  SPACING,
  SHADOWS,
  OPACITY,
  Z_INDEX
} from './styles';

// Navbar constants - Tournament-specific theming
export {
  CURRENT_TOURNAMENT_NAVBAR,
  TOURNAMENT_THEMES,
  ACTIVE_TOURNAMENT,
  NAVBAR_STYLES,
  DROPDOWN_STYLES,
  TOURNAMENT_HELPERS,
  DEV_NAVBAR_HELPERS
} from './navbar';

// Re-export defaults for convenience
export { default as LAYOUT_CONSTANTS } from './layout';
export { default as POSITION_CONSTANTS } from './positions';
export { default as STYLE_CONSTANTS } from './styles';

/**
 * Quick access to commonly used values
 */
export const QUICK_ACCESS = {
  // Most frequently used measurements
  MAIN_WIDTH: '1391px',
  PICKS_HEIGHT: '256px',
  QUEUE_WIDTH: '288px',
  CARD_GAP: '4.5px',
  
  // Core colors
  BACKGROUND: '#101927',
  BORDER_COLOR: 'rgba(255, 255, 255, 0.1)',
  CLOCK_BORDER: '#FBBF25',
  
  // Position colors (most used)
  QB_COLOR: '#7C3AED',
  RB_COLOR: '#0fba80', 
  WR_COLOR: '#4285F4',
  TE_COLOR: '#7C3AED',
  
  // Key positions
  CLOCK_TOP: '0px',
  CLOCK_LEFT: '45.5px',
  BOARD_BTN_TOP: '118px',
  AUTODRAFT_TOP: '182px',
  CONTENT_TOP: '380px',
  
  // Navbar (tournament-specific)
  NAVBAR_TEXTURE: 'url(/texture_reduced_highlights.png)',
  NAVBAR_FALLBACK: '#5f7a7a',
  CURRENT_TOURNAMENT: 'Current tournament theme easily changeable'
};

/**
 * Validation helpers to ensure constants are used correctly
 */
export const VALIDATION = {
  /**
   * Validates that a position is valid (uses centralized POSITIONS)
   */
  isValidPosition: (position) => _POSITIONS.includes(position),
  
  /**
   * Validates that measurements match expected format
   */
  isValidMeasurement: (value) => {
    return typeof value === 'string' && 
           (value.endsWith('px') || value.endsWith('%') || value.endsWith('vw') || value.endsWith('vh'));
  },
  
  /**
   * Validates hex color format
   */
  isValidColor: (color) => {
    return /^#[0-9A-F]{6}$/i.test(color);
  }
};

/**
 * Development helpers for debugging layout issues
 */
export const DEV_HELPERS = {
  /**
   * Log all layout measurements (development only)
   */
  logLayoutMeasurements: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🎯 Draft Room V3 - Layout Measurements');
      console.log('Main Width:', QUICK_ACCESS.MAIN_WIDTH);
      console.log('Picks Height:', QUICK_ACCESS.PICKS_HEIGHT);
      console.log('Queue Width:', QUICK_ACCESS.QUEUE_WIDTH);
      console.log('Content Top:', QUICK_ACCESS.CONTENT_TOP);
      console.groupEnd();
    }
  },
  
  /**
   * Log all position colors (development only)
   */
  logPositionColors: () => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🎨 Draft Room V3 - Position Colors');
      console.log('QB:', QUICK_ACCESS.QB_COLOR);
      console.log('RB:', QUICK_ACCESS.RB_COLOR);
      console.log('WR:', QUICK_ACCESS.WR_COLOR);
      console.log('TE:', QUICK_ACCESS.TE_COLOR);
      console.groupEnd();
    }
  },
  
  /**
   * Verify critical measurements are preserved
   */
  verifyCriticalMeasurements: () => {
    const critical = {
      mainWidth: QUICK_ACCESS.MAIN_WIDTH === '1391px',
      picksHeight: QUICK_ACCESS.PICKS_HEIGHT === '256px',
      queueWidth: QUICK_ACCESS.QUEUE_WIDTH === '288px',
      clockPosition: QUICK_ACCESS.CLOCK_TOP === '0px' && QUICK_ACCESS.CLOCK_LEFT === '45.5px'
    };
    
    const allValid = Object.values(critical).every(Boolean);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Critical measurements verified:', allValid ? 'PASS' : 'FAIL');
      if (!allValid) {
        console.warn('❌ Failed measurements:', 
          Object.entries(critical)
            .filter(([_, valid]) => !valid)
            .map(([key]) => key)
        );
      }
    }
    
    return allValid;
  }
};
