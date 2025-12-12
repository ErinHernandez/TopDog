/**
 * Draft Room V3 - Position System Constants
 * 
 * These exact colors and position-specific values maintain
 * the precise visual identity you've developed.
 */

// ============================================
// POSITION ARRAYS
// ============================================

/** All fantasy-relevant positions */
export const POSITIONS = ['QB', 'RB', 'WR', 'TE'];

/** Positions eligible for FLEX spots */
export const FLEX_POSITIONS = ['RB', 'WR', 'TE'];

/** Check if a position is valid */
export const isValidPosition = (position) => POSITIONS.includes(position);

/** Check if a position is FLEX-eligible */
export const isFlexEligible = (position) => FLEX_POSITIONS.includes(position);

// ============================================
// POSITION COLORS
// ============================================

export const POSITION_COLORS = {
  QB: {
    primary: '#F472B6',     // Pink (swapped from TE)
    name: 'QB',
    rgb: { r: 244, g: 114, b: 182 },
    rgba: 'rgba(244, 114, 182, 0.3)'
  },
  RB: {
    primary: '#0fba80',     // Green (softer green from memory)
    name: 'RB', 
    rgb: { r: 15, g: 186, b: 128 },
    rgba: 'rgba(15, 186, 128, 0.3)'
  },
  WR: {
    primary: '#FBBF25',     // Yellow/Gold
    name: 'WR',
    rgb: { r: 251, g: 191, b: 37 },
    rgba: 'rgba(251, 191, 37, 0.3)'
  },
  TE: {
    primary: '#7C3AED',     // Purple (swapped from QB)
    name: 'TE',
    rgb: { r: 124, g: 58, b: 237 },
    rgba: 'rgba(124, 58, 237, 0.3)'
  }
};

// Position end colors for gradient calculations
export const POSITION_END_COLORS = {
  QB: '#1f2833',
  RB: '#1f2833', 
  WR: '#1f2833',
  TE: '#1f2833'
};

// Filter button states
export const POSITION_FILTER_STYLES = {
  QB: {
    active: {
      backgroundColor: '#7C3AED',
      color: 'white',
      borderColor: '#7C3AED'
    },
    inactive: {
      backgroundColor: 'rgba(124, 58, 237, 0.3)',
      color: 'white',
      borderColor: 'transparent'
    }
  },
  RB: {
    active: {
      backgroundColor: '#0fba80',
      color: 'white', 
      borderColor: '#0fba80'
    },
    inactive: {
      backgroundColor: 'rgba(15, 186, 128, 0.3)',
      color: 'white',
      borderColor: 'transparent'
    }
  },
  WR: {
    active: {
      backgroundColor: '#FBBF25',
      color: 'white',
      borderColor: '#FBBF25'
    },
    inactive: {
      backgroundColor: 'rgba(251, 191, 37, 0.3)', 
      color: 'white',
      borderColor: 'transparent'
    }
  },
  TE: {
    active: {
      backgroundColor: '#7C3AED',
      color: 'white',
      borderColor: '#7C3AED'
    },
    inactive: {
      backgroundColor: 'rgba(124, 58, 237, 0.3)',
      color: 'white', 
      borderColor: 'transparent'
    }
  }
};

// Gradient calculation functions (preserved from current implementation)
export const GRADIENT_FUNCTIONS = {
  /**
   * Creates the first gradient (0px to 135px)
   * Exact replica of current gradient logic
   */
  createFirstGradient: (startColor, endColor) => {
    const gradientStops = [];
    gradientStops.push(`${startColor} 0px`);
    
    // Calculate RGB values
    const r1 = parseInt(startColor.slice(1, 3), 16);
    const g1 = parseInt(startColor.slice(3, 5), 16);
    const b1 = parseInt(startColor.slice(5, 7), 16);
    const r2 = 0x3B;
    const g2 = 0x43;
    const b2 = 0x4D;
    
    // Add color stops for each 0.2px from 0px to 135px
    for (let i = 1; i <= 675; i++) {
      const percent = i / 675;
      const r = Math.round(r1 + (r2 - r1) * percent);
      const g = Math.round(g1 + (g2 - g1) * percent);
      const b = Math.round(b1 + (b2 - b1) * percent);
      
      const color = `rgb(${r}, ${g}, ${b})`;
      gradientStops.push(`${color} ${i * 0.2}px`);
    }
    
    return `linear-gradient(to right, ${gradientStops.join(', ')})`;
  },

  /**
   * Creates the second gradient (135px to 175px)
   * Continues seamlessly from first gradient
   */
  createSecondGradient: (startColor, endColor) => {
    const gradientStops = [];
    
    // Calculate the exact color at 135px (where first gradient ends)
    const r1 = parseInt(startColor.slice(1, 3), 16);
    const g1 = parseInt(startColor.slice(3, 5), 16);
    const b1 = parseInt(startColor.slice(5, 7), 16);
    const r2 = 0x3B;
    const g2 = 0x43;
    const b2 = 0x4D;
    
    // At 135px, we're 80% through the total 169px gradient
    const startPercent = 0.8;
    const startR = Math.round(r1 + (r2 - r1) * startPercent);
    const startG = Math.round(g1 + (g2 - g1) * startPercent);
    const startB = Math.round(b1 + (b2 - b1) * startPercent);
    const startColorRGB = `rgb(${startR}, ${startG}, ${startB})`;
    
    gradientStops.push(`${startColorRGB} 0px`);
    
    // Add color stops for each 0.2px from 0px to 40px
    // This completes the remaining 20% of the transition
    for (let i = 1; i <= 200; i++) {
      const localPercent = i / 200; // 0 to 1 within this 40px segment
      const globalPercent = startPercent + localPercent * 0.2; // 80% to 100%
      
      const r = Math.round(r1 + (r2 - r1) * globalPercent);
      const g = Math.round(g1 + (g2 - g1) * globalPercent);
      const b = Math.round(b1 + (b2 - b1) * globalPercent);
      
      const color = `rgb(${r}, ${g}, ${b})`;
      gradientStops.push(`${color} ${i * 0.2}px`);
    }
    
    return `linear-gradient(to right, ${gradientStops.join(', ')})`;
  }
};

// Queue gradient system (for Your Queue section)
export const QUEUE_GRADIENTS = {
  createQueueGradient: (position) => {
    const positionColor = POSITION_COLORS[position]?.primary || '#6b7280';
    return {
      firstGradient: GRADIENT_FUNCTIONS.createFirstGradient(positionColor, '#1f2833'),
      secondGradient: GRADIENT_FUNCTIONS.createSecondGradient(positionColor, '#1f2833')
    };
  }
};

// Helper functions for position logic
export const POSITION_HELPERS = {
  /**
   * Get position color by position string
   */
  getPositionColor: (position) => {
    return POSITION_COLORS[position]?.primary || '#6b7280';
  },

  /**
   * Get position end color for gradients
   */
  getPositionEndColor: (position) => {
    return POSITION_END_COLORS[position] || '#1f2833';
  },

  /**
   * Get filter styles for position
   */
  getFilterStyles: (position, isActive) => {
    const styles = POSITION_FILTER_STYLES[position];
    return isActive ? styles?.active : styles?.inactive;
  },

  /**
   * Get RGB values for position
   */
  getPositionRGB: (position) => {
    return POSITION_COLORS[position]?.rgb || { r: 128, g: 128, b: 128 };
  },

  /**
   * Get RGBA string for position
   */
  getPositionRGBA: (position) => {
    return POSITION_COLORS[position]?.rgba || 'rgba(128, 128, 128, 0.3)';
  }
};

export default POSITION_COLORS;
