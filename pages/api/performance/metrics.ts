/**
 * Performance Metrics API
 * 
 * Collects and reports performance metrics from the client.
 * Used for monitoring Core Web Vitals and custom performance metrics.
 * 
 * POST /api/performance/metrics
 * 
 * @module pages/api/performance/metrics
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import {
  withErrorHandling,
  validateMethod,
  validateBody,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { logger } from '../../../lib/structuredLogger';
import { captureError } from '../../../lib/errorTracking';

// ============================================================================
// TYPES
// ============================================================================

interface PerformanceMetricsPayload {
  /** Largest Contentful Paint in ms */
  lcp?: number | null;
  /** First Input Delay in ms */
  fid?: number | null;
  /** Cumulative Layout Shift */
  cls?: number | null;
  /** First Contentful Paint in ms */
  fcp?: number | null;
  /** Time to Interactive in ms */
  tti?: number | null;
  /** Total Blocking Time in ms */
  tbt?: number | null;
  /** DOM Content Loaded in ms */
  domContentLoaded?: number | null;
  /** Page Load in ms */
  pageLoad?: number | null;
  /** Time to First Byte in ms */
  ttfb?: number | null;
  /** Custom metrics */
  custom?: Record<string, number>;
  /** Page URL */
  url?: string;
  /** User agent */
  userAgent?: string;
  /** Connection type (if available) */
  connectionType?: string;
  /** Device type */
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  /** Timestamp */
  timestamp?: string;
}

interface PerformanceMetricsResponse {
  received: boolean;
  metricsId?: string;
  message?: string;
}

// ============================================================================
// PERFORMANCE BUDGETS
// ============================================================================

/**
 * Performance budgets based on Core Web Vitals thresholds
 * https://web.dev/vitals/
 */
const PERFORMANCE_BUDGETS = {
  lcp: {
    good: 2500, // ms
    needsImprovement: 4000, // ms
  },
  fid: {
    good: 100, // ms
    needsImprovement: 300, // ms
  },
  cls: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  fcp: {
    good: 1800, // ms
    needsImprovement: 3000, // ms
  },
  ttfb: {
    good: 800, // ms
    needsImprovement: 1800, // ms
  },
} as const;

/**
 * Evaluate performance metric against budget
 */
function evaluateMetric(
  metric: string,
  value: number | null | undefined
): 'good' | 'needs-improvement' | 'poor' | 'unknown' {
  if (value === null || value === undefined) {
    return 'unknown';
  }

  const budget = PERFORMANCE_BUDGETS[metric as keyof typeof PERFORMANCE_BUDGETS];
  if (!budget) {
    return 'unknown';
  }

  if (value <= budget.good) {
    return 'good';
  } else if (value <= budget.needsImprovement) {
    return 'needs-improvement';
  } else {
    return 'poor';
  }
}

// ============================================================================
// HANDLER
// ============================================================================

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceMetricsResponse>,
  logger: typeof logger
): Promise<void> {
  // Validate method
  validateMethod(req, ['POST'], logger);

  // Validate body
  const payload = req.body as PerformanceMetricsPayload;
  validateBody(req, [], logger); // No required fields, but validate body exists

  // Generate metrics ID for tracking
  const metricsId = `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Extract metrics
    const metrics = {
      lcp: payload.lcp,
      fid: payload.fid,
      cls: payload.cls,
      fcp: payload.fcp,
      tti: payload.tti,
      tbt: payload.tbt,
      domContentLoaded: payload.domContentLoaded,
      pageLoad: payload.pageLoad,
      ttfb: payload.ttfb,
      custom: payload.custom || {},
    };

    // Evaluate performance
    const evaluation = {
      lcp: evaluateMetric('lcp', metrics.lcp),
      fid: evaluateMetric('fid', metrics.fid),
      cls: evaluateMetric('cls', metrics.cls),
      fcp: evaluateMetric('fcp', metrics.fcp),
      ttfb: evaluateMetric('ttfb', metrics.ttfb),
    };

    // Log performance metrics
    logger.info('Performance metrics received', {
      component: 'performance',
      metricsId,
      url: payload.url,
      deviceType: payload.deviceType,
      connectionType: payload.connectionType,
      metrics: {
        lcp: metrics.lcp,
        fid: metrics.fid,
        cls: metrics.cls,
        fcp: metrics.fcp,
        ttfb: metrics.ttfb,
      },
      evaluation,
    });

    // Check for poor performance (alert threshold)
    const poorMetrics = Object.entries(evaluation).filter(
      ([_, rating]) => rating === 'poor'
    );

    if (poorMetrics.length > 0) {
      logger.warn('Poor performance detected', {
        component: 'performance',
        metricsId,
        url: payload.url,
        poorMetrics: poorMetrics.map(([metric]) => metric),
        metrics,
      });

      // Send to error tracking for visibility
      await captureError(
        new Error(`Poor performance: ${poorMetrics.map(([m]) => m).join(', ')}`),
        {
          tags: {
            component: 'performance',
            severity: 'warning',
          },
          extra: {
            metricsId,
            url: payload.url,
            poorMetrics: poorMetrics.map(([metric, rating]) => ({
              metric,
              rating,
              value: metrics[metric as keyof typeof metrics],
            })),
          },
        }
      );
    }

    // In production, you might want to store these metrics in a database
    // For now, we'll just log them and return success
    // Future: Store in Firestore or analytics service

    const successResponse = createSuccessResponse(
      {
        received: true,
        metricsId,
        message: 'Performance metrics recorded',
      },
      200,
      logger
    );

    return res.status(successResponse.statusCode).json(successResponse.body);

  } catch (error) {
    logger.error('Error processing performance metrics', error as Error, {
      component: 'performance',
      metricsId,
      payload: {
        url: payload.url,
        hasMetrics: !!payload.lcp || !!payload.fid || !!payload.cls,
      },
    });

    await captureError(error as Error, {
      tags: { component: 'performance', operation: 'metrics' },
    });

    const errorResponse = createErrorResponse(
      ErrorType.INTERNAL,
      'Failed to process performance metrics',
      {},
      metricsId
    );

    return res.status(errorResponse.statusCode).json({
      received: false,
      error: errorResponse.body.error,
    });
  }
}

export default withErrorHandling(handler);
