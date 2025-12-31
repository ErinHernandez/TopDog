/**
 * Analytics Module
 * 
 * Central exports for analytics functionality.
 */

export {
  // Types
  type DeviceInfo,
  type PerformanceMetrics,
  type DeviceTrackingEvent,
  type DraftPerformanceMetrics,
  type ErrorInfo,
  
  // Functions
  collectDeviceInfo,
  collectPerformanceMetrics,
  trackDeviceInfo,
  trackPerformance,
  trackDraftPerformance,
  trackError,
  
  // React Hook
  useDeviceTracking,
} from './deviceTracking';

