/**
 * Query Performance Monitor
 *
 * Tracks query execution times and triggers alerts for slow queries.
 * Integrates with Sentry for critical query alerts.
 *
 * @module lib/monitoring/queryMonitor
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface QueryMetrics {
  /** Name of the query operation */
  queryName: string;
  /** Firestore collection being queried */
  collection: string;
  /** Query duration in milliseconds */
  duration: number;
  /** Number of results returned */
  resultCount: number;
  /** Timestamp when query completed */
  timestamp: number;
}

export interface MetricsSummary {
  /** Average query duration across window */
  avgDuration: number;
  /** Maximum query duration in window */
  maxDuration: number;
  /** Count of slow queries (>500ms) */
  slowQueryCount: number;
  /** Count of critical queries (>2000ms) */
  criticalQueryCount: number;
  /** Total queries in window */
  totalQueries: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Threshold for slow query warning (ms) */
const SLOW_QUERY_THRESHOLD_MS = 500;

/** Threshold for critical query alert (ms) */
const CRITICAL_QUERY_THRESHOLD_MS = 2000;

/** Size of rolling metrics window */
const WINDOW_SIZE = 100;

// ============================================================================
// STATE
// ============================================================================

const metricsWindow: QueryMetrics[] = [];

// ============================================================================
// INTERNAL FUNCTIONS
// ============================================================================

/**
 * Record query metrics and check thresholds
 */
function recordMetrics(metrics: QueryMetrics): void {
  // Add to rolling window
  metricsWindow.push(metrics);
  if (metricsWindow.length > WINDOW_SIZE) {
    metricsWindow.shift();
  }

  // Check thresholds and alert
  if (metrics.duration >= CRITICAL_QUERY_THRESHOLD_MS) {
    logger.error('Critical slow query detected', undefined, {
      component: 'query-monitor',
      ...metrics,
    });

    // Report to Sentry
    try {
      Sentry.captureMessage('Critical slow Firestore query', {
        level: 'error',
        tags: {
          collection: metrics.collection,
          queryName: metrics.queryName,
        },
        extra: {
          duration: metrics.duration,
          resultCount: metrics.resultCount,
          timestamp: new Date(metrics.timestamp).toISOString(),
        },
      });
    } catch {
      // Sentry may not be initialized in all environments
    }
  } else if (metrics.duration >= SLOW_QUERY_THRESHOLD_MS) {
    logger.warn('Slow query detected', {
      component: 'query-monitor',
      ...metrics,
    });
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Measure query performance with automatic tracking
 *
 * Wraps a query function to measure its execution time and record metrics.
 *
 * @param queryName - Name for identifying the query
 * @param collection - Firestore collection being queried
 * @param queryFn - The query function to measure
 * @returns Query result
 *
 * @example
 * const players = await measureQuery(
 *   'getAvailablePlayers',
 *   'players',
 *   () => getDocs(query(playersRef, limit(100)))
 * );
 */
export async function measureQuery<T>(
  queryName: string,
  collection: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    // Determine result count
    let resultCount = 1;
    if (Array.isArray(result)) {
      resultCount = result.length;
    } else if (result && typeof result === 'object' && 'docs' in result) {
      resultCount = (result as { docs: unknown[] }).docs?.length || 0;
    }

    recordMetrics({
      queryName,
      collection,
      duration,
      resultCount,
      timestamp: Date.now(),
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error('Query failed', error as Error, {
      component: 'query-monitor',
      queryName,
      collection,
      duration,
    });

    // Record failed query as critical
    recordMetrics({
      queryName: `${queryName}:FAILED`,
      collection,
      duration,
      resultCount: 0,
      timestamp: Date.now(),
    });

    throw error;
  }
}

/**
 * Get current metrics summary
 *
 * Returns aggregated statistics about recent query performance.
 *
 * @returns Summary of query metrics
 *
 * @example
 * const summary = getMetricsSummary();
 * if (summary.criticalQueryCount > 0) {
 *   console.warn('Critical slow queries detected!');
 * }
 */
export function getMetricsSummary(): MetricsSummary {
  if (metricsWindow.length === 0) {
    return {
      avgDuration: 0,
      maxDuration: 0,
      slowQueryCount: 0,
      criticalQueryCount: 0,
      totalQueries: 0,
    };
  }

  const durations = metricsWindow.map((m) => m.duration);
  const sum = durations.reduce((a, b) => a + b, 0);

  return {
    avgDuration: Math.round(sum / durations.length),
    maxDuration: Math.round(Math.max(...durations)),
    slowQueryCount: metricsWindow.filter(
      (m) => m.duration >= SLOW_QUERY_THRESHOLD_MS
    ).length,
    criticalQueryCount: metricsWindow.filter(
      (m) => m.duration >= CRITICAL_QUERY_THRESHOLD_MS
    ).length,
    totalQueries: metricsWindow.length,
  };
}

/**
 * Get recent query details
 *
 * Returns the last N query metrics for debugging.
 *
 * @param count - Number of recent queries to return (default: 10)
 * @returns Array of recent query metrics
 */
export function getRecentQueries(count: number = 10): QueryMetrics[] {
  return metricsWindow.slice(-count);
}

/**
 * Clear all metrics (for testing)
 */
export function clearMetrics(): void {
  metricsWindow.length = 0;
}

/**
 * Get threshold values (for health endpoint)
 */
export function getThresholds(): {
  slowMs: number;
  criticalMs: number;
} {
  return {
    slowMs: SLOW_QUERY_THRESHOLD_MS,
    criticalMs: CRITICAL_QUERY_THRESHOLD_MS,
  };
}
