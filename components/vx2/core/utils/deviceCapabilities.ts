/**
 * Device Capability Detection Utilities
 * 
 * Detects device capabilities and iOS version for legacy device support.
 * Used to conditionally enable/disable features and apply fallbacks.
 * 
 * Created: December 30, 2024
 * Target: iOS 12+ Safari
 */

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceCapabilities {
  /** iOS version as a number (e.g., 15.4) or null if not iOS */
  iosVersion: number | null;
  /** Safari version as a number or null if not Safari */
  safariVersion: number | null;
  /** Whether the device is considered "legacy" (Tier 2/3) */
  isLegacyDevice: boolean;
  /** Device support tier (1 = full, 2 = compatible, 3 = best effort) */
  supportTier: 1 | 2 | 3;
  /** Whether the browser supports flexbox gap */
  supportsFlexGap: boolean;
  /** Whether the browser supports aspect-ratio CSS property */
  supportsAspectRatio: boolean;
  /** Whether the browser supports WebP images */
  supportsWebP: boolean;
  /** Whether the user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Screen width in CSS pixels */
  screenWidth: number;
  /** Screen height in CSS pixels */
  screenHeight: number;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Whether the device has a notch or Dynamic Island */
  hasNotchOrIsland: boolean;
  /** Estimated device model based on screen dimensions */
  estimatedModel: string;
}

export interface DeviceTier {
  tier: 1 | 2 | 3;
  name: string;
  description: string;
  minIOS: number;
  models: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const DEVICE_TIERS: DeviceTier[] = [
  {
    tier: 1,
    name: 'Full Support',
    description: 'All features, optimal performance',
    minIOS: 15,
    models: ['iPhone 11', 'iPhone 12', 'iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 16'],
  },
  {
    tier: 2,
    name: 'Compatible',
    description: 'All features functional, acceptable performance',
    minIOS: 15,
    models: ['iPhone 8', 'iPhone X', 'iPhone XR', 'iPhone XS'],
  },
  {
    tier: 3,
    name: 'Best Effort',
    description: 'Core features work, performance may degrade',
    minIOS: 15,
    models: ['iPhone 6s', 'iPhone 7', 'iPhone SE (1st gen)'],
  },
];

// Screen dimensions for device estimation
const DEVICE_SCREENS: Record<string, { width: number; height: number; models: string[] }> = {
  'se-1st': { width: 320, height: 568, models: ['iPhone SE (1st gen)', 'iPhone 5s'] },
  'se-home': { width: 375, height: 667, models: ['iPhone SE (2nd/3rd gen)', 'iPhone 6s', 'iPhone 7', 'iPhone 8'] },
  'plus': { width: 414, height: 736, models: ['iPhone 6s Plus', 'iPhone 7 Plus', 'iPhone 8 Plus'] },
  'x-xs': { width: 375, height: 812, models: ['iPhone X', 'iPhone XS', 'iPhone 11 Pro'] },
  'xr-11': { width: 414, height: 896, models: ['iPhone XR', 'iPhone 11'] },
  'xs-max': { width: 414, height: 896, models: ['iPhone XS Max', 'iPhone 11 Pro Max'] },
  '12-13': { width: 390, height: 844, models: ['iPhone 12', 'iPhone 12 Pro', 'iPhone 13', 'iPhone 13 Pro'] },
  '12-13-mini': { width: 375, height: 812, models: ['iPhone 12 mini', 'iPhone 13 mini'] },
  '12-13-max': { width: 428, height: 926, models: ['iPhone 12 Pro Max', 'iPhone 13 Pro Max'] },
  '14': { width: 390, height: 844, models: ['iPhone 14'] },
  '14-pro': { width: 393, height: 852, models: ['iPhone 14 Pro', 'iPhone 15', 'iPhone 15 Pro'] },
  '14-pm': { width: 430, height: 932, models: ['iPhone 14 Pro Max', 'iPhone 15 Plus', 'iPhone 15 Pro Max'] },
  '16-pro': { width: 402, height: 874, models: ['iPhone 16 Pro'] },
  '16-pm': { width: 440, height: 956, models: ['iPhone 16 Pro Max'] },
};

// ============================================================================
// DETECTION FUNCTIONS
// ============================================================================

/**
 * Parse iOS version from user agent string
 */
export function parseIOSVersion(userAgent: string): number | null {
  // iOS user agent contains "OS X_Y_Z" pattern
  const match = userAgent.match(/OS (\d+)_(\d+)(?:_(\d+))?/);
  if (!match) return null;
  
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  const patch = match[3] ? parseInt(match[3], 10) : 0;
  
  // Return as float (e.g., 15.4 for iOS 15.4)
  return major + minor / 10 + patch / 100;
}

/**
 * Parse Safari version from user agent string
 */
export function parseSafariVersion(userAgent: string): number | null {
  // Safari version in user agent
  const match = userAgent.match(/Version\/(\d+)\.(\d+)/);
  if (!match) return null;
  
  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);
  
  return major + minor / 10;
}

/**
 * Check if browser supports flexbox gap
 */
export function checkFlexGapSupport(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false;
  }
  return CSS.supports('gap', '1px');
}

/**
 * Check if browser supports aspect-ratio CSS property
 */
export function checkAspectRatioSupport(): boolean {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') {
    return false;
  }
  return CSS.supports('aspect-ratio', '1');
}

/**
 * Check if browser supports WebP images
 */
export function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width === 1);
    img.onerror = () => resolve(false);
    // Minimal WebP image (1x1 transparent)
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA=';
  });
}

/**
 * Check WebP support synchronously (uses cached result if available)
 */
let webPSupportCache: boolean | null = null;
export function checkWebPSupportSync(): boolean {
  if (webPSupportCache !== null) return webPSupportCache;
  
  // Quick check using canvas (less reliable but synchronous)
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL) {
      const dataUrl = canvas.toDataURL('image/webp');
      webPSupportCache = dataUrl.indexOf('data:image/webp') === 0;
      return webPSupportCache;
    }
  }
  
  return true; // Assume support if we can't check
}

/**
 * Check if user prefers reduced motion
 */
export function checkReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Estimate device model from screen dimensions
 */
export function estimateDeviceModel(width: number, height: number): string {
  // Normalize to portrait orientation
  const w = Math.min(width, height);
  const h = Math.max(width, height);
  
  // Find closest match
  for (const [, config] of Object.entries(DEVICE_SCREENS)) {
    if (config.width === w && config.height === h) {
      return config.models[0];
    }
  }
  
  // Fallback to screen size category
  if (w <= 375 && h <= 667) return 'iPhone (small screen)';
  if (w <= 390 && h <= 844) return 'iPhone (medium screen)';
  if (w <= 430 && h <= 932) return 'iPhone (large screen)';
  return 'iPhone (unknown)';
}

/**
 * Determine device support tier based on iOS version and screen size
 */
export function determineDeviceTier(iosVersion: number | null, screenWidth: number): 1 | 2 | 3 {
  // If not iOS, assume modern browser (Tier 1)
  if (iosVersion === null) return 1;
  
  // iOS 15+ with modern screen = Tier 1
  if (iosVersion >= 15 && screenWidth >= 390) return 1;
  
  // iOS 15+ with smaller screen = Tier 2
  if (iosVersion >= 15 && screenWidth >= 375) return 2;
  
  // Older iOS or very small screen = Tier 3
  return 3;
}

/**
 * Check if device has notch or Dynamic Island based on safe area
 */
export function checkNotchOrIsland(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
  
  // Check if safe-area-inset-top is significant (> 20px indicates notch)
  const testEl = document.createElement('div');
  testEl.style.paddingTop = 'env(safe-area-inset-top, 0px)';
  document.body.appendChild(testEl);
  const paddingTop = parseInt(getComputedStyle(testEl).paddingTop, 10);
  document.body.removeChild(testEl);
  
  return paddingTop > 20;
}

// ============================================================================
// MAIN DETECTION FUNCTION
// ============================================================================

/**
 * Detect all device capabilities
 * Call this once on app initialization and cache the result
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  // Server-side fallback
  if (typeof window === 'undefined') {
    return {
      iosVersion: null,
      safariVersion: null,
      isLegacyDevice: false,
      supportTier: 1,
      supportsFlexGap: true,
      supportsAspectRatio: true,
      supportsWebP: true,
      prefersReducedMotion: false,
      screenWidth: 390,
      screenHeight: 844,
      devicePixelRatio: 3,
      hasNotchOrIsland: true,
      estimatedModel: 'iPhone 14 Pro',
    };
  }
  
  const ua = navigator.userAgent;
  const iosVersion = parseIOSVersion(ua);
  const safariVersion = parseSafariVersion(ua);
  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const devicePixelRatio = window.devicePixelRatio || 1;
  const supportTier = determineDeviceTier(iosVersion, screenWidth);
  
  return {
    iosVersion,
    safariVersion,
    isLegacyDevice: supportTier >= 2,
    supportTier,
    supportsFlexGap: checkFlexGapSupport(),
    supportsAspectRatio: checkAspectRatioSupport(),
    supportsWebP: checkWebPSupportSync(),
    prefersReducedMotion: checkReducedMotion(),
    screenWidth,
    screenHeight,
    devicePixelRatio,
    hasNotchOrIsland: checkNotchOrIsland(),
    estimatedModel: estimateDeviceModel(screenWidth, screenHeight),
  };
}

// ============================================================================
// DOM CLASS HELPERS
// ============================================================================

/**
 * Apply device capability classes to the HTML element
 * Call this once on app initialization
 */
export function applyDeviceClasses(capabilities?: DeviceCapabilities): void {
  if (typeof document === 'undefined') return;
  
  const caps = capabilities || detectDeviceCapabilities();
  const html = document.documentElement;
  
  // Remove existing device classes
  html.classList.remove(
    'legacy-device',
    'ios-lt-14',
    'ios-lt-15',
    'no-flex-gap',
    'no-webp',
    'reduced-motion'
  );
  
  // Apply new classes based on capabilities
  if (caps.isLegacyDevice) {
    html.classList.add('legacy-device');
  }
  
  if (caps.iosVersion !== null) {
    if (caps.iosVersion < 14) {
      html.classList.add('ios-lt-14');
    }
    if (caps.iosVersion < 15) {
      html.classList.add('ios-lt-15');
    }
  }
  
  if (!caps.supportsFlexGap) {
    html.classList.add('no-flex-gap');
  }
  
  if (!caps.supportsWebP) {
    html.classList.add('no-webp');
  }
  
  if (caps.prefersReducedMotion) {
    html.classList.add('reduced-motion');
  }
}

// ============================================================================
// REACT HOOK
// ============================================================================

let cachedCapabilities: DeviceCapabilities | null = null;

/**
 * Get device capabilities (cached after first call)
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  if (cachedCapabilities === null) {
    cachedCapabilities = detectDeviceCapabilities();
  }
  return cachedCapabilities;
}

/**
 * Clear cached capabilities (useful for testing)
 */
export function clearCapabilitiesCache(): void {
  cachedCapabilities = null;
}

// ============================================================================
// ANIMATION HELPERS
// ============================================================================

/**
 * Get recommended animation duration based on device capabilities
 */
export function getAnimationDuration(baseDuration: number): number {
  const caps = getDeviceCapabilities();
  
  // No animations if user prefers reduced motion
  if (caps.prefersReducedMotion) return 0;
  
  // Reduce animations on legacy devices
  if (caps.supportTier === 3) return baseDuration * 0.5;
  if (caps.supportTier === 2) return baseDuration * 0.75;
  
  return baseDuration;
}

/**
 * Check if we should skip heavy animations
 */
export function shouldReduceAnimations(): boolean {
  const caps = getDeviceCapabilities();
  return caps.prefersReducedMotion || caps.supportTier >= 2;
}

// ============================================================================
// PERFORMANCE HELPERS
// ============================================================================

/**
 * Get recommended batch size for list rendering
 * Legacy devices should render fewer items at once
 */
export function getRecommendedBatchSize(): number {
  const caps = getDeviceCapabilities();
  
  if (caps.supportTier === 3) return 10;
  if (caps.supportTier === 2) return 20;
  return 50;
}

/**
 * Get recommended debounce delay for user input
 * Legacy devices need more time to process
 */
export function getRecommendedDebounceDelay(): number {
  const caps = getDeviceCapabilities();
  
  if (caps.supportTier === 3) return 300;
  if (caps.supportTier === 2) return 200;
  return 100;
}


