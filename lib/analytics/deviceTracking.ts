/**
 * Device Tracking Analytics
 *
 * Collects anonymized device information for understanding user device distribution
 * and optimizing for legacy device support.
 *
 * Data collected:
 * - iOS version
 * - Safari version
 * - Screen dimensions
 * - Device pixel ratio
 * - Feature support (WebP, flexbox gap, etc.)
 * - Support tier classification
 * - Performance metrics (optional)
 *
 * Privacy notes:
 * - No personally identifiable information collected
 * - Device model is estimated, not exact
 * - Data is aggregated for analysis
 *
 * Created: December 30, 2024
 */

import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[DeviceTracking]');

// ============================================================================
// TYPES
// ============================================================================

export interface DeviceInfo {
  /** iOS version (e.g., "17.2") or null if not iOS */
  iosVersion: string | null;
  /** Safari version or null */
  safariVersion: string | null;
  /** Estimated device model */
  estimatedModel: string;
  /** Support tier (1, 2, or 3) */
  supportTier: 1 | 2 | 3;
  /** Screen width in CSS pixels */
  screenWidth: number;
  /** Screen height in CSS pixels */
  screenHeight: number;
  /** Viewport width */
  viewportWidth: number;
  /** Viewport height */
  viewportHeight: number;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Whether device supports WebP */
  supportsWebP: boolean;
  /** Whether device supports flexbox gap */
  supportsFlexGap: boolean;
  /** Whether device supports aspect-ratio CSS */
  supportsAspectRatio: boolean;
  /** Whether user prefers reduced motion */
  prefersReducedMotion: boolean;
  /** Whether device has notch or Dynamic Island */
  hasNotchOrIsland: boolean;
  /** Browser/platform identifier */
  platform: string;
  /** Is mobile device */
  isMobile: boolean;
  /** Is tablet device */
  isTablet: boolean;
  /** Timezone offset in minutes */
  timezoneOffset: number;
  /** Browser language */
  language: string;
  /** Connection type if available */
  connectionType: string | null;
  /** Timestamp */
  timestamp: string;
}

export interface PerformanceMetrics {
  /** First Contentful Paint in ms */
  fcp: number | null;
  /** Largest Contentful Paint in ms */
  lcp: number | null;
  /** First Input Delay in ms */
  fid: number | null;
  /** Cumulative Layout Shift */
  cls: number | null;
  /** Time to Interactive in ms */
  tti: number | null;
  /** Total Blocking Time in ms */
  tbt: number | null;
  /** DOM Content Loaded in ms */
  domContentLoaded: number | null;
  /** Page Load in ms */
  pageLoad: number | null;
}

export interface DeviceTrackingEvent {
  eventType: 'device_info' | 'performance' | 'error' | 'draft_performance';
  deviceInfo: DeviceInfo;
  performanceMetrics?: PerformanceMetrics;
  draftMetrics?: DraftPerformanceMetrics;
  errorInfo?: ErrorInfo;
  sessionId: string;
}

export interface DraftPerformanceMetrics {
  /** Time from click to pick confirmation in ms */
  pickLatency: number;
  /** Time for player list to render in ms */
  listRenderTime: number;
  /** Number of players in list */
  playerCount: number;
  /** Whether virtualization is enabled */
  isVirtualized: boolean;
  /** Current round */
  round: number;
  /** Pick number */
  pickNumber: number;
}

export interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  
  // Try to get from sessionStorage
  if (typeof sessionStorage !== 'undefined') {
    const stored = sessionStorage.getItem('td_session_id');
    if (stored) {
      sessionId = stored;
      return sessionId;
    }
  }
  
  // Generate new session ID
  sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('td_session_id', sessionId);
  }
  
  return sessionId;
}

// ============================================================================
// ANALYTICS BACKEND
// ============================================================================

/** Analytics endpoint - can be configured via environment variable */
const ANALYTICS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || '/api/analytics';

/** Queue for batching analytics events */
let analyticsQueue: DeviceTrackingEvent[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const MAX_QUEUE_SIZE = 10; // Flush when queue reaches this size

/**
 * Send analytics event to backend
 * Uses batching and retry logic for reliability
 */
async function sendToAnalytics(event: DeviceTrackingEvent): Promise<void> {
  // Add to queue
  analyticsQueue.push(event);

  // Flush if queue is full
  if (analyticsQueue.length >= MAX_QUEUE_SIZE) {
    await flushAnalyticsQueue();
    return;
  }

  // Schedule flush if not already scheduled
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushAnalyticsQueue().catch(error => {
        logger.warn(`Failed to flush analytics queue: ${error instanceof Error ? error.message : String(error)}`);
      });
    }, FLUSH_INTERVAL_MS);
  }
}

/**
 * Flush queued analytics events to backend
 */
async function flushAnalyticsQueue(): Promise<void> {
  // Clear timeout
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }

  // Get events to send
  const events = [...analyticsQueue];
  analyticsQueue = [];

  if (events.length === 0) return;

  try {
    // Use sendBeacon for reliability on page unload, fetch otherwise
    const payload = JSON.stringify({ events, timestamp: new Date().toISOString() });

    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      // Use sendBeacon for fire-and-forget
      const success = navigator.sendBeacon(ANALYTICS_ENDPOINT, payload);
      if (!success) {
        // Fallback to fetch if sendBeacon fails
        await fetchAnalytics(payload);
      }
    } else {
      await fetchAnalytics(payload);
    }

    logger.debug(`Sent ${events.length} analytics events`);
  } catch (error) {
    // Re-queue events on failure (with limit to prevent infinite growth)
    if (analyticsQueue.length < MAX_QUEUE_SIZE * 2) {
      analyticsQueue = [...events, ...analyticsQueue];
    }
    logger.warn(`Failed to send analytics: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Fetch-based analytics send (used when sendBeacon unavailable or fails)
 */
async function fetchAnalytics(payload: string): Promise<void> {
  const response = await fetch(ANALYTICS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    // Don't wait for response - fire and forget
    keepalive: true,
  });

  if (!response.ok) {
    throw new Error(`Analytics API returned ${response.status}`);
  }
}

/**
 * Flush analytics on page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (analyticsQueue.length > 0) {
      // Use sendBeacon for page unload
      const payload = JSON.stringify({ events: analyticsQueue, timestamp: new Date().toISOString() });
      navigator.sendBeacon?.(ANALYTICS_ENDPOINT, payload);
    }
  });
}

// ============================================================================
// DEVICE DETECTION
// ============================================================================

/**
 * Parse iOS version from user agent
 */
function parseIOSVersion(ua: string): string | null {
  const match = ua.match(/OS (\d+)_(\d+)(?:_(\d+))?/);
  if (!match) return null;
  const [, major, minor, patch] = match;
  return patch ? `${major}.${minor}.${patch}` : `${major}.${minor}`;
}

/**
 * Parse Safari version from user agent
 */
function parseSafariVersion(ua: string): string | null {
  const match = ua.match(/Version\/(\d+)\.(\d+)/);
  if (!match) return null;
  return `${match[1]}.${match[2]}`;
}

/**
 * Estimate device model from screen dimensions
 */
function estimateDeviceModel(width: number, height: number): string {
  const w = Math.min(width, height);
  const h = Math.max(width, height);
  
  const models: Record<string, string> = {
    '320x568': 'iPhone SE (1st gen)',
    '375x667': 'iPhone SE/6s/7/8',
    '414x736': 'iPhone 6s+/7+/8+',
    '375x812': 'iPhone X/XS/11 Pro/12 mini',
    '414x896': 'iPhone XR/XS Max/11',
    '390x844': 'iPhone 12/13/14',
    '393x852': 'iPhone 14 Pro/15',
    '428x926': 'iPhone 12/13 Pro Max',
    '430x932': 'iPhone 14/15 Pro Max',
    '402x874': 'iPhone 16 Pro',
    '440x956': 'iPhone 16 Pro Max',
  };
  
  return models[`${w}x${h}`] || `Unknown (${w}x${h})`;
}

/**
 * Determine support tier
 */
function determineSupportTier(iosVersion: string | null, screenWidth: number): 1 | 2 | 3 {
  if (!iosVersion) return 1;
  
  const majorVersion = parseInt(iosVersion.split('.')[0], 10);
  
  if (majorVersion >= 15 && screenWidth >= 390) return 1;
  if (majorVersion >= 15 && screenWidth >= 375) return 2;
  return 3;
}

/**
 * Check feature support
 */
function checkSupport() {
  const supportsFlexGap = typeof CSS !== 'undefined' && CSS.supports?.('gap', '1px');
  const supportsAspectRatio = typeof CSS !== 'undefined' && CSS.supports?.('aspect-ratio', '1');
  
  // WebP check (synchronous approximation)
  let supportsWebP = true;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    if (canvas.toDataURL) {
      supportsWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
  }
  
  return { supportsFlexGap, supportsAspectRatio, supportsWebP };
}

/**
 * Get connection type if available
 */
function getConnectionType(): string | null {
  if (typeof navigator === 'undefined') return null;
  
  const nav = navigator as Navigator & {
    connection?: { effectiveType?: string; type?: string };
  };
  
  if (nav.connection) {
    return nav.connection.effectiveType || nav.connection.type || null;
  }
  
  return null;
}

/**
 * Check if device has notch/Dynamic Island
 */
function hasNotchOrIsland(): boolean {
  if (typeof window === 'undefined' || typeof CSS === 'undefined') return false;
  
  try {
    const testEl = document.createElement('div');
    testEl.style.paddingTop = 'env(safe-area-inset-top, 0px)';
    document.body.appendChild(testEl);
    const paddingTop = parseInt(getComputedStyle(testEl).paddingTop, 10);
    document.body.removeChild(testEl);
    return paddingTop > 20;
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Collect device information
 */
export function collectDeviceInfo(): DeviceInfo {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const iosVersion = parseIOSVersion(ua);
  const safariVersion = parseSafariVersion(ua);
  const screenWidth = typeof screen !== 'undefined' ? screen.width : 0;
  const screenHeight = typeof screen !== 'undefined' ? screen.height : 0;
  const support = checkSupport();
  
  const isMobile = /iPhone|iPad|iPod|Android|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const isTablet = /iPad/i.test(ua) || (isMobile && Math.min(screenWidth, screenHeight) >= 600);
  
  return {
    iosVersion,
    safariVersion,
    estimatedModel: estimateDeviceModel(screenWidth, screenHeight),
    supportTier: determineSupportTier(iosVersion, screenWidth),
    screenWidth,
    screenHeight,
    viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 0,
    viewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    supportsWebP: support.supportsWebP,
    supportsFlexGap: support.supportsFlexGap,
    supportsAspectRatio: support.supportsAspectRatio,
    prefersReducedMotion: typeof window !== 'undefined' 
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
      : false,
    hasNotchOrIsland: hasNotchOrIsland(),
    platform: ua.includes('iPhone') ? 'iPhone' : ua.includes('iPad') ? 'iPad' : 'Other',
    isMobile,
    isTablet,
    timezoneOffset: new Date().getTimezoneOffset(),
    language: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
    connectionType: getConnectionType(),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Collect Web Vitals performance metrics
 */
export function collectPerformanceMetrics(): PerformanceMetrics {
  const metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    tti: null,
    tbt: null,
    domContentLoaded: null,
    pageLoad: null,
  };
  
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return metrics;
  }
  
  // Navigation timing
  const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  if (navTiming) {
    metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.startTime;
    metrics.pageLoad = navTiming.loadEventEnd - navTiming.startTime;
  }
  
  // Paint timing
  const paintEntries = performance.getEntriesByType('paint');
  const fcpEntry = paintEntries.find(e => e.name === 'first-contentful-paint');
  if (fcpEntry) {
    metrics.fcp = fcpEntry.startTime;
  }
  
  // LCP (if available via PerformanceObserver results)
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  if (lcpEntries.length > 0) {
    metrics.lcp = lcpEntries[lcpEntries.length - 1].startTime;
  }
  
  return metrics;
}

/**
 * Track device info event
 */
export function trackDeviceInfo(): DeviceTrackingEvent {
  const event: DeviceTrackingEvent = {
    eventType: 'device_info',
    deviceInfo: collectDeviceInfo(),
    sessionId: getSessionId(),
  };
  
  // Log in development
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Device Info', { event });
  }

  // Send to analytics backend (non-blocking)
  sendToAnalytics(event).catch(error => {
    logger.warn(`Failed to send device info analytics: ${error instanceof Error ? error.message : String(error)}`);
  });

  return event;
}

/**
 * Track performance metrics
 */
export function trackPerformance(): DeviceTrackingEvent {
  const event: DeviceTrackingEvent = {
    eventType: 'performance',
    deviceInfo: collectDeviceInfo(),
    performanceMetrics: collectPerformanceMetrics(),
    sessionId: getSessionId(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Performance', { event });
  }

  return event;
}

/**
 * Track draft room performance
 */
export function trackDraftPerformance(metrics: DraftPerformanceMetrics): DeviceTrackingEvent {
  const event: DeviceTrackingEvent = {
    eventType: 'draft_performance',
    deviceInfo: collectDeviceInfo(),
    draftMetrics: metrics,
    sessionId: getSessionId(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Draft Performance', { event });
  }

  return event;
}

/**
 * Track error with device context
 */
export function trackError(error: Error, componentStack?: string): DeviceTrackingEvent {
  const event: DeviceTrackingEvent = {
    eventType: 'error',
    deviceInfo: collectDeviceInfo(),
    errorInfo: {
      message: error.message,
      stack: error.stack,
      componentStack,
    },
    sessionId: getSessionId(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    logger.error('Error', error, { event });
  }

  return event;
}

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * Hook to track device info on mount
 */
export function useDeviceTracking(options?: { trackPerformance?: boolean }) {
  const hasTracked = useRef(false);
  
  useEffect(() => {
    if (hasTracked.current) return;
    hasTracked.current = true;
    
    // Track device info immediately
    trackDeviceInfo();
    
    // Track performance after load
    if (options?.trackPerformance) {
      // Wait for page to fully load
      if (document.readyState === 'complete') {
        setTimeout(trackPerformance, 1000);
      } else {
        window.addEventListener('load', () => {
          setTimeout(trackPerformance, 1000);
        }, { once: true });
      }
    }
  }, [options?.trackPerformance]);
}

// ============================================================================
// EXPORTS
// ============================================================================

const deviceTracking = {
  collectDeviceInfo,
  collectPerformanceMetrics,
  trackDeviceInfo,
  trackPerformance,
  trackDraftPerformance,
  trackError,
  useDeviceTracking,
};

export default deviceTracking;
