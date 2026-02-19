/**
 * Enhanced Health Check API
 *
 * Provides comprehensive health check endpoint with external dependency monitoring.
 * Uses caching to avoid excessive external API calls.
 *
 * GET /api/health-enhanced
 *
 * Response:
 * {
 *   "status": "healthy" | "degraded" | "unhealthy",
 *   "checks": {
 *     "firebase": { "status": "...", "responseTimeMs": ... },
 *     "stripe": { "status": "...", "responseTimeMs": ... },
 *     "paymentProviders": { "status": "...", "responseTimeMs": ... }
 *   },
 *   "uptime": 12345,
 *   "version": "1.0.0",
 *   "systemInfo": {
 *     "memoryUsageMB": 123.45,
 *     "nodeVersion": "18.0.0"
 *   }
 * }
 *
 * @module pages/api/health-enhanced
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
} from '../../lib/apiErrorHandler';
import { getHealthStatus } from '../../lib/monitoring/healthCheck';
import { logger } from '../../lib/structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

interface EnhancedHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    firebase: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTimeMs: number;
      error?: string;
    };
    stripe: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTimeMs: number;
      error?: string;
    };
    paymentProviders: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTimeMs: number;
      error?: string;
    };
  };
  systemInfo: {
    memoryUsageMB: number;
    nodeVersion: string;
  };
  overallResponseTimeMs: number;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EnhancedHealthResponse>
): Promise<void> {
  await withErrorHandling(req, res, async (req, res, requestLogger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], requestLogger);

    const startTime = Date.now();

    requestLogger.debug('Enhanced health check request', {
      component: 'health-enhanced',
      method: req.method,
    });

    try {
      // Get comprehensive health status from monitoring utility
      const healthStatus = await getHealthStatus();

      // Collect system information
      const memoryUsage = process.memoryUsage();
      const memoryUsageMB = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
      const nodeVersion = process.version || 'unknown';

      const responseTime = Date.now() - startTime;

      // Build response
      const response: EnhancedHealthResponse = {
        status: healthStatus.status,
        timestamp: healthStatus.timestamp,
        uptime: healthStatus.uptime,
        version: healthStatus.version,
        checks: {
          firebase: {
            status: healthStatus.components.firebase.status,
            responseTimeMs: healthStatus.components.firebase.responseTimeMs,
            error: healthStatus.components.firebase.error,
          },
          stripe: {
            status: healthStatus.components.stripe.status,
            responseTimeMs: healthStatus.components.stripe.responseTimeMs,
            error: healthStatus.components.stripe.error,
          },
          paymentProviders: {
            status: healthStatus.components.paymentProviders.status,
            responseTimeMs: healthStatus.components.paymentProviders.responseTimeMs,
            error: healthStatus.components.paymentProviders.error,
          },
        },
        systemInfo: {
          memoryUsageMB,
          nodeVersion,
        },
        overallResponseTimeMs: responseTime,
      };

      // Set cache headers - cache for 30 seconds (matches health check cache TTL)
      res.setHeader('Cache-Control', 'public, max-age=30');
      res.setHeader('X-Server-Time', Date.now().toString());

      // Determine HTTP status code
      const statusCode = response.status === 'healthy' ? 200 : response.status === 'degraded' ? 200 : 503;

      requestLogger.debug('Enhanced health check complete', {
        component: 'health-enhanced',
        status: response.status,
        responseTimeMs: responseTime,
      });

      const apiResponse = createSuccessResponse(response, statusCode, requestLogger);
      return res.status(apiResponse.statusCode).json(apiResponse.body);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      requestLogger.error('Enhanced health check error', error instanceof Error ? error : new Error(errorMessage));

      // Return 503 Service Unavailable on unexpected errors
      const failedResponse: EnhancedHealthResponse = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        checks: {
          firebase: { status: 'unhealthy', responseTimeMs: 0, error: 'Health check failed' },
          stripe: { status: 'unhealthy', responseTimeMs: 0, error: 'Health check failed' },
          paymentProviders: { status: 'unhealthy', responseTimeMs: 0, error: 'Health check failed' },
        },
        systemInfo: {
          memoryUsageMB: Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100,
          nodeVersion: process.version || 'unknown',
        },
        overallResponseTimeMs: Date.now() - startTime,
      };

      return res.status(503).json(failedResponse);
    }
  });
}
