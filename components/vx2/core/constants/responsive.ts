/**
 * VX2 Responsive Constants
 * 
 * Enterprise-grade responsive sizing system for supporting all iPhone models
 * from iPhone SE (375x667) to iPhone 16 Pro Max (440x956).
 * 
 * Device Classification:
 * - compact: height <= 700px (iPhone SE, iPhone 8)
 * - standard: height 701-880px (iPhone 12-15, Mini models)
 * - large: height > 880px (Pro Max models)
 */

// ============================================================================
// TYPES
// ============================================================================

export type DeviceClass = 'compact' | 'standard' | 'large';

export interface DeviceClassification {
  class: DeviceClass;
  heightRange: [number, number];
  scaleFactor: number;
}

export interface ResponsiveScale {
  // Typography
  titleSize: number;
  titleLineHeight: number;
  labelSize: number;
  valueSize: number;
  buttonTextSize: number;
  progressLabelSize: number;
  
  // Spacing
  cardPadding: number;
  sectionGap: number;
  elementGap: number;
  
  // Components
  logoBarHeight: number;
  logoHeight: number;
  buttonHeight: number;
  imageMaxSize: number;
  progressBarHeight: number;
  statsRowHeight: number;
  
  // Margins
  titleMarginBottom: number;
  imageMarginTop: number;
  imageMarginBottom: number;
  progressMarginBottom: number;
  buttonMarginBottom: number;
}

// ============================================================================
// DEVICE CLASSIFICATIONS
// ============================================================================

export const DEVICE_CLASSIFICATIONS: Record<DeviceClass, DeviceClassification> = {
  compact: {
    class: 'compact',
    heightRange: [0, 700],
    scaleFactor: 0.65,
  },
  standard: {
    class: 'standard',
    heightRange: [701, 880],
    scaleFactor: 0.85,
  },
  large: {
    class: 'large',
    heightRange: [881, Infinity],
    scaleFactor: 1.0,
  },
};

// ============================================================================
// RESPONSIVE SCALE VALUES
// ============================================================================

export const RESPONSIVE_SCALE: Record<DeviceClass, ResponsiveScale> = {
  compact: {
    // Typography - significantly reduced for compact screens
    titleSize: 16,
    titleLineHeight: 1.2,
    labelSize: 9,
    valueSize: 11,
    buttonTextSize: 11,
    progressLabelSize: 9,
    
    // Spacing - tight but usable
    cardPadding: 10,
    sectionGap: 6,
    elementGap: 4,
    
    // Components - minimum viable sizes
    logoBarHeight: 28,
    logoHeight: 16,
    buttonHeight: 36,
    imageMaxSize: 100,
    progressBarHeight: 6,
    statsRowHeight: 32,
    
    // Margins - compressed
    titleMarginBottom: 6,
    imageMarginTop: 8,
    imageMarginBottom: 4,
    progressMarginBottom: 6,
    buttonMarginBottom: 6,
  },
  standard: {
    // Typography - balanced for mid-range screens
    titleSize: 22,
    titleLineHeight: 1.15,
    labelSize: 11,
    valueSize: 14,
    buttonTextSize: 13,
    progressLabelSize: 11,
    
    // Spacing - comfortable
    cardPadding: 16,
    sectionGap: 12,
    elementGap: 8,
    
    // Components - standard sizes
    logoBarHeight: 36,
    logoHeight: 22,
    buttonHeight: 48,
    imageMaxSize: 160,
    progressBarHeight: 8,
    statsRowHeight: 44,
    
    // Margins - standard
    titleMarginBottom: 16,
    imageMarginTop: 20,
    imageMarginBottom: 8,
    progressMarginBottom: 12,
    buttonMarginBottom: 12,
  },
  large: {
    // Typography - full size for large screens
    titleSize: 26,
    titleLineHeight: 1.1,
    labelSize: 12,
    valueSize: 16,
    buttonTextSize: 14,
    progressLabelSize: 13,
    
    // Spacing - generous
    cardPadding: 21,
    sectionGap: 16,
    elementGap: 12,
    
    // Components - full sizes
    logoBarHeight: 44,
    logoHeight: 28,
    buttonHeight: 57,
    imageMaxSize: 200,
    progressBarHeight: 8,
    statsRowHeight: 50,
    
    // Margins - spacious
    titleMarginBottom: 24,
    imageMarginTop: 32,
    imageMarginBottom: 12,
    progressMarginBottom: 16,
    buttonMarginBottom: 16,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get device class based on viewport height
 */
export function getDeviceClass(viewportHeight: number): DeviceClass {
  if (viewportHeight <= 700) return 'compact';
  if (viewportHeight <= 880) return 'standard';
  return 'large';
}

/**
 * Get device class from a device preset ID
 * Used for simulated phone frames where viewport queries don't work
 */
export function getDeviceClassFromPreset(presetId: string | undefined): DeviceClass {
  if (!presetId) return 'standard';
  
  // Compact devices (height <= 700)
  const compactDevices = ['iphone-se'];
  if (compactDevices.includes(presetId)) return 'compact';
  
  // Large devices (height > 880)
  const largeDevices = [
    'iphone-11',
    'iphone-12-pro-max',
    'iphone-13-pro-max', 
    'iphone-14-pro-max',
    'iphone-16-pro-max'
  ];
  if (largeDevices.includes(presetId)) return 'large';
  
  // Everything else is standard
  return 'standard';
}

/**
 * Get responsive scale for a device class
 */
export function getResponsiveScale(deviceClass: DeviceClass): ResponsiveScale {
  return RESPONSIVE_SCALE[deviceClass];
}

/**
 * Get scale factor for a device class (useful for proportional scaling)
 */
export function getScaleFactor(deviceClass: DeviceClass): number {
  return DEVICE_CLASSIFICATIONS[deviceClass].scaleFactor;
}

// ============================================================================
// CSS CUSTOM PROPERTY HELPERS
// ============================================================================

/**
 * Generate CSS custom properties object for a device class
 * Can be spread into a style prop
 */
export function getResponsiveCSSVars(deviceClass: DeviceClass): Record<string, string> {
  const scale = RESPONSIVE_SCALE[deviceClass];
  
  return {
    '--vx2-title-size': `${scale.titleSize}px`,
    '--vx2-label-size': `${scale.labelSize}px`,
    '--vx2-value-size': `${scale.valueSize}px`,
    '--vx2-button-text-size': `${scale.buttonTextSize}px`,
    '--vx2-card-padding': `${scale.cardPadding}px`,
    '--vx2-section-gap': `${scale.sectionGap}px`,
    '--vx2-element-gap': `${scale.elementGap}px`,
    '--vx2-logo-bar-height': `${scale.logoBarHeight}px`,
    '--vx2-logo-height': `${scale.logoHeight}px`,
    '--vx2-button-height': `${scale.buttonHeight}px`,
    '--vx2-image-max-size': `${scale.imageMaxSize}px`,
  };
}

