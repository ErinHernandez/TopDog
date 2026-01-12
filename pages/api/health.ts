/**
 * Health Check API
 * 
 * Provides a simple health check endpoint for uptime monitoring.
 * Used by monitoring services (UptimeRobot, etc.) to verify the application is running.
 * 
 * GET /api/health
 * 
 * @module pages/api/health
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '../../lib/structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptime: number;
  version?: string;
  environment: string;
  responseTimeMs?: number;
  checks?: {
    database?: 'ok' | 'error';
    api?: 'ok' | 'error';
  };
  performance?: {
    memoryUsageMB?: number;
    cpuUsage?: number;
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
): Promise<void> {
  // Only allow GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
    });
    return;
  }

  const startTime = Date.now();
  const checks: HealthResponse['checks'] = {};
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';

  try {
    // Basic health check - application is running
    // In a more sophisticated setup, you could check:
    // - Database connectivity
    // - External API availability
    // - Cache connectivity
    // - Disk space
    // etc.

    // For now, we'll just verify the application is responding
    // Future: Add actual health checks for critical dependencies
    
    // Example: Check if we can access environment variables (basic sanity check)
    const hasRequiredEnv = !!(
      process.env.NODE_ENV
    );

    if (!hasRequiredEnv) {
      overallStatus = 'degraded';
      checks.api = 'error';
    } else {
      checks.api = 'ok';
    }

    // Database check would go here if needed
    // try {
    //   await db.collection('health').findOne({});
    //   checks.database = 'ok';
    // } catch (error) {
    //   checks.database = 'error';
    //   overallStatus = 'degraded';
    // }

    const responseTime = Date.now() - startTime;

    // Collect performance metrics
    const performance: HealthResponse['performance'] = {};
    
    // Memory usage (if available)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage();
      performance.memoryUsageMB = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
    }

    // Log health check (only in production to avoid noise)
    if (process.env.NODE_ENV === 'production') {
      logger.debug('Health check', {
        component: 'health',
        status: overallStatus,
        responseTime,
        checks,
        performance,
      });
    }

    // Set cache headers to prevent caching of health checks
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'unknown',
      responseTimeMs: responseTime,
      checks,
      performance: Object.keys(performance).length > 0 ? performance : undefined,
    });

  } catch (error) {
    logger.error('Health check failed', error as Error, {
      component: 'health',
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        api: 'error',
      },
    });
  }
}
