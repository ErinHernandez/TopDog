/**
 * VX2 Core Utilities
 * 
 * Utility functions for the VX2 framework.
 */

export {
  // Types
  type DeviceCapabilities,
  type DeviceTier,
  
  // Constants
  DEVICE_TIERS,
  
  // Detection functions
  parseIOSVersion,
  parseSafariVersion,
  checkFlexGapSupport,
  checkAspectRatioSupport,
  checkWebPSupport,
  checkWebPSupportSync,
  checkReducedMotion,
  estimateDeviceModel,
  determineDeviceTier,
  checkNotchOrIsland,
  detectDeviceCapabilities,
  
  // DOM helpers
  applyDeviceClasses,
  
  // Getters
  getDeviceCapabilities,
  clearCapabilitiesCache,
  
  // Animation helpers
  getAnimationDuration,
  shouldReduceAnimations,
  
  // Performance helpers
  getRecommendedBatchSize,
  getRecommendedDebounceDelay,
} from './deviceCapabilities';


