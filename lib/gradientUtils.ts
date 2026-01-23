/**
 * Gradient utility functions for consistent shading across the application
 * Based on the available player container cell formatting
 */

// ============================================================================
// TYPES
// ============================================================================

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | string;

export interface PositionGradient {
  firstGradient: string;
  secondGradient?: string;
  positionColor: string;
}

export interface TeamGradient {
  firstGradient: string;
  primaryColor: string;
  secondaryColor: string;
}

export type NFLTeamCode = 
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI'
  | 'CIN' | 'CLE' | 'DAL' | 'DEN' | 'DET' | 'GB'
  | 'HOU' | 'IND' | 'JAX' | 'JAC' | 'KC' | 'LAC' | 'LAR'
  | 'LV' | 'MIA' | 'MIN' | 'NE' | 'NO' | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SEA' | 'SF' | 'TB'
  | 'TEN' | 'WAS';

// ============================================================================
// POSITION COLOR MAPPING
// ============================================================================

/**
 * Position color mapping
 */
export const getPositionColor = (position: Position): string => {
  switch (position) {
    case 'QB': return '#F472B6';  // Pink
    case 'RB': return '#0fba80';  // Green
    case 'WR': return '#4285F4';  // Blue
    case 'TE': return '#7C3AED';  // Purple
    default: return '#808080';
  }
};

/**
 * Position end color (darker shade)
 */
export const getPositionEndColor = (position: Position): string => {
  return '#1f2833';
};

// ============================================================================
// GRADIENT CREATION FUNCTIONS
// ============================================================================

/**
 * Create first gradient (0px to 136px) - 80% of the transition (15% faster)
 */
export const createFirstGradient = (startColor: string, endColor: string): string => {
  const gradientStops: string[] = [];
  gradientStops.push(`${startColor} 0px`);
  gradientStops.push(`${startColor} 1px`);
  
  // Add color stops for each 0.2px from 1px to 116px (15% reduced width)
  for (let i = 1; i <= 578; i++) {
    const percent = i / 578; // 1% per stop (578 stops = 0.2px each)
    const r1 = parseInt(startColor.slice(1, 3), 16);
    const g1 = parseInt(startColor.slice(3, 5), 16);
    const b1 = parseInt(startColor.slice(5, 7), 16);
    
    // Use the provided end color
    const r2 = parseInt(endColor.slice(1, 3), 16);
    const g2 = parseInt(endColor.slice(3, 5), 16);
    const b2 = parseInt(endColor.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * percent);
    const g = Math.round(g1 + (g2 - g1) * percent);
    const b = Math.round(b1 + (b2 - b1) * percent);
    
    const color = `rgb(${r}, ${g}, ${b})`;
    gradientStops.push(`${color} ${i * 0.2 + 1}px`);
  }
  
  return `linear-gradient(to right, ${gradientStops.join(', ')})`;
};

/**
 * Create second gradient (160px to 200px) - remaining 20% of the transition
 */
export const createSecondGradient = (startColor: string, endColor: string): string => {
  const gradientStops: string[] = [];
  
  // Calculate the exact color at 160px (where first gradient ends)
  const r1 = parseInt(startColor.slice(1, 3), 16);
  const g1 = parseInt(startColor.slice(3, 5), 16);
  const b1 = parseInt(startColor.slice(5, 7), 16);
  const r2 = 0x3B;
  const g2 = 0x43;
  const b2 = 0x4D;
  
  // At 160px, we're 80% through the total 200px gradient
  const startPercent = 0.8;
  const startR = Math.round(r1 + (r2 - r1) * startPercent);
  const startG = Math.round(g1 + (g2 - g1) * startPercent);
  const startB = Math.round(b1 + (b2 - b1) * startPercent);
  const startColorRGB = `rgb(${startR}, ${startG}, ${startB})`;
  
  gradientStops.push(`${startColorRGB} 0px`);
  
  // Add color stops for each 0.2px from 0px to 40px
  // This should complete the remaining 20% of the transition
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
};

/**
 * Create complete gradient for a position
 */
export const createPositionGradient = (position: Position): PositionGradient => {
  const positionColor = getPositionColor(position);
  const positionEndColor = getPositionEndColor(position);
  
  return {
    firstGradient: createFirstGradient(positionColor, positionEndColor),
    secondGradient: createSecondGradient(positionColor, positionEndColor),
    positionColor
  };
};

/**
 * Create fast gradient for roster (75% slower transition - 25% further than the previous 50% slower)
 */
export const createRosterGradient = (position: Position): PositionGradient => {
  const positionColor = getPositionColor(position);
  const positionEndColor = getPositionEndColor(position);
  
  const gradientStops: string[] = [];
  gradientStops.push(`${positionColor} 0px`);
  gradientStops.push(`${positionColor} 1px`);
  
  // 10% longer gradient: increase distances and stops by 10% from previous values
  let totalDistance: number;
  let totalStops: number;
  if (position === 'QB') {
    totalDistance = 73.63125; // 110% of 66.9375px (10% increase)
    totalStops = 369; // 110% of 335 stops (10% increase)
  } else if (position === 'RB') {
    totalDistance = 72.1423828125; // 110% of 65.583984375px (10% increase)
    totalStops = 363; // 110% of 330 stops (10% increase)
  } else {
    totalDistance = 73.63125; // 110% of 66.9375px (10% increase)
    totalStops = 369; // 110% of 335 stops (10% increase)
  }
  
  // Add color stops for each 0.2px from 1px to totalDistance
  for (let i = 1; i <= totalStops; i++) {
    const percent = i / totalStops; // 1% per stop
    const r1 = parseInt(positionColor.slice(1, 3), 16);
    const g1 = parseInt(positionColor.slice(3, 5), 16);
    const b1 = parseInt(positionColor.slice(5, 7), 16);
    
    // Use the provided end color
    const r2 = parseInt(positionEndColor.slice(1, 3), 16);
    const g2 = parseInt(positionEndColor.slice(3, 5), 16);
    const b2 = parseInt(positionEndColor.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * percent);
    const g = Math.round(g1 + (g2 - g1) * percent);
    const b = Math.round(b1 + (b2 - b1) * percent);
    
    const color = `rgb(${r}, ${g}, ${b})`;
    gradientStops.push(`${color} ${i * 0.2 + 1}px`);
  }
  
  return {
    firstGradient: `linear-gradient(to right, ${gradientStops.join(', ')})`,
    positionColor
  };
};

/**
 * Create ultra-fast gradient for queue (15% faster than roster gradient)
 */
export const createQueueGradient = (position: Position): PositionGradient => {
  const positionColor = getPositionColor(position);
  const positionEndColor = getPositionEndColor(position);
  
  const gradientStops: string[] = [];
  gradientStops.push(`${positionColor} 0px`);
  gradientStops.push(`${positionColor} 1px`);
  
  // 15% faster than roster gradient (68px instead of 80px, 66.3px for RB)
  const totalDistance = position === 'RB' ? 66.3 : 68; // 15% faster
  const totalStops = position === 'RB' ? 332 : 340; // 15% fewer stops
  
  // Add color stops for each 0.2px from 1px to totalDistance
  for (let i = 1; i <= totalStops; i++) {
    const percent = i / totalStops; // 1% per stop
    const r1 = parseInt(positionColor.slice(1, 3), 16);
    const g1 = parseInt(positionColor.slice(3, 5), 16);
    const b1 = parseInt(positionColor.slice(5, 7), 16);
    
    // Use the provided end color
    const r2 = parseInt(positionEndColor.slice(1, 3), 16);
    const g2 = parseInt(positionEndColor.slice(3, 5), 16);
    const b2 = parseInt(positionEndColor.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * percent);
    const g = Math.round(g1 + (g2 - g1) * percent);
    const b = Math.round(b1 + (b2 - b1) * percent);
    
    const color = `rgb(${r}, ${g}, ${b})`;
    gradientStops.push(`${color} ${i * 0.2 + 1}px`);
  }
  
  return {
    firstGradient: `linear-gradient(to right, ${gradientStops.join(', ')})`,
    positionColor
  };
};

/**
 * Create gradient for picked players that starts at 60% completion
 */
export const createPickedPlayerGradient = (position: Position): PositionGradient => {
  const positionColor = getPositionColor(position);
  const positionEndColor = getPositionEndColor(position);
  
  const gradientStops: string[] = [];
  
  // Calculate the color at 60% completion of the normal gradient
  const r1 = parseInt(positionColor.slice(1, 3), 16);
  const g1 = parseInt(positionColor.slice(3, 5), 16);
  const b1 = parseInt(positionColor.slice(5, 7), 16);
  const r2 = parseInt(positionEndColor.slice(1, 3), 16);
  const g2 = parseInt(positionEndColor.slice(3, 5), 16);
  const b2 = parseInt(positionEndColor.slice(5, 7), 16);
  
  // At 60% completion, the color is 60% of the way from start to end
  const r60 = Math.round(r1 + (r2 - r1) * 0.60);
  const g60 = Math.round(g1 + (g2 - g1) * 0.60);
  const b60 = Math.round(b1 + (b2 - b1) * 0.60);
  const color60 = `rgb(${r60}, ${g60}, ${b60})`;
  
  // Start with the 60% completed color
  gradientStops.push(`${color60} 0px`);
  gradientStops.push(`${color60} 1px`);
  
  // Apply to all positions
  if (position === 'RB') {
    // Complete the remaining 40% of the transition
    const remainingStops = 188; // 40% of the full 471 stops
    
    for (let i = 1; i <= remainingStops; i++) {
      const percent = i / remainingStops; // 0 to 1 for the remaining 40%
      const globalPercent = 0.60 + percent * 0.40; // 60% to 100%
      
      const r = Math.round(r1 + (r2 - r1) * globalPercent);
      const g = Math.round(g1 + (g2 - g1) * globalPercent);
      const b = Math.round(b1 + (b2 - b1) * globalPercent);
      
      const color = `rgb(${r}, ${g}, ${b})`;
      gradientStops.push(`${color} ${i * 0.2 + 1}px`);
    }
  } else if (position === 'QB') {
    // Complete the remaining 40% of the transition
    const remainingStops = 209; // 40% of the full 522 stops
    
    for (let i = 1; i <= remainingStops; i++) {
      const percent = i / remainingStops; // 0 to 1 for the remaining 40%
      const globalPercent = 0.60 + percent * 0.40; // 60% to 100%
      
      const r = Math.round(r1 + (r2 - r1) * globalPercent);
      const g = Math.round(g1 + (g2 - g1) * globalPercent);
      const b = Math.round(b1 + (b2 - b1) * globalPercent);
      
      const color = `rgb(${r}, ${g}, ${b})`;
      gradientStops.push(`${color} ${i * 0.2 + 1}px`);
    }
  } else if (position === 'WR') {
    // Complete the remaining 40% of the transition
    const remainingStops = 192; // 40% of the full 479 stops
    
    for (let i = 1; i <= remainingStops; i++) {
      const percent = i / remainingStops; // 0 to 1 for the remaining 40%
      const globalPercent = 0.60 + percent * 0.40; // 60% to 100%
      
      const r = Math.round(r1 + (r2 - r1) * globalPercent);
      const g = Math.round(g1 + (g2 - g1) * globalPercent);
      const b = Math.round(b1 + (b2 - b1) * globalPercent);
      
      const color = `rgb(${r}, ${g}, ${b})`;
      gradientStops.push(`${color} ${i * 0.2 + 1}px`);
    }
  } else if (position === 'TE') {
    // Complete the remaining 40% of the transition
    const remainingStops = 192; // 40% of the full 479 stops
    
    for (let i = 1; i <= remainingStops; i++) {
      const percent = i / remainingStops; // 0 to 1 for the remaining 40%
      const globalPercent = 0.60 + percent * 0.40; // 60% to 100%
      
      const r = Math.round(r1 + (r2 - r1) * globalPercent);
      const g = Math.round(g1 + (g2 - g1) * globalPercent);
      const b = Math.round(b1 + (b2 - b1) * globalPercent);
      
      const color = `rgb(${r}, ${g}, ${b})`;
      gradientStops.push(`${color} ${i * 0.2 + 1}px`);
    }
  } else {
    // For other positions, use the normal gradient for now
    return createRosterGradient(position);
  }
  
  return {
    firstGradient: `linear-gradient(to right, ${gradientStops.join(', ')})`,
    positionColor
  };
};

// ============================================================================
// TEAM GRADIENT FUNCTIONS
// ============================================================================

/**
 * NFL Team Colors mapping for gradients
 * Verified against official team brand guidelines
 */
export const getTeamColors = (team: NFLTeamCode | string): [string, string] => {
  const teamColors: Record<NFLTeamCode, [string, string]> = {
    'ARI': ['#97233F', '#000000'], // Cardinals: Cardinal Red, Black
    'ATL': ['#A71930', '#000000'], // Falcons: Red, Black
    'BAL': ['#241773', '#9E7C0C'], // Ravens: Purple, Metallic Gold
    'BUF': ['#00338D', '#C60C30'], // Bills: Royal Blue, Red
    'CAR': ['#0085CA', '#101820'], // Panthers: Panther Blue, Black
    'CHI': ['#0B162A', '#C83803'], // Bears: Navy, Orange
    'CIN': ['#FB4F14', '#000000'], // Bengals: Orange, Black
    'CLE': ['#311D00', '#FF3C00'], // Browns: Brown, Orange
    'DAL': ['#041E42', '#869397'], // Cowboys: Navy, Silver (NOT royal blue)
    'DEN': ['#FB4F14', '#002244'], // Broncos: Orange, Navy
    'DET': ['#0076B6', '#B0B7BC'], // Lions: Honolulu Blue, Silver
    'GB': ['#203731', '#FFB612'], // Packers: Dark Green, Gold
    'HOU': ['#03202F', '#A71930'], // Texans: Deep Steel Blue, Battle Red
    'IND': ['#002C5F', '#A2AAAD'], // Colts: Royal Blue, Silver
    'JAX': ['#006778', '#D7A22A'], // Jaguars: Teal, Gold
    'JAC': ['#006778', '#D7A22A'], // Jaguars (alt code): Teal, Gold
    'KC': ['#E31837', '#FFB81C'], // Chiefs: Red, Gold
    'LV': ['#000000', '#A5ACAF'], // Raiders: Black, Silver
    'LAC': ['#0080C6', '#FFC20E'], // Chargers: Powder Blue, Gold
    'LAR': ['#003594', '#FFD100'], // Rams: Royal Blue, Sol (Gold)
    'MIA': ['#008E97', '#FC4C02'], // Dolphins: Aqua, Orange
    'MIN': ['#4F2683', '#FFC62F'], // Vikings: Purple, Gold
    'NE': ['#002244', '#C60C30'], // Patriots: Navy, Red
    'NO': ['#101820', '#D3BC8D'], // Saints: Black, Old Gold
    'NYG': ['#0B2265', '#A71930'], // Giants: Blue, Red
    'NYJ': ['#125740', '#000000'], // Jets: Gotham Green, Black
    'PHI': ['#004C54', '#A5ACAF'], // Eagles: Midnight Green, Silver
    'PIT': ['#101820', '#FFB612'], // Steelers: Black, Gold
    'SF': ['#AA0000', '#B3995D'], // 49ers: Red, Gold
    'SEA': ['#002244', '#69BE28'], // Seahawks: College Navy, Action Green
    'TB': ['#D50A0A', '#34302B'], // Buccaneers: Red, Pewter
    'TEN': ['#0C2340', '#4B92DB'], // Titans: Navy, Titans Blue
    'WAS': ['#5A1414', '#FFB612']  // Commanders: Burgundy, Gold
  };
  
  return teamColors[team?.toUpperCase() as NFLTeamCode] || ['#374151', '#1F2937']; // Default gray gradient
};

/**
 * Calculate relative luminance of a hex color (0 = darkest, 1 = brightest)
 */
const getLuminance = (hexColor: string): number => {
  const r = parseInt(hexColor.slice(1, 3), 16) / 255;
  const g = parseInt(hexColor.slice(3, 5), 16) / 255;
  const b = parseInt(hexColor.slice(5, 7), 16) / 255;
  
  // sRGB luminance formula
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
};

/**
 * Convert hex color to rgba with opacity
 */
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Create team-based gradient for stats modals
 */
export const createTeamGradient = (team: NFLTeamCode | string): TeamGradient => {
  const [color1, color2] = getTeamColors(team);
  
  // Calculate luminance to determine which is darker
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  
  // Darker color goes in center, lighter on edges
  const edgeColor = lum1 > lum2 ? color1 : color2;
  const centerColor = lum1 > lum2 ? color2 : color1;
  
  // Convert to rgba with varying opacity for depth
  const darkDeep = hexToRgba(centerColor, 0.95);
  const darkMid = hexToRgba(centerColor, 0.85);
  const lightAccent = hexToRgba(edgeColor, 0.6);
  const lightGlow = hexToRgba(edgeColor, 0.35);
  
  // Elegant gradient: deep dark base with subtle light accent sweep
  const diagonalGradient = `linear-gradient(135deg, ${darkDeep} 0%, ${darkMid} 25%, ${lightGlow} 45%, ${lightAccent} 55%, ${darkMid} 75%, ${darkDeep} 100%)`;
  
  return {
    firstGradient: diagonalGradient,
    primaryColor: edgeColor,
    secondaryColor: centerColor
  };
};

/**
 * Create flex gradient with RB gradient in top third
 */
export const createFlexGradient = (): PositionGradient => {
  const rbColor = getPositionColor('RB'); // Green
  const endColor = getPositionEndColor('RB'); // Dark gray
  
  const gradientStops: string[] = [];
  
  // Top third: RB gradient (0px to ~26.7px) - horizontal flow
  gradientStops.push(`${rbColor} 0px`);
  gradientStops.push(`${rbColor} 1px`);
  
  for (let i = 1; i <= 133; i++) { // 133 stops for ~26.7px
    const percent = i / 133;
    const r1 = parseInt(rbColor.slice(1, 3), 16);
    const g1 = parseInt(rbColor.slice(3, 5), 16);
    const b1 = parseInt(rbColor.slice(5, 7), 16);
    const r2 = parseInt(endColor.slice(1, 3), 16);
    const g2 = parseInt(endColor.slice(3, 5), 16);
    const b2 = parseInt(endColor.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * percent);
    const g = Math.round(g1 + (g2 - g1) * percent);
    const b = Math.round(b1 + (b2 - b1) * percent);
    
    const color = `rgb(${r}, ${g}, ${b})`;
    gradientStops.push(`${color} ${i * 0.2 + 1}px`);
  }
  
  // Rest of the cell: Dark gray
  gradientStops.push(`${endColor} 26.7px`);
  gradientStops.push(`${endColor} 80px`);
  
  return {
    firstGradient: `linear-gradient(to right, ${gradientStops.join(', ')})`,
    positionColor: '#808080' // Default gray for flex
  };
};
