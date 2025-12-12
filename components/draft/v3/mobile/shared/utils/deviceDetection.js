/**
 * Device Detection and Platform Utilities
 * Determines optimal mobile experience based on device
 */

/**
 * Detect iOS devices
 */
export function isIOS() {
  if (typeof window === 'undefined') return false;
  
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/**
 * Detect Android devices
 */
export function isAndroid() {
  if (typeof window === 'undefined') return false;
  
  return /Android/.test(navigator.userAgent);
}

/**
 * Detect mobile devices (any)
 */
export function isMobile() {
  if (typeof window === 'undefined') return false;
  
  return /Mobi|Android/i.test(navigator.userAgent) || 
         window.innerWidth <= 768;
}

/**
 * Detect tablet devices
 */
export function isTablet() {
  if (typeof window === 'undefined') return false;
  
  return window.innerWidth >= 768 && window.innerWidth <= 1024;
}

/**
 * Get optimal mobile experience platform
 */
export function getMobilePlatform() {
  if (isIOS()) return 'apple';
  if (isAndroid()) return 'android';
  return 'web'; // Fallback to web experience
}

/**
 * Get device category for layout decisions
 */
export function getDeviceCategory() {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width <= 414) return 'phone';
  if (width <= 768) return 'phablet';
  if (width <= 1024) return 'tablet';
  return 'desktop';
}

/**
 * Check if device supports hover (not touch-only)
 */
export function supportsHover() {
  if (typeof window === 'undefined') return true;
  
  return window.matchMedia('(hover: hover)').matches;
}

/**
 * Get safe area insets for iOS devices
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined' || !isIOS()) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  const style = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0')
  };
}

/**
 * Mobile routing helper - determines which mobile experience to show
 */
export function getMobileRoute(baseRoute, roomId = '') {
  const platform = getMobilePlatform();
  
  if (platform === 'web') {
    return `${baseRoute}/${roomId}`; // Standard web experience
  }
  
  return `${baseRoute}/mobile/${platform}/${roomId}`;
}

/**
 * Touch capability detection
 */
export function getTouchCapabilities() {
  if (typeof window === 'undefined') {
    return { hasTouch: false, maxTouchPoints: 0 };
  }

  return {
    hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    maxTouchPoints: navigator.maxTouchPoints || 0,
    isMultiTouch: navigator.maxTouchPoints > 1
  };
}
