/**
 * Web Vitals Collection
 *
 * Client-side utility for collecting and reporting Core Web Vitals
 * and other performance metrics to the performance API.
 *
 * @module lib/performance/webVitals
 */

import { createScopedLogger } from '../clientLogger';

const logger = createScopedLogger('[WebVitals]');

// ============================================================================
// TYPES
// ============================================================================

export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  entries: PerformanceEntry[];
}

export interface PerformanceMetrics {
  url?: string;
  userAgent?: string;
  deviceType?: 'mobile' | 'desktop';
  timestamp?: string;
  connectionType?: string;
  lcp?: number | null;
  fid?: number | null;
  cls?: number | null;
  fcp?: number | null;
  tti?: number | null;
  tbt?: number | null;
  domContentLoaded?: number | null;
  pageLoad?: number | null;
  ttfb?: number | null;
  custom?: Record<string, number>;
}

// ============================================================================
// WEB VITALS COLLECTION
// ============================================================================

/**
 * Collect Largest Contentful Paint (LCP)
 */
export function collectLCP(onMetric: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
        startTime?: number;
      };

      if (lastEntry) {
        const value = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime || 0;
        
        onMetric({
          id: `lcp-${Date.now()}`,
          name: 'LCP',
          value,
          rating: value <= 2500 ? 'good' : value <= 4000 ? 'needs-improvement' : 'poor',
          delta: value,
          entries: [lastEntry],
        });
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    // PerformanceObserver not supported or error
    logger.warn('LCP collection failed');
  }
}

/**
 * Collect First Input Delay (FID)
 */
export function collectFID(onMetric: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEventTiming[];
      
      for (const entry of entries) {
        if (entry.processingStart && entry.startTime) {
          const value = entry.processingStart - entry.startTime;
          
          onMetric({
            id: `fid-${Date.now()}`,
            name: 'FID',
            value,
            rating: value <= 100 ? 'good' : value <= 300 ? 'needs-improvement' : 'poor',
            delta: value,
            entries: [entry],
          });
        }
      }
    });

    observer.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    logger.warn('FID collection failed');
  }
}

/**
 * Collect Cumulative Layout Shift (CLS)
 */
export function collectCLS(onMetric: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    let clsValue = 0;
    const clsEntries: PerformanceEntry[] = [];

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LayoutShift[];

      for (const entry of entries) {
        // Only count layout shifts without recent user input
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          clsEntries.push(entry);
        }
      }

      // Report CLS periodically (on visibility change or page unload)
      if (document.visibilityState === 'hidden') {
        onMetric({
          id: `cls-${Date.now()}`,
          name: 'CLS',
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
          delta: clsValue,
          entries: clsEntries,
        });
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });

    // Report CLS when page is hidden
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && clsValue > 0) {
        onMetric({
          id: `cls-${Date.now()}`,
          name: 'CLS',
          value: clsValue,
          rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor',
          delta: clsValue,
          entries: clsEntries,
        });
      }
    });
  } catch (error) {
    logger.warn('CLS collection failed');
  }
}

/**
 * Collect First Contentful Paint (FCP)
 */
export function collectFCP(onMetric: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((entry) => entry.name === 'first-contentful-paint');

      if (fcpEntry) {
        onMetric({
          id: `fcp-${Date.now()}`,
          name: 'FCP',
          value: fcpEntry.startTime,
          rating: fcpEntry.startTime <= 1800 ? 'good' : fcpEntry.startTime <= 3000 ? 'needs-improvement' : 'poor',
          delta: fcpEntry.startTime,
          entries: [fcpEntry],
        });
      }
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    logger.warn('FCP collection failed');
  }
}

/**
 * Collect Time to First Byte (TTFB)
 */
export function collectTTFB(onMetric: (metric: WebVitalsMetric) => void): void {
  if (typeof window === 'undefined' || typeof performance === 'undefined') {
    return;
  }

  try {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navTiming) {
      const ttfb = navTiming.responseStart - navTiming.requestStart;
      
      onMetric({
        id: `ttfb-${Date.now()}`,
        name: 'TTFB',
        value: ttfb,
        rating: ttfb <= 800 ? 'good' : ttfb <= 1800 ? 'needs-improvement' : 'poor',
        delta: ttfb,
        entries: [navTiming],
      });
    }
  } catch (error) {
    logger.warn('TTFB collection failed');
  }
}

// ============================================================================
// METRICS AGGREGATION
// ============================================================================

/**
 * Collect all Web Vitals and send to performance API
 */
export function collectAndReportWebVitals(
  apiEndpoint: string = '/api/performance/metrics'
): void {
  if (typeof window === 'undefined') {
    return;
  }

  const metrics: PerformanceMetrics = {
    url: window.location.href,
    userAgent: navigator.userAgent,
    deviceType: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop',
    timestamp: new Date().toISOString(),
  };

  // Collect connection type if available (Network Information API - not in Navigator type)
  interface NavigatorWithConnection extends Navigator {
    connection?: { effectiveType?: string };
    mozConnection?: { effectiveType?: string };
    webkitConnection?: { effectiveType?: string };
  }
  const nav = navigator as NavigatorWithConnection;
  const connection = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
  if (connection) {
    metrics.connectionType = connection.effectiveType;
  }

  // Collect all metrics
  const collectedMetrics: WebVitalsMetric[] = [];

  const onMetric = (metric: WebVitalsMetric) => {
    collectedMetrics.push(metric);
    
    // Update metrics object
    switch (metric.name) {
      case 'LCP':
        metrics.lcp = metric.value;
        break;
      case 'FID':
        metrics.fid = metric.value;
        break;
      case 'CLS':
        metrics.cls = metric.value;
        break;
      case 'FCP':
        metrics.fcp = metric.value;
        break;
      case 'TTFB':
        metrics.ttfb = metric.value;
        break;
    }

    // Send metrics when all critical metrics are collected or after delay
    if (collectedMetrics.length >= 3 || (collectedMetrics.length > 0 && document.visibilityState === 'hidden')) {
      sendMetrics(apiEndpoint, metrics);
    }
  };

  // Start collecting
  collectLCP(onMetric);
  collectFID(onMetric);
  collectCLS(onMetric);
  collectFCP(onMetric);
  collectTTFB(onMetric);

  // Collect navigation timing metrics
  if (typeof performance !== 'undefined') {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navTiming) {
      metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.startTime;
      metrics.pageLoad = navTiming.loadEventEnd - navTiming.startTime;
    }
  }

  // Send metrics on page unload (if not already sent)
  window.addEventListener('beforeunload', () => {
    if (collectedMetrics.length > 0) {
      sendMetrics(apiEndpoint, metrics, true); // Use sendBeacon for reliability
    }
  });

  // Send metrics after a delay to ensure all metrics are collected
  setTimeout(() => {
    if (collectedMetrics.length > 0) {
      sendMetrics(apiEndpoint, metrics);
    }
  }, 5000); // 5 seconds
}

/**
 * Send metrics to API
 */
function sendMetrics(
  apiEndpoint: string,
  metrics: PerformanceMetrics,
  useBeacon: boolean = false
): void {
  if (useBeacon && 'sendBeacon' in navigator) {
    // Use sendBeacon for reliability on page unload
    navigator.sendBeacon(
      apiEndpoint,
      JSON.stringify(metrics)
    );
  } else {
    // Use fetch for normal requests
    fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metrics),
      keepalive: true, // Keep request alive even if page unloads
    }).catch(() => {
      logger.warn('Failed to send metrics');
    });
  }
}

// ============================================================================
// TYPES FOR PERFORMANCE ENTRIES
// ============================================================================

interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  duration: number;
  cancelable: boolean;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources: LayoutShiftAttribution[];
}

interface LayoutShiftAttribution {
  node?: Node;
  previousRect: DOMRectReadOnly;
  currentRect: DOMRectReadOnly;
}
